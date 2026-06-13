# API_GUIDELINES.md
# Guía de Diseño de APIs

## 1. Principio

Las APIs deben ser consistentes, predecibles, documentadas y seguras.

## 2. Convenciones de naming

Usar sustantivos en plural:

```txt
/api/products/
/api/orders/
/api/customers/
/api/tickets/
```

Evitar nombres ambiguos:

```txt
/api/do_stuff/
/api/process/
/api/data/
```

## 3. Métodos HTTP

| Método | Uso |
|---|---|
| GET | Lectura |
| POST | Creación o acción controlada |
| PUT | Reemplazo completo |
| PATCH | Actualización parcial |
| DELETE | Eliminación lógica o controlada |

## 4. Acciones especiales

Para acciones de dominio usar rutas claras:

```txt
POST /api/tickets/{id}/assign/
POST /api/tickets/{id}/derive/
POST /api/orders/{id}/cancel/
POST /api/cash-register/{id}/close/
```

## 5. Paginación

Todo listado grande debe paginarse.

Respuesta sugerida:

```json
{
  "count": 120,
  "next": "...",
  "previous": null,
  "results": []
}
```

## 6. Filtros

Los filtros deben ser explícitos:

```txt
/api/orders/?status=pending&created_from=2026-01-01&created_to=2026-01-31
```

## 7. Errores

Formato estándar:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No se pudo completar la operación.",
    "details": {
      "field": ["Mensaje específico"]
    }
  }
}
```

## 8. Versionado

Si un cambio rompe compatibilidad:

```txt
/api/v1/products/
/api/v2/products/
```

## 9. Seguridad

- Cada endpoint debe tener permisos.
- Validar ownership.
- Validar tenant.
- No exponer campos sensibles.
- Rate limit en endpoints públicos.
- Auditar exportaciones y acciones críticas.

## 10. Documentación

Cada endpoint debe documentar:

- propósito;
- permisos;
- request;
- response;
- errores;
- filtros;
- paginación;
- side effects;
- eventos auditables.

## 11. Checklist antes de crear endpoint

- ¿Ya existe un endpoint similar?
- ¿Respeta naming?
- ¿Tiene permisos?
- ¿Tiene tests?
- ¿Está documentado?
- ¿Respeta tenant?
- ¿Necesita auditoría?
- ¿Necesita notificación?
