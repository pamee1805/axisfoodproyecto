# SPRINT_0.md

# Sprint 0 - Cimientos del Proyecto

## 1. Regla de oro

> No se programan features de negocio en Sprint 0.

El objetivo del Sprint 0 es construir la plataforma antes de construir la aplicación.

Para AxisFood/GastroChef, Sprint 0 tiene como objetivo dejar lista la arquitectura, seguridad, autenticación, permisos, multi-tenant, documentación y estructura técnica necesaria para comenzar el desarrollo funcional en Sprint 1.

---

## 2. Distribución recomendada

| Área | Porcentaje |
|---|---:|
| Cimientos técnicos y arquitectura | 70% |
| Features de negocio | 0% |
| Preparación funcional | 30% |

---

## 3. Backend base

### Entregables

- repositorio backend;
- configuración Django;
- configuración de entorno;
- conexión PostgreSQL;
- modelo Tenant;
- modelo Usuario personalizado;
- autenticación JWT;
- permisos base;
- RBAC inicial;
- soporte multi-tenant;
- estructura modular;
- service layer inicial;
- auditoría base;
- healthcheck;
- tests mínimos.

### Apps iniciales recomendadas

- accounts
- tenants
- audit
- core

---

## 4. Frontend base

### Entregables

- repositorio frontend;
- React + Vite;
- Tailwind CSS;
- layout principal;
- sistema de rutas;
- cliente HTTP;
- manejo de autenticación;
- manejo de permisos;
- TanStack Query o equivalente;
- estados loading/error/empty;
- componentes base;
- design system mínimo;
- estructura de navegación principal.

### Layout inicial

- Sidebar
- Header
- Área de contenido
- Página Login
- Dashboard temporal

---

## 5. DevOps inicial

### Entregables

- Dockerfile backend;
- Dockerfile frontend;
- docker-compose;
- PostgreSQL;
- Redis;
- Nginx o proxy equivalente;
- variables de entorno;
- scripts de arranque;
- logs;
- README de ejecución local.

### Variables mínimas

- SECRET_KEY
- DEBUG
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- ALLOWED_HOSTS

---

## 6. Documentación obligatoria

Antes de avanzar a Sprint 1 deben existir y estar completos:

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `STACK.md`
- `RULES.md`
- `FOLDER_STRUCTURE.md`
- `WORKFLOW.md`
- `RBAC.md`
- `API_GUIDELINES.md`

Documentación recomendada:

- `ADR/`
- `README.md`
- `SPRINT_0.md`

---

## 7. Definition of Done del Sprint 0

Sprint 0 está completo si:

- el proyecto corre localmente;
- backend y frontend se comunican;
- existe autenticación base;
- existen permisos base;
- existe RBAC inicial;
- existe soporte multi-tenant;
- la DB migra sin errores;
- los contenedores levantan correctamente;
- hay estructura modular;
- existe auditoría básica;
- hay tests mínimos;
- el equipo puede crear nuevas features sin romper arquitectura;
- los agentes IA tienen documentación suficiente para no improvisar.

---

## 8. No permitido en Sprint 0

- pantallas de negocio complejas;
- endpoints finales de negocio;
- módulo completo de pedidos;
- módulo completo de pagos;
- módulo completo de deliverys;
- dashboards finales;
- reportes avanzados;
- IA aplicada;
- integraciones externas no esenciales;
- automatizaciones de negocio;
- lógica avanzada de pérdidas y rentabilidad.

---

## 9. Salida de Sprint 0

Al finalizar, el Orchestrator debe emitir:

```txt
SPRINT_0_STATUS: READY_FOR_FEATURES
```

Si falta documentación, arquitectura, permisos o infraestructura, emitir:

```txt
SPRINT_0_STATUS: BLOCKED
Motivo: [explicación]
```

### Criterio final

Sprint 1 no puede comenzar si:

- falta documentación obligatoria;
- falta RBAC;
- falta soporte multi-tenant;
- falta autenticación;
- existen errores de migración;
- existen errores críticos de arquitectura.

La prioridad del Sprint 0 es garantizar una base sólida, segura y mantenible para el desarrollo de AxisFood/GastroChef.