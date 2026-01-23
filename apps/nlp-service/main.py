import os
import re
import json
import logging
import requests
import fitz
from google import genai
from google.genai import types # Importante para tipos si usas SDK nuevo
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# --- CONFIGURACIÓN DE LOGS ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("nlp-service")

# --- CARGA DE ENTORNO ---
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
WEBHOOK_URL = os.getenv("NESTJS_WEBHOOK_URL")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

# Validaciones de inicio
if not all([GOOGLE_API_KEY, WEBHOOK_URL, WEBHOOK_SECRET]):
    logger.critical("Faltan variables de entorno críticas.")
    raise RuntimeError("Faltan variables de entorno")

client = genai.Client() # Explicito para evitar dudas
app = FastAPI()

class CVNotification(BaseModel):
    applicationId: int
    filePath: str
    jobRequirements: str

def clean_text(text: str) -> str:
    if not text: return ""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7f]', r'', text)
    return text.strip()

def extract_text_from_pdf(file_path: str) -> str:
    if not file_path or not os.path.exists(file_path):
        return ""
    try:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return clean_text(text)
    except Exception as e:
        logger.error(f"Error leyendo PDF {file_path}: {e}")
        return ""

def analyze_application_with_ai(cv_text: str, cover_text: str, requirements_json: str):
    # 1. Parseo seguro de JSON
    try:
        reqs = json.loads(requirements_json)
        # .get() devuelve None si es null en el JSON, forzamos string vacío
        public_reqs = reqs.get("public_criteria") or ""
        secret_reqs = reqs.get("secret_criteria") or ""
    except:
        public_reqs = requirements_json
        secret_reqs = ""

    prompt = f"""
    Eres un reclutador experto (ATS). Analiza el candidato.
    
    REQUISITOS PÚBLICOS: {public_reqs}
    REQUISITOS OCULTOS: {secret_reqs}

    CV: {cv_text[:50000]} 
    CARTA: {cover_text[:10000]}

    INSTRUCCIONES:
    1. Si no cumple requisitos ocultos, penaliza.
    2. Responde SOLO JSON válido.
    
    FORMATO JSON:
    {{
    "score": (0-100),
    "summary": "Resumen ejecutivo...",
    "decision": "ADVANCE/HOLD/REJECT",
    "reasoning": "Motivo..."
    }}
    """

    try:
        # 2. Configuración para reducir bloqueos de seguridad
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        print(response)
        
        # 3. Validación CRÍTICA de respuesta vacía
        if not response.text:
            logger.warning("Gemini devolvió respuesta vacía (posible bloqueo).")
            return {
                "score": 0, 
                "summary": "Análisis bloqueado por filtros de seguridad o error de modelo.", 
                "decision": "REJECT"
            }

        # 4. Limpieza del JSON
        clean_json = re.sub(r'```json|```', '', response.text).strip()
        return json.loads(clean_json)

    except Exception as e:
        logger.error(f"Excepción en IA: {e}")
        return {"score": 0, "summary": f"Fallo técnico IA: {str(e)}", "decision": "REJECT"}

def process_application_task(application_id: int, requirements_payload: str):
    logger.info(f"[App {application_id}] Iniciando análisis...")
    try:
        data = json.loads(requirements_payload)
        
        cv_text = extract_text_from_pdf(data.get("resumePath"))
        cover_text = extract_text_from_pdf(data.get("coverLetterPath"))
        
        # Validación: Si no hay texto en el CV, no gastamos tokens
        if not cv_text:
            logger.warning(f"[App {application_id}] CV vacío o ilegible.")
            ai_result = {"score": 0, "summary": "CV ilegible o vacío", "decision": "REJECT"}
        else:
            ai_result = analyze_application_with_ai(cv_text, cover_text, requirements_payload)

        # Construcción Payload para NestJS
        payload = {
            "applicationId": application_id,
            "score": ai_result.get("score", 0),
            "summary": ai_result.get("summary", "Sin resumen"),
            "rawText": cv_text[:5000],          # Limitamos para no explotar DB
            "coverLetterText": cover_text[:5000], # Limitamos para no explotar DB
            "decision": ai_result.get("decision", "REJECT")
        }
        
        # Envío Webhook
        res = requests.post(
            WEBHOOK_URL, 
            json=payload, 
            headers={"X-SieveFlow-Secret": WEBHOOK_SECRET}, 
            timeout=15
        )
        
        if res.status_code < 300:
            logger.info(f"[App {application_id}] ✅ Éxito. Status: {res.status_code}")
        else:
            logger.error(f"[App {application_id}] ❌ Error Webhook. Status: {res.status_code} Body: {res.text}")

    except Exception as e:
        logger.exception(f"[App {application_id}] Error fatal en worker")

@app.post("/process-cv")
async def process_cv(notification: CVNotification, background_tasks: BackgroundTasks):
    if not os.path.exists(notification.filePath):
        logger.error(f"Archivo no existe: {notification.filePath}")
        # No lanzamos error 404 para no bloquear a NestJS, solo logueamos
    
    background_tasks.add_task(
        process_application_task, 
        notification.applicationId, 
        notification.jobRequirements
    )
    return {"status": "processing", "applicationId": notification.applicationId}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)