import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, Clock3, CreditCard, Flame, Inbox, Search, ShoppingCart, TrendingUp } from 'lucide-react'

import ContextHelp from '../components/common/ContextHelp'
import StatusBadge from '../components/common/StatusBadge'
import ClienteModal from '../components/ventas/ClienteModal'
import PagoModal from '../components/ventas/PagoModal'
import PedidoModal from '../components/ventas/PedidoModal'
import { canalesPedido, estadosPago, estadosPedido, metodosPago } from '../constants/options'
import { getProductos } from '../services/productosService'
import { salesHelp } from '../utils/helpText'
import {
  createCliente,
  createPago,
  createPedido,
  deleteCliente,
  deletePago,
  getClientes,
  getPagos,
  getPedidos,
  updateCliente,
  updatePago,
  updatePedido,
} from '../services/ventasService'
import { formatCurrency as formatMoney, formatDate } from '../utils/formatters'

const emptyFilters = {
  estado: '',
  canal: '',
  sucursal: '',
  fecha: '',
  search: '',
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

function getStoredSucursales() {
  try {
    const user = JSON.parse(localStorage.getItem('axisfood_user')) || null
    const sucursal = user?.sucursal_principal
    return sucursal?.id
      ? [{ id: sucursal.id, nombre: sucursal.nombre || `Sucursal ${sucursal.id}` }]
      : []
  } catch {
    return []
  }
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  }

  if (error.response?.status === 403) {
    return 'No tenés permisos para gestionar ventas'
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

function getLabel(items, value) {
  return items.find((item) => item.value === value)?.label || value || '-'
}

function isPedidoCerrado(pedido) {
  return ['entregado', 'finalizado', 'cancelado'].includes(pedido.estado)
}

function isPagoCerrado(pago) {
  return ['aprobado', 'reintegrado'].includes(pago.estado)
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

function isThisMonth(value) {
  const date = new Date(value)
  const today = new Date()
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  )
}

function PedidoDetalleModal({ isOpen, onClose, pedido }) {
  if (!isOpen || !pedido) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Pedido #{pedido.id}</p>
            <h3>Detalle del pedido</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="sales-detail-grid">
          <div>
            <span>Cliente</span>
            <strong>{pedido.cliente_nombre || '-'}</strong>
          </div>
          <div>
            <span>Canal</span>
            <strong>{getLabel(canalesPedido, pedido.canal)}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{getLabel(estadosPedido, pedido.estado)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatMoney(pedido.total)}</strong>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table sales-detail-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.items?.map((item) => (
                <tr key={item.id || `${item.producto}-${item.cantidad}`}>
                  <td>{item.producto_nombre || item.producto}</td>
                  <td>{item.cantidad}</td>
                  <td className="table-cell-money">{formatMoney(item.precio_unitario)}</td>
                  <td className="table-cell-money">{formatMoney(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Ventas() {
  const [activeTab, setActiveTab] = useState('pedidos')
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [pagos, setPagos] = useState([])
  const [productos, setProductos] = useState([])
  const [sucursales] = useState(() => getStoredSucursales())
  const [filters, setFilters] = useState(emptyFilters)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pedidoModalOpen, setPedidoModalOpen] = useState(false)
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [pagoModalOpen, setPagoModalOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState(null)
  const [editingCliente, setEditingCliente] = useState(null)
  const [editingPago, setEditingPago] = useState(null)
  const [selectedPedido, setSelectedPedido] = useState(null)

  const pedidoById = useMemo(
    () => new Map(pedidos.map((pedido) => [pedido.id, pedido])),
    [pedidos],
  )

  const filteredPedidos = useMemo(() => {
    const term = filters.search.trim().toLowerCase()

    return pedidos.filter((pedido) => {
      if (filters.estado && pedido.estado !== filters.estado) {
        return false
      }
      if (filters.canal && pedido.canal !== filters.canal) {
        return false
      }
      if (filters.sucursal && String(pedido.sucursal) !== String(filters.sucursal)) {
        return false
      }
      if (filters.fecha && !isTodayMatch(pedido.fecha, filters.fecha)) {
        return false
      }
      if (!term) {
        return true
      }

      return (
        String(pedido.id).includes(term) ||
        (pedido.cliente_nombre || '').toLowerCase().includes(term)
      )
    })
  }, [filters, pedidos])

  const salesKpis = useMemo(() => {
    const pagosAprobados = pagos.filter((pago) => pago.estado === 'aprobado')
    const ventasHoy = pedidos
      .filter((pedido) => isToday(pedido.fecha))
      .reduce((total, pedido) => total + Number(pedido.total || 0), 0)

    return [
      {
        icon: Clock3,
        label: 'Pedidos pendientes',
        subtitle: 'Esperan atención',
        value: pedidos.filter((pedido) => pedido.estado === 'pendiente').length,
      },
      {
        icon: Flame,
        label: 'En preparación',
        subtitle: 'En cocina o proceso',
        value: pedidos.filter((pedido) => pedido.estado === 'en_preparacion').length,
      },
      {
        icon: CircleCheck,
        label: 'Finalizados hoy',
        subtitle: 'Cerrados en el día',
        value: pedidos.filter((pedido) => pedido.estado === 'finalizado' && isToday(pedido.fecha))
          .length,
      },
      {
        icon: TrendingUp,
        label: 'Ventas del día',
        subtitle: 'Total de pedidos de hoy',
        value: formatMoney(ventasHoy),
      },
      {
        icon: CreditCard,
        label: 'Pagos aprobados',
        subtitle: 'Cobros confirmados',
        value: pagosAprobados.length,
      },
    ]
  }, [pagos, pedidos])

  const clientStats = useMemo(() => {
    const pedidosPorCliente = pedidos.reduce((map, pedido) => {
      const current = map.get(pedido.cliente) || []
      current.push(pedido)
      map.set(pedido.cliente, current)
      return map
    }, new Map())

    return {
      activos: clientes.length,
      nuevosMes: clientes.filter((cliente) => isThisMonth(cliente.created_at)).length,
      frecuentes: clientes.filter((cliente) => (pedidosPorCliente.get(cliente.id) || []).length >= 2)
        .length,
      pedidosPorCliente,
    }
  }, [clientes, pedidos])

  const paymentStats = useMemo(() => {
    const ingresosHoy = pagos
      .filter((pago) => pago.estado === 'aprobado' && isToday(pago.fecha))
      .reduce((total, pago) => total + Number(pago.monto || 0), 0)

    return [
      { label: 'Pagos pendientes', value: pagos.filter((pago) => pago.estado === 'pendiente').length },
      { label: 'Pagos aprobados', value: pagos.filter((pago) => pago.estado === 'aprobado').length },
      { label: 'Pagos rechazados', value: pagos.filter((pago) => pago.estado === 'rechazado').length },
      { label: 'Ingresos del día', value: formatMoney(ingresosHoy) },
    ]
  }, [pagos])

  function pedidoTienePagoAprobado(pedido) {
    return pagos.some((pago) => String(pago.pedido) === String(pedido.id) && pago.estado === 'aprobado')
  }

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [clientesResponse, pedidosResponse, pagosResponse, productosResponse] =
        await Promise.all([
          getClientes(),
          getPedidos(),
          getPagos(),
          getProductos({ estado: 'activo' }),
        ])

      setClientes(normalizeList(clientesResponse.data))
      setPedidos(normalizeList(pedidosResponse.data))
      setPagos(normalizeList(pagosResponse.data))
      setProductos(normalizeList(productosResponse.data))
    } catch (requestError) {
      setClientes([])
      setPedidos([])
      setPagos([])
      setProductos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openNewPedido() {
    setEditingPedido(null)
    setPedidoModalOpen(true)
  }

  function openNewPago(pedido = null) {
    setEditingPago(null)
    setSelectedPedido(pedido)
    setPagoModalOpen(true)
  }

  async function handleSubmitPedido(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingPedido) {
        await updatePedido(editingPedido.id, data)
        setSuccess('Pedido actualizado.')
      } else {
        await createPedido(data)
        setSuccess('Pedido creado.')
      }

      setPedidoModalOpen(false)
      setEditingPedido(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelPedido(pedido) {
    const confirmed = window.confirm(`¿Cancelar pedido #${pedido.id}?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await updatePedido(pedido.id, { estado: 'cancelado' })
      setSuccess('Pedido cancelado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleSubmitCliente(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data)
        setSuccess('Cliente actualizado.')
      } else {
        await createCliente(data)
        setSuccess('Cliente creado.')
      }

      setClienteModalOpen(false)
      setEditingCliente(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteCliente(cliente) {
    const confirmed = window.confirm(`¿Eliminar cliente "${cliente.nombre}"?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteCliente(cliente.id)
      setSuccess('Cliente eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleSubmitPago(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingPago) {
        await updatePago(editingPago.id, data)
        setSuccess('Pago actualizado.')
      } else {
        await createPago(data)
        setSuccess('Pago registrado.')
      }

      setPagoModalOpen(false)
      setEditingPago(null)
      setSelectedPedido(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeletePago(pago) {
    const confirmed = window.confirm(`¿Eliminar pago #${pago.id}?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deletePago(pago.id)
      setSuccess('Pago eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function renderPedidos() {
    if (isLoading) {
      return <div className="sales-empty-state">Cargando pedidos...</div>
    }

    if (!filteredPedidos.length) {
      return (
        <div className="sales-empty-state">
          <Search size={24} />
          <strong>No hay pedidos para mostrar.</strong>
          <span>Probá limpiar filtros o creá un pedido nuevo.</span>
        </div>
      )
    }

    return (
      <>
        <ContextHelp className="context-help-compact" item={salesHelp.cancelarPedido} />
        <div className="data-table-wrapper sales-table-shell">
        <table className="data-table sales-saas-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Items</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.map((pedido) => {
              const cerrado = isPedidoCerrado(pedido)
              const cobrado = pedidoTienePagoAprobado(pedido)
              return (
              <tr key={pedido.id}>
                <td>
                  <strong>#{pedido.id}</strong>
                </td>
                <td>{formatDate(pedido.fecha)}</td>
                <td>{pedido.cliente_nombre || '-'}</td>
                <td>
                  <span className={`sales-channel-badge sales-channel-${pedido.canal}`}>
                    {getLabel(canalesPedido, pedido.canal)}
                  </span>
                </td>
                <td>
                  <StatusBadge label={getLabel(estadosPedido, pedido.estado)} value={pedido.estado} />
                </td>
                <td className="table-cell-number">{pedido.items?.length || 0}</td>
                <td className="table-cell-money">
                  <strong>{formatMoney(pedido.total)}</strong>
                </td>
                <td>
                  <div className="sales-row-actions">
                    <button className="sales-action-btn" onClick={() => { setSelectedPedido(pedido); setDetalleOpen(true) }} type="button">Ver</button>
                    {cerrado ? <span className="table-action-muted">Cerrado</span> : null}
                    {!cerrado ? (
                      <button className="sales-action-btn" onClick={() => { setEditingPedido(pedido); setPedidoModalOpen(true) }} type="button">Editar</button>
                    ) : null}
                    {!cobrado && pedido.estado !== 'cancelado' ? (
                      <button className="sales-action-btn sales-action-primary" onClick={() => openNewPago(pedido)} type="button">Cobrar</button>
                    ) : null}
                    {!cerrado ? (
                      <button className="sales-action-btn sales-action-danger" onClick={() => handleCancelPedido(pedido)} type="button">Cancelar</button>
                    ) : null}
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </>
    )
  }

  function renderClientes() {
    if (isLoading) {
      return <div className="sales-empty-state">Cargando clientes...</div>
    }

    if (!clientes.length) {
      return (
        <div className="sales-empty-state">
          <Inbox size={24} />
          <strong>No hay clientes cargados.</strong>
          <span>Agregá clientes para tomar pedidos más rápido.</span>
        </div>
      )
    }

    return (
      <div className="data-table-wrapper sales-table-shell">
        <table className="data-table sales-saas-table sales-clients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Pedidos</th>
              <th>Total gastado</th>
              <th>Última compra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              const clientOrders = clientStats.pedidosPorCliente.get(cliente.id) || []
              const total = clientOrders.reduce((sum, pedido) => sum + Number(pedido.total || 0), 0)
              const lastOrder = clientOrders[0]
              return (
                <tr key={cliente.id}>
                  <td>
                    <strong>{`${cliente.nombre} ${cliente.apellido || ''}`.trim()}</strong>
                  </td>
                  <td>{cliente.telefono || '-'}</td>
                  <td>{cliente.email || '-'}</td>
                  <td className="table-cell-number">{clientOrders.length}</td>
                  <td className="table-cell-money">{formatMoney(total)}</td>
                  <td>{lastOrder ? formatDate(lastOrder.fecha) : '-'}</td>
                  <td>
                    <div className="sales-row-actions">
                      <button className="sales-action-btn" onClick={() => { setEditingCliente(cliente); setClienteModalOpen(true) }} type="button">Editar</button>
                      <button className="sales-action-btn sales-action-danger" onClick={() => handleDeleteCliente(cliente)} type="button">Eliminar</button>
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

  function renderPagos() {
    if (isLoading) {
      return <div className="sales-empty-state">Cargando pagos...</div>
    }

    if (!pagos.length) {
      return (
        <div className="sales-empty-state">
          <Inbox size={24} />
          <strong>No hay pagos registrados.</strong>
          <span>Registrá un pago desde un pedido o desde el botón principal.</span>
        </div>
      )
    }

    return (
      <div className="data-table-wrapper sales-table-shell">
        <table className="data-table sales-saas-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => {
              const pedido = pedidoById.get(pago.pedido)
              const cerrado = isPagoCerrado(pago)
              return (
                <tr key={pago.id}>
                  <td>
                    <strong>#{pago.pedido}</strong>
                  </td>
                  <td>{pedido?.cliente_nombre || '-'}</td>
                  <td>{getLabel(metodosPago, pago.metodo_pago)}</td>
                  <td className="table-cell-money">
                    <strong>{formatMoney(pago.monto)}</strong>
                  </td>
                  <td>
                    <StatusBadge label={getLabel(estadosPago, pago.estado)} value={pago.estado} />
                  </td>
                  <td>{formatDate(pago.fecha)}</td>
                  <td>
                    <div className="sales-row-actions">
                      {cerrado ? (
                        <span className="table-action-muted">Cerrado</span>
                      ) : (
                        <>
                          <button className="sales-action-btn" onClick={() => { setEditingPago(pago); setSelectedPedido(null); setPagoModalOpen(true) }} type="button">Editar</button>
                          <button className="sales-action-btn sales-action-danger" onClick={() => handleDeletePago(pago)} type="button">Eliminar</button>
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

  return (
    <section className="sales-page sales-saas-page">
      <div className="sales-saas-hero">
        <div className="page-title-block">
          <span className="page-title-icon">
            <ShoppingCart size={32} />
          </span>
          <div>
            <h2>Ventas</h2>
            <p>Gestión de pedidos, clientes y pagos</p>
          </div>
        </div>
        <div className="sales-hero-actions">
          <button className="button button-primary" onClick={openNewPedido} type="button">Nuevo pedido</button>
          <button className="button button-secondary" onClick={() => openNewPago()} type="button">Registrar pago</button>
        </div>
      </div>

      <section className="sales-saas-kpi-grid">
        {salesKpis.map((kpi) => (
          <article className="sales-saas-kpi-card" key={kpi.label}>
            <span className="sales-kpi-icon">
              <kpi.icon size={22} />
            </span>
            <strong>{kpi.value}</strong>
            <p>{kpi.label}</p>
            <small>{kpi.subtitle}</small>
          </article>
        ))}
      </section>

      <section className="sales-saas-tabs" aria-label="Ventas">
        {[
          ['pedidos', 'Pedidos'],
          ['clientes', 'Clientes'],
          ['pagos', 'Pagos'],
        ].map(([value, label]) => (
          <button
            aria-selected={activeTab === value}
            className={`sales-saas-tab ${activeTab === value ? 'sales-saas-tab-active' : ''}`}
            key={value}
            onClick={() => setActiveTab(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>

      {activeTab === 'pedidos' ? (
        <section className="sales-filter-bar">
          <select name="estado" onChange={handleFilterChange} value={filters.estado}>
            <option value="">Estado</option>
            {estadosPedido.map((estado) => (
              <option key={estado.value} value={estado.value}>{estado.label}</option>
            ))}
          </select>
          <select name="canal" onChange={handleFilterChange} value={filters.canal}>
            <option value="">Canal</option>
            {canalesPedido.map((canal) => (
              <option key={canal.value} value={canal.value}>{canal.label}</option>
            ))}
          </select>
          <select name="sucursal" onChange={handleFilterChange} value={filters.sucursal}>
            <option value="">Sucursal</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
            ))}
          </select>
          <input name="fecha" onChange={handleFilterChange} type="date" value={filters.fecha} />
          <input
            name="search"
            onChange={handleFilterChange}
            placeholder="Buscar pedido o cliente"
            type="search"
            value={filters.search}
          />
        </section>
      ) : null}

      {activeTab === 'clientes' ? (
        <section className="sales-tab-dashboard">
          <div className="sales-tab-header">
            <div>
              <h3>Clientes</h3>
              <p>Personas que compran en el negocio</p>
            </div>
            <button className="button button-primary" onClick={() => { setEditingCliente(null); setClienteModalOpen(true) }} type="button">Nuevo cliente</button>
          </div>
          <div className="sales-small-kpi-grid">
            <article><span>Clientes activos</span><strong>{clientStats.activos}</strong></article>
            <article><span>Nuevos del mes</span><strong>{clientStats.nuevosMes}</strong></article>
            <article><span>Clientes frecuentes</span><strong>{clientStats.frecuentes}</strong></article>
          </div>
        </section>
      ) : null}

      {activeTab === 'pagos' ? (
        <section className="sales-tab-dashboard">
          <div className="sales-tab-header">
            <div>
              <h3>Pagos</h3>
              <p>Cobros registrados de pedidos</p>
            </div>
            <button className="button button-primary" onClick={() => openNewPago()} type="button">Registrar pago</button>
          </div>
          <div className="sales-small-kpi-grid">
            {paymentStats.map((stat) => (
              <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>
            ))}
          </div>
        </section>
      ) : null}

      {success && !error ? <div className="purchase-feedback purchase-feedback-success">{success}</div> : null}
      {error ? (
        <div className="purchase-feedback purchase-feedback-error">{error}</div>
      ) : (
        <section className="sales-saas-panel">
          {activeTab === 'pedidos' ? renderPedidos() : null}
          {activeTab === 'clientes' ? renderClientes() : null}
          {activeTab === 'pagos' ? renderPagos() : null}
        </section>
      )}

      <PedidoModal
        clientes={clientes}
        initialData={editingPedido}
        isOpen={pedidoModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => { setPedidoModalOpen(false); setEditingPedido(null) }}
        onSubmit={handleSubmitPedido}
        productos={productos}
        sucursales={sucursales}
      />

      <ClienteModal
        initialData={editingCliente}
        isOpen={clienteModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => { setClienteModalOpen(false); setEditingCliente(null) }}
        onSubmit={handleSubmitCliente}
      />

      <PagoModal
        initialData={editingPago}
        isOpen={pagoModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => { setPagoModalOpen(false); setEditingPago(null); setSelectedPedido(null) }}
        onSubmit={handleSubmitPago}
        pedido={selectedPedido}
        pedidos={pedidos}
      />

      <PedidoDetalleModal
        isOpen={detalleOpen}
        onClose={() => { setDetalleOpen(false); setSelectedPedido(null) }}
        pedido={selectedPedido}
      />
    </section>
  )
}

function isTodayMatch(value, dateString) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  const selected = new Date(`${dateString}T00:00:00`)
  return (
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth() &&
    date.getDate() === selected.getDate()
  )
}

export default Ventas



