# SieveFlow

Sistema inteligente de análisis y gestión de currículums utilizando procesamiento de lenguaje natural y machine learning.

## 🏗️ Estructura del Proyecto

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

### 📦 Aplicaciones

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
- **ML/NLP:** spaCy, scikit-learn, transformers
- **Puerto:** 8001 (por defecto)
- **Descripción:** Servicio especializado en:
  - Parsing y extracción de información de CVs (PDF, DOCX, TXT)
  - Análisis de competencias y experiencia
  - Generación de estadísticas y métricas
  - Clasificación y matching de candidatos

### 📚 Paquetes Compartidos

#### **@sieveflow/shared-types**
Tipos TypeScript compartidos entre backend y frontend:
- Interfaces de API (`ApiResponse`, `PaginatedResponse`)
- Modelos de datos (`User`, `CV`, etc.)
- Enums y tipos comunes

#### **@sieveflow/config**
Configuraciones reutilizables:
- TypeScript configs (base, NestJS, Next.js)
- ESLint configs
- Prettier config

## 🚀 Inicio Rápido

### Prerequisitos
```bash
node >= 20.x
pnpm >= 10.x
python >= 3.10
postgresql >= 14
```

### Instalación

```bash
# Instalar todas las dependencias del monorepo
pnpm install

# Compilar paquetes compartidos
pnpm build:packages

# Instalar dependencias de Python para NLP service
cd apps/nlp-service
pip install -r requirements.txt
cd ../..
```

### Desarrollo

```bash
# Ejecutar todo en paralelo
pnpm dev

# O ejecutar servicios individuales:
pnpm dev:backend     # Backend en http://localhost:3000
pnpm dev:frontend    # Frontend en http://localhost:3000
pnpm dev:nlp        # NLP Service en http://localhost:8001
```

### Build de Producción

```bash
# Compilar todos los proyectos
pnpm build

# O builds individuales:
pnpm build:packages
pnpm build:backend
pnpm build:frontend
```

## 🛠️ Scripts Disponibles

```bash
pnpm dev              # Ejecuta todos los servicios en paralelo
pnpm build            # Compila todos los proyectos
pnpm build:packages   # Compila solo los paquetes compartidos
pnpm lint             # Ejecuta linter en todos los proyectos
pnpm test             # Ejecuta tests en todos los proyectos
pnpm clean            # Limpia node_modules y builds
```

## 🗄️ Base de Datos

### Setup PostgreSQL

```bash
# Crear base de datos
createdb sieveflow

# Configurar variables de entorno
cp apps/web/backend/.env.example apps/web/backend/.env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
cd apps/web/backend
pnpm db:migrate
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
- Tailwind CSS
- TypeScript

### NLP Service
- FastAPI
- spaCy
- scikit-learn
- PyTorch/TensorFlow
- pdfplumber / python-docx

## 📝 Variables de Entorno

### Backend
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sieveflow
NLP_SERVICE_URL=http://localhost:8001
PORT=3000
```

### NLP Service
```env
MODEL_PATH=./models
MAX_FILE_SIZE=10485760
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC
