# ADR_TEMPLATE.md

# Architecture Decision Record

## ADR-[Número]: [Título de la Decisión]

**Fecha:** `[YYYY-MM-DD]`  
**Estado:** Propuesto / Aprobado / Rechazado / Reemplazado  
**Responsable:** Orchestrator / Backend Agent / Frontend Agent / Security Agent / DevOps Agent

---

# 1. Contexto

Describir claramente:

- qué problema se intenta resolver;
- qué necesidad de AxisFood genera esta decisión;
- qué módulos están involucrados;
- qué restricciones existen;
- qué impacto puede tener.

## Referencias

Documentos relacionados:

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
```

## Problema

```txt
[Describir el problema]
```

### Ejemplo

```txt
Se necesita definir la estrategia oficial de autenticación para AxisFood.

Actualmente existen varias alternativas posibles y la decisión afectará backend, frontend, seguridad y despliegue.
```

---

# 2. Decisión

Describir exactamente qué se decidió.

La decisión debe ser:

- específica;
- verificable;
- implementable;
- consistente con la arquitectura oficial.

## Resumen Ejecutivo

```txt
[Resumen corto]
```

### Ejemplo

```txt
Se adopta JWT como mecanismo oficial de autenticación.
```

---

## Decisión Técnica Completa

```txt
[Explicación detallada]
```

### Ejemplo

```txt
AxisFood utilizará JWT Access + Refresh Token.

Los tokens serán emitidos por Django REST Framework SimpleJWT.

El frontend almacenará únicamente el access token en memoria y el refresh token según la estrategia definida por Security.
```

---

# 3. Alternativas Consideradas

| Alternativa | Ventajas | Desventajas |
|------------|------------|------------|
| `[Alternativa 1]` | `[Ventajas]` | `[Desventajas]` |
| `[Alternativa 2]` | `[Ventajas]` | `[Desventajas]` |
| `[Alternativa 3]` | `[Ventajas]` | `[Desventajas]` |

### Ejemplo

| Alternativa | Ventajas | Desventajas |
|------------|------------|------------|
| JWT | Escalable | Manejo de expiración |
| Session Auth | Simple | Menos flexible |
| OAuth puro | Muy seguro | Más complejo |

---

# 4. Motivo de Selección

Explicar por qué se eligió la alternativa final.

Factores posibles:

- simplicidad;
- seguridad;
- mantenibilidad;
- escalabilidad;
- costo;
- tiempo de implementación;
- compatibilidad con AxisFood.

## Justificación

```txt
[Explicación]
```

---

# 5. Consecuencias

## Positivas

- `[Consecuencia positiva]`
- `[Consecuencia positiva]`
- `[Consecuencia positiva]`

### Ejemplo

- Arquitectura más consistente.
- Menor complejidad operativa.
- Mejor escalabilidad.

---

## Negativas / Trade-offs

- `[Consecuencia negativa]`
- `[Consecuencia negativa]`

### Ejemplo

- Requiere migración futura.
- Aumenta complejidad de configuración.

---

# 6. Impacto en AxisFood

## Backend

```txt
[Impacto]
```

---

## Frontend

```txt
[Impacto]
```

---

## Seguridad

```txt
[Impacto]
```

---

## DevOps

```txt
[Impacto]
```

---

## Base de Datos

```txt
[Impacto]
```

---

## Auditoría

```txt
[Impacto]
```

---

## Multi-Tenant

```txt
[Impacto]
```

---

## RBAC

```txt
[Impacto]
```

---

# 7. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|----------|----------|----------|----------|
| `[Riesgo]` | Baja / Media / Alta | Baja / Media / Alta | `[Mitigación]` |

### Ejemplo

| Riesgo | Probabilidad | Impacto | Mitigación |
|----------|----------|----------|----------|
| Configuración incorrecta | Media | Alta | Revisiones obligatorias |

---

# 8. Plan de Implementación

## Paso 1

```txt
[Paso]
```

## Paso 2

```txt
[Paso]
```

## Paso 3

```txt
[Paso]
```

## Paso 4

```txt
[Paso]
```

---

# 9. Criterios de Aceptación

La decisión se considera implementada correctamente si:

- `[Criterio]`
- `[Criterio]`
- `[Criterio]`

### Ejemplo

- JWT funciona correctamente.
- Los endpoints validan autenticación.
- Los tests pasan correctamente.

---

# 10. Compatibilidad

## ¿Rompe compatibilidad?

- [ ] Sí
- [ ] No

---

## Si rompe compatibilidad

Describir:

```txt
APIs afectadas
Migraciones necesarias
Plan de transición
Plan de rollback
```

---

# 11. Módulos Afectados

Seleccionar los que correspondan.

```txt
accounts
tenants
customers
products
orders
payments
cash
inventory
suppliers
purchases
deliveries
settlements
losses
subscriptions
reports
audit
```

---

# 12. Archivos Potencialmente Afectados

```txt
backend/apps/[domain]/models.py
backend/apps/[domain]/services.py
backend/apps/[domain]/permissions.py
backend/apps/[domain]/selectors.py
backend/apps/[domain]/views.py
frontend/src/features/[domain]
docs/*
```

---

# 13. Documentación Actualizada

Actualizar cuando corresponda:

```txt
PROJECT_CONTEXT.md
ARCHITECTURE.md
STACK.md
RULES.md
FOLDER_STRUCTURE.md
WORKFLOW.md
RBAC.md
API_GUIDELINES.md
DOMAIN_MODEL.md
```

---

# 14. Revisión Futura

La decisión deberá revisarse cuando ocurra alguno de los siguientes eventos:

- cambio significativo de arquitectura;
- crecimiento importante de usuarios;
- cambio de stack tecnológico;
- problemas de rendimiento;
- problemas de seguridad;
- nueva versión mayor de AxisFood;
- nueva necesidad de negocio.

## Fecha sugerida de revisión

```txt
[YYYY-MM-DD]
```

---

# 15. Resultado Final

## Si se aprueba

```txt
ADR_STATUS: APPROVED
```

---

## Si se rechaza

```txt
ADR_STATUS: REJECTED

Motivo:
[Explicación]
```

---

## Si reemplaza otro ADR

```txt
ADR_STATUS: REPLACED

ADR reemplazado:
ADR-[Número]
```

---

# 16. Regla de Oro

> Ninguna decisión arquitectónica puede implementarse si rompe RBAC, multi-tenant, auditoría, workflows, seguridad o la arquitectura oficial de AxisFood sin aprobación explícita del Orchestrator.