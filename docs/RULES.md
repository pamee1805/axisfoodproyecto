# RULES.md

# Constitución del Proyecto

Este documento contiene las reglas inviolables de AxisFood.

Todo agente IA y todo desarrollador humano debe obedecerlas.

El incumplimiento de estas reglas puede comprometer la arquitectura, seguridad, auditoría, aislamiento multi-tenant, rentabilidad del negocio o integridad de los datos.

---

## 1. Reglas de Arquitectura

- El backend es el único Source of Truth.
- Toda lógica de negocio vive en Services.
- Los Serializers validan estructura, no gobiernan negocio.
- El Frontend no decide permisos, precios, stock, rendiciones, devoluciones, mermas ni reglas críticas.
- No se crea una carpeta nueva sin actualizar `FOLDER_STRUCTURE.md`.
- No se agrega una dependencia nueva sin justificación técnica.
- No se rompe compatibilidad de API sin registrar un ADR.
- Todo módulo debe respetar la arquitectura multi-tenant.
- Todo modelo sensible debe estar asociado a un Tenant.
- Las reglas definidas en `PROJECT_CONTEXT.md` tienen prioridad sobre decisiones de implementación.
- Los módulos deben estar desacoplados y organizados por dominio.
- Toda funcionalidad nueva debe respetar RBAC y Workflow.

---

## 2. Reglas de Seguridad

- Todo endpoint debe tener permisos explícitos.
- Todo acceso debe validar usuario, tenant y alcance.
- Ningún usuario puede acceder a recursos de otro tenant.
- No se guardan secretos en el repositorio.
- No se hardcodean tokens, claves ni credenciales.
- Toda exportación sensible debe ser auditable.
- Los errores no deben exponer stack traces en producción.
- Toda acción crítica requiere autenticación y autorización.
- No confiar únicamente en validaciones realizadas por frontend.
- Los usuarios suspendidos no pueden operar.
- Los tenants suspendidos no pueden operar.
- Toda acción financiera debe quedar auditada.
- Toda modificación de inventario debe quedar auditada.
- Toda modificación de permisos debe quedar auditada.

---

## 3. Reglas de Frontend

- Usar componentes reutilizables.
- No duplicar lógica de negocio.
- No hardcodear estados si provienen del backend.
- No mezclar estilos sin convención.
- Mantener diseño responsive.
- Manejar estados loading, empty y error.
- Utilizar Lucide React como sistema de iconos.
- No crear pantallas desconectadas del flujo real.
- Toda pantalla debe respetar permisos definidos en `RBAC.md`.
- Toda pantalla debe respetar tenant y scope.
- Los dashboards deben consumir exclusivamente APIs oficiales.
- No realizar cálculos financieros en frontend.
- No realizar cálculos de stock en frontend.
- No realizar validaciones críticas en frontend.

### Interfaces operativas

#### Cocina

- Priorizar velocidad.
- Minimizar clics.
- Mostrar pedidos activos claramente.

#### Caja

- Priorizar rapidez y precisión.
- Reducir errores humanos.
- Mostrar movimientos relevantes.

#### Inventario

- Mostrar stock actualizado.
- Mostrar vencimientos.
- Mostrar alertas de reposición.

---

## 4. Reglas de Backend

- Toda mutación compleja debe pasar por un Service.
- Toda creación relevante debe tener tests.
- Toda entidad sensible debe ser auditable.
- Toda transición de estado debe validarse en backend.
- No usar `count() + 1` para códigos críticos.
- No ejecutar queries globales sin tenant.
- No retornar más información de la necesaria.
- Todo queryset sensible debe filtrar por tenant.
- Toda regla de negocio debe ejecutarse en backend.
- Los cálculos financieros deben realizarse en backend.
- Los cálculos de pérdidas deben realizarse en backend.
- Los cálculos de rentabilidad deben realizarse en backend.
- Los cálculos de stock deben realizarse en backend.

### Validaciones obligatorias

#### Pedidos

- Validar estado actual.
- Validar tenant.
- Validar permisos.

#### Pagos

- Validar estado.
- Validar montos.
- Validar tenant.

#### Rendiciones

- Validar diferencias.
- Validar responsable.
- Validar montos.

#### Inventario

- Validar stock disponible.
- Validar movimientos.
- Validar vencimientos.

---

## 5. Reglas de API

- Usar nombres consistentes.
- Responder errores con formato estándar.
- Paginar listados grandes.
- Soportar filtros explícitos.
- Documentar endpoints.
- No crear endpoints duplicados.
- Versionar cambios incompatibles.
- Toda API sensible debe validar permisos.
- Toda API multi-tenant debe filtrar recursos por tenant.
- No exponer información interna innecesaria.
- Mantener consistencia en códigos HTTP.
- Mantener consistencia en respuestas.

### Formato estándar de éxito

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente"
}
```

### Formato estándar de error

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "No autorizado"
  }
}
```

---

## 6. Reglas de IA y Agentes

- Ningún agente improvisa arquitectura.
- Ningún agente modifica archivos fuera de su scope sin autorización.
- Ningún agente elimina código sin explicar impacto.
- Todo cambio debe informar archivos modificados.
- Todo cambio debe incluir criterios de aceptación.
- Todo cambio debe indicar riesgos.
- Si falta información, el agente debe preguntar o documentar supuestos.
- No se programan features durante Sprint 0.
- Ningún agente puede ignorar PROJECT_CONTEXT.md.
- Ningún agente puede ignorar RBAC.md.
- Ningún agente puede ignorar WORKFLOW.md.
- Ningún agente puede ignorar ARCHITECTURE.md.
- Ningún agente puede modificar seguridad sin justificación.
- Ningún agente puede modificar permisos sin documentación.
- Ningún agente puede modificar workflows sin aprobación.
- Ningún agente puede omitir documentación obligatoria.

---

## 7. Reglas de Documentación

- Todo módulo nuevo debe quedar documentado.
- Toda decisión importante debe registrarse como ADR.
- Toda regla de negocio nueva debe agregarse a PROJECT_CONTEXT.md.
- Toda modificación de workflow debe reflejarse en WORKFLOW.md.
- Toda modificación estructural debe reflejarse en FOLDER_STRUCTURE.md.
- Toda nueva integración debe documentarse en ARCHITECTURE.md.
- Todo cambio de permisos debe reflejarse en RBAC.md.
- Todo cambio de API debe reflejarse en API_GUIDELINES.md.
- La documentación debe mantenerse sincronizada con la implementación.
- Ningún cambio importante puede quedar sin documentación.

---

## 8. Reglas Específicas de AxisFood

### Inventario

- Toda modificación de stock debe generar auditoría.
- Toda merma requiere motivo obligatorio.
- Todo desperdicio requiere motivo obligatorio.
- Todo vencimiento debe quedar registrado.
- Todo ajuste manual debe quedar auditado.
- Todo movimiento debe registrar usuario responsable.

### Compras

- Toda compra debe estar asociada a un proveedor.
- Toda compra debe afectar inventario.
- Toda compra debe quedar auditada.
- Toda compra debe registrar costo real.

### Caja

- Toda apertura debe registrarse.
- Todo cierre debe registrarse.
- Toda diferencia debe quedar auditada.
- Todo movimiento debe tener responsable.

### Rendiciones

- Toda rendición debe validar monto esperado.
- Toda diferencia debe quedar registrada.
- Todo cierre debe quedar auditado.
- Toda observación debe quedar almacenada.

### Mermas y Desperdicios

- Deben afectar métricas de pérdidas.
- Deben afectar indicadores de rentabilidad.
- Deben quedar auditados.
- Deben registrar responsable.

### Reportes

- Todo reporte debe filtrar por tenant.
- Toda exportación debe quedar auditada.
- Ningún reporte puede exponer datos de otro tenant.
- Los reportes financieros deben utilizar datos validados.

### Auditoría

Se debe registrar:

- Creación.
- Modificación.
- Eliminación lógica.
- Cambio de estado.
- Exportaciones.
- Apertura de caja.
- Cierre de caja.
- Rendiciones.
- Compras.
- Ajustes de stock.
- Mermas.
- Desperdicios.
- Devoluciones.

---

## 9. Regla de Oro

> Si un cambio puede romper arquitectura, seguridad, permisos, workflow, auditoría, inventario, caja, reportes, métricas financieras o aislamiento multi-tenant, debe ser revisado y aprobado por el Orchestrator antes de implementarse.