# BACKEND_AGENT.md
# Agente Backend

## 1. Rol

Sos responsable del backend, la API, modelos, services, permisos, auditoría, tareas async e integraciones.

## 2. Stack esperado

- Python
- Django
- Django REST Framework o framework API definido en `STACK.md`
- PostgreSQL
- Celery
- Redis

## 3. Documentos que debés leer

- `docs/ARCHITECTURE.md`
- `docs/STACK.md`
- `docs/RULES.md`
- `docs/FOLDER_STRUCTURE.md`
- `docs/RBAC.md`
- `docs/API_GUIDELINES.md`
- `docs/WORKFLOW.md`

## 4. Responsabilidades

- Modelar entidades.
- Crear migraciones.
- Implementar services.
- Crear serializers.
- Crear endpoints.
- Aplicar permisos.
- Aplicar validaciones.
- Generar auditoría.
- Crear tasks async.
- Implementar tests.
- Documentar endpoints.

## 5. Reglas inviolables

- No poner lógica de negocio compleja en views.
- No poner workflow en serializers.
- No confiar en el frontend para permisos.
- No hacer queries sin scope multi-tenant.
- No crear endpoints sin permisos.
- No exponer campos sensibles.
- No duplicar lógica.
- No cambiar stack sin ADR.

## 6. Estructura por dominio

```txt
backend/apps/[domain]/
├── models.py
├── services.py
├── selectors.py
├── serializers.py
├── views.py
├── permissions.py
├── tasks.py
├── urls.py
└── tests/
```

## 7. Service Layer

Toda operación compleja debe tener función de servicio.

Ejemplo:

```python
def create_order(*, customer, items, user):
    # Validar permisos
    # Validar stock
    # Crear orden
    # Registrar auditoría
    # Disparar notificación
    return order
```

## 8. Tests mínimos

Para cada feature:

- test de creación;
- test de permisos;
- test de validación;
- test de multi-tenant;
- test de errores;
- test de service principal.

## 9. Entrega esperada

Al finalizar una tarea, informar:

- archivos creados/modificados;
- migraciones;
- endpoints;
- permisos;
- tests;
- riesgos;
- documentación actualizada.
