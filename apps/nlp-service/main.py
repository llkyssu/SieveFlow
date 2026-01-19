import os
import re
import json
import logging
import requests
import fitz  # PyMuPDF
import google.generativeai as genai
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# --- CARGA DE CONFIGURACIÓN ---
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
WEBHOOK_URL = os.getenv("NESTJS_WEBHOOK_URL")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET") # Secreto compartido con NestJS

if not all([GOOGLE_API_KEY, WEBHOOK_URL, WEBHOOK_SECRET]):
    raise RuntimeError("Faltan variables de entorno críticas en el .env")

# Configuración de IA
genai.configure(api_key=GOOGLE_API_KEY)
ai_model = genai.GenerativeModel('gemini-1.5-flash')

# Configuración de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nlp-service")

app = FastAPI(title="SieveFlow NLP Service")

# --- MODELOS ---
class CVNotification(BaseModel):
    applicationId: int
    filePath: str
    jobRequirements: str

# --- UTILIDADES ---
def clean_text(text: str) -> str:
    """Limpia el ruido del PDF para optimizar tokens y precisión"""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7f]', r'', text)
    return text.strip()

def analyze_cv_with_ai(cv_text: str, requirements: str):
    """Analiza semánticamente el CV frente a los requisitos usando Gemini"""
    prompt = f"""
    Eres un reclutador experto sistema ATS. Analiza el CV adjunto comparándolo con los requerimientos.
    
    REQUISITOS DEL PUESTO: 
    {requirements}
    
    CONTENIDO DEL CV: 
    {cv_text}
    
    Responde ÚNICAMENTE en formato JSON:
    {{
      "score": (entero 0-100 basado en coincidencia técnica y experiencia),
      "summary": (resumen de 3 líneas del perfil),
      "decision": (explicación breve de la puntuación)
    }}
    """
    try:
        response = ai_model.generate_content(prompt)
        # Limpieza de formato Markdown en la respuesta
        clean_json = re.sub(r'```json|```', '', response.text).strip()
        return json.loads(clean_json)
    except Exception as e:
        logger.error(f"Error en análisis de IA: {e}")
        return {"score": 0, "summary": "Error en el procesamiento de IA", "decision": str(e)}

# --- WORKER (Background Task) ---
def process_pdf_task(application_id: int, file_path: str, requirements: str):
    """Flujo asíncrono: Extracción -> IA -> Notificación a NestJS"""
    try:
        # 1. Extracción de texto
        text_content = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text_content += page.get_text()
        
        cleaned_text = clean_text(text_content)
        
        # 2. Análisis de IA
        ai_result = analyze_cv_with_ai(cleaned_text, requirements)
        
        # 3. Notificación Webhook con Seguridad
        payload = {
            "applicationId": application_id,
            "score": ai_result.get("score", 0),
            "summary": ai_result.get("summary", ""),
            "rawText": cleaned_text[:3000]
        }
        
        headers = {
            "X-SieveFlow-Secret": WEBHOOK_SECRET
        }
        
        res = requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=15)
        logger.info(f"Análisis completado para App {application_id}. Webhook status: {res.status_code}")
            
    except Exception as e:
        logger.error(f"Fallo en el hilo de procesamiento: {e}")

# --- ENDPOINTS ---
@app.post("/process-cv")
async def process_cv(notification: CVNotification, background_tasks: BackgroundTasks):
    """Punto de entrada para NestJS"""
    if not os.path.exists(notification.filePath):
        logger.error(f"Archivo no encontrado: {notification.filePath}")
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el sistema")

    background_tasks.add_task(
        process_pdf_task, 
        notification.applicationId, 
        notification.filePath,
        notification.jobRequirements
    )

    return {
        "status": "processing", 
        "applicationId": notification.applicationId
    }