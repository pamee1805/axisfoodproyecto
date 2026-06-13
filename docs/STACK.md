# STACK.md
# Stack Tecnológico Oficial

## 1. Principio

> Ningún agente puede cambiar tecnología, librería principal, framework o patrón de arquitectura sin aprobación del Orchestrator y registro ADR.

## 2. Backend

| Componente | Tecnología oficial | Versión / Nota |
|---|---|---|
| Lenguaje | Python | `[Completar]` |
| Framework | Django | `[Completar]` |
| API | Django REST Framework / Django Ninja | `[Elegir uno]` |
| Autenticación | JWT / Session / OAuth2/OIDC | `[Completar]` |
| Tareas async | Celery | `[Completar]` |
| Cache / broker | Redis | `[Completar]` |

## 3. Base de datos

| Componente | Tecnología |
|---|---|
| Motor principal | PostgreSQL |
| Migraciones | Django migrations |
| Backups | `[Definir estrategia]` |
| Multi-tenant | `[Schema / row-level / tenant_id / no aplica]` |

## 4. Frontend

| Componente | Tecnología |
|---|---|
| Framework | React |
| Build tool | Vite |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Estado cliente | Zustand / Context / Redux |
| Server state | TanStack Query |
| Formularios | React Hook Form |
| Validaciones | Zod / Yup |
| Íconos | Lucide React |

## 5. DevOps

| Componente | Tecnología |
|---|---|
| Contenedores | Docker / Docker Compose |
| Proxy | Nginx / Traefik |
| SSL | Let's Encrypt / Certbot |
| CI/CD | `[GitHub Actions / GitLab CI / Manual]` |
| Logs | `[Docker logs / Loki / Sentry / etc.]` |
| Observabilidad | `[Completar]` |

## 6. Testing

| Capa | Herramienta |
|---|---|
| Backend unit tests | Pytest / Django TestCase |
| API tests | Pytest + APIClient |
| Frontend tests | Vitest / Testing Library |
| E2E | Playwright / Cypress |
| Lint | Ruff / ESLint |
| Format | Black / Prettier |

## 7. Convenciones de versiones

- Backend y frontend deben tener versiones documentadas.
- Las migraciones deben ser reproducibles.
- Los cambios de API deben ser compatibles o versionados.
- Las dependencias críticas deben fijarse con lockfile.

## 8. Librerías prohibidas sin autorización

- Librerías abandonadas.
- Librerías sin mantenimiento.
- Librerías que dupliquen funcionalidades existentes.
- Librerías que agreguen peso excesivo al frontend.
- Librerías que afecten seguridad o privacidad sin revisión.

## 9. Comandos base

```bash
# Backend
python manage.py migrate
python manage.py runserver
pytest

# Frontend
npm install
npm run dev
npm run build
npm run test

# Docker
docker compose up -d --build
docker compose logs -f
```
