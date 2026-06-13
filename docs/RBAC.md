# RBAC.md
# Roles, Permisos, Scopes y Multi-tenant

## 1. Principio

> Todo acceso debe estar controlado por rol, pertenencia y alcance.  
> El multi-tenant no se agrega después: se diseña desde el inicio.

## 2. Roles globales

| Rol | Descripción |
|---|---|
| `system_admin` | Administración global del sistema |
| `tenant_admin` | Administración de un tenant/organismo/empresa |
| `manager` | Gestión operativa |
| `operator` | Operación diaria |
| `viewer` | Solo lectura |
| `external_user` | Usuario externo / ciudadano / cliente |

## 3. Scopes

| Scope | Descripción |
|---|---|
| `global` | Acceso total |
| `tenant` | Acceso a un tenant |
| `team` | Acceso a un equipo |
| `own` | Solo recursos propios |
| `public` | Información pública |

## 4. Matriz de permisos

| Recurso | Acción | system_admin | tenant_admin | manager | operator | viewer | external_user |
|---|---|---:|---:|---:|---:|---:|---:|
| Usuarios | Crear | Sí | Sí | No | No | No | No |
| Usuarios | Ver | Sí | Sí | Sí | No | No | No |
| Tickets / Solicitudes | Crear | Sí | Sí | Sí | Sí | No | Sí |
| Tickets / Solicitudes | Responder | Sí | Sí | Sí | Sí | No | Sí, si es propio |
| Reportes | Ver | Sí | Sí | Sí | No | Sí | No |
| Configuración | Modificar | Sí | Sí | No | No | No | No |

## 5. Reglas multi-tenant

- Todo modelo sensible debe tener relación con tenant si corresponde.
- Todo queryset debe filtrar por tenant.
- Todo endpoint debe validar scope.
- Todo reporte debe filtrar por tenant.
- Toda exportación debe auditarse.
- No se exponen datos agregados si pueden inferir información sensible de otro tenant.

## 6. Permisos por acción

Toda acción sensible debe responder:

- ¿Quién puede ejecutarla?
- ¿Sobre qué recurso?
- ¿Bajo qué scope?
- ¿Con qué validaciones?
- ¿Se audita?
- ¿Notifica a alguien?

## 7. Tests mínimos de permisos

Para cada endpoint sensible:

- usuario sin login no accede;
- usuario de otro tenant no accede;
- usuario con rol insuficiente no accede;
- usuario correcto accede;
- acción queda auditada si corresponde.

## 8. Prohibiciones

- No confiar en filtros del frontend.
- No exponer endpoints administrativos sin permiso explícito.
- No asumir que un usuario pertenece a un solo scope si el modelo permite múltiples pertenencias.
- No devolver objetos de otro tenant aunque se conozca el ID.
