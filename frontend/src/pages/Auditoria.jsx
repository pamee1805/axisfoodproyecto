import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  ClipboardList,
  Eye,
  FilterX,
  Inbox,
  KeyRound,
  Layers3,
  RefreshCw,
  Users,
} from 'lucide-react'

import { getAuditLog, getAuditLogs } from '../services/auditoriaService'
import { formatDateTime as formatDate } from '../utils/formatters'

const emptyFilters = {
  accion: '',
  recurso: '',
  usuario: '',
  fecha_desde: '',
  fecha_hasta: '',
}

const criticalActions = new Set([
  'eliminacion',
  'cierre_caja',
  'asignacion_rol_usuario',
  'modificacion_rol_usuario',
  'eliminacion_rol_usuario',
  'asignacion_permiso_rol',
  'modificacion_permiso_rol',
  'eliminacion_permiso_rol',
])

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  }

  if (error.response?.status === 403) {
    return 'No tenés permisos para ver auditoría'
  }

  return 'No se pudo cargar auditoría. Revisá que el backend esté activo.'
}

function isToday(value) {
  const date = new Date(value)
  const today = new Date()

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function getActionClass(log) {
  const action = log.accion || ''
  if (action.includes('eliminacion')) {
    return 'danger'
  }
  if (action.includes('modificacion') || action.includes('cierre')) {
    return 'warning'
  }
  if (action.includes('asignacion') || action.includes('permiso') || action.includes('rol')) {
    return 'security'
  }
  if (action.includes('apertura') || action.includes('creacion')) {
    return 'success'
  }
  return 'neutral'
}

function getJsonPreview(data, emptyText) {
  if (!data || (typeof data === 'object' && !Object.keys(data).length)) {
    return emptyText
  }

  return JSON.stringify(data, null, 2)
}

function KpiCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <article className={`audit-kpi-card audit-kpi-${tone}`}>
      <span className="audit-kpi-icon">
        <Icon size={20} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  )
}

function AuditDetailModal({ isLoading, log, onClose }) {
  if (!log && !isLoading) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-wide audit-detail-modal" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Detalle de auditoría</p>
            <h3>{isLoading ? 'Cargando detalle' : log.accion_label || log.accion}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="audit-loading-inline">
            <RefreshCw size={22} />
            Cargando registro...
          </div>
        ) : (
          <>
            <section className="audit-detail-grid">
              <div>
                <span>Fecha</span>
                <strong>{formatDate(log.fecha)}</strong>
              </div>
              <div>
                <span>Usuario</span>
                <strong>{log.usuario_username || 'Sistema'}</strong>
              </div>
              <div>
                <span>Acción</span>
                <strong>{log.accion_label || log.accion}</strong>
              </div>
              <div>
                <span>Recurso</span>
                <strong>{log.recurso || '-'}</strong>
              </div>
              <div>
                <span>Referencia</span>
                <strong>{log.recurso_id || '-'}</strong>
              </div>
              <div>
                <span>IP</span>
                <strong>{log.ip || '-'}</strong>
              </div>
            </section>

            <details className="audit-user-agent">
              <summary>User agent</summary>
              <p>{log.user_agent || 'Sin user agent registrado'}</p>
            </details>

            <section className="audit-json-grid">
              <details open>
                <summary>Datos anteriores</summary>
                <pre>{getJsonPreview(log.datos_anteriores, 'Sin datos anteriores')}</pre>
              </details>
              <details open>
                <summary>Datos nuevos</summary>
                <pre>{getJsonPreview(log.datos_nuevos, 'Sin datos nuevos')}</pre>
              </details>
            </section>
          </>
        )}
      </section>
    </div>
  )
}

function Auditoria() {
  const [logs, setLogs] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const filterOptions = useMemo(() => {
    const acciones = new Map()
    const recursos = new Set()
    const usuarios = new Map()

    logs.forEach((log) => {
      if (log.accion) {
        acciones.set(log.accion, log.accion_label || log.accion)
      }
      if (log.recurso) {
        recursos.add(log.recurso)
      }
      if (log.usuario) {
        usuarios.set(log.usuario, log.usuario_username || `Usuario ${log.usuario}`)
      }
    })

    return {
      acciones: Array.from(acciones.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      recursos: Array.from(recursos).sort(),
      usuarios: Array.from(usuarios.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    }
  }, [logs])

  const kpis = useMemo(() => {
    const users = new Set(logs.map((log) => log.usuario).filter(Boolean))
    const resources = new Set(logs.map((log) => log.recurso).filter(Boolean))

    return [
      {
        helper: 'Registros del día cargado',
        icon: CalendarClock,
        label: 'Acciones hoy',
        tone: 'today',
        value: logs.filter((log) => isToday(log.fecha)).length,
      },
      {
        helper: 'Usuarios con actividad',
        icon: Users,
        label: 'Usuarios activos',
        tone: 'users',
        value: users.size,
      },
      {
        helper: 'Recursos impactados',
        icon: Layers3,
        label: 'Módulos afectados',
        tone: 'modules',
        value: resources.size,
      },
      {
        helper: 'Roles, permisos, cierres o bajas',
        icon: KeyRound,
        label: 'Operaciones críticas',
        tone: 'critical',
        value: logs.filter((log) => criticalActions.has(log.accion)).length,
      },
    ]
  }, [logs])

  const loadLogs = useCallback(async (nextFilters) => {
    setIsLoading(true)
    setError('')

    try {
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value !== ''),
      )
      const response = await getAuditLogs(params)
      setLogs(normalizeList(response.data))
    } catch (requestError) {
      setLogs([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs(emptyFilters)
  }, [loadLogs])

  function handleFilterChange(event) {
    const { name, value } = event.target
    const nextFilters = { ...filters, [name]: value }
    setFilters(nextFilters)
    loadLogs(nextFilters)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    loadLogs(emptyFilters)
  }

  async function openDetail(log) {
    setSelectedLog(log)
    setIsDetailLoading(true)
    setError('')

    try {
      const response = await getAuditLog(log.id)
      setSelectedLog(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setSelectedLog(null)
    } finally {
      setIsDetailLoading(false)
    }
  }

  return (
    <section className="audit-page">
      <div className="audit-hero">
        <div className="audit-title-block">
          <span className="audit-title-icon">
            <ClipboardList size={32} />
          </span>
          <div>
            <h2>Auditoría</h2>
            <p>Registro de acciones y cambios del sistema</p>
          </div>
        </div>
        <span className="audit-readonly-badge">
          <Eye size={16} />
          Solo lectura
        </span>
      </div>

      <section className="audit-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="audit-filter-panel">
        <label>
          Acción
          <select name="accion" onChange={handleFilterChange} value={filters.accion}>
            <option value="">Todas</option>
            {filterOptions.acciones.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Recurso
          <select name="recurso" onChange={handleFilterChange} value={filters.recurso}>
            <option value="">Todos</option>
            {filterOptions.recursos.map((recurso) => (
              <option key={recurso} value={recurso}>{recurso}</option>
            ))}
          </select>
        </label>
        <label>
          Usuario
          <select name="usuario" onChange={handleFilterChange} value={filters.usuario}>
            <option value="">Todos</option>
            {filterOptions.usuarios.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Fecha desde
          <input name="fecha_desde" onChange={handleFilterChange} type="date" value={filters.fecha_desde} />
        </label>
        <label>
          Fecha hasta
          <input name="fecha_hasta" onChange={handleFilterChange} type="date" value={filters.fecha_hasta} />
        </label>
        <button className="audit-clear-button" onClick={clearFilters} type="button">
          <FilterX size={17} />
          Limpiar
        </button>
      </section>

      {error ? <div className="purchase-feedback purchase-feedback-error">{error}</div> : null}

      <section className="audit-table-panel">
        <div className="audit-card-heading">
          <div>
            <p className="eyebrow">Actividad</p>
            <h3>Registros recientes</h3>
          </div>
          <span>{logs.length} eventos</span>
        </div>

        {isLoading ? (
          <div className="audit-empty-state">
            <RefreshCw size={24} className="audit-spin" />
            <strong>Cargando auditoría</strong>
            <span>Buscando acciones registradas del sistema.</span>
          </div>
        ) : logs.length ? (
          <div className="data-table-wrapper audit-table-wrapper">
            <table className="data-table audit-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Recurso</th>
                  <th>Referencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.fecha)}</td>
                    <td>
                      <strong>{log.usuario_username || 'Sistema'}</strong>
                    </td>
                    <td>
                      <span className={`audit-action-badge audit-action-${getActionClass(log)}`}>
                        {log.accion_label || log.accion || '-'}
                      </span>
                    </td>
                    <td>{log.recurso || '-'}</td>
                    <td>{log.recurso_id || '-'}</td>
                    <td>
                      <button className="audit-detail-button" onClick={() => openDetail(log)} type="button">
                        <Eye size={15} />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="audit-empty-state">
            <Inbox size={24} />
            <strong>No hay registros para mostrar</strong>
            <span>Probá limpiar filtros o elegir otro rango de fechas.</span>
          </div>
        )}
      </section>

      <AuditDetailModal
        isLoading={isDetailLoading}
        log={selectedLog}
        onClose={() => {
          setSelectedLog(null)
          setIsDetailLoading(false)
        }}
      />
    </section>
  )
}

export default Auditoria




