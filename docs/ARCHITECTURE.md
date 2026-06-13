# ARCHITECTURE.md
# Arquitectura del Sistema

## 1. Principio rector

> El backend es el **source of truth**.  
> El frontend presenta estado, pero no decide reglas de negocio, permisos, workflow, SLA, precios ni validaciones críticas.

## 2. Objetivos arquitectónicos

La arquitectura debe ser:

- modular;
- mantenible;
- testeable;
- escalable;
- segura;
- multi-tenant si aplica;
- observable;
- documentada;
- preparada para agentes IA sin improvisación.

## 3. Capas del sistema

```txt
Frontend
  ↓
API / Controllers / ViewSets
  ↓
Serializers / DTOs
  ↓
Service Layer
  ↓
Models / ORM
  ↓
Database
```

## 4. Regla de Service Layer

Toda lógica de negocio compleja debe vivir en `services/`.

### Permitido en services

- workflow;
- cálculos;
- validaciones de negocio;
- reglas de permisos complejas;
- transiciones de estado;
- creación coordinada de entidades;
- auditoría;
- notificaciones;
- integración con terceros.

### Prohibido en vistas, serializers o frontend

- lógica de negocio crítica;
- cálculos de permisos;
- mutaciones complejas;
- decisiones de workflow;
- reglas multi-tenant;
- validaciones de seguridad.

## 5. Módulos principales

| Módulo | Responsabilidad | Owner principal |
|---|---|---|
| `[Módulo 1]` | `[Responsabilidad]` | Backend Agent |
| `[Módulo 2]` | `[Responsabilidad]` | Frontend Agent |
| `[Módulo 3]` | `[Responsabilidad]` | DevOps Agent |
| `[Módulo 4]` | `[Responsabilidad]` | Security Agent |

## 6. Modelo de datos

### Entidades principales

| Entidad | Descripción | Relaciones clave |
|---|---|---|
| `[Entidad 1]` | `[Descripción]` | `[Relaciones]` |
| `[Entidad 2]` | `[Descripción]` | `[Relaciones]` |

### Reglas de datos

- Toda entidad sensible debe tener `created_at`, `updated_at` y trazabilidad.
- Toda entidad multi-tenant debe estar asociada a un tenant/organismo/empresa.
- No se deben hacer queries globales sin scope.
- No se deben exponer IDs internos si el dominio requiere códigos públicos.

## 7. Multi-tenant y aislamiento

Si el sistema es multi-tenant:

- cada query debe filtrar por tenant;
- los permisos deben validar alcance;
- los reportes deben respetar el tenant;
- las exportaciones deben respetar el tenant;
- ningún usuario debe poder inferir datos de otro tenant.

## 8. Auditoría

Toda acción relevante debe generar evento auditable.

Eventos mínimos:

- login;
- creación;
- edición;
- cambio de estado;
- eliminación lógica;
- exportación;
- asignación;
- derivación;
- cambio de permisos;
- integración externa.

## 9. Integraciones externas

| Integración | Propósito | Responsable | Estado |
|---|---|---|---|
| `[Integración 1]` | `[Propósito]` | `[Owner]` | `[Pendiente/Implementado]` |

## 10. Decisiones arquitectónicas

Las decisiones relevantes deben registrarse como ADR en `templates/ADR_TEMPLATE.md`.

Ejemplos:

- elección de framework;
- patrón de autenticación;
- base de datos;
- estrategia multi-tenant;
- manejo de archivos;
- mensajería asíncrona;
- proveedores externos.

## 11. Anti-patrones prohibidos

- Duplicar lógica entre backend y frontend.
- Crear endpoints ad hoc sin convención.
- Mezclar dominios en un mismo módulo sin justificación.
- Crear carpetas nuevas sin actualizar `FOLDER_STRUCTURE.md`.
- Saltar permisos en endpoints internos.
- Hardcodear reglas de negocio.
- Crear features sin tests mínimos.
- Resolver deuda técnica agregando más complejidad accidental.
