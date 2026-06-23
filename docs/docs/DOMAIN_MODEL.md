# DOMAIN_MODEL.md

# Modelo de Dominio Oficial

## 1. Objetivo

Definir las entidades principales de AxisFood, sus relaciones y responsabilidades.

Este documento es la fuente de verdad para:

- Modelos Django
- Base de datos PostgreSQL
- Relaciones
- APIs
- Services
- Reportes
- Auditoría
- RBAC
- Multi-Tenant

---

# 2. Tenant

Representa una empresa o negocio gastronómico dentro de AxisFood.

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

## Relaciones

```txt
Tenant
├── Sucursales
├── Usuarios
├── Clientes
├── Productos
├── Pedidos
├── Pagos
├── Compras
├── Inventario
├── Caja
├── Rendiciones
├── Reportes
└── Auditoría
```

---

# 3. Sucursal

Representa una sede física del negocio.

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

# 4. Usuario

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

# 5. Rol

Representa un conjunto de permisos.

## Campos

```txt
id
nombre
descripcion
```

### Ejemplos

```txt
administrador_sistema
administrador_tenant
gerente
cajero
operador_cocina
operador_delivery
operador_inventario
visualizador
cliente_externo
```

---

# 6. Permiso

Representa una acción permitida.

## Campos

```txt
id
codigo
nombre
descripcion
```

### Ejemplos

```txt
create_product
update_product
view_orders
approve_purchase
close_cash_register
```

---

# 7. UserRole

Relación usuario-rol.

## Campos

```txt
id
usuario_id
rol_id
```

---

# 8. RolePermission

Relación rol-permiso.

## Campos

```txt
id
rol_id
permiso_id
```

---

# 9. Cliente

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

# 10. Categoria

Clasificación de productos.

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

# 11. Producto

Representa un artículo vendible.

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

> El stock actual NO se almacena.
>
> Se calcula desde InventarioMovimiento.

---

# 12. Pedido

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

# 13. PedidoItem

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

# 14. Pago

Representa un cobro.

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

# 15. CajaSession

Representa la apertura y cierre de caja.

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

# 16. CajaMovimiento

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

# 17. Proveedor

Representa proveedores.

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

# 18. Compra

Representa adquisición de mercadería.

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

# 19. CompraItem

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

# 20. InventarioMovimiento

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

# 21. DeliveryProfile

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

# 22. Rendicion

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

# 23. Merma

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

## Motivos

```txt
rotura
produccion
error_operativo
otro
```

---

# 24. Desperdicio

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

# 25. Vencimiento

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

# 26. Devolucion

Devoluciones de clientes.

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

# 27. Plan

Representa un plan comercial.

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

# 28. Suscripcion

Plan contratado por el tenant.

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

# 29. AuditLog

Registro de auditoría.

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

# 30. Dashboard (Entidad Conceptual)

No es una tabla física.

Representa KPIs calculados.

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

# 31. Relaciones Principales

```txt
Tenant
│
├── Sucursales
│
├── Usuarios
│   ├── UserRole
│   └── DeliveryProfile
│
├── Roles
│   └── RolePermission
│
├── Clientes
│
├── Categorias
│   └── Productos
│
├── Pedidos
│   └── PedidoItems
│
├── Pagos
│
├── CajaSession
│   └── CajaMovimiento
│
├── Compras
│   └── CompraItems
│
├── InventarioMovimiento
│
├── Proveedores
│
├── Rendiciones
│
├── Mermas
├── Desperdicios
├── Vencimientos
├── Devoluciones
│
├── Suscripciones
│   └── Plan
│
└── AuditLog
```

---

# 32. Regla de Oro

> Ninguna entidad sensible puede existir sin Tenant. Ninguna relación puede romper el aislamiento multi-tenant definido en RBAC.md y ARCHITECTURE.md.

> Toda operación financiera, de inventario, permisos o workflow debe quedar auditada en AuditLog.