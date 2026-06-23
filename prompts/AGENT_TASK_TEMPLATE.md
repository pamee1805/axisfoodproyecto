# AGENT_TASK_TEMPLATE.md

# Plantilla para Asignar Tareas a Agentes

## 1. Objetivo

Estandarizar la forma en que se asignan tareas a agentes IA dentro del proyecto AxisFood.

Esta plantilla debe usarse cada vez que el Orchestrator asigne una tarea a un agente especializado.

El objetivo es evitar:

- improvisación;
- cambios fuera de alcance;
- mezcla de responsabilidades;
- ruptura de arquitectura;
- omisión de permisos;
- omisión de auditoría;
- errores multi-tenant.

---

## 2. Tarea

`[Nombre corto de la tarea]`

### Ejemplos

```txt
Crear modelos base de accounts
Implementar autenticación JWT
Crear service de apertura de caja
Implementar permisos RBAC para pedidos
Crear endpoints de productos
Crear tests de multi-tenant
```

---

## 3. Contexto

`[Explicar qué se necesita y por qué.]`

El contexto debe incluir:

- problema que se intenta resolver;
- módulo afectado;
- relación con AxisFood;
- restricciones importantes;
- dependencia con otros documentos.

### Ejemplo

```txt
AxisFood necesita implementar el módulo de productos para permitir que cada tenant gestione su catálogo gastronómico.

El módulo debe respetar multi-tenant, RBAC, auditoría y la estructura definida en FOLDER_STRUCTURE.md.

No se debe implementar lógica de inventario avanzada en esta tarea.
```

---

## 4. Agente Responsable

Seleccionar un único agente principal:

- Backend Agent
- Frontend Agent
- DevOps Agent
- Security Agent
- QA Agent
- Orchestrator

### Responsable

```txt
[Nombre del agente responsable]
```

---

## 5. Agentes Secundarios

Agentes que deben revisar, validar o coordinar la tarea:

```txt
[Agente secundario 1]
[Agente secundario 2]
[Agente secundario 3]
```

### Ejemplo

```txt
Security Agent
QA Agent
Orchestrator
```

---

## 6. Documentos Fuente

El agente debe leer antes de trabajar:

```txt
docs/PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/STACK.md
docs/RULES.md
docs/FOLDER_STRUCTURE.md
docs/WORKFLOW.md
docs/RBAC.md
docs/API_GUIDELINES.md
docs/DOMAIN_MODEL.md
docs/SPRINT_0.md
```

### Documentos específicos de la tarea

```txt
[Documento específico 1]
[Documento específico 2]
```

---

## 7. Alcance

### Incluido

- `[Item incluido 1]`
- `[Item incluido 2]`
- `[Item incluido 3]`

### Excluido

- `[Item fuera de alcance 1]`
- `[Item fuera de alcance 2]`
- `[Item fuera de alcance 3]`

### Ejemplo

#### Incluido

- Crear modelo Product.
- Crear serializer ProductSerializer.
- Crear ProductService.
- Crear endpoints CRUD.
- Crear permisos básicos.
- Crear tests.

#### Excluido

- Crear lógica avanzada de stock.
- Crear reportes.
- Crear dashboard.
- Crear integración con proveedores.

---

## 8. Archivos Esperados

El agente debe indicar qué archivos va a crear o modificar.

```txt
backend/apps/[domain]/models.py
backend/apps/[domain]/services.py
backend/apps/[domain]/selectors.py
backend/apps/[domain]/serializers.py
backend/apps/[domain]/permissions.py
backend/apps/[domain]/views.py
backend/apps/[domain]/urls.py
backend/apps/[domain]/tests/test_models.py
backend/apps/[domain]/tests/test_api.py
```

### Ejemplo para Products

```txt
backend/apps/products/models.py
backend/apps/products/services.py
backend/apps/products/selectors.py
backend/apps/products/serializers.py
backend/apps/products/permissions.py
backend/apps/products/views.py
backend/apps/products/urls.py
backend/apps/products/tests/test_models.py
backend/apps/products/tests/test_api.py
```

---

## 9. Reglas Específicas

Toda tarea debe respetar:

- backend como Source of Truth;
- lógica de negocio en Services;
- queries complejas en Selectors;
- permisos en permissions.py;
- validaciones críticas en backend;
- RBAC definido en RBAC.md;
- multi-tenant obligatorio;
- auditoría en acciones críticas;
- estructura definida en FOLDER_STRUCTURE.md;
- workflows definidos en WORKFLOW.md;
- endpoints definidos según API_GUIDELINES.md.

### Reglas adicionales de AxisFood

- No exponer datos de otro tenant.
- No confiar en filtros del frontend.
- No crear endpoints sin permisos.
- No realizar cálculos financieros en frontend.
- No realizar cálculos de stock en frontend.
- No modificar workflows sin actualizar WORKFLOW.md.
- No modificar permisos sin actualizar RBAC.md.
- No crear carpetas nuevas sin actualizar FOLDER_STRUCTURE.md.

---

## 10. Criterios de Aceptación

La tarea estará completa si:

- el código respeta la arquitectura;
- los archivos están en la carpeta correcta;
- los permisos están definidos;
- el multi-tenant está validado;
- las reglas de negocio viven en Services;
- los serializers no contienen lógica crítica;
- existen tests mínimos;
- la documentación afectada fue actualizada;
- no se rompe compatibilidad;
- no hay endpoints duplicados.

### Criterios específicos

```txt
[Criterio 1]
[Criterio 2]
[Criterio 3]
```

---

## 11. Tests Requeridos

Toda tarea debe definir tests.

### Tests mínimos

- usuario sin login no accede;
- usuario de otro tenant no accede;
- usuario con rol insuficiente no accede;
- usuario correcto accede;
- datos inválidos devuelven error;
- acción crítica genera auditoría si corresponde.

### Tests específicos

```txt
[Test específico 1]
[Test específico 2]
[Test específico 3]
```

---

## 12. Riesgos

Identificar riesgos antes de implementar.

```txt
[Riesgo 1]
[Riesgo 2]
[Riesgo 3]
```

### Riesgos comunes en AxisFood

- fuga de datos entre tenants;
- reglas de negocio en frontend;
- permisos incompletos;
- endpoints sin auditoría;
- duplicación de lógica;
- queries globales sin filtro por tenant;
- cambios incompatibles sin ADR;
- features desarrolladas durante Sprint 0.

---

## 13. Entrega Esperada

El agente debe responder con:

- resumen;
- archivos modificados;
- decisiones tomadas;
- tests ejecutados;
- riesgos pendientes;
- documentación actualizada.

Formato obligatorio:

```md
# Entrega del Agente

## Resumen

[Resumen breve]

## Archivos modificados

- [Archivo 1]
- [Archivo 2]

## Decisiones tomadas

- [Decisión 1]
- [Decisión 2]

## Tests ejecutados

- [Test 1]
- [Test 2]

## Riesgos pendientes

- [Riesgo 1]
- [Riesgo 2]

## Documentación actualizada

- [Documento 1]
- [Documento 2]

## Estado final

TASK_STATUS: COMPLETED
```

Si no puede completar:

```md
# Entrega del Agente

## Estado final

TASK_STATUS: BLOCKED

## Motivo

[Explicación del bloqueo]

## Información faltante

- [Dato faltante 1]
- [Dato faltante 2]
```

---

## 14. Plantilla Rápida para Copiar

```md
# Tarea para Agente

## Tarea

[Nombre corto]

## Contexto

[Explicación de la necesidad]

## Agente Responsable

[Backend Agent / Frontend Agent / DevOps Agent / Security Agent / QA Agent / Orchestrator]

## Agentes Secundarios

- [Agente]
- [Agente]

## Documentos Fuente

- docs/PROJECT_CONTEXT.md
- docs/ARCHITECTURE.md
- docs/STACK.md
- docs/RULES.md
- docs/FOLDER_STRUCTURE.md
- docs/WORKFLOW.md
- docs/RBAC.md
- docs/API_GUIDELINES.md
- docs/DOMAIN_MODEL.md

## Alcance

### Incluido

- [Item]
- [Item]

### Excluido

- [Item]
- [Item]

## Archivos Esperados

- [Archivo]
- [Archivo]

## Reglas Específicas

- Respetar multi-tenant.
- Respetar RBAC.
- Usar Services para lógica de negocio.
- Usar Selectors para queries complejas.
- No confiar en frontend.
- Auditar acciones críticas.

## Criterios de Aceptación

- [Criterio]
- [Criterio]

## Tests Requeridos

- [Test]
- [Test]

## Riesgos

- [Riesgo]
- [Riesgo]

## Entrega Esperada

El agente debe responder con:

- resumen;
- archivos modificados;
- decisiones tomadas;
- tests ejecutados;
- riesgos pendientes;
- documentación actualizada.
```

---

## 15. Regla de Oro

> Ningún agente debe implementar una tarea si no entiende el alcance, los documentos fuente, los permisos, el tenant afectado y los criterios de aceptación.