import os
import re
import json
import requests
import fitz
from google import genai
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
WEBHOOK_URL = os.getenv("NESTJS_WEBHOOK_URL")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

if not all([GOOGLE_API_KEY, WEBHOOK_URL, WEBHOOK_SECRET]):
    raise RuntimeError("Faltan variables de entorno")

client = genai.Client()
app = FastAPI()

class CVNotification(BaseModel):
    applicationId: int
    filePath: str
    jobRequirements: str

def clean_text(text: str) -> str:
    if not text:
        return ""
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
    except Exception:
        return ""

def analyze_application_with_ai(cv_text: str, cover_text: str, requirements_json: str):
    try:
        reqs = json.loads(requirements_json)
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
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        if not response.text:
            return {
                "score": 0, 
                "summary": "Análisis bloqueado por filtros de seguridad o error de modelo.", 
                "decision": "REJECT"
            }

        clean_json = re.sub(r'```json|```', '', response.text).strip()
        return json.loads(clean_json)

    except Exception as e:
        return {"score": 0, "summary": f"Fallo técnico IA: {str(e)}", "decision": "REJECT"}

def process_application_task(application_id: int, requirements_payload: str):
    try:
        data = json.loads(requirements_payload)
        
        cv_text = extract_text_from_pdf(data.get("resumePath"))
        cover_text = extract_text_from_pdf(data.get("coverLetterPath"))
        
        if not cv_text:
            ai_result = {"score": 0, "summary": "CV ilegible o vacío", "decision": "REJECT"}
        else:
            ai_result = analyze_application_with_ai(cv_text, cover_text, requirements_payload)

        payload = {
            "applicationId": application_id,
            "score": ai_result.get("score", 0),
            "summary": ai_result.get("summary", "Sin resumen"),
            "rawText": cv_text[:5000],
            "coverLetterText": cover_text[:5000],
            "decision": ai_result.get("decision", "REJECT")
        }
        
        requests.post(
            WEBHOOK_URL, 
            json=payload, 
            headers={"X-SieveFlow-Secret": WEBHOOK_SECRET}, 
            timeout=15
        )

    except Exception:
        pass

@app.post("/process-cv")
async def process_cv(notification: CVNotification, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        process_application_task, 
        notification.applicationId, 
        notification.jobRequirements
    )
    return {"status": "processing", "applicationId": notification.applicationId}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)