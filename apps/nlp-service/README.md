# NLP Service

Servicio de procesamiento de lenguaje natural para análisis de currículums.

## Tecnologías

- **FastAPI** - Framework web moderno y rápido
- **spaCy** - NLP avanzado
- **transformers** - Modelos de ML pre-entrenados
- **pdfplumber** - Extracción de texto de PDFs

## Instalación

```bash
# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Descargar modelos de spaCy
python -m spacy download es_core_news_md
python -m spacy download en_core_web_md
```

## Desarrollo

```bash
# Modo desarrollo (auto-reload)
pnpm dev

# O directamente con uvicorn
uvicorn src.main:app --reload --host 0.0.0.0 --port 8001
```

## API Endpoints

### `GET /`
Health check básico

### `POST /api/cv/parse`
Parsea un archivo CV (PDF, DOCX, TXT)
- **Body:** `multipart/form-data` con archivo
- **Response:** Información extraída del CV

### `POST /api/cv/analyze`
Analiza texto de CV y extrae skills, experiencia, etc.
- **Body:** `{ "text": "..." }`
- **Response:** Análisis detallado

### `GET /api/health`
Health check detallado con lista de endpoints

## Estructura

```
nlp-service/
├── src/
│   ├── main.py              # FastAPI app principal
│   ├── models/              # Modelos ML (TODO)
│   ├── parsers/             # Parsers de documentos (TODO)
│   └── analyzers/           # Analizadores NLP (TODO)
├── requirements.txt         # Dependencias Python
└── .env.example            # Variables de entorno ejemplo
```

## TODO

- [ ] Implementar parser de PDFs con pdfplumber
- [ ] Implementar parser de DOCX
- [ ] Integrar spaCy para extracción de entidades
- [ ] Modelo de clasificación de skills
- [ ] Análisis de experiencia laboral
- [ ] Generación de estadísticas
- [ ] Tests con pytest
