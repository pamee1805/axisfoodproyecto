# STACK.md

# Stack Tecnológico Oficial

## 1. Principio

> Ningún agente puede cambiar tecnología, librería principal, framework o patrón de arquitectura sin aprobación del Orchestrator y registro ADR.

El stack definido en este documento es el stack oficial de AxisFood/GastroChef y debe mantenerse consistente durante todo el desarrollo del proyecto.

---

## 2. Backend

| Componente | Tecnología oficial | Versión / Nota |
|---|---|---|
| Lenguaje | Python | 3.13+ |
| Framework | Django | 5.x |
| API | Django REST Framework | Oficial |
| Autenticación | JWT (SimpleJWT) | Oficial |
| Tareas async | Celery | Con Redis |
| Cache / broker | Redis | Broker y cache principal |

### Librerías principales

- Django
- Django REST Framework
- djangorestframework-simplejwt
- Celery
- Redis
- psycopg
- django-filter
- drf-spectacular

---

## 3. Base de datos

| Componente | Tecnología |
|---|---|
| Motor principal | PostgreSQL |
| Migraciones | Django Migrations |
| Backups | Dump automático programado |
| Multi-tenant | tenant_id (Row Level Isolation) |

### Reglas

- Todo modelo sensible debe tener relación con tenant.
- Todo queryset debe filtrar por tenant.
- Ninguna consulta puede exponer información de otro tenant.
- Las migraciones deben ser reproducibles.

---

## 4. Frontend

| Componente | Tecnología |
|---|---|
| Framework | React |
| Build tool | Vite |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Estado cliente | Context API |
| Server state | TanStack Query |
| Formularios | React Hook Form |
| Validaciones | Zod |
| Íconos | Lucide React |

### Librerías principales

- React
- React Router DOM
- Axios
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- Tailwind CSS

---

## 5. DevOps

| Componente | Tecnología |
|---|---|
| Contenedores | Docker / Docker Compose |
| Proxy | Nginx |
| SSL | Let's Encrypt + Certbot |
| CI/CD | GitHub Actions |
| Logs | Docker Logs |
| Observabilidad | Django Admin + Logs |

### Infraestructura mínima

- Backend Django
- Frontend React
- PostgreSQL
- Redis
- Nginx

---

## 6. Testing

| Capa | Herramienta |
|---|---|
| Backend unit tests | Pytest |
| API tests | Pytest + APIClient |
| Frontend tests | Vitest |
| E2E | Playwright |
| Lint | Ruff + ESLint |
| Format | Black + Prettier |

### Cobertura mínima

- Services críticos
- Permisos RBAC
- Multi-tenant
- Autenticación
- APIs principales

---

## 7. Convenciones de versiones

- Backend y frontend deben tener versiones documentadas.
- Las migraciones deben ser reproducibles.
- Los cambios de API deben ser compatibles o versionados.
- Las dependencias críticas deben fijarse mediante lockfile.
- Toda actualización mayor requiere validación previa.
- Todo cambio incompatible debe registrarse mediante ADR.

### Convención inicial

```txt
Backend: v0.x.x
Frontend: v0.x.x
API: v1
```

---

## 8. Librerías prohibidas sin autorización

- Librerías abandonadas.
- Librerías sin mantenimiento.
- Librerías que dupliquen funcionalidades existentes.
- Librerías que agreguen peso excesivo al frontend.
- Librerías que afecten seguridad o privacidad sin revisión.
- Librerías que requieran acceso innecesario a datos sensibles.
- Librerías instaladas sin justificación técnica.

---

## 9. Comandos base

### Backend

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
pytest
```

### Frontend

```bash
npm install
npm run dev
npm run build
npm run test
```

### Docker

```bash
docker compose up -d --build
docker compose down
docker compose logs -f
```

### Celery

```bash
celery -A config worker -l info
celery -A config beat -l info
```

### Calidad de código

```bash
ruff check .
black .
eslint .
```

---

## 10. Tecnologías futuras (Fuera del MVP)

Estas tecnologías podrán evaluarse en versiones posteriores:

- Aplicación móvil Flutter.
- Integración Mercado Pago avanzada.
- Integración AFIP.
- OpenTelemetry.
- Grafana.
- Loki.
- Sentry.
- IA para predicción de ventas.
- IA para análisis de pérdidas.
- Geolocalización avanzada de deliverys.

Toda incorporación futura deberá ser aprobada por el Orchestrator y documentada mediante ADR.
