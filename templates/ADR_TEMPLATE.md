# ADR_TEMPLATE.md

# Architecture Decision Record

## ADR-[Número]: [Título]

**Fecha:** `[YYYY-MM-DD]`  
**Estado:** Propuesto / Aprobado / Rechazado / Reemplazado  
**Responsable:** `[Nombre / Agente]`

---

## Contexto

Describir claramente:

- qué problema se intenta resolver;
- qué necesidad del proyecto genera esta decisión;
- qué restricciones existen;
- qué documentos impacta.

### Referencias

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `RULES.md`
- `[Otros documentos relacionados]`

---

## Decisión

Describir exactamente qué se decidió.

La decisión debe ser:

- específica;
- verificable;
- implementable;
- consistente con la arquitectura vigente.

### Resumen ejecutivo

`[Explicación breve de la decisión]`

### Decisión detallada

`[Explicación técnica completa]`

---

## Alternativas consideradas

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| `[Alternativa 1]` | `[Ventajas]` | `[Desventajas]` |
| `[Alternativa 2]` | `[Ventajas]` | `[Desventajas]` |
| `[Alternativa 3]` | `[Ventajas]` | `[Desventajas]` |

---

## Motivo de selección

Explicar por qué la alternativa elegida fue considerada superior.

Factores posibles:

- simplicidad;
- mantenibilidad;
- escalabilidad;
- seguridad;
- costo;
- tiempo de implementación;
- compatibilidad con arquitectura existente.

---

## Consecuencias

### Positivas

- `[Consecuencia positiva]`
- `[Consecuencia positiva]`
- `[Consecuencia positiva]`

### Negativas / Trade-offs

- `[Consecuencia negativa]`
- `[Consecuencia negativa]`
- `[Consecuencia negativa]`

---

## Impacto en el sistema

### Backend

`[Impacto esperado]`

### Frontend

`[Impacto esperado]`

### DevOps

`[Impacto esperado]`

### Seguridad

`[Impacto esperado]`

### Testing

`[Impacto esperado]`

### Documentación

`[Impacto esperado]`

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `[Riesgo]` | Baja / Media / Alta | Baja / Media / Alta | `[Mitigación]` |

---

## Plan de implementación

1. `[Paso 1]`
2. `[Paso 2]`
3. `[Paso 3]`
4. `[Paso 4]`

---

## Criterios de aceptación

- `[Criterio 1]`
- `[Criterio 2]`
- `[Criterio 3]`

---

## Compatibilidad

### ¿Rompe compatibilidad?

- [ ] Sí
- [ ] No

### Si rompe compatibilidad

Describir:

- APIs afectadas;
- migraciones necesarias;
- estrategia de transición;
- plan de rollback.

---

## Documentos actualizados

- `[Documento]`
- `[Documento]`
- `[Documento]`

---

## Archivos afectados

- `[Archivo]`
- `[Archivo]`
- `[Archivo]`

---

## Revisión futura

La decisión deberá revisarse cuando ocurra alguna de las siguientes condiciones:

- cambio significativo de arquitectura;
- crecimiento de usuarios;
- cambio de stack tecnológico;
- problemas de rendimiento;
- problemas de seguridad;
- nueva versión mayor del sistema.

### Fecha sugerida de revisión

`[YYYY-MM-DD]`

---

## Estado final

```txt
ADR_STATUS: APPROVED
```

o

```txt
ADR_STATUS: REJECTED
Motivo: [explicación]
```
