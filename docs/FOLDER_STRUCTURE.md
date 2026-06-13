# FOLDER_STRUCTURE.md
# Estructura de Carpetas IA-Ready

## 1. Principio

La estructura de carpetas define responsabilidades.  
Los agentes IA no deben mezclar dominios ni escribir código en cualquier lugar.

## 2. Estructura recomendada

```txt
project/
├── agents/
│   ├── ORCHESTRATOR.md
│   ├── BACKEND_AGENT.md
│   ├── FRONTEND_AGENT.md
│   ├── DEVOPS_AGENT.md
│   ├── SECURITY_AGENT.md
│   └── QA_AGENT.md
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── STACK.md
│   ├── RULES.md
│   ├── FOLDER_STRUCTURE.md
│   ├── WORKFLOW.md
│   ├── RBAC.md
│   ├── API_GUIDELINES.md
│   └── SPRINT_0.md
├── backend/
│   ├── apps/
│   │   └── [domain]/
│   │       ├── models.py
│   │       ├── services.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       ├── permissions.py
│   │       ├── selectors.py
│   │       ├── tasks.py
│   │       ├── urls.py
│   │       └── tests/
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   ├── nginx/
│   └── scripts/
├── docker-compose.yml
└── README.md
```

## 3. Responsabilidades por carpeta

| Carpeta | Responsabilidad | Agente principal |
|---|---|---|
| `agents/` | Instrucciones operativas para agentes IA | Orchestrator |
| `docs/` | Source of truth documental | Orchestrator |
| `backend/` | API, modelos, services, permisos | Backend Agent |
| `frontend/` | UI, rutas, estado cliente, integración API | Frontend Agent |
| `docker/` | Infraestructura local y despliegue | DevOps Agent |
| `checklists/` | Validaciones de calidad | QA + Orchestrator |

## 4. Reglas de separación

- `frontend/` no contiene lógica de negocio crítica.
- `backend/apps/[domain]/services.py` contiene reglas de negocio.
- `backend/apps/[domain]/selectors.py` contiene queries complejas de lectura.
- `backend/apps/[domain]/permissions.py` contiene permisos específicos.
- `frontend/src/features/[domain]` agrupa pantallas y componentes por dominio.
- `frontend/src/components` solo contiene componentes compartidos.

## 5. Prohibiciones

- No crear `utils.py` gigante con lógica mezclada.
- No crear `components/misc`.
- No crear endpoints dentro de archivos que no correspondan.
- No mezclar lógica de dominios.
- No duplicar validaciones críticas entre frontend y backend.
- No crear carpetas nuevas sin documentarlas acá.
