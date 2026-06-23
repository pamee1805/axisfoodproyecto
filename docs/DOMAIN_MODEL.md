# DOMAIN_MODEL.md

# Modelo de Dominio Oficial de AxisFood

## 1. Objetivo

Definir las entidades principales de AxisFood, sus relaciones, responsabilidades y reglas de negocio.

Este documento constituye la fuente oficial para:

* Modelos Django
* Base de datos PostgreSQL
* APIs
* Services
* RBAC
* Multi-Tenant
* Workflows
* Reportes
* Auditoría

---

# 2. Principios del Modelo

## Multi-Tenant

AxisFood es una plataforma multi-tenant.

Cada negocio gastronómico opera de forma aislada.

Ningún tenant puede acceder a información perteneciente a otro tenant.

Toda entidad sensible debe estar asociada a un tenant.

---

## Auditoría

Toda operación relevante debe registrarse en AuditLog.

Eventos mínimos auditables:

* creación;
* modificación;
* eliminación lógica;
* cambios de estado;
* movimientos de caja;
* movimientos de inventario;
* pagos;
* rendiciones;
* devoluciones;
* cambios de permisos.

---

## Source of Truth

El backend es la fuente de verdad.

Las reglas de negocio se implementan en Services.

---

# 3. Tenant

Representa una empresa gastronómica dentro de AxisFood.

## Campos

```txt
id
nombre
razon_social
cuit
email
telefono
direccion
estado
created_at
updated_at
```

## Estados

```txt
activo
prueba
suspendido
cancelado
```

---

# 4. Sucursal

Representa una ubicación física perteneciente a un tenant.

## Campos

```txt
id
tenant_id
nombre
direccion
telefono
estado
created_at
updated_at
```

## Estados

```txt
activa
inactiva
```

---

# 5. Usuario

Representa una persona que utiliza el sistema.

## Campos

```txt
id
tenant_id
sucursal_id
nombre
apellido
email
telefono
estado
ultimo_acceso
created_at
updated_at
```

## Estados

```txt
activo
inactivo
suspendido
vacaciones
```

---

# 6. Rol

Define conjuntos de permisos.

## Campos

```txt
id
nombre
descripcion
created_at
```

## Roles iniciales

```txt
system_admin
tenant_admin
manager
operator
viewer
external_user
```

---

# 7. Permiso

Representa acciones específicas del sistema.

## Campos

```txt
id
codigo
nombre
descripcion
```

---

# 8. UserRole

Relación N-N entre usuarios y roles.

## Campos

```txt
id
usuario_id
rol_id
```

---

# 9. RolePermission

Relación N-N entre roles y permisos.

## Campos

```txt
id
rol_id
permiso_id
```

---

# 10. Cliente

Representa un comprador.

## Campos

```txt
id
tenant_id
nombre
apellido
telefono
email
direccion
notas
created_at
updated_at
```

---

# 11. Categoria

Clasifica productos.

## Campos

```txt
id
tenant_id
nombre
descripcion
estado
created_at
updated_at
```

---

# 12. Producto

Representa artículos comercializados.

## Campos

```txt
id
tenant_id
categoria_id
nombre
descripcion
precio
costo
stock_minimo
stock_maximo
punto_reposicion
estado
created_at
updated_at
```

## Estados

```txt
activo
inactivo
agotado
```

## Regla

El stock actual se calcula desde InventarioMovimiento.

No se almacena físicamente.

---

# 13. Pedido

Representa una venta.

## Campos

```txt
id
tenant_id
sucursal_id
cliente_id
estado
subtotal
descuento
total
fecha
created_by
created_at
updated_at
```

## Estados

```txt
pendiente
en_preparacion
listo
en_camino
entregado
finalizado
cancelado
```

---

# 14. PedidoItem

Detalle de productos vendidos.

## Campos

```txt
id
pedido_id
producto_id
cantidad
precio_unitario
subtotal
```

---

# 15. Pago

Representa un cobro asociado a un pedido.

## Campos

```txt
id
tenant_id
pedido_id
monto
metodo_pago
estado
fecha
created_at
```

## Métodos

```txt
efectivo
tarjeta
transferencia
mercado_pago
```

## Estados

```txt
pendiente
aprobado
rechazado
reintegrado
```

---

# 16. CajaSession

Representa apertura y cierre de caja.

## Campos

```txt
id
tenant_id
sucursal_id
usuario_id
fecha_apertura
fecha_cierre
saldo_inicial
saldo_final
estado
```

## Estados

```txt
abierta
cerrada
```

---

# 17. CajaMovimiento

Representa movimientos financieros.

## Campos

```txt
id
tenant_id
caja_session_id
tipo
monto
descripcion
usuario_id
fecha
```

## Tipos

```txt
ingreso
egreso
ajuste
```

---

# 18. Proveedor

Representa proveedores comerciales.

## Campos

```txt
id
tenant_id
nombre
telefono
email
direccion
estado
created_at
updated_at
```

---

# 19. Compra

Representa adquisiciones de mercadería.

## Campos

```txt
id
tenant_id
proveedor_id
usuario_id
estado
total
fecha
created_at
updated_at
```

## Estados

```txt
pendiente
aprobada
rechazada
recibida
```

---

# 20. CompraItem

Detalle de productos comprados.

## Campos

```txt
id
compra_id
producto_id
cantidad
costo_unitario
subtotal
```

---

# 21. InventarioMovimiento

Representa movimientos de stock.

## Campos

```txt
id
tenant_id
sucursal_id
producto_id
tipo_movimiento
cantidad
motivo
usuario_id
fecha
```

## Tipos

```txt
entrada
salida
ajuste
merma
desperdicio
vencimiento
devolucion
```

---

# 22. DeliveryProfile

Información adicional para repartidores.

## Campos

```txt
id
usuario_id
vehiculo
patente
estado
```

## Estados

```txt
activo
inactivo
ocupado
```

---

# 23. Rendicion

Control de dinero entregado por repartidores.

## Campos

```txt
id
tenant_id
delivery_id
monto_esperado
monto_rendido
diferencia
estado
fecha
```

## Estados

```txt
abierta
pendiente_revision
cerrada
observada
```

---

# 24. Merma

Pérdidas operativas.

## Campos

```txt
id
tenant_id
producto_id
cantidad
motivo
usuario_id
fecha
```

---

# 25. Desperdicio

Productos descartados.

## Campos

```txt
id
tenant_id
producto_id
cantidad
motivo
usuario_id
fecha
```

---

# 26. Vencimiento

Productos vencidos.

## Campos

```txt
id
tenant_id
producto_id
cantidad
fecha_vencimiento
usuario_id
```

---

# 27. Devolucion

Devoluciones realizadas por clientes.

## Campos

```txt
id
tenant_id
pedido_id
motivo
monto
estado
fecha
```

## Estados

```txt
pendiente
aprobada
rechazada
```

---

# 28. Plan

Representa los planes comerciales de AxisFood.

## Campos

```txt
id
nombre
precio
max_usuarios
max_sucursales
max_productos
max_almacenamiento
estado
```

---

# 29. Suscripcion

Plan contratado por un tenant.

## Campos

```txt
id
tenant_id
plan_id
estado
fecha_inicio
fecha_fin
```

## Estados

```txt
activa
por_vencer
vencida
suspendida
cancelada
```

---

# 30. AuditLog

Registro central de auditoría.

## Campos

```txt
id
tenant_id
usuario_id
accion
recurso
recurso_id
datos_anteriores
datos_nuevos
ip
user_agent
fecha
```

---

# 31. Dashboard (Entidad Conceptual)

No representa una tabla física.

Genera KPIs calculados.

## Indicadores

```txt
ventas_diarias
ventas_mensuales
ticket_promedio
productos_top
perdidas
mermas
desperdicios
rentabilidad
compras
inventario
```

---

# 32. Relaciones Principales

```txt
Tenant
├── Sucursales
├── Usuarios
│   ├── UserRole
│   └── DeliveryProfile
├── Roles
│   └── RolePermission
├── Clientes
├── Categorias
│   └── Productos
├── Pedidos
│   └── PedidoItems
├── Pagos
├── CajaSession
│   └── CajaMovimiento
├── Compras
│   └── CompraItems
├── InventarioMovimiento
├── Proveedores
├── Rendiciones
├── Mermas
├── Desperdicios
├── Vencimientos
├── Devoluciones
├── Suscripciones
│   └── Plan
└── AuditLog
```

---

# 33. Regla de Oro

> Ninguna entidad sensible puede existir sin Tenant.

> Ninguna relación puede romper el aislamiento multi-tenant definido en RBAC.md y ARCHITECTURE.md.

> Toda operación financiera, de inventario, permisos o workflow debe quedar auditada en AuditLog.
