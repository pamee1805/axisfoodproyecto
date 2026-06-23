import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  PackageX,
  Plus,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'

import { useAuth } from '../auth/useAuth'
import MermaModal from '../components/mermas/MermaModal'
import {
  createMermaMovimiento,
  getInventarioMovimientos,
  getProductos,
} from '../services/mermasService'
import { formatCurrency as formatMoney, formatDateTime as formatDate, formatNumber } from '../utils/formatters'

const lossTypes = ['merma', 'desperdicio', 'vencimiento']
const smartAlertThreshold = 5
const typeLabels = {
  merma: 'Producto perdido',
  desperdicio: 'Desperdicio',
  vencimiento: 'Vencimiento',
  ajuste: 'Ajuste negativo',
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

function getSucursalPrincipalFromUser(user) {
  return user?.sucursal_principal?.id
    ? {
        id: user.sucursal_principal.id,
        nombre: user.sucursal_principal.nombre || 'Sucursal principal',
      }
    : null
}

function getStoredSucursalPrincipal() {
  try {
    const user = JSON.parse(localStorage.getItem('axisfood_user')) || null
    return getSucursalPrincipalFromUser(user)
  } catch {
    return null
  }
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  }

  if (error.response?.status === 403) {
    return 'No tenés permisos para gestionar mermas.'
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

  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
      return `${field}: ${text}`
    })
    .join(' ')
}

function formatQuantity(value) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 3,
  }).format(Number(value || 0))
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

function isPreviousMonth(value) {
  const date = new Date(value)
  const today = new Date()
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === previous.getFullYear() &&
    date.getMonth() === previous.getMonth()
  )
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

function isThisWeek(value) {
  const date = new Date(value)
  const today = new Date()

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return date >= start && date < end
}

function getMovementCost(movimiento) {
  const costoTotal = Number(movimiento.costo_total || 0)
  if (costoTotal) {
    return Math.abs(costoTotal)
  }

  return Math.abs(Number(movimiento.cantidad || 0) * Number(movimiento.costo_unitario || 0))
}

function getMovementQuantity(movimiento) {
  return Math.abs(Number(movimiento.cantidad || 0))
}

function buildProductRanking(movimientos) {
  const map = movimientos.reduce((acc, movimiento) => {
    const key = movimiento.producto || movimiento.producto_nombre || 'sin-producto'
    const current = acc.get(key) || {
      producto: movimiento.producto_nombre || 'Producto',
      cantidad: 0,
      costo: 0,
      eventos: 0,
    }

    current.cantidad += getMovementQuantity(movimiento)
    current.costo += getMovementCost(movimiento)
    current.eventos += 1
    acc.set(key, current)
    return acc
  }, new Map())

  return Array.from(map.values()).sort((a, b) => b.costo - a.costo)
}

function buildReasonRanking(movimientos) {
  const totalEvents = movimientos.length || 1
  const map = movimientos.reduce((acc, movimiento) => {
    const motivo = movimiento.motivo?.trim() || 'Sin motivo informado'
    const current = acc.get(motivo) || { motivo, eventos: 0 }

    current.eventos += 1
    acc.set(motivo, current)
    return acc
  }, new Map())

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      porcentaje: (item.eventos / totalEvents) * 100,
    }))
    .sort((a, b) => b.eventos - a.eventos)
}

function buildBranchRanking(movimientos) {
  const map = movimientos.reduce((acc, movimiento) => {
    const sucursal = movimiento.sucursal_nombre || movimiento.sucursal || 'Sin sucursal'
    const current = acc.get(sucursal) || { sucursal, eventos: 0, costo: 0 }

    current.eventos += 1
    current.costo += getMovementCost(movimiento)
    acc.set(sucursal, current)
    return acc
  }, new Map())

  return Array.from(map.values()).sort((a, b) => b.costo - a.costo)
}

function buildTypeSummary(movimientos, ajustesNegativos) {
  return [...lossTypes, 'ajuste'].map((tipo) => {
    const source = tipo === 'ajuste'
      ? ajustesNegativos
      : movimientos.filter((movimiento) => movimiento.tipo_movimiento === tipo)

    return {
      tipo,
      label: typeLabels[tipo],
      eventos: source.length,
      costo: source.reduce((total, movimiento) => total + getMovementCost(movimiento), 0),
    }
  })
}

function buildSmartAlerts({
  currentMonthCost,
  previousMonthCost,
  productRanking,
  typeSummary,
  weeklyEvents,
}) {
  const alerts = []
  const topProduct = productRanking[0]
  const dominantType = typeSummary
    .filter((item) => lossTypes.includes(item.tipo))
    .sort((a, b) => b.costo - a.costo)[0]
  const recurrentProduct = productRanking.find((item) => item.eventos >= 3)

  if (topProduct) {
    alerts.push(`Producto con mayor pérdida: ${topProduct.producto} (${formatMoney(topProduct.costo)}).`)
  }

  if (dominantType?.costo > 0) {
    alerts.push(`Tipo de pérdida dominante: ${dominantType.label}.`)
  }

  if (weeklyEvents > smartAlertThreshold) {
    alerts.push(`Más de ${smartAlertThreshold} eventos esta semana: ${weeklyEvents} registros.`)
  }

  if (recurrentProduct) {
    alerts.push(`Producto reincidente: ${recurrentProduct.producto} acumula ${recurrentProduct.eventos} eventos.`)
  }

  if (previousMonthCost > 0 && currentMonthCost > previousMonthCost) {
    const increase = ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100
    alerts.push(`Incremento de pérdidas respecto al período anterior: ${formatNumber(increase)}%.`)
  }

  return alerts
}

function buildExecutiveSummary({ currentMonthEvents, productRanking, totalCost, typeSummary }) {
  if (!currentMonthEvents || !productRanking.length || !totalCost) {
    return 'No se registraron pérdidas en el período analizado.'
  }

  const dominantType = typeSummary
    .filter((item) => lossTypes.includes(item.tipo))
    .sort((a, b) => b.costo - a.costo)[0]
  const topProduct = productRanking[0]
  const share = totalCost ? (topProduct.costo / totalCost) * 100 : 0

  return `La mayor pérdida proviene de ${dominantType?.label.toLowerCase() || 'pérdidas operativas'}. ${topProduct.producto} representa el ${formatNumber(share)}% del costo perdido. Se registraron ${currentMonthEvents} eventos este mes.`
}

function KpiCard({ helper, icon: Icon, label, tone, value }) {
  return (
    <article className={`mermas-kpi-card mermas-kpi-${tone}`}>
      <span className="mermas-kpi-icon">
        <Icon size={21} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  )
}

function Mermas() {
  const { accessToken, isAuthReady, user } = useAuth()
  const [movimientosMerma, setMovimientosMerma] = useState([])
  const [ajustesNegativos, setAjustesNegativos] = useState([])
  const [productos, setProductos] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const sucursalPrincipal = useMemo(
    () => getSucursalPrincipalFromUser(user) || getStoredSucursalPrincipal(),
    [user],
  )
  const defaultSucursalId = sucursalPrincipal?.id || ''

  const movimientosMes = useMemo(
    () => movimientosMerma.filter((movimiento) => isThisMonth(movimiento.fecha)),
    [movimientosMerma],
  )
  const movimientosHoy = useMemo(
    () => movimientosMerma.filter((movimiento) => isToday(movimiento.fecha)),
    [movimientosMerma],
  )
  const previousMonthMovimientos = useMemo(
    () => movimientosMerma.filter((movimiento) => isPreviousMonth(movimiento.fecha)),
    [movimientosMerma],
  )
  const ajustesNegativosMes = useMemo(
    () => ajustesNegativos.filter((movimiento) => isThisMonth(movimiento.fecha)),
    [ajustesNegativos],
  )
  const productRanking = useMemo(() => buildProductRanking(movimientosMes), [movimientosMes])
  const reasonRanking = useMemo(() => buildReasonRanking(movimientosMes), [movimientosMes])
  const branchRanking = useMemo(() => buildBranchRanking(movimientosMes), [movimientosMes])
  const typeSummary = useMemo(
    () => buildTypeSummary(movimientosMes, ajustesNegativosMes),
    [ajustesNegativosMes, movimientosMes],
  )

  const stats = useMemo(() => {
    const totalCost = movimientosMes.reduce((total, movimiento) => total + getMovementCost(movimiento), 0)
    const todayCost = movimientosHoy.reduce((total, movimiento) => total + getMovementCost(movimiento), 0)
    const productosAfectados = new Set(movimientosMes.map((movimiento) => movimiento.producto)).size
    const desperdicios = movimientosMes
      .filter((movimiento) => movimiento.tipo_movimiento === 'desperdicio')
      .reduce((total, movimiento) => total + getMovementCost(movimiento), 0)
    const vencimientos = movimientosMes
      .filter((movimiento) => movimiento.tipo_movimiento === 'vencimiento')
      .reduce((total, movimiento) => total + getMovementCost(movimiento), 0)
    const ajustes = ajustesNegativosMes.reduce((total, movimiento) => total + getMovementCost(movimiento), 0)

    return {
      totalCost,
      todayCost,
      events: movimientosMes.length,
      productosAfectados,
      desperdicios,
      vencimientos,
      ajustes,
    }
  }, [ajustesNegativosMes, movimientosHoy, movimientosMes])

  const previousMonthCost = useMemo(
    () => previousMonthMovimientos.reduce((total, movimiento) => total + getMovementCost(movimiento), 0),
    [previousMonthMovimientos],
  )
  const weeklyEvents = useMemo(
    () => movimientosMerma.filter((movimiento) => isThisWeek(movimiento.fecha)).length,
    [movimientosMerma],
  )
  const smartAlerts = useMemo(
    () =>
      buildSmartAlerts({
        currentMonthCost: stats.totalCost,
        previousMonthCost,
        productRanking,
        typeSummary,
        weeklyEvents,
      }),
    [previousMonthCost, productRanking, stats.totalCost, typeSummary, weeklyEvents],
  )
  const executiveSummary = useMemo(
    () =>
      buildExecutiveSummary({
        currentMonthEvents: stats.events,
        productRanking,
        totalCost: stats.totalCost,
        typeSummary,
      }),
    [productRanking, stats.events, stats.totalCost, typeSummary],
  )
  const hasLosses = movimientosMes.length > 0

  const loadData = useCallback(async () => {
    if (!isAuthReady) {
      setIsLoading(true)
      return
    }

    if (!accessToken) {
      setIsLoading(false)
      setError('Necesitás iniciar sesión para ver el control de mermas.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const [mermaResponse, desperdicioResponse, vencimientoResponse, ajusteResponse, productosResponse] =
        await Promise.all([
          getInventarioMovimientos({ tipo_movimiento: 'merma' }),
          getInventarioMovimientos({ tipo_movimiento: 'desperdicio' }),
          getInventarioMovimientos({ tipo_movimiento: 'vencimiento' }),
          getInventarioMovimientos({ tipo_movimiento: 'ajuste' }),
          getProductos({ estado: 'activo' }),
        ])

      const mermas = [
        ...normalizeList(mermaResponse.data),
        ...normalizeList(desperdicioResponse.data),
        ...normalizeList(vencimientoResponse.data),
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      const negativos = normalizeList(ajusteResponse.data)
        .filter((movimiento) => Number(movimiento.cantidad || 0) < 0)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      setMovimientosMerma(mermas)
      setAjustesNegativos(negativos)
      setProductos(normalizeList(productosResponse.data))
    } catch (requestError) {
      setMovimientosMerma([])
      setAjustesNegativos([])
      setProductos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, isAuthReady])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleSubmitMerma(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await createMermaMovimiento(data)
      setSuccess('Producto descartado registrado en inventario.')
      setModalOpen(false)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const kpis = [
    {
      helper: 'Pérdidas reales del mes',
      icon: TriangleAlert,
      label: 'Costo de pérdida del mes',
      tone: 'loss',
      value: formatMoney(stats.totalCost),
    },
    {
      helper: 'Impacto registrado hoy',
      icon: CalendarDays,
      label: 'Costo de pérdida de hoy',
      tone: 'events',
      value: formatMoney(stats.todayCost),
    },
    {
      helper: 'Productos perdidos, desperdicios y vencimientos',
      icon: CalendarDays,
      label: 'Eventos registrados',
      tone: 'events',
      value: stats.events,
    },
    {
      helper: 'Productos con pérdida',
      icon: PackageX,
      label: 'Productos afectados',
      tone: 'products',
      value: stats.productosAfectados,
    },
    {
      helper: 'Costo por preparación o manipulación',
      icon: TriangleAlert,
      label: 'Desperdicio acumulado',
      tone: 'waste',
      value: formatMoney(stats.desperdicios),
    },
    {
      helper: 'Producto fuera de fecha',
      icon: TriangleAlert,
      label: 'Vencimientos acumulados',
      tone: 'expired',
      value: formatMoney(stats.vencimientos),
    },
    {
      helper: 'Separados de la pérdida real',
      icon: TriangleAlert,
      label: 'Ajustes negativos',
      tone: 'adjust',
      value: formatMoney(stats.ajustes),
    },
  ]

  return (
    <section className="mermas-page notranslate" translate="no">
      <div className="mermas-hero">
        <div className="mermas-title-block">
          <span className="mermas-title-icon">
            <TriangleAlert size={32} />
          </span>
          <div>
            <h2>Pérdidas operativas</h2>
            <p>Detectá dónde se pierde dinero y priorizá acciones con impacto económico.</p>
          </div>
        </div>
        <button className="button button-primary mermas-primary-action" onClick={() => setModalOpen(true)} type="button">
          <Plus size={18} />
          Registrar pérdida
        </button>
      </div>

      <div className="mermas-info-alert">
        <TriangleAlert size={18} />
        <span>Solo se consideran pérdidas por descarte, desperdicio y vencimiento. Los ajustes negativos se muestran aparte.</span>
      </div>

      {success && !error ? <div className="purchase-feedback purchase-feedback-success">{success}</div> : null}
      {error ? <div className="purchase-feedback purchase-feedback-error">{error}</div> : null}
      {isLoading ? (
        <div className="purchase-feedback">
          <RefreshCw className="mermas-spin" size={18} />
          Cargando control de mermas...
        </div>
      ) : null}

      <section className="mermas-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      {!isLoading && !hasLosses ? (
        <section className="mermas-panel mermas-excellent-state">
          <strong>Excelente trabajo</strong>
          <span>No se registraron pérdidas en el período analizado.</span>
        </section>
      ) : null}

      <section className="mermas-executive-grid">
        <article className="mermas-panel mermas-executive-summary">
          <p className="eyebrow">Resumen ejecutivo</p>
          <h3>Donde estoy perdiendo dinero?</h3>
          <p>{executiveSummary}</p>
        </article>

        <article className="mermas-panel">
          <div className="mermas-card-heading">
            <div>
              <p className="eyebrow">Alertas de pérdidas</p>
              <h3>Prioridades operativas</h3>
            </div>
          </div>
          {smartAlerts.length ? (
            <div className="mermas-alert-list">
              {smartAlerts.map((alert) => (
                <div className="mermas-alert-item" key={alert}>
                  <TriangleAlert size={16} />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mermas-empty-state">
              <ShieldCheck size={24} />
              <strong>Sin alertas</strong>
              <span>No hay alertas relevantes.</span>
            </div>
          )}
        </article>
      </section>

      <section className="mermas-type-grid">
        {typeSummary.map((item) => (
          <article className={`mermas-panel mermas-type-card mermas-type-card-${item.tipo}`} key={item.tipo}>
            <span>{item.label}</span>
            <strong>{formatMoney(item.costo)}</strong>
            <small>{item.eventos} eventos</small>
          </article>
        ))}
      </section>

      <section className="mermas-ranking-grid">
        <article className="mermas-panel mermas-table-panel">
          <div className="mermas-card-heading">
            <div>
              <p className="eyebrow">Ranking principal</p>
              <h3>Top productos con más pérdida económica</h3>
            </div>
            <span>{productRanking.length} productos</span>
          </div>
          {productRanking.length ? (
            <div className="data-table-wrapper">
              <table className="data-table mermas-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Eventos</th>
                    <th>Cantidad perdida</th>
                    <th>Costo perdido</th>
                  </tr>
                </thead>
                <tbody>
                  {productRanking.map((item) => (
                    <tr key={item.producto}>
                      <td><strong>{item.producto}</strong></td>
                      <td className="table-cell-number">{item.eventos}</td>
                      <td className="table-cell-number">{formatQuantity(item.cantidad)}</td>
                      <td className="table-cell-money"><strong>{formatMoney(item.costo)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mermas-empty-state">Excelente trabajo. No se registraron pérdidas en el período analizado.</div>
          )}
        </article>

        <article className="mermas-panel mermas-table-panel">
          <div className="mermas-card-heading">
            <div>
              <p className="eyebrow">Ranking secundario</p>
              <h3>Motivos más frecuentes</h3>
            </div>
          </div>
          {reasonRanking.length ? (
            <div className="data-table-wrapper">
              <table className="data-table mermas-table">
                <thead>
                  <tr>
                    <th>Motivo</th>
                    <th>Eventos</th>
                    <th>Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonRanking.slice(0, 8).map((item) => (
                    <tr key={item.motivo}>
                      <td><strong>{item.motivo}</strong></td>
                      <td className="table-cell-number">{item.eventos}</td>
                      <td className="table-cell-number">{formatNumber(item.porcentaje)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mermas-empty-state">Sin motivos registrados.</div>
          )}
        </article>
      </section>

      <section className="mermas-panel mermas-table-panel">
        <div className="mermas-card-heading">
          <div>
            <p className="eyebrow">Pérdidas por sucursal</p>
            <h3>Sucursales con mayor costo perdido</h3>
          </div>
        </div>
        {branchRanking.length ? (
          <div className="data-table-wrapper">
            <table className="data-table mermas-table">
              <thead>
                <tr>
                  <th>Sucursal</th>
                  <th>Eventos</th>
                  <th>Costo perdido</th>
                </tr>
              </thead>
              <tbody>
                {branchRanking.map((item) => (
                  <tr key={item.sucursal}>
                    <td><strong>{item.sucursal}</strong></td>
                    <td className="table-cell-number">{item.eventos}</td>
                    <td className="table-cell-money"><strong>{formatMoney(item.costo)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mermas-empty-state">Sin pérdidas por sucursal.</div>
        )}
      </section>

      <section className="mermas-panel mermas-table-panel">
        <div className="mermas-card-heading">
          <div>
            <p className="eyebrow">Detalle operativo</p>
            <h3>Movimientos de pérdida y ajustes negativos</h3>
          </div>
          <span>{movimientosMerma.length + ajustesNegativos.length} movimientos</span>
        </div>

        {isLoading ? (
          <div className="mermas-empty-state">
            <RefreshCw className="mermas-spin" size={24} />
            Cargando control de mermas...
          </div>
        ) : movimientosMerma.length || ajustesNegativos.length ? (
          <div className="data-table-wrapper">
            <table className="data-table mermas-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Sucursal</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Costo total</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {[...movimientosMerma, ...ajustesNegativos]
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map((movimiento) => (
                    <tr key={`${movimiento.tipo_movimiento}-${movimiento.id}`}>
                      <td>{formatDate(movimiento.fecha)}</td>
                      <td><strong>{movimiento.producto_nombre || '-'}</strong></td>
                      <td>{movimiento.sucursal_nombre || movimiento.sucursal}</td>
                      <td>
                        <span className={`mermas-type-badge mermas-type-${movimiento.tipo_movimiento}`}>
                          {typeLabels[movimiento.tipo_movimiento] || movimiento.tipo_movimiento}
                        </span>
                      </td>
                      <td className="table-cell-number">{formatQuantity(getMovementQuantity(movimiento))}</td>
                      <td className="table-cell-money"><strong>{formatMoney(getMovementCost(movimiento))}</strong></td>
                      <td>{movimiento.motivo || '-'}</td>
                      <td>{movimiento.usuario_username || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mermas-empty-state">Excelente trabajo. No se registraron pérdidas en el período analizado.</div>
        )}
      </section>

      <MermaModal
        defaultSucursalId={defaultSucursalId}
        isOpen={modalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitMerma}
        productos={productos}
        sucursalPrincipal={sucursalPrincipal}
      />
    </section>
  )
}

export default Mermas




