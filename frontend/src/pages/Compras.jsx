import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleCheck, Clock3, Inbox, PackageCheck, Search, TrendingUp, Truck } from 'lucide-react'

import ContextHelp from '../components/common/ContextHelp'
import StatusBadge from '../components/common/StatusBadge'
import OrdenCompraModal from '../components/compras/OrdenCompraModal'
import ProveedorModal from '../components/compras/ProveedorModal'
import { estadosOrdenCompra } from '../constants/options'
import {
  createOrdenCompra,
  createProveedor,
  deleteOrdenCompra,
  deleteProveedor,
  getOrdenesCompra,
  getProveedores,
  updateOrdenCompra,
  updateProveedor,
} from '../services/comprasService'
import { getProductos } from '../services/productosService'
import { purchaseHelp } from '../utils/helpText'
import { formatCurrency as formatMoney, formatDateTime as formatDate } from '../utils/formatters'

const proveedorEstados = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

const emptyFilters = {
  estado: '',
  proveedor: '',
  fechaDesde: '',
  fechaHasta: '',
}

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
    return 'No tenés permisos para gestionar compras'
  }

  const data = error.response?.data
  if (!data) {
    return 'No se pudo conectar con el servidor. Revisá que el backend esté activo.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  if (Array.isArray(data)) {
    return data.join(' ')
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      if (Array.isArray(messages)) {
        return `${field}: ${messages.join(' ')}`
      }

      if (typeof messages === 'object' && messages !== null) {
        return `${field}: ${JSON.stringify(messages)}`
      }

      return `${field}: ${String(messages)}`
    })
    .join(' ')
}

function getEstadoLabel(value) {
  return estadosOrdenCompra.find((estado) => estado.value === value)?.label || value
}

function isCompraCerrada(orden) {
  return ['recibida', 'rechazada'].includes(orden.estado)
}

function isSameMonth(value, referenceDate = new Date()) {
  const date = new Date(value)
  return (
    !Number.isNaN(date.getTime()) &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getFullYear() === referenceDate.getFullYear()
  )
}

function isInsideDateRange(value, fechaDesde, fechaHasta) {
  if (!fechaDesde && !fechaHasta) {
    return true
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const fromDate = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
  const toDate = fechaHasta ? new Date(`${fechaHasta}T00:00:00`) : null

  if (fromDate && orderDate < fromDate) {
    return false
  }

  if (toDate && orderDate > toDate) {
    return false
  }

  return true
}

function DetailModal({ isOpen, onClose, orden }) {
  if (!isOpen || !orden) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Orden #{orden.id}</p>
            <h3>Detalle de compra</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="purchase-detail-grid">
          <div>
            <span>Proveedor</span>
            <strong>{orden.proveedor_nombre || '-'}</strong>
          </div>
          <div>
            <span>Fecha</span>
            <strong>{formatDate(orden.fecha)}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{getEstadoLabel(orden.estado)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatMoney(orden.total)}</strong>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table purchase-detail-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo por unidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orden.items?.map((item) => (
                <tr key={item.id || `${item.producto}-${item.cantidad}`}>
                  <td>{item.producto_nombre || item.producto}</td>
                  <td>{item.cantidad}</td>
                  <td className="table-cell-money">{formatMoney(item.costo_unitario)}</td>
                  <td className="table-cell-money">{formatMoney(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ContextHelp item={purchaseHelp.marcarRecibida} />
      </section>
    </div>
  )
}

function EstadoModal({ isOpen, isSubmitting, onClose, onSubmit, orden }) {
  const [estado, setEstado] = useState('pendiente')

  useEffect(() => {
    if (orden) {
      setEstado(orden.estado || 'pendiente')
    }
  }, [orden])

  if (!isOpen || !orden) {
    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ estado })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Estado</p>
            <h3>Cambiar estado</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="entity-form" onSubmit={handleSubmit}>
          <p className="muted-text">
            Orden #{orden.id} de <strong>{orden.proveedor_nombre || '-'}</strong>
          </p>
          <label>
            Estado
            <select onChange={(event) => setEstado(event.target.value)} value={estado}>
              {estadosOrdenCompra.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <ContextHelp item={purchaseHelp.marcarRecibida} />

          <div className="modal-actions">
            <button className="button button-secondary" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : 'Guardar estado'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Compras() {
  const [activeTab, setActiveTab] = useState('ordenes')
  const [ordenes, setOrdenes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [filterDraft, setFilterDraft] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ordenModalOpen, setOrdenModalOpen] = useState(false)
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [estadoModalOpen, setEstadoModalOpen] = useState(false)
  const [editingOrden, setEditingOrden] = useState(null)
  const [editingProveedor, setEditingProveedor] = useState(null)
  const [selectedOrden, setSelectedOrden] = useState(null)

  const activeProveedores = useMemo(
    () => proveedores.filter((proveedor) => proveedor.estado !== 'inactivo'),
    [proveedores],
  )

  const filteredOrdenes = useMemo(
    () =>
      ordenes.filter((orden) =>
        isInsideDateRange(orden.fecha, appliedFilters.fechaDesde, appliedFilters.fechaHasta),
      ),
    [appliedFilters.fechaDesde, appliedFilters.fechaHasta, ordenes],
  )

  const kpis = useMemo(() => {
    const countByEstado = (estado) =>
      ordenes.filter((orden) => orden.estado === estado).length
    const totalMes = ordenes
      .filter((orden) => isSameMonth(orden.fecha))
      .reduce((total, orden) => total + Number(orden.total || 0), 0)

    return [
      { icon: Clock3, title: 'Órdenes pendientes', value: countByEstado('pendiente') },
      { icon: CircleCheck, title: 'Órdenes aprobadas', value: countByEstado('aprobada') },
      { icon: PackageCheck, title: 'Órdenes recibidas', value: countByEstado('recibida') },
      { icon: TrendingUp, title: 'Total compras del mes', value: formatMoney(totalMes), accent: true },
    ]
  }, [ordenes])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = {}
      if (appliedFilters.estado) {
        params.estado = appliedFilters.estado
      }
      if (appliedFilters.proveedor) {
        params.proveedor = appliedFilters.proveedor
      }

      const [ordenesResponse, proveedoresResponse, productosResponse] = await Promise.all([
        getOrdenesCompra(params),
        getProveedores(),
        getProductos({ estado: 'activo' }),
      ])

      setOrdenes(normalizeList(ordenesResponse.data))
      setProveedores(normalizeList(proveedoresResponse.data))
      setProductos(normalizeList(productosResponse.data))
    } catch (requestError) {
      setOrdenes([])
      setProveedores([])
      setProductos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters.estado, appliedFilters.proveedor])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilterDraft((current) => ({ ...current, [name]: value }))
  }

  function handleSearchFilters() {
    setAppliedFilters(filterDraft)
  }

  function handleClearFilters() {
    setFilterDraft(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  function handleNewOrden() {
    setEditingOrden(null)
    setOrdenModalOpen(true)
  }

  function handleEditOrden(orden) {
    setEditingOrden(orden)
    setOrdenModalOpen(true)
  }

  function handleViewOrden(orden) {
    setSelectedOrden(orden)
    setDetailModalOpen(true)
  }

  function handleChangeEstado(orden) {
    setSelectedOrden(orden)
    setEstadoModalOpen(true)
  }

  function handleNewProveedor() {
    setEditingProveedor(null)
    setProveedorModalOpen(true)
  }

  function handleEditProveedor(proveedor) {
    setEditingProveedor(proveedor)
    setProveedorModalOpen(true)
  }

  async function handleSubmitOrden(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingOrden) {
        await updateOrdenCompra(editingOrden.id, data)
        setSuccess('Orden actualizada.')
      } else {
        await createOrdenCompra(data)
        setSuccess('Orden creada.')
      }

      setOrdenModalOpen(false)
      setEditingOrden(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmitEstado(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateOrdenCompra(selectedOrden.id, data)
      setSuccess('Estado actualizado.')
      setEstadoModalOpen(false)
      setSelectedOrden(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteOrden(orden) {
    const confirmed = window.confirm(`¿Eliminar orden #${orden.id}?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteOrdenCompra(orden.id)
      setSuccess('Orden eliminada.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleSubmitProveedor(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, data)
        setSuccess('Proveedor actualizado.')
      } else {
        await createProveedor(data)
        setSuccess('Proveedor creado.')
      }

      setProveedorModalOpen(false)
      setEditingProveedor(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProveedor(proveedor) {
    const confirmed = window.confirm(`¿Eliminar proveedor "${proveedor.nombre}"?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteProveedor(proveedor.id)
      setSuccess('Proveedor eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function renderOrdenes() {
    if (isLoading) {
      return <div className="empty-state">Cargando órdenes de compra...</div>
    }

    if (!filteredOrdenes.length) {
      return (
        <div className="empty-state">
          <Search size={24} />
          <strong>No hay órdenes para estos filtros.</strong>
          <span>Probá limpiar la búsqueda o crear una nueva orden de compra.</span>
        </div>
      )
    }

    return (
      <div className="data-table-wrapper modern-table-wrapper">
        <table className="data-table purchases-table modern-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Items</th>
              <th>Total</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrdenes.map((orden) => {
              const cerrada = isCompraCerrada(orden)
              return (
                <tr key={orden.id}>
                  <td>{formatDate(orden.fecha)}</td>
                  <td>
                    <strong>{orden.proveedor_nombre || '-'}</strong>
                    <small>Orden #{orden.id}</small>
                  </td>
                  <td>
                    <StatusBadge label={getEstadoLabel(orden.estado)} value={orden.estado} />
                  </td>
                <td className="table-cell-number">{orden.items?.length || 0}</td>
                <td className="table-cell-money">
                  <strong>{formatMoney(orden.total)}</strong>
                </td>
                  <td>{orden.usuario_username || '-'}</td>
                  <td>
                    <div className="table-actions modern-actions">
                      <button
                        className="icon-action-button"
                        onClick={() => handleViewOrden(orden)}
                        title="Ver detalle"
                        type="button"
                      >
                        <span>Ver</span>
                        Ver
                      </button>
                      {cerrada ? (
                        <span className="table-action-muted">Cerrada</span>
                      ) : (
                        <>
                          <button
                            className="icon-action-button"
                            onClick={() => handleEditOrden(orden)}
                            title="Editar"
                            type="button"
                          >
                            <span>Editar</span>
                            Editar
                          </button>
                          <button
                            className="icon-action-button"
                            onClick={() => handleChangeEstado(orden)}
                            title="Cambiar estado"
                            type="button"
                          >
                            <span>Estado</span>
                            Estado
                          </button>
                          <button
                            className="icon-action-button icon-action-danger"
                            onClick={() => handleDeleteOrden(orden)}
                            title="Eliminar"
                            type="button"
                          >
                            <span>x</span>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function renderProveedores() {
    if (isLoading) {
      return <div className="empty-state">Cargando proveedores...</div>
    }

    if (!proveedores.length) {
      return (
        <div className="empty-state">
          <Inbox size={24} />
          <strong>Todavía no hay proveedores.</strong>
          <span>Agregá el primero para poder crear órdenes de compra.</span>
        </div>
      )
    }

    return (
      <div className="data-table-wrapper modern-table-wrapper">
        <table className="data-table suppliers-table modern-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id}>
                <td>
                  <strong>{proveedor.nombre}</strong>
                </td>
                <td>{proveedor.telefono || '-'}</td>
                <td>{proveedor.email || '-'}</td>
                <td>{proveedor.direccion || '-'}</td>
                <td>
                  <StatusBadge
                    label={
                      proveedorEstados.find((item) => item.value === proveedor.estado)?.label ||
                      proveedor.estado
                    }
                    value={proveedor.estado}
                  />
                </td>
                <td>
                  <div className="table-actions modern-actions">
                    <button
                      className="icon-action-button"
                      onClick={() => handleEditProveedor(proveedor)}
                      type="button"
                    >
                      <span>✎</span>
                      Editar
                    </button>
                    <button
                      className="icon-action-button icon-action-danger"
                      onClick={() => handleDeleteProveedor(proveedor)}
                      type="button"
                    >
                      <span>×</span>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section className="purchases-page purchases-dashboard">
      <div className="purchase-hero">
        <div className="purchase-title-block">
          <span className="purchase-title-icon">
            <Truck size={32} />
          </span>
          <div>
            <p className="eyebrow">Compras</p>
            <h2>Compras</h2>
            <p>Gestioná tus proveedores y órdenes de compra</p>
          </div>
        </div>
        <div className="page-actions purchase-hero-actions">
          <button className="button button-secondary" onClick={handleNewProveedor} type="button">
            Proveedores
          </button>
          <button className="button button-primary" onClick={handleNewOrden} type="button">
            + Nueva orden de compra
          </button>
        </div>
      </div>

      <section className="purchase-kpi-grid">
        {kpis.map((kpi) => (
          <article className={`purchase-kpi-card ${kpi.accent ? 'purchase-kpi-accent' : ''}`} key={kpi.title}>
            <span className="purchase-kpi-icon">
              <kpi.icon size={22} />
            </span>
            <div>
              <p>{kpi.title}</p>
              <strong>{kpi.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="purchase-dashboard-grid">
        <main className="purchase-dashboard-main">
          <section className="panel purchase-tabs-panel">
            <div aria-label="Compras" className="purchase-tabs" role="tablist">
              <button
                aria-selected={activeTab === 'ordenes'}
                className={`purchase-tab ${activeTab === 'ordenes' ? 'purchase-tab-active' : ''}`}
                onClick={() => setActiveTab('ordenes')}
                role="tab"
                type="button"
              >
                Órdenes de compra
              </button>
              <button
                aria-selected={activeTab === 'proveedores'}
                className={`purchase-tab ${
                  activeTab === 'proveedores' ? 'purchase-tab-active' : ''
                }`}
                onClick={() => setActiveTab('proveedores')}
                role="tab"
                type="button"
              >
                Proveedores
              </button>
            </div>
          </section>

          {activeTab === 'ordenes' ? (
            <section className="panel purchase-filter-panel">
              <label>
                Estado
                <select name="estado" onChange={handleFilterChange} value={filterDraft.estado}>
                  <option value="">Todos</option>
                  {estadosOrdenCompra.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Proveedor
                <select
                  name="proveedor"
                  onChange={handleFilterChange}
                  value={filterDraft.proveedor}
                >
                  <option value="">Todos</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha desde
                <input
                  name="fechaDesde"
                  onChange={handleFilterChange}
                  type="date"
                  value={filterDraft.fechaDesde}
                />
              </label>

              <label>
                Fecha hasta
                <input
                  name="fechaHasta"
                  onChange={handleFilterChange}
                  type="date"
                  value={filterDraft.fechaHasta}
                />
              </label>

              <div className="purchase-filter-actions">
                <button className="button button-secondary" onClick={handleClearFilters} type="button">
                  Limpiar
                </button>
                <button className="button button-primary" onClick={handleSearchFilters} type="button">
                  Buscar
                </button>
              </div>
            </section>
          ) : (
            <section className="panel purchase-supplier-toolbar">
              <div>
                <p className="eyebrow">Proveedores</p>
                <h3>Base de proveedores</h3>
              </div>
              <button className="button button-primary" onClick={handleNewProveedor} type="button">
                Nuevo proveedor
              </button>
            </section>
          )}

          <ContextHelp item={purchaseHelp.marcarRecibida} />

          {success && !error ? (
            <div className="purchase-feedback purchase-feedback-success">{success}</div>
          ) : null}

          {error ? (
            <div className="purchase-feedback purchase-feedback-error">{error}</div>
          ) : (
            <section className="panel products-table-panel modern-table-panel">
              {activeTab === 'ordenes' ? renderOrdenes() : renderProveedores()}
            </section>
          )}
        </main>

        <aside className="purchase-side-panel">
          <section className="panel purchase-quick-card">
            <div className="panel-heading">
              <h3>Acciones rápidas</h3>
            </div>
            <button className="button button-primary" onClick={handleNewOrden} type="button">
              Nueva orden de compra
            </button>
            <ContextHelp className="context-help-compact" item={purchaseHelp.crearOrden} />
            <button className="button button-secondary" onClick={handleNewProveedor} type="button">
              Nuevo proveedor
            </button>
          </section>

          <section className="panel purchase-quick-card">
            <div className="panel-heading">
              <h3>Estados de órdenes</h3>
            </div>
            <div className="purchase-status-list">
              {estadosOrdenCompra.map((estado) => (
                <StatusBadge key={estado.value} label={estado.label} value={estado.value} />
              ))}
            </div>
          </section>

          <section className="panel purchase-note-card">
            <ContextHelp item={purchaseHelp.marcarRecibida} />
          </section>
        </aside>
      </section>

      <OrdenCompraModal
        initialData={editingOrden}
        isOpen={ordenModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setOrdenModalOpen(false)
          setEditingOrden(null)
        }}
        onSubmit={handleSubmitOrden}
        productos={productos}
        proveedores={activeProveedores}
      />

      <ProveedorModal
        initialData={editingProveedor}
        isOpen={proveedorModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setProveedorModalOpen(false)
          setEditingProveedor(null)
        }}
        onSubmit={handleSubmitProveedor}
      />

      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedOrden(null)
        }}
        orden={selectedOrden}
      />

      <EstadoModal
        isOpen={estadoModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setEstadoModalOpen(false)
          setSelectedOrden(null)
        }}
        onSubmit={handleSubmitEstado}
        orden={selectedOrden}
      />
    </section>
  )
}

export default Compras



