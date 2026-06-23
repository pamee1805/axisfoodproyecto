# WORKFLOW.md

# Workflow, Estados y Transiciones

## 1. Objetivo

Definir cómo se mueve el sistema, qué estados existen, qué transiciones son válidas y qué reglas gobiernan los procesos.

Este documento evita que la IA invente flujos paralelos.

En AxisFood los workflows gobiernan:

- Tenants
- Usuarios
- Pedidos
- Pagos
- Caja
- Compras
- Rendiciones
- Devoluciones
- Suscripciones

---

## 2. Entidades con Workflow

| Entidad | Tiene estados | Documento fuente |
|----------|----------|----------|
| Tenant | Sí | DOMAIN_MODEL.md |
| Usuario | Sí | DOMAIN_MODEL.md |
| Pedido | Sí | DOMAIN_MODEL.md |
| Pago | Sí | DOMAIN_MODEL.md |
| CajaSession | Sí | DOMAIN_MODEL.md |
| Compra | Sí | DOMAIN_MODEL.md |
| Rendicion | Sí | DOMAIN_MODEL.md |
| Devolucion | Sí | DOMAIN_MODEL.md |
| Suscripcion | Sí | DOMAIN_MODEL.md |

---

## 3. Estados Permitidos

### Tenant

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| activa | Tenant operativo | Sí | No |
| prueba | Período de prueba | Sí | No |
| suspendida | Acceso bloqueado | Sí | No |
| cancelada | Tenant cancelado | Sí | Sí |

---

### Usuario

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| activo | Puede operar normalmente | Sí | No |
| inactivo | No puede operar | Sí | No |
| suspendido | Acceso bloqueado | Sí | No |
| vacaciones | Ausente temporalmente | Sí | No |

---

### Pedido

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| pendiente | Pedido recibido | Sí | No |
| en_preparacion | Pedido en cocina | Sí | No |
| listo | Pedido preparado | Sí | No |
| en_camino | Pedido en reparto | Sí | No |
| entregado | Pedido entregado | Sí | No |
| finalizado | Pedido cerrado correctamente | Sí | Sí |
| cancelado | Pedido cancelado | Sí | Sí |

---

### Pago

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| pendiente | Pago aún no confirmado | Sí | No |
| aprobado | Pago validado | Sí | Sí |
| rechazado | Pago rechazado | Sí | Sí |
| reintegrado | Dinero devuelto al cliente | Sí | Sí |

---

### CajaSession

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| abierta | Caja operativa | No | No |
| cerrada | Caja cerrada | No | Sí |

---

### Compra

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| pendiente | Esperando aprobación | No | No |
| aprobada | Compra autorizada | No | No |
| rechazada | Compra rechazada | No | Sí |
| recibida | Mercadería recibida | No | Sí |

---

### Rendicion

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| abierta | Rendición pendiente | No | No |
| pendiente_revision | Esperando validación | No | No |
| observada | Tiene diferencias | No | No |
| cerrada | Rendición aceptada | No | Sí |

---

### Devolucion

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| pendiente | Esperando revisión | Sí | No |
| aprobada | Devolución aceptada | Sí | Sí |
| rechazada | Devolución rechazada | Sí | Sí |

---

### Suscripcion

| Estado | Descripción | Visible | Estado Final |
|----------|----------|----------:|----------:|
| activa | Cuenta habilitada | Sí | No |
| por_vencer | Próxima al vencimiento | Sí | No |
| vencida | Pago vencido | Sí | No |
| suspendida | Acceso bloqueado | Sí | No |
| cancelada | Cuenta cancelada | Sí | Sí |

---

## 4. Transiciones Permitidas

### Pedido

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| pendiente | en_preparacion | operador_cocina / gerente | Pedido válido |
| en_preparacion | listo | operador_cocina | Producción finalizada |
| listo | en_camino | operador_delivery / gerente | Delivery asignado |
| en_camino | entregado | operador_delivery | Entrega confirmada |
| entregado | finalizado | gerente | Pago validado |
| pendiente | cancelado | gerente | Motivo obligatorio |
| en_preparacion | cancelado | gerente | Motivo obligatorio |

---

### Pago

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| pendiente | aprobado | sistema / cajero | Confirmación de pago |
| pendiente | rechazado | sistema | Error de pago |
| aprobado | reintegrado | gerente | Devolución aprobada |

---

### CajaSession

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| abierta | cerrada | cajero / gerente | Saldo final registrado |

---

### Compra

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| pendiente | aprobada | gerente | Validación administrativa |
| pendiente | rechazada | gerente | Motivo obligatorio |
| aprobada | recibida | operador_inventario | Mercadería recibida |

---

### Rendicion

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| abierta | pendiente_revision | operador_delivery | Monto informado |
| pendiente_revision | cerrada | gerente | Coincide monto esperado |
| pendiente_revision | observada | gerente | Existe diferencia |

---

### Usuario

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| activo | inactivo | administrador_tenant | Motivo opcional |
| activo | suspendido | administrador_tenant | Motivo obligatorio |
| inactivo | activo | administrador_tenant | Validación administrativa |
| suspendido | activo | administrador_tenant | Rehabilitación aprobada |

---

### Suscripcion

| Desde | Hacia | Quién puede hacerlo | Validaciones |
|----------|----------|----------|----------|
| activa | por_vencer | sistema | Fecha próxima |
| por_vencer | vencida | sistema | Pago no realizado |
| vencida | suspendida | sistema | Período de gracia vencido |
| suspendida | activa | administrador_sistema | Pago confirmado |

---

## 5. Transiciones Prohibidas

| Desde | Hacia | Motivo |
|----------|----------|----------|
| cancelado | pendiente | No se puede reactivar |
| cancelado | en_preparacion | Flujo inválido |
| finalizado | pendiente | Pedido cerrado |
| finalizado | en_preparacion | Pedido cerrado |
| rechazado | aprobado | Debe generarse un nuevo pago |
| cerrada | abierta | Caja cerrada |
| cerrada | pendiente_revision | Rendición finalizada |
| cancelada | activa | Requiere nueva suscripción |

---

## 6. Eventos Auditables

- creación;
- edición;
- cambio de estado;
- asignación de delivery;
- apertura de caja;
- cierre de caja;
- aprobación de compra;
- recepción de compra;
- devolución;
- reintegro;
- cierre de rendición;
- exportación;
- suspensión de cuenta;
- reactivación de cuenta.

---

## 7. Reglas de Implementación

- Las transiciones se validan en backend.
- El frontend puede ocultar botones, pero no decide la validez final.
- Cada transición relevante genera auditoría.
- Cada transición puede disparar notificaciones.
- Las reglas de workflow deben tener tests.
- Toda transición debe respetar RBAC.
- Toda transición debe respetar multi-tenant.
- Ninguna transición puede ejecutarse sobre recursos de otro tenant.
- Las validaciones críticas deben ejecutarse en services.

---

## 8. Sprint 0

Durante Sprint 0 no se programan features de negocio.

Sprint 0 debe construir:

- repositorio;
- backend base;
- frontend base;
- autenticación base;
- modelo de usuarios;
- permisos base;
- RBAC;
- multi-tenant;
- estructura modular;
- Docker;
- base de datos;
- CI/CD inicial;
- documentación viva.

---

## 9. Definition of Done para un Workflow

Un workflow está completo si:

- el backend valida transiciones;
- el frontend muestra acciones correctas;
- hay tests;
- hay auditoría;
- hay manejo de errores;
- está documentado;
- respeta permisos;
- respeta multi-tenant;
- genera notificaciones cuando corresponde;
- cumple las reglas definidas en PROJECT_CONTEXT.md;
- cumple las reglas definidas en RBAC.md;
- cumple las reglas definidas en ARCHITECTURE.md.