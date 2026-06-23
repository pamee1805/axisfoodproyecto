import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  LayoutDashboard,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import apiClient from '../api/apiClient'
import { formatCurrency as formatMoney, formatDateTime as formatDate, formatNumber } from '../utils/formatters'

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
    return 'No tenés permiso para ver el dashboard.'
  }

  return 'No se pudo cargar el dashboard. Revisá que el backend esté activo.'
}

function getMovimientoLabel(value) {
  const labels = {
    entrada: 'Entrada',
    salida: 'Salida',
    ajuste: 'Ajuste',
    merma: 'Producto perdido',
    desperdicio: 'Desperdicio',
    vencimiento: 'Vencimiento',
    devolucion: 'Devolución',
  }

  return labels[value] || value || '-'
}

function getMovimientoColor(value) {
  const colors = {
    entrada: '#19d395',
    devolucion: '#19d395',
    salida: '#ff6384',
    merma: '#ff9f43',
    desperdicio: '#ff9f43',
    vencimiento: '#b794f4',
    ajuste: '#8edcff',
  }

  return colors[value] || '#7f8cff'
}

function buildInventoryChartData(movimientos) {
  return movimientos.slice(0, 8).reverse().map((movimiento) => ({
    label: getMovimientoLabel(movimiento.tipo_movimiento),
    cantidad: Math.abs(Number(movimiento.cantidad || 0)),
    tipo: movimiento.tipo_movimiento,
  }))
}

function KpiCard({ accent, icon: Icon, label, value, helper }) {
  return (
    <article className={`dashboard2-kpi dashboard2-kpi-${accent}`}>
      <span className="dashboard2-kpi-icon">
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

function Panel({ children, title, eyebrow, count }) {
  return (
    <article className="dashboard2-panel dashboard2-chart-card">
      <div className="dashboard2-card-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {count ? <span>{count}</span> : null}
      </div>
      {children}
    </article>
  )
}

function QuickActionCard({ action }) {
  const Icon = action.icon

  if (action.disabled) {
    return (
      <article aria-disabled="true" className="dashboard2-action-card dashboard2-action-card-disabled">
        <Icon size={20} />
        <span>{action.label}</span>
        <small>{action.reason}</small>
      </article>
    )
  }

  return (
    <Link className="dashboard2-action-card" to={action.to}>
      <Icon size={20} />
      <span>{action.label}</span>
      <ArrowRight size={16} />
    </Link>
  )
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiClient.get('dashboard/resumen/')
        setData(response.data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const resumen = data?.resumen || {}
  const caja = data?.caja_abierta || {}
  const stockBajo = normalizeList(data?.productos_stock_bajo)
  const movimientos = normalizeList(data?.ultimos_movimientos_inventario)
  const ventasHoy = Number(data?.ventas_hoy || 0)
  const pedidosPendientes = Number(data?.pedidos_pendientes || 0)
  const comprasPendientes = Number(resumen.total_ordenes_compra_pendientes || 0)

  const kpis = useMemo(
    () => [
      {
        accent: 'sales',
        helper: ventasHoy > 0 ? 'Facturación registrada hoy' : 'Sin cobros aprobados hoy',
        icon: TrendingUp,
        label: 'Ventas Hoy',
        value: formatMoney(ventasHoy),
      },
      {
        accent: 'orders',
        helper: pedidosPendientes ? 'Requieren seguimiento' : 'Flujo de pedidos al día',
        icon: ClipboardCheck,
        label: 'Pedidos Activos',
        value: formatNumber(pedidosPendientes),
      },
      {
        accent: 'cash',
        helper: caja.existe ? caja.sucursal || 'Turno activo' : 'Abrir caja para operar',
        icon: Wallet,
        label: 'Caja Actual',
        value: caja.existe ? 'Abierta' : 'Cerrada',
      },
      {
        accent: 'stock',
        helper: stockBajo.length ? 'Requieren reposición' : 'Inventario saludable',
        icon: TriangleAlert,
        label: 'Productos Críticos',
        value: formatNumber(stockBajo.length),
      },
    ],
    [
      caja.existe,
      caja.sucursal,
      pedidosPendientes,
      stockBajo.length,
      ventasHoy,
    ],
  )

  const alerts = useMemo(() => {
    const nextAlerts = []

    if (!caja.existe) {
      nextAlerts.push({
        icon: CircleX,
        tone: 'danger',
        title: 'Caja cerrada',
        text: 'Abrir una caja antes de registrar cobros operativos.',
      })
    }
    if (stockBajo.length) {
      nextAlerts.push({
        icon: TriangleAlert,
        tone: 'warning',
        title: 'Stock bajo',
        text: `${stockBajo.length} productos necesitan reposición.`,
      })
    }
    if (comprasPendientes) {
      nextAlerts.push({
        icon: ShoppingCart,
        tone: 'info',
        title: 'Compras pendientes',
        text: `${comprasPendientes} órdenes esperan aprobación.`,
      })
    }

    return nextAlerts
  }, [caja.existe, comprasPendientes, stockBajo.length])

  const quickActions = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: 'Nueva venta',
        to: '/ventas',
      },
      {
        icon: PackagePlus,
        label: 'Nuevo producto',
        to: '/productos',
      },
      {
        icon: ShoppingCart,
        label: 'Nueva compra',
        to: '/compras',
      },
      {
        icon: Boxes,
        label: 'Nuevo movimiento',
        to: '/inventario',
      },
      {
        disabled: caja.existe,
        icon: Wallet,
        label: 'Abrir caja',
        reason: 'Ya hay una caja abierta',
        to: '/caja',
      },
      {
        icon: Users,
        label: 'Gestionar usuarios',
        to: '/usuarios',
      },
    ],
    [caja.existe],
  )

  const inventoryChartData = useMemo(() => buildInventoryChartData(movimientos), [movimientos])
  const criticalStock = stockBajo.slice(0, 5)
  const movementSummary = useMemo(() => {
    const totals = movimientos.reduce((acc, movimiento) => {
      const key = movimiento.tipo_movimiento || 'movimiento'
      acc[key] = (acc[key] || 0) + Math.abs(Number(movimiento.cantidad || 0))
      return acc
    }, {})

    return Object.entries(totals).map(([tipo, value]) => ({
      name: getMovimientoLabel(tipo),
      value,
      color: getMovimientoColor(tipo),
    }))
  }, [movimientos])

  if (isLoading) {
    return (
      <section className="dashboard2-page">
        <div className="dashboard2-loading dashboard2-panel">
          <RefreshCw size={26} />
          <div>
            <strong>Cargando Dashboard</strong>
            <span>Preparando indicadores comerciales y alertas del negocio.</span>
          </div>
        </div>
        <section className="dashboard2-kpi-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="dashboard2-skeleton" key={index} />
          ))}
        </section>
      </section>
    )
  }

  if (error) {
    return (
      <section className="dashboard2-page">
        <div className="dashboard2-error dashboard2-panel">
          <CircleX size={26} />
          <div>
            <strong>No se pudo cargar el dashboard</strong>
            <span>{error}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard2-page">
      <div className="dashboard2-hero">
        <div className="dashboard2-hero-copy">
          <div className="page-title-block">
            <span className="page-title-icon">
              <LayoutDashboard size={34} />
            </span>
            <div>
              <p className="eyebrow">Panel gerencial comercial</p>
              <h2>Dashboard</h2>
              <p>Ventas, pedidos, caja, inventario y compras en una vista ejecutiva para decidir rápido.</p>
            </div>
          </div>
        </div>
        <div className="dashboard2-hero-metric">
          <span>Ventas hoy</span>
          <strong>{formatMoney(ventasHoy)}</strong>
          <small>{formatNumber(resumen.total_pedidos_hoy)} pedidos registrados</small>
        </div>
      </div>

      <section className="dashboard2-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="dashboard2-quick-panel">
        <div className="dashboard2-section-heading">
          <div>
            <h3>Accesos rápidos</h3>
            <p>Atajos para operar el negocio sin buscar en el menú.</p>
          </div>
        </div>
        <div className="dashboard2-actions-grid">
          {quickActions.map((action) => (
            <QuickActionCard action={action} key={action.label} />
          ))}
        </div>
      </section>

      <section className="dashboard2-alert-grid">
        {alerts.length ? (
          alerts.map((alert) => {
            const Icon = alert.icon
            return (
              <article className={`dashboard2-alert dashboard2-alert-${alert.tone}`} key={alert.title}>
                <Icon size={18} />
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.text}</span>
                </div>
              </article>
            )
          })
        ) : (
          <article className="dashboard2-alert dashboard2-alert-success">
            <CircleCheck size={18} />
            <div>
              <strong>Operación estable</strong>
              <span>No hay alertas críticas visibles con los datos actuales.</span>
            </div>
          </article>
        )}
      </section>

      <section className="dashboard2-main-grid">
        {inventoryChartData.length ? (
          <Panel count={`${movimientos.length} recientes`} eyebrow="Inventario" title="Actividad de stock">
            <div className="dashboard2-chart dashboard2-chart-large">
              <ResponsiveContainer height={300} minHeight={300} minWidth={0} width="100%">
                <BarChart data={inventoryChartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="rgba(145, 158, 255, 0.12)" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tick={false} tickLine={false} />
                  <YAxis axisLine={false} tick={false} tickLine={false} width={36} />
                  <Tooltip
                    contentStyle={{
                      background: '#0b122d',
                      border: '1px solid rgba(145, 158, 255, 0.2)',
                      borderRadius: 8,
                      color: '#ffffff',
                    }}
                    formatter={(value) => [formatNumber(value), 'Cantidad']}
                  />
                  <Bar dataKey="cantidad" isAnimationActive={false} radius={[8, 8, 0, 0]}>
                    {inventoryChartData.map((entry) => (
                      <Cell fill={getMovimientoColor(entry.tipo)} key={`${entry.tipo}-${entry.cantidad}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ) : null}

        {movementSummary.length ? (
          <Panel count={`${movementSummary.length} tipos`} eyebrow="Operación" title="Composición de movimientos">
            <div className="dashboard2-pie-wrap">
              <ResponsiveContainer height={300} minHeight={300} minWidth={0} width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={movementSummary}
                    dataKey="value"
                    innerRadius={62}
                    isAnimationActive={false}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {movementSummary.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0b122d',
                      border: '1px solid rgba(145, 158, 255, 0.2)',
                      borderRadius: 8,
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard2-legend">
                {movementSummary.map((item) => (
                  <span key={item.name}>
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        ) : null}
      </section>

      <section className="dashboard2-ranking-grid">
        <Panel count={`${criticalStock.length} críticos`} eyebrow="Inventario" title="Productos con stock crítico">
          {criticalStock.length ? (
            <div className="dashboard2-critical-list">
              {criticalStock.map((producto) => (
                <div className="dashboard2-critical-row" key={producto.id || producto.nombre}>
                  <div>
                    <strong>{producto.nombre}</strong>
                    <span>Stock recomendado mínimo: {formatNumber(producto.punto_reposicion)}</span>
                  </div>
                  <em>{formatNumber(producto.stock_actual)}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard2-empty">
              <CircleCheck size={22} />
              <strong>Stock saludable</strong>
              <span>No hay productos por debajo del stock recomendado mínimo.</span>
            </div>
          )}
        </Panel>

        <Panel count={`${movimientos.length} recientes`} eyebrow="Inventario" title="Últimos movimientos">
          <div className="dashboard2-movement-list">
            {movimientos.slice(0, 6).map((movimiento) => (
              <div className="dashboard2-movement-row" key={movimiento.id}>
                <i style={{ background: getMovimientoColor(movimiento.tipo_movimiento) }} />
                <div>
                  <strong>{movimiento.producto || movimiento.producto_nombre || 'Producto'}</strong>
                  <span>{getMovimientoLabel(movimiento.tipo_movimiento)} - {formatDate(movimiento.fecha)}</span>
                </div>
                <em>{formatNumber(movimiento.cantidad)}</em>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </section>
  )
}

export default Dashboard





