# ARCHITECTURE.md

# Arquitectura Oficial de AxisFood

## 1. Principio Rector

> El backend es el Source of Truth.

El frontend presenta información pero no decide:

- reglas de negocio;
- permisos;
- workflows;
- estados;
- precios;
- cálculos;
- validaciones críticas.

---

## 2. Objetivos Arquitectónicos

La arquitectura debe ser:

- modular;
- mantenible;
- testeable;
- escalable;
- segura;
- multi-tenant;
- auditable;
- documentada;
- preparada para IA.

---

## 3. Arquitectura General

```txt
Usuario
   │
   ▼
Frontend React
   │
   ▼
API REST
   │
   ▼
Permissions / RBAC
   │
   ▼
Services
   │
   ▼
Selectors
   │
   ▼
Models
   │
   ▼
PostgreSQL
```

---

## 4. Capas del Sistema

### Frontend

Responsable de:

- UI;
- formularios;
- navegación;
- experiencia de usuario.

### API Layer

Responsable de:

- requests;
- responses;
- autenticación;
- permisos.

### Service Layer

Responsable de:

- lógica de negocio;
- workflows;
- cálculos;
- validaciones complejas.

### Selector Layer

Responsable de:

- consultas complejas;
- filtros;
- reportes.

### Persistence Layer

Responsable de:

- modelos;
- relaciones;
- almacenamiento.

---

## 5. Módulos Oficiales

| Módulo | Responsabilidad | Owner |
|---|---|---|
| Accounts | Usuarios y autenticación | Backend Agent |
| Tenants | Multi-tenant | Backend Agent |
| Customers | Clientes | Backend Agent |
| Products | Productos | Backend Agent |
| Orders | Pedidos | Backend Agent |
| Payments | Pagos | Backend Agent |
| Cash | Caja | Backend Agent |
| Inventory | Inventario | Backend Agent |
| Purchases | Compras | Backend Agent |
| Suppliers | Proveedores | Backend Agent |
| Deliveries | Deliverys | Backend Agent |
| Settlements | Rendiciones | Backend Agent |
| Losses | Mermas y desperdicios | Backend Agent |
| Reports | Reportes | Backend Agent |
| Audit | Auditoría | Security Agent |
| Dashboard | Indicadores | Frontend Agent |

---

## 6. Entidades Principales

| Entidad | Descripción |
|---|---|
| Tenant | Negocio gastronómico |
| User | Usuario |
| Customer | Cliente |
| Product | Producto |
| Order | Pedido |
| Payment | Pago |
| CashMovement | Movimiento de caja |
| Supplier | Proveedor |
| Purchase | Compra |
| InventoryMovement | Movimiento de stock |
| Delivery | Repartidor |
| Settlement | Rendición |
| Loss | Merma |
| Waste | Desperdicio |
| Expiration | Vencimiento |
| AuditLog | Auditoría |

---

## 7. Reglas de Datos

- Toda entidad sensible debe tener trazabilidad.
- Toda entidad sensible debe pertenecer a un tenant.
- No existen queries globales sin tenant.
- Todo acceso valida RBAC.
- Todo acceso valida scope.

---

## 8. Multi-Tenant

### Estrategia

Aislamiento mediante tenant_id.

Ejemplo:

```python
tenant = models.ForeignKey(
    Tenant,
    on_delete=models.CASCADE
)
```

### Reglas

- Todo recurso pertenece a un tenant.
- Todo queryset filtra por tenant.
- Todo reporte filtra por tenant.
- Toda exportación filtra por tenant.
- Ningún usuario puede acceder a datos de otro tenant.

---

## 9. RBAC

```txt
Usuario
   │
   ▼
Rol
   │
   ▼
Permisos
   │
   ▼
Scope
```

Roles definidos en:

```txt
RBAC.md
```

---

## 10. Service Layer

Toda lógica compleja debe vivir en Services.

Services principales:

```txt
OrderService
PaymentService
InventoryService
PurchaseService
SettlementService
LossService
ReportService
```

Prohibido:

- lógica compleja en Views;
- lógica compleja en Serializers;
- lógica compleja en Frontend.

---

## 11. Auditoría

Toda acción relevante debe generar auditoría.

Eventos mínimos:

- login;
- logout;
- creación;
- edición;
- cambio de estado;
- eliminación lógica;
- exportación;
- apertura de caja;
- cierre de caja;
- compras;
- rendiciones;
- ajustes de stock;
- mermas;
- desperdicios.

---

## 12. Integraciones

| Integración | Propósito | Estado |
|---|---|---|
| Mercado Pago | Cobros online | Futuro |
| WhatsApp | Notificaciones | Futuro |
| Email | Comunicaciones | Futuro |

---

## 13. Infraestructura

```txt
Frontend React
      │
      ▼
Nginx
      │
      ▼
Django
   ┌──┴──┐
   ▼     ▼
 Redis PostgreSQL
```

Servicios:

- Frontend React
- Backend Django
- PostgreSQL
- Redis
- Celery
- Nginx

---

## 14. Anti-Patrones Prohibidos

- Duplicar lógica entre backend y frontend.
- Saltar Services.
- Saltar RBAC.
- Saltar auditoría.
- Saltar tenant.
- Crear endpoints sin documentación.
- Crear carpetas sin actualizar FOLDER_STRUCTURE.md.
- Hardcodear reglas de negocio.

---

## 15. Regla de Oro

> Si una implementación rompe el aislamiento multi-tenant, RBAC, auditoría, workflow o separación de capas, debe ser rechazada hasta ser revisada por el Orchestrator.