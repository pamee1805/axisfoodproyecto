# PR_CHECKLIST.md

# Checklist de Pull Request

## Contexto

- [ ] El PR explica claramente qué problema resuelve.
- [ ] La tarea tiene criterios de aceptación definidos.
- [ ] Se identificaron los archivos modificados.
- [ ] El alcance coincide con la tarea asignada.
- [ ] No se agregaron cambios fuera del alcance aprobado.
- [ ] Se revisó la documentación relacionada.

---

## Arquitectura

- [ ] Respeta `ARCHITECTURE.md`.
- [ ] Respeta `FOLDER_STRUCTURE.md`.
- [ ] Respeta `RULES.md`.
- [ ] Respeta `DOMAIN_MODEL.md`.
- [ ] No introduce lógica de negocio en frontend.
- [ ] No duplica lógica existente.
- [ ] No crea módulos fuera de la estructura definida.
- [ ] No agrega dependencias sin justificación.
- [ ] No rompe compatibilidad sin ADR aprobado.
- [ ] Mantiene la separación entre Models, Services, Selectors y API.

---

## Multi-Tenant

- [ ] Todas las entidades sensibles respetan tenant.
- [ ] Todos los querysets filtran por tenant.
- [ ] No existen consultas globales sin validación.
- [ ] No se exponen datos de otros tenants.
- [ ] Se validó aislamiento multi-tenant.
- [ ] Se probaron escenarios entre tenants diferentes.

---

## Backend

- [ ] Endpoints protegidos con permisos.
- [ ] RBAC implementado correctamente.
- [ ] Services utilizados para lógica compleja.
- [ ] Selectors utilizados para consultas complejas.
- [ ] Validaciones críticas implementadas en backend.
- [ ] Tests agregados o actualizados.
- [ ] Migraciones revisadas.
- [ ] No existen consultas inseguras.
- [ ] No se retornan campos innecesarios.
- [ ] Se respetan los workflows definidos.

---

## Frontend

- [ ] Maneja estado loading.
- [ ] Maneja estado error.
- [ ] Maneja estado vacío.
- [ ] Es responsive.
- [ ] Utiliza componentes reutilizables.
- [ ] No hardcodea reglas críticas.
- [ ] No toma decisiones de permisos.
- [ ] No toma decisiones de workflow.
- [ ] Consume únicamente APIs oficiales.
- [ ] Respeta RBAC definido por backend.

---

## Seguridad

- [ ] No expone secretos.
- [ ] No expone credenciales.
- [ ] No expone tokens.
- [ ] Valida autenticación.
- [ ] Valida permisos.
- [ ] Valida tenant.
- [ ] Valida ownership cuando corresponde.
- [ ] No expone datos sensibles.
- [ ] Cumple `RBAC.md`.
- [ ] Cumple las reglas de seguridad definidas en `RULES.md`.

---

## Auditoría

- [ ] Las acciones críticas generan AuditLog.
- [ ] Los cambios de estado generan auditoría.
- [ ] Las operaciones financieras generan auditoría.
- [ ] Las operaciones de inventario generan auditoría.
- [ ] Las exportaciones generan auditoría.
- [ ] Los cambios de permisos generan auditoría.

---

## Workflow

- [ ] Respeta `WORKFLOW.md`.
- [ ] Solo permite transiciones válidas.
- [ ] Bloquea transiciones prohibidas.
- [ ] Genera auditoría de cambios de estado.
- [ ] Genera notificaciones cuando corresponde.
- [ ] Existen tests para las transiciones críticas.

---

## Base de Datos

- [ ] Las migraciones fueron revisadas.
- [ ] No rompe integridad referencial.
- [ ] No elimina datos críticos sin justificación.
- [ ] Mantiene consistencia multi-tenant.
- [ ] Los índices necesarios fueron evaluados.

---

## Testing

- [ ] Tests ejecutados correctamente.
- [ ] Tests unitarios aprobados.
- [ ] Tests de API aprobados.
- [ ] Tests de permisos aprobados.
- [ ] Tests multi-tenant aprobados.
- [ ] Tests de workflow aprobados.
- [ ] Casos de error probados.
- [ ] Casos límite probados.
- [ ] No rompe funcionalidades existentes.

---

## Documentación

- [ ] Se actualizó documentación afectada.
- [ ] Se actualizó `PROJECT_CONTEXT.md` si corresponde.
- [ ] Se actualizó `DOMAIN_MODEL.md` si corresponde.
- [ ] Se actualizó `WORKFLOW.md` si corresponde.
- [ ] Se actualizó `RBAC.md` si corresponde.
- [ ] Se actualizó `ARCHITECTURE.md` si corresponde.
- [ ] Se actualizó `API_GUIDELINES.md` si corresponde.
- [ ] Se agregó ADR si corresponde.

---

## DevOps

- [ ] Variables de entorno documentadas.
- [ ] Docker continúa funcionando.
- [ ] No rompe CI/CD.
- [ ] Logs revisados.
- [ ] Configuración actualizada si corresponde.

---

## Aprobación Final

- [ ] QA aprobado.
- [ ] Security aprobado.
- [ ] Orchestrator aprobado.
- [ ] Documentación actualizada.
- [ ] Listo para merge.

---

## Estado Final

### Si se aprueba

```txt
PR_STATUS: APPROVED
```

### Si requiere cambios

```txt
PR_STATUS: CHANGES_REQUESTED

Motivo:
[Explicación]
```

---

## Regla de Oro

> Ningún Pull Request puede aprobarse si compromete arquitectura, seguridad, RBAC, multi-tenant, auditoría, workflows o integridad de datos.