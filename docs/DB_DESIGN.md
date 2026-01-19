# SieveFlow - Arquitectura de Sistema y Documentación Técnica

## 1. Resumen del Sistema

SieveFlow es un sistema de seguimiento de candidatos (ATS) potenciado por IA. El sistema permite a los reclutadores gestionar vacantes y a los candidatos postular mediante la subida de sus CVs, los cuales son analizados automáticamente para generar puntuaciones de afinidad (AI Score).

---

## 2. Arquitectura de Base de Datos (Drizzle ORM)

El diseño sigue un modelo de **Identidad Separada** para simplificar el flujo B2B:

- **Users**: Reclutadores y Administradores con acceso al sistema (vía JWT).
- **Candidates**: Postulantes externos identificados por su email (sin necesidad de cuenta/login).
- **Applications**: Entidad pivot que vincula a un candidato con un trabajo, almacenando el resultado del análisis de IA.

### Flujo de Datos de Archivos

- **Almacenamiento Físico**: Los archivos PDF se guardan en el sistema de archivos local (`/uploads/resumes/`) utilizando nombres únicos basados en **UUID v4** para evitar colisiones y ataques de inyección de rutas.
- **Almacenamiento Lógico**: La base de datos guarda la ruta relativa del archivo, no el binario, para optimizar el rendimiento de PostgreSQL.

---

## 3. Flujo de Postulación (Secuencia Técnica)

Para garantizar la integridad del sistema, se sigue este orden estrictamente:

1. **Recepción**: El `ResumesController` intercepta el archivo mediante un `FileInterceptor`.
2. **Validación**: Se aplica un `ParseFilePipe` para asegurar que el archivo sea un **PDF** y pese menos de **5MB**.
3. **Persistencia Física**: Se escribe el archivo en disco usando `fs/promises` para no bloquear el hilo de ejecución de Node.js.
4. **Transacción de DB**:
   - Se realiza un *Upsert* del Candidato (se busca por email, si no existe se crea).
   - Se crea el registro en la tabla `Applications`.
5. **Notificación Asíncrona**: Se dispara un aviso al servicio de Python (NLP) de forma no bloqueante utilizando `lastValueFrom` y `HttpService`.

---

## 4. Comunicación entre Microservicios

El sistema utiliza una arquitectura **Productor-Consumidor** desacoplada:

- **Productor (NestJS)**: Envía una petición `POST` al servicio de Python con el `applicationId` y el `filePath`.
- **Consumidor (Python/FastAPI)**: Recibe la notificación y procesa el archivo en segundo plano.
- **Configuración**: Las URLs de comunicación se gestionan mediante variables de entorno (`.env`) inyectadas vía `ConfigService` para mayor seguridad y flexibilidad.

---

## 5. Decisiones de Diseño (Ingeniería)

| Decisión                             | Justificación                                                                                                         |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **Separación User/Candidate**  | Mantiene la seguridad de los reclutadores aislada de los datos públicos de postulantes.                               |
| **UUID para Archivos**          | Garantiza unicidad absoluta y anonimiza los archivos en el servidor.                                                   |
| **Rollback Manual**             | Si la base de datos falla tras guardar el archivo, el sistema ejecuta un `unlink` para evitar "archivos huérfanos". |
| **Comunicación No Bloqueante** | El usuario recibe respuesta inmediata ("Recibido") mientras la IA procesa el CV de fondo.                              |

---

## 6. Próximos Pasos

- [ ] Implementación de **FastAPI** para la extracción de texto (PyMuPDF).
- [ ] Integración con LLM (OpenAI/Gemini) para el cálculo de `ai_score`.
- [ ] Webhook de retorno para actualizar el estado de la aplicación en NestJS.
