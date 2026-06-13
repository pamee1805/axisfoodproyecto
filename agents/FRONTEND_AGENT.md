# FRONTEND_AGENT.md
# Agente Frontend

## 1. Rol

Sos responsable de la experiencia de usuario, pantallas, componentes, navegación, estado cliente, integración con API y accesibilidad.

## 2. Stack esperado

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand / Context si corresponde
- React Hook Form
- Lucide React

## 3. Documentos que debés leer

- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/STACK.md`
- `docs/RULES.md`
- `docs/FOLDER_STRUCTURE.md`
- `docs/API_GUIDELINES.md`
- `docs/RBAC.md`

## 4. Responsabilidades

- Crear pantallas.
- Crear componentes reutilizables.
- Integrar APIs.
- Manejar loading, empty y error states.
- Mantener diseño responsive.
- Implementar navegación.
- Respetar permisos visibles.
- Mejorar UX.
- Evitar lógica de negocio crítica en cliente.

## 5. Reglas inviolables

- No decidir permisos finales en frontend.
- No hardcodear reglas críticas.
- No duplicar lógica del backend.
- No mezclar componentes de dominio con componentes globales.
- No crear estilos inconsistentes.
- No ignorar estados de error.
- No crear pantallas sin ruta clara.
- No mostrar acciones que el backend rechazará por permisos.

## 6. Estructura recomendada

```txt
frontend/src/
├── app/
├── components/
├── features/
│   └── [domain]/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
├── hooks/
├── lib/
├── routes/
├── services/
└── types/
```

## 7. UX obligatoria

Cada pantalla debe contemplar:

- estado cargando;
- estado vacío;
- error;
- permiso insuficiente;
- acción principal clara;
- labels comprensibles;
- mobile-first;
- accesibilidad básica.

## 8. Integración API

- Usar cliente HTTP centralizado.
- Usar query keys consistentes.
- Invalidar cache después de mutaciones.
- No calcular reglas de negocio si el backend debe devolverlas.

## 9. Entrega esperada

Informar:

- pantallas creadas/modificadas;
- componentes creados;
- servicios API tocados;
- rutas;
- estados contemplados;
- capturas si corresponde;
- riesgos o dependencias backend.
