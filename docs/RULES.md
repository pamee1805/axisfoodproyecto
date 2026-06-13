# RULES.md
# Constitución del Proyecto

Este documento contiene las reglas inviolables del proyecto.  
Todo agente IA y todo desarrollador humano debe obedecerlas.

## 1. Reglas de arquitectura

- El backend es el source of truth.
- La lógica de negocio compleja vive en services.
- Los serializers validan estructura, no gobiernan el negocio.
- El frontend no decide permisos, precios, workflow, SLA ni reglas críticas.
- No se crea una carpeta nueva sin actualizar `FOLDER_STRUCTURE.md`.
- No se agrega una dependencia nueva sin justificarla.
- No se rompe compatibilidad de API sin registrar ADR.

## 2. Reglas de seguridad

- Todo endpoint debe tener permisos explícitos.
- Toda query sensible debe respetar el tenant/scope.
- Ningún usuario debe acceder a datos fuera de su alcance.
- No se guardan secretos en el repositorio.
- No se hardcodean tokens, claves ni credenciales.
- Toda exportación sensible debe ser auditable.
- Los errores no deben exponer stack traces en producción.

## 3. Reglas de frontend

- Usar componentes reutilizables.
- No duplicar lógica de negocio.
- No hardcodear estados si vienen del backend.
- No mezclar estilos sin convención.
- Mantener diseño responsive.
- Manejar loading, empty y error states.
- Usar Lucide React como sistema de íconos si aplica.
- No crear pantallas que no estén conectadas al flujo real.

## 4. Reglas de backend

- Toda mutación compleja debe pasar por un service.
- Toda creación relevante debe tener tests.
- Toda entidad sensible debe ser auditable.
- Toda transición de estado debe validarse en backend.
- No usar `count() + 1` para códigos críticos sin bloqueo o secuencia.
- No hacer queries globales sin scope.
- No retornar más campos de los necesarios.

## 5. Reglas de API

- Usar nombres consistentes.
- Responder errores con formato estándar.
- Paginar listados grandes.
- Soportar filtros explícitos.
- Documentar endpoints.
- No crear endpoints duplicados.
- Versionar cambios incompatibles.

## 6. Reglas de IA / agentes

- Ningún agente improvisa arquitectura.
- Ningún agente modifica archivos fuera de su scope sin permiso del Orchestrator.
- Ningún agente elimina código sin explicar impacto.
- Todo cambio debe informar archivos modificados.
- Todo cambio debe tener criterios de aceptación.
- Si falta información, el agente debe preguntar o marcar supuesto.
- No se programan features durante Sprint 0.

## 7. Reglas de documentación

- Todo módulo nuevo debe quedar documentado.
- Toda decisión importante debe registrarse como ADR.
- Toda regla de negocio nueva debe agregarse a `PROJECT_CONTEXT.md` o `WORKFLOW.md`.
- Toda modificación de estructura debe reflejarse en `FOLDER_STRUCTURE.md`.
- Toda nueva integración debe documentarse en `ARCHITECTURE.md`.

## 8. Regla de oro

> Si un cambio puede romper arquitectura, seguridad, permisos, workflow o datos, debe ser revisado por el Orchestrator antes de implementarse.
