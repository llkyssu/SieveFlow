# SieveFlow

Sistema inteligente de análisis y gestión de currículums utilizando procesamiento de lenguaje natural e IA.

## Estructura del Proyecto

Este es un **monorepo** gestionado con **pnpm workspaces** que contiene múltiples aplicaciones y paquetes compartidos.

```
SieveFlow/
├── apps/
│   ├── web/
│   │   ├── backend/          # API REST con NestJS + PostgreSQL
│   │   └── frontend/         # Interfaz de usuario con Next.js
│   └── nlp-service/          # Servicio de ML con FastAPI (Python)
├── packages/
│   ├── shared-types/         # Tipos TypeScript compartidos
│   └── config/               # Configuraciones compartidas (ESLint, TS, Prettier)
└── package.json              # Scripts del monorepo
```

### Aplicaciones

#### **Backend** (`apps/web/backend`)
- **Framework:** NestJS
- **Base de datos:** PostgreSQL con Drizzle ORM
- **Puerto:** 3000 (por defecto)
- **Descripción:** API REST que gestiona usuarios, currículums, estadísticas y se comunica con el servicio NLP

#### **Frontend** (`apps/web/frontend`)
- **Framework:** Next.js 14+ (React)
- **Estilos:** Tailwind CSS
- **Puerto:** 3000 (por defecto)
- **Descripción:** Interfaz de usuario para subir CVs, ver análisis, estadísticas y gestionar candidatos

#### **NLP Service** (`apps/nlp-service`)
- **Framework:** FastAPI (Python)
- **Puerto:** 8001 (por defecto)
- **Descripción:** Servicio especializado en:
  - Parsing y extracción de información de CVs (PDF, DOCX, TXT)
  - Análisis de competencias y experiencia con IA
  - Generación de estadísticas y métricas
  - Clasificación y matching de candidatos


### Desarrollo

```bash
# Ejecutar todo en paralelo
pnpm dev

# O ejecutar servicios individuales:
pnpm dev:backend     # Backend en http://localhost:3000
pnpm dev:frontend    # Frontend en http://localhost:3000
pnpm dev:nlp        # NLP Service en http://localhost:8001
```

## 🔧 Tecnologías

### Backend
- NestJS
- PostgreSQL
- Drizzle ORM
- TypeScript

### Frontend
- Next.js 14+
- React 19
- TypeScript

### NLP Service
- FastAPI
- pdfplumber / python-docx

