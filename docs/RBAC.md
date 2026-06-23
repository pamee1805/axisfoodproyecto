# RBAC.md

# Roles, Permisos, Alcances y Multi-Tenant

## 1. Principio

> Todo acceso debe estar controlado por rol, pertenencia y alcance.
>
> El multi-tenant no se agrega después: se diseña desde el inicio.

AxisFood es una plataforma SaaS multi-tenant para negocios gastronómicos.

Cada empresa, restaurante, cafetería o comercio gastronómico registrado en la plataforma constituye un Tenant independiente.

Ningún usuario puede acceder a recursos pertenecientes a otro tenant.

Todas las validaciones de acceso se realizan en el backend.

Todo acceso debe respetar:

- rol del usuario;
- alcance;
- tenant;
- estado del usuario;
- estado del tenant.

---

## 2. Roles globales

| Rol | Descripción |
|---|---|
| `administrador_sistema` | Administración global de AxisFood |
| `administrador_tenant` | Dueño o administrador principal del negocio |
| `gerente` | Responsable operativo del negocio |
| `cajero` | Operación de caja y pagos |
| `operador_cocina` | Producción, cocina y preparación de pedidos |
| `operador_delivery` | Gestión de repartos y entregas |
| `operador_inventario` | Compras, stock, proveedores y control de inventario |
| `visualizador` | Acceso únicamente de lectura |
| `cliente_externo` | Cliente que realiza pedidos o consulta su estado |

---

## 3. Alcances

| Alcance | Descripción |
|---|---|
| `global` | Acceso total a toda la plataforma |
| `tenant` | Acceso a los recursos del negocio |
| `sucursal` | Acceso a una sucursal específica |
| `equipo` | Acceso a un área específica: caja, cocina, inventario o delivery |
| `propio` | Acceso únicamente a recursos propios |
| `publico` | Información pública |

---

## 4. Matriz de permisos

| Recurso | Acción | administrador_sistema | administrador_tenant | gerente | cajero | operador_cocina | operador_delivery | operador_inventario | visualizador | cliente_externo |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Tenants | Crear | Sí | No | No | No | No | No | No | No | No |
| Tenants | Ver | Sí | Propio | Propio | No | No | No | No | No | No |
| Tenants | Suspender | Sí | No | No | No | No | No | No | No | No |
| Sucursales | Crear | Sí | Sí | No | No | No | No | No | No | No |
| Sucursales | Ver | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | No |
| Sucursales | Editar | Sí | Sí | Sí | No | No | No | No | No | No |
| Usuarios | Crear | Sí | Sí | No | No | No | No | No | No | No |
| Usuarios | Ver | Sí | Sí | Sí | No | No | No | No | No | No |
| Usuarios | Editar | Sí | Sí | No | No | No | No | No | No | No |
| Roles | Asignar | Sí | Sí | No | No | No | No | No | No | No |
| Permisos | Ver | Sí | Sí | No | No | No | No | No | No | No |
| Clientes | Crear | Sí | Sí | Sí | Sí | No | No | No | No | Sí |
| Clientes | Ver | Sí | Sí | Sí | Sí | No | No | No | Sí | Propio |
| Clientes | Editar | Sí | Sí | Sí | Sí | No | No | No | No | Propio |
| Categorías | Crear | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Categorías | Ver | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Productos | Crear | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Productos | Editar | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Productos | Ver | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Pedidos | Crear | Sí | Sí | Sí | Sí | No | No | No | No | Sí |
| Pedidos | Ver | Sí | Sí | Sí | Sí | Sí | Asignado | No | Sí | Propio |
| Pedidos | Cambiar estado | Sí | Sí | Sí | No | Sí | Sí | No | No | No |
| Pedidos | Cancelar | Sí | Sí | Sí | Sí | No | No | No | No | Propio limitado |
| Pagos | Registrar | Sí | Sí | Sí | Sí | No | No | No | No | No |
| Pagos | Ver | Sí | Sí | Sí | Sí | No | No | No | Sí | Propio |
| Pagos | Reintegrar | Sí | Sí | Sí | Sí | No | No | No | No | No |
| Caja | Abrir | Sí | Sí | Sí | Sí | No | No | No | No | No |
| Caja | Cerrar | Sí | Sí | Sí | Sí | No | No | No | No | No |
| Caja | Ver | Sí | Sí | Sí | Sí | No | No | No | Sí | No |
| Caja | Registrar movimiento | Sí | Sí | Sí | Sí | No | No | No | No | No |
| Compras | Crear | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Compras | Aprobar | Sí | Sí | Sí | No | No | No | No | No | No |
| Compras | Ver | Sí | Sí | Sí | No | No | No | Sí | Sí | No |
| Proveedores | Crear | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Proveedores | Editar | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Proveedores | Ver | Sí | Sí | Sí | No | No | No | Sí | Sí | No |
| Inventario | Ver | Sí | Sí | Sí | No | No | No | Sí | Sí | No |
| Inventario | Ajustar | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Inventario | Registrar entrada | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Inventario | Registrar salida | Sí | Sí | Sí | No | Sí | No | Sí | No | No |
| Deliverys | Ver | Sí | Sí | Sí | No | No | Sí | No | Sí | No |
| Deliverys | Asignar pedido | Sí | Sí | Sí | No | No | Sí | No | No | No |
| Rendiciones | Crear | Sí | Sí | Sí | No | No | Sí | No | No | No |
| Rendiciones | Ver | Sí | Sí | Sí | No | No | Propia | No | Sí | No |
| Rendiciones | Cerrar | Sí | Sí | Sí | No | No | No | No | No | No |
| Mermas | Registrar | Sí | Sí | Sí | No | Sí | No | Sí | No | No |
| Mermas | Ver | Sí | Sí | Sí | No | Sí | No | Sí | Sí | No |
| Desperdicios | Registrar | Sí | Sí | Sí | No | Sí | No | Sí | No | No |
| Desperdicios | Ver | Sí | Sí | Sí | No | Sí | No | Sí | Sí | No |
| Vencimientos | Registrar | Sí | Sí | Sí | No | No | No | Sí | No | No |
| Vencimientos | Ver | Sí | Sí | Sí | No | No | No | Sí | Sí | No |
| Devoluciones | Registrar | Sí | Sí | Sí | Sí | No | No | Sí | No | No |
| Devoluciones | Ver | Sí | Sí | Sí | Sí | No | No | Sí | Sí | Propia |
| Reportes | Ver | Sí | Sí | Sí | No | No | No | No | Sí | No |
| Reportes | Exportar | Sí | Sí | Sí | No | No | No | No | No | No |
| Dashboard | Ver | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí | No |
| Auditoría | Ver | Sí | Sí | No | No | No | No | No | No | No |
| Suscripciones | Gestionar | Sí | No | No | No | No | No | No | No | No |
| Suscripciones | Ver | Sí | Sí | No | No | No | No | No | No | No |
| Configuración | Modificar | Sí | Sí | No | No | No | No | No | No | No |

---

## 5. Reglas Multi-Tenant

- Todo tenant representa un negocio gastronómico independiente.
- Todo usuario pertenece a un tenant, salvo `administrador_sistema`.
- Toda sucursal pertenece a un tenant.
- Todo cliente pertenece a un tenant.
- Toda categoría pertenece a un tenant.
- Todo producto pertenece a un tenant.
- Todo pedido pertenece a un tenant.
- Todo pago pertenece a un tenant.
- Toda sesión de caja pertenece a un tenant.
- Todo movimiento de caja pertenece a un tenant.
- Toda compra pertenece a un tenant.
- Todo proveedor pertenece a un tenant.
- Todo movimiento de inventario pertenece a un tenant.
- Toda rendición pertenece a un tenant.
- Toda merma pertenece a un tenant.
- Todo desperdicio pertenece a un tenant.
- Todo vencimiento pertenece a un tenant.
- Toda devolución pertenece a un tenant.
- Toda suscripción pertenece a un tenant.
- Todo registro de auditoría pertenece a un tenant.
- Todo queryset sensible debe filtrar por tenant.
- Todo endpoint sensible debe validar tenant, rol y alcance.
- Todo reporte debe filtrar por tenant.
- Toda exportación debe quedar auditada.
- Ningún usuario puede acceder a recursos de otro tenant aunque conozca el ID.
- No se deben exponer datos agregados que permitan inferir información de otro tenant.
- Un tenant suspendido no puede operar el sistema.

---

## 6. Permisos por acción

Toda acción sensible debe responder:

- ¿Quién puede ejecutarla?
- ¿Sobre qué recurso?
- ¿Bajo qué alcance?
- ¿Con qué validaciones?
- ¿Genera auditoría?
- ¿Genera notificaciones?
- ¿Afecta inventario?
- ¿Afecta caja?
- ¿Afecta reportes?
- ¿Afecta métricas de pérdidas o rentabilidad?

---

## 7. Reglas específicas por módulo

### Usuarios

- Solo `administrador_sistema` y `administrador_tenant` pueden crear usuarios.
- Solo `administrador_sistema` y `administrador_tenant` pueden asignar roles.
- Un usuario no puede cambiar su propio rol.
- Un usuario suspendido no puede operar.
- Un usuario inactivo no puede operar.

### Pedidos

- Todo pedido pertenece a un tenant.
- Todo pedido pertenece a una sucursal.
- El cliente externo solo puede ver sus propios pedidos.
- Cocina solo puede modificar estados relacionados con preparación.
- Delivery solo puede modificar estados relacionados con entrega.
- La cancelación debe tener motivo obligatorio.
- Todo cambio de estado debe auditarse.

### Pagos

- Solo cajero, gerente, administrador_tenant o administrador_sistema pueden registrar pagos.
- Los pagos en efectivo pueden afectar caja y rendiciones.
- Los reintegros deben auditarse.
- Un pago rechazado no puede convertirse manualmente en aprobado sin trazabilidad.

### Caja

- Toda caja debe abrirse antes de registrar movimientos.
- Todo cierre debe registrar saldo final.
- Toda diferencia debe quedar auditada.
- Los movimientos de caja deben pertenecer a una sesión de caja.

### Compras

- Toda compra debe estar asociada a un proveedor.
- Toda compra aprobada puede generar entrada de inventario.
- Toda compra recibida debe quedar auditada.
- Solo gerente, administrador_tenant o administrador_sistema pueden aprobar compras.

### Inventario

- Todo movimiento de inventario debe registrar producto, cantidad, motivo y usuario.
- Todo ajuste manual debe tener motivo obligatorio.
- Las salidas por merma, desperdicio, vencimiento o devolución deben quedar auditadas.
- El stock actual se calcula a partir de los movimientos de inventario.

### Deliverys

- Un operador delivery solo puede ver pedidos asignados.
- La asignación de pedido debe ser realizada por gerente, administrador_tenant o administrador_sistema.
- Los pedidos cobrados en efectivo generan monto esperado de rendición.

### Rendiciones

- Toda rendición debe validar monto esperado y monto rendido.
- Toda diferencia debe quedar registrada.
- Solo gerente, administrador_tenant o administrador_sistema pueden cerrar rendiciones.
- El delivery solo puede crear o consultar sus propias rendiciones.

### Mermas, desperdicios y vencimientos

- Toda merma debe tener motivo obligatorio.
- Todo desperdicio debe tener motivo obligatorio.
- Todo vencimiento debe registrar producto, cantidad y fecha.
- Estas operaciones afectan inventario y métricas de pérdida.
- Todas estas operaciones deben quedar auditadas.

### Devoluciones

- Toda devolución debe pertenecer a un pedido.
- Las devoluciones pueden impactar caja, pagos, inventario y reportes.
- Toda devolución debe tener motivo.
- Las devoluciones aprobadas deben quedar auditadas.

### Reportes

- Todo reporte debe filtrar por tenant.
- Todo reporte financiero debe usar datos validados.
- Toda exportación debe auditarse.
- El visualizador puede ver reportes autorizados, pero no exportarlos.

### Suscripciones

- Solo `administrador_sistema` puede gestionar suscripciones.
- Un tenant suspendido por suscripción no puede operar.
- La reactivación debe quedar auditada.

---

## 8. Tests mínimos de permisos

Para cada endpoint sensible:

- usuario sin login no accede;
- usuario suspendido no accede;
- tenant suspendido no accede;
- usuario de otro tenant no accede;
- usuario con rol insuficiente no accede;
- usuario con alcance incorrecto no accede;
- usuario correcto accede;
- cliente externo solo accede a recursos propios;
- delivery solo accede a pedidos asignados;
- reportes filtran por tenant;
- exportaciones generan auditoría;
- movimientos de caja quedan auditados;
- movimientos de inventario quedan auditados;
- cambios de estado quedan auditados;
- rendiciones quedan auditadas;
- mermas quedan auditadas;
- desperdicios quedan auditados;
- devoluciones quedan auditadas.

---

## 9. Prohibiciones

- No confiar en filtros enviados por frontend.
- No exponer endpoints administrativos sin permisos explícitos.
- No asumir que un usuario posee un único alcance.
- No devolver objetos de otro tenant aunque se conozca el ID.
- No omitir auditoría en acciones críticas.
- No permitir exportaciones sin registro de auditoría.
- No permitir cambios de estado fuera del workflow definido.
- No permitir operaciones sobre tenants suspendidos.
- No permitir operaciones por usuarios suspendidos.
- No permitir consultas globales sin validación explícita.
- No permitir acciones financieras sin auditoría.
- No permitir ajustes de inventario sin motivo.
- No permitir cierre de caja sin saldo final.
- No permitir cierre de rendición sin monto rendido.

---

## 10. Regla de Oro

> Si existe duda sobre permisos, acceso, alcance, tenant o auditoría, el backend debe denegar la operación hasta que las validaciones sean explícitas.