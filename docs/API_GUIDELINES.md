# API_GUIDELINES.md

# Guía Oficial de APIs

## 1. Objetivo

Definir los estándares obligatorios para todas las APIs de AxisFood.

Las APIs deben ser:

- consistentes;
- seguras;
- auditables;
- multi-tenant;
- documentadas;
- versionables.

Ningún endpoint puede implementarse fuera de estas reglas.

---

## 2. Principios

### Backend como Source of Truth

El backend es responsable de:

- permisos;
- validaciones;
- workflows;
- cálculos;
- auditoría;
- multi-tenant.

El frontend nunca debe asumir que una operación es válida.

---

## 3. Convenciones de Naming

Usar sustantivos en plural:

```txt
/api/v1/products/
/api/v1/orders/
/api/v1/customers/
/api/v1/payments/
/api/v1/inventory/
/api/v1/purchases/
```

Evitar:

```txt
/api/do_stuff/
/api/process/
/api/data/
/api/createProduct/
```

---

## 4. Métodos HTTP

| Método | Uso |
|---|---|
| GET | Lectura |
| POST | Creación |
| PUT | Reemplazo completo |
| PATCH | Actualización parcial |
| DELETE | Eliminación lógica |

---

## 5. Acciones Especiales

Para acciones de dominio:

```txt
POST /api/v1/orders/{id}/cancel/
POST /api/v1/orders/{id}/complete/
POST /api/v1/settlements/{id}/close/
POST /api/v1/cash-registers/{id}/close/
POST /api/v1/purchases/{id}/approve/
```

---

## 6. Versionado

Formato oficial:

```txt
/api/v1/
```

Ejemplos:

```txt
/api/v1/products/
/api/v1/orders/
/api/v1/customers/
```

Los cambios incompatibles requieren:

```txt
/api/v2/
```

---

## 7. Multi-Tenant

Toda API sensible debe:

- validar tenant;
- validar rol;
- validar scope;
- filtrar recursos por tenant;
- impedir acceso a recursos de otros tenants.

Ejemplo:

```python
Product.objects.filter(
    tenant=request.user.tenant
)
```

---

## 8. RBAC

Toda API debe validar:

- autenticación;
- rol;
- scope;
- tenant;
- estado del usuario.

Referirse a:

```txt
RBAC.md
```

---

## 9. Formato de Respuesta Exitosa

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente"
}
```

---

## 10. Respuesta con Listado

```json
{
  "success": true,
  "count": 100,
  "results": []
}
```

---

## 11. Formato de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No se pudo completar la operación.",
    "details": {
      "field": ["Mensaje específico"]
    }
  }
}
```

---

## 12. Códigos HTTP

| Código | Uso |
|---|---|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido |
| 400 | Error de validación |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 409 | Conflicto |
| 422 | Regla de negocio |
| 500 | Error interno |

---

## 13. Paginación

Todo listado grande debe paginarse.

Formato estándar:

```json
{
  "count": 120,
  "next": "...",
  "previous": null,
  "results": []
}
```

---

## 14. Filtros

Ejemplos:

```txt
/products/?search=pizza

/products/?category=1

/orders/?status=pending

/orders/?date_from=2026-01-01

/orders/?date_to=2026-01-31
```

---

## 15. Ordenamiento

Formato:

```txt
?ordering=name

?ordering=-created_at
```

---

## 16. Autenticación

Sistema oficial:

```txt
JWT
```

Header:

```http
Authorization: Bearer TOKEN
```

---

## 17. Auditoría

Deben generar auditoría:

- POST
- PUT
- PATCH
- DELETE
- Exportaciones
- Cambios de estado
- Ajustes de inventario
- Rendiciones
- Compras
- Mermas
- Desperdicios
- Devoluciones

---

## 18. APIs Oficiales de AxisFood

### Accounts

```txt
/api/v1/accounts/
```

### Tenants

```txt
/api/v1/tenants/
```

### Customers

```txt
/api/v1/customers/
```

### Products

```txt
/api/v1/products/
```

### Orders

```txt
/api/v1/orders/
```

### Payments

```txt
/api/v1/payments/
```

### Cash

```txt
/api/v1/cash/
```

### Inventory

```txt
/api/v1/inventory/
```

### Purchases

```txt
/api/v1/purchases/
```

### Suppliers

```txt
/api/v1/suppliers/
```

### Deliveries

```txt
/api/v1/deliveries/
```

### Settlements

```txt
/api/v1/settlements/
```

### Losses

```txt
/api/v1/losses/
```

### Reports

```txt
/api/v1/reports/
```

---

## 19. Checklist antes de crear un endpoint

- ¿Ya existe uno similar?
- ¿Respeta naming?
- ¿Respeta tenant?
- ¿Valida RBAC?
- ¿Tiene auditoría?
- ¿Tiene tests?
- ¿Está documentado?
- ¿Necesita notificaciones?
- ¿Respeta Workflow?

---

## 20. Regla de Oro

> Ninguna API puede exponer datos de otro tenant, ignorar RBAC o ejecutar lógica de negocio fuera de los Services.