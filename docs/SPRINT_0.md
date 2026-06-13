# SPRINT_0.md
# Sprint 0 - Cimientos del Proyecto

## 1. Regla de oro

> No se programan features de negocio en Sprint 0.

El objetivo del Sprint 0 es construir la plataforma antes de construir la aplicación.

## 2. Distribución recomendada

| Área | Porcentaje |
|---|---:|
| Cimientos técnicos y arquitectura | 70% |
| Features de negocio | 0% |
| Preparación funcional | 30% |

## 3. Backend base

Entregables:

- repo backend;
- configuración Django;
- configuración de entorno;
- conexión PostgreSQL;
- modelo de usuario;
- autenticación base;
- permisos base;
- estructura modular;
- service layer inicial;
- healthcheck;
- tests mínimos.

## 4. Frontend base

Entregables:

- repo frontend;
- React + Vite;
- Tailwind;
- layout principal;
- sistema de rutas;
- cliente HTTP;
- manejo de auth;
- TanStack Query o equivalente;
- estados loading/error/empty;
- componentes base;
- design system mínimo.

## 5. DevOps inicial

Entregables:

- Dockerfile backend;
- Dockerfile frontend;
- docker-compose;
- PostgreSQL;
- Redis;
- Nginx o proxy;
- variables de entorno;
- scripts de arranque;
- logs;
- README de ejecución local.

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

## 7. Definition of Done del Sprint 0

Sprint 0 está completo si:

- el proyecto corre localmente;
- backend y frontend se comunican;
- existe autenticación base;
- existen permisos base;
- la DB migra sin errores;
- los contenedores levantan;
- hay estructura modular;
- hay tests mínimos;
- el equipo puede crear nuevas features sin romper arquitectura;
- los agentes IA tienen documentación suficiente para no improvisar.

## 8. No permitido en Sprint 0

- pantallas de negocio complejas;
- endpoints finales de negocio;
- IA aplicada;
- integraciones externas no esenciales;
- dashboards finales;
- reportes avanzados;
- automatizaciones de negocio.

## 9. Salida de Sprint 0

Al finalizar, el Orchestrator debe emitir:

```txt
SPRINT_0_STATUS: READY_FOR_FEATURES
```

Si falta documentación o arquitectura, emitir:

```txt
SPRINT_0_STATUS: BLOCKED
Motivo: [explicación]
```
