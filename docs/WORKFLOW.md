# WORKFLOW.md
# Workflow, Estados y Transiciones

## 1. Objetivo

Definir cómo se mueve el sistema, qué estados existen, qué transiciones son válidas y qué reglas gobiernan los procesos.

Este documento evita que la IA invente flujos paralelos.

## 2. Entidades con workflow

| Entidad | Tiene estados | Documento fuente |
|---|---|---|
| `[Entidad 1]` | Sí/No | `[Referencia]` |
| `[Entidad 2]` | Sí/No | `[Referencia]` |

## 3. Estados permitidos

Ejemplo:

| Estado | Descripción | Visible para usuario | Estado final |
|---|---|---:|---:|
| `draft` | Borrador | No | No |
| `active` | Activo | Sí | No |
| `paused` | Pausado | Sí | No |
| `closed` | Cerrado | Sí | Sí |

## 4. Transiciones permitidas

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|---|---|---|---|
| `draft` | `active` | Admin / Supervisor | Datos completos |
| `active` | `paused` | Admin / Supervisor | Motivo obligatorio |
| `paused` | `active` | Admin / Supervisor | Motivo obligatorio |
| `active` | `closed` | Admin / Supervisor | Reglas de cierre |

## 5. Transiciones prohibidas

| Desde | Hacia | Motivo |
|---|---|---|
| `closed` | `draft` | No se puede volver a borrador |
| `closed` | `active` | Requiere proceso de reapertura |

## 6. Eventos auditables del workflow

- creación;
- cambio de estado;
- cambio de responsable;
- derivación;
- cierre;
- reapertura;
- cancelación;
- exportación.

## 7. Reglas de implementación

- Las transiciones se validan en backend.
- El frontend puede ocultar botones, pero no decide la validez final.
- Cada transición relevante genera auditoría.
- Cada transición puede disparar notificaciones.
- Las reglas de workflow deben tener tests.

## 8. Sprint 0

Durante Sprint 0 no se programan features de negocio.

Sprint 0 debe construir:

- repo;
- backend base;
- frontend base;
- autenticación base;
- modelo de usuarios;
- permisos base;
- estructura modular;
- Docker;
- base de datos;
- CI/CD inicial;
- documentación viva.

## 9. Definition of Done para un flujo

Un flujo está completo si:

- el backend valida transiciones;
- el frontend muestra acciones correctas;
- hay tests;
- hay auditoría;
- hay manejo de errores;
- está documentado;
- respeta permisos;
- respeta multi-tenant si aplica.
