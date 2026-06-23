import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  LockKeyhole,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  UnlockKeyhole,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import StatusBadge from '../components/common/StatusBadge'
import {
  abrirCaja,
  cerrarCaja,
  crearMovimientoCaja,
  getCajas,
  getMovimientosCaja,
} from '../services/cajaService'
import ContextHelp from '../components/common/ContextHelp'
import { cashHelp } from '../utils/helpText'
import { formatCurrency as formatMoney, formatTime } from '../utils/formatters'

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
      ? [{ id: sucursal.id, nombre: sucursal.nombre || 'Sucursal principal' }]
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
    return 'No tenés permisos para gestionar caja.'
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
      const labels = {
        saldo_final: 'Saldo final',
        saldo_inicial: 'Saldo inicial',
        sucursal: 'Sucursal',
        monto: 'Monto',
        descripcion: 'Concepto',
      }
      return `${labels[field] || 'Dato'}: ${text}`
    })
    .join(' ')
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

function getMovimientoLabel(tipo) {
  const labels = {
    ingreso: 'Ingreso',
    egreso: 'Egreso',
    ajuste: 'Ajuste',
  }

  return labels[tipo] || 'Movimiento'
}

function getMovimientoSign(tipo) {
  return tipo === 'egreso' ? '-' : '+'
}

function getSaldoActual(caja, movimientos) {
  if (!caja) {
    return 0
  }

  return movimientos.reduce((total, movimiento) => {
    const monto = Number(movimiento.monto || 0)
    if (movimiento.tipo === 'egreso') {
      return total - monto
    }
    return total + monto
  }, Number(caja.saldo_inicial || 0))
}

function buildChartData(movimientos) {
  const buckets = movimientos
    .filter((movimiento) => isToday(movimiento.fecha))
    .reduce((acc, movimiento) => {
      const label = formatTime(movimiento.fecha)
      const current = acc.get(label) || { label, ingresos: 0, egresos: 0 }
      if (movimiento.tipo === 'egreso') {
        current.egresos += Number(movimiento.monto || 0)
      } else if (movimiento.tipo === 'ingreso') {
        current.ingresos += Number(movimiento.monto || 0)
      }
      acc.set(label, current)
      return acc
    }, new Map())

  return Array.from(buckets.values()).slice(-8)
}

function CajaKpiCard({ accent, icon: Icon, label, value, helper }) {
  return (
    <article className={`cash-kpi-card cash-kpi-${accent}`}>
      <span className="cash-kpi-icon">
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

function CajaModal({ children, eyebrow, isOpen, onClose, title }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function AbrirCajaForm({ isSubmitting, onCancel, onSubmit, sucursales }) {
  const [values, setValues] = useState({
    sucursal: sucursales[0]?.id || '',
    saldo_inicial: '',
    observacion: '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const saldo = Number(values.saldo_inicial)

    if (!values.sucursal) {
      nextErrors.sucursal = 'Elegí una sucursal para abrir caja.'
    }
    if (values.saldo_inicial === '' || Number.isNaN(saldo) || saldo < 0) {
      nextErrors.saldo_inicial = 'Ingresá un saldo inicial válido.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      return
    }

    onSubmit({
      sucursal: Number(values.sucursal),
      saldo_inicial: values.saldo_inicial,
    })
  }

  return (
    <form className="entity-form cash-form" onSubmit={handleSubmit}>
      <ContextHelp item={cashHelp.abrir} />

      <div className="form-grid form-grid-single">
        <label>
          Sucursal
          <select name="sucursal" onChange={handleChange} value={values.sucursal}>
            <option value="">Elegir sucursal</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          {errors.sucursal ? <small>{errors.sucursal}</small> : null}
        </label>

        <label>
          Saldo inicial
          <input
            min="0"
            name="saldo_inicial"
            onChange={handleChange}
            placeholder="0,00"
            step="0.01"
            type="number"
            value={values.saldo_inicial}
          />
          {errors.saldo_inicial ? <small>{errors.saldo_inicial}</small> : null}
        </label>

        <label>
          Observación opcional
          <textarea
            name="observacion"
            onChange={handleChange}
            placeholder="Ej: apertura de turno mañana"
            rows="3"
            value={values.observacion}
          />
        </label>
      </div>

      <div className="cash-form-note">
        La observación queda en pantalla como ayuda operativa; el backend actual de Caja no guarda ese campo.
      </div>

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </div>
    </form>
  )
}

function MovimientoCajaForm({ isSubmitting, onCancel, onSubmit, tipo }) {
  const [values, setValues] = useState({ monto: '', descripcion: '' })
  const [errors, setErrors] = useState({})
  const isIngreso = tipo === 'ingreso'

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const monto = Number(values.monto)

    if (values.monto === '' || Number.isNaN(monto) || monto <= 0) {
      nextErrors.monto = 'El monto tiene que ser mayor que cero.'
    }
    if (!values.descripcion.trim()) {
      nextErrors.descripcion = 'Escribí un concepto simple.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      return
    }

    onSubmit({
      tipo,
      monto: values.monto,
      descripcion: values.descripcion.trim(),
    })
  }

  return (
    <form className="entity-form cash-form" onSubmit={handleSubmit}>
      <ContextHelp item={isIngreso ? cashHelp.ingreso : cashHelp.egreso} />

      <div className="form-grid form-grid-single">
        <label>
          Monto
          <input
            min="0.01"
            name="monto"
            onChange={handleChange}
            placeholder="0,00"
            step="0.01"
            type="number"
            value={values.monto}
          />
          {errors.monto ? <small>{errors.monto}</small> : null}
        </label>

        <label>
          Motivo o concepto
          <textarea
            name="descripcion"
            onChange={handleChange}
            placeholder={isIngreso ? 'Ej: venta en efectivo' : 'Ej: compra menor'}
            rows="3"
            value={values.descripcion}
          />
          {errors.descripcion ? <small>{errors.descripcion}</small> : null}
        </label>
      </div>

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Guardando...' : isIngreso ? 'Registrar ingreso' : 'Registrar egreso'}
        </button>
      </div>
    </form>
  )
}

function CerrarCajaForm({ caja, esperado, isSubmitting, onCancel, onSubmit }) {
  const [values, setValues] = useState({ saldo_final: '', observacion: '' })
  const [errors, setErrors] = useState({})
  const saldoFinal = Number(values.saldo_final || 0)
  const diferencia = values.saldo_final === '' ? 0 : saldoFinal - esperado

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const saldo = Number(values.saldo_final)

    if (values.saldo_final === '' || Number.isNaN(saldo) || saldo < 0) {
      nextErrors.saldo_final = 'Ingresá el saldo contado al cierre.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      return
    }

    onSubmit({
      id: caja.id,
      saldo_final: values.saldo_final,
      estado: 'cerrada',
    })
  }

  return (
    <form className="entity-form cash-form" onSubmit={handleSubmit}>
      <ContextHelp item={cashHelp.cerrar} />

      <div className="cash-close-summary">
        <span>Esperado por sistema</span>
        <strong>{formatMoney(esperado)}</strong>
        <small className={diferencia < 0 ? 'cash-negative' : 'cash-positive'}>
          Diferencia: {formatMoney(diferencia)}
        </small>
      </div>

      <div className="form-grid form-grid-single">
        <label>
          Saldo final contado
          <input
            min="0"
            name="saldo_final"
            onChange={handleChange}
            placeholder="0,00"
            step="0.01"
            type="number"
            value={values.saldo_final}
          />
          {errors.saldo_final ? <small>{errors.saldo_final}</small> : null}
        </label>

        <label>
          Observación
          <textarea
            name="observacion"
            onChange={handleChange}
            placeholder="Ej: diferencia por vuelto pendiente"
            rows="3"
            value={values.observacion}
          />
        </label>
      </div>

      <div className="cash-form-note">
        La observación no se envía porque el backend actual de Caja no incluye ese campo.
      </div>

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Cerrando...' : 'Cerrar caja'}
        </button>
      </div>
    </form>
  )
}

function Caja() {
  const [cajas, setCajas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [sucursales] = useState(() => getStoredSucursales())

  const cajaAbierta = useMemo(
    () => cajas.find((caja) => caja.estado === 'abierta') || null,
    [cajas],
  )

  const movimientosCaja = useMemo(() => {
    if (!cajaAbierta) {
      return movimientos
    }
    return movimientos.filter((movimiento) => movimiento.caja_session === cajaAbierta.id)
  }, [cajaAbierta, movimientos])

  const ingresosHoy = useMemo(
    () =>
      movimientosCaja
        .filter((movimiento) => movimiento.tipo === 'ingreso' && isToday(movimiento.fecha))
        .reduce((total, movimiento) => total + Number(movimiento.monto || 0), 0),
    [movimientosCaja],
  )

  const egresosHoy = useMemo(
    () =>
      movimientosCaja
        .filter((movimiento) => movimiento.tipo === 'egreso' && isToday(movimiento.fecha))
        .reduce((total, movimiento) => total + Number(movimiento.monto || 0), 0),
    [movimientosCaja],
  )

  const saldoActual = useMemo(
    () => getSaldoActual(cajaAbierta, movimientosCaja),
    [cajaAbierta, movimientosCaja],
  )
  const diferencia = ingresosHoy - egresosHoy
  const chartData = useMemo(() => buildChartData(movimientosCaja), [movimientosCaja])
  const ultimosMovimientos = movimientosCaja.slice(0, 8)

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const cajasResponse = await getCajas()
      const nextCajas = normalizeList(cajasResponse.data)
      const abierta = nextCajas.find((caja) => caja.estado === 'abierta') || null

      let nextMovimientos = []
      if (abierta) {
        const movimientosResponse = await getMovimientosCaja({ caja_session: abierta.id })
        nextMovimientos = normalizeList(movimientosResponse.data)
      }

      setCajas(nextCajas)
      setMovimientos(nextMovimientos)
    } catch (requestError) {
      setCajas([])
      setMovimientos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAbrirCaja(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await abrirCaja(data)
      setSuccess('Caja abierta. Ya podés registrar movimientos.')
      setActiveModal(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMovimiento(data) {
    if (!cajaAbierta) {
      setError('No hay caja abierta. Abrí una caja para registrar movimientos.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await crearMovimientoCaja({ ...data, caja_session: cajaAbierta.id })
      setSuccess(data.tipo === 'ingreso' ? 'Ingreso registrado.' : 'Egreso registrado.')
      setActiveModal(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCerrarCaja(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await cerrarCaja(data.id, {
        estado: data.estado,
        saldo_final: data.saldo_final,
      })
      setSuccess('Caja cerrada correctamente.')
      setActiveModal(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canRegisterMovement = Boolean(cajaAbierta)

  return (
    <section className="cash-page">
      <div className="cash-hero">
        <div className="cash-title-block">
          <span className="cash-title-icon">
            <Wallet size={32} />
          </span>
          <div>
            <h2>Caja</h2>
            <p>Control de ingresos, egresos y cierre del turno</p>
          </div>
        </div>
        <StatusBadge
          className={cajaAbierta ? 'cash-status-open' : 'cash-status-closed'}
          label={cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
          value={cajaAbierta ? 'abierta' : 'cerrada'}
        />
      </div>

      {success && !error ? <div className="purchase-feedback purchase-feedback-success">{success}</div> : null}
      {error ? <div className="purchase-feedback purchase-feedback-error">{error}</div> : null}

      {!cajaAbierta && !isLoading ? (
        <div className="cash-empty-alert">
          <Banknote size={22} />
          <span>No hay caja abierta. Abrí una caja para registrar movimientos.</span>
        </div>
      ) : null}

      <section className="cash-kpi-grid">
        <CajaKpiCard
          accent="balance"
          helper={cajaAbierta ? cajaAbierta.sucursal_nombre || 'Turno activo' : 'Sin turno abierto'}
          icon={Wallet}
          label="Saldo actual"
          value={isLoading ? '...' : formatMoney(saldoActual)}
        />
        <CajaKpiCard
          accent="income"
          helper="Entradas registradas hoy"
          icon={ArrowUpRight}
          label="Ingresos hoy"
          value={isLoading ? '...' : formatMoney(ingresosHoy)}
        />
        <CajaKpiCard
          accent="expense"
          helper="Salidas registradas hoy"
          icon={ArrowDownLeft}
          label="Egresos hoy"
          value={isLoading ? '...' : formatMoney(egresosHoy)}
        />
        <CajaKpiCard
          accent="diff"
          helper="Ingresos menos egresos"
          icon={CheckCircle2}
          label="Diferencia"
          value={isLoading ? '...' : formatMoney(diferencia)}
        />
      </section>

      <section className="cash-dashboard-grid">
        <article className="cash-chart-panel">
          <div className="cash-card-heading">
            <div>
              <p className="eyebrow">Flujo del turno</p>
              <h3>Ingresos vs Egresos</h3>
            </div>
            <span>{movimientosCaja.length ? 'Datos reales' : 'Sin actividad'}</span>
          </div>

          <div className="cash-chart">
            {isLoading ? (
              <div className="cash-loading">
                <RefreshCw size={22} />
                Cargando caja...
              </div>
            ) : (
              <ResponsiveContainer height={310} minHeight={310} minWidth={0} width="100%">
                <AreaChart data={chartData || []} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="cashIncome" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#19d395" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#19d395" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cashExpense" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#ff6384" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#ff6384" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(145, 158, 255, 0.12)" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tick={false} tickLine={false} />
                  <YAxis axisLine={false} tick={false} tickFormatter={(value) => `$${value / 1000}k`} tickLine={false} width={48} />
                  <Tooltip
                    contentStyle={{
                      background: '#0b122d',
                      border: '1px solid rgba(145, 158, 255, 0.18)',
                      borderRadius: 8,
                      color: '#ffffff',
                    }}
                    formatter={(value, name) => [
                      formatMoney(value),
                      name === 'ingresos' ? 'Ingresos' : 'Egresos',
                    ]}
                  />
                  <Area dataKey="ingresos" fill="url(#cashIncome)" isAnimationActive={false} stroke="#19d395" strokeWidth={3} type="monotone" />
                  <Area dataKey="egresos" fill="url(#cashExpense)" isAnimationActive={false} stroke="#ff6384" strokeWidth={3} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <aside className="cash-actions-panel">
          <div className="cash-card-heading">
            <div>
              <p className="eyebrow">Acciones rápidas</p>
              <h3>Operar caja</h3>
            </div>
          </div>
          <button
            className="cash-action-button cash-action-income"
            disabled={!canRegisterMovement}
            onClick={() => setActiveModal('ingreso')}
            type="button"
          >
            <PlusCircle size={19} />
            Registrar ingreso
          </button>
          <button
            className="cash-action-button cash-action-expense"
            disabled={!canRegisterMovement}
            onClick={() => setActiveModal('egreso')}
            type="button"
          >
            <MinusCircle size={19} />
            Registrar egreso
          </button>
          <button
            className="cash-action-button"
            disabled={Boolean(cajaAbierta) || !sucursales.length}
            onClick={() => setActiveModal('abrir')}
            type="button"
          >
            <UnlockKeyhole size={19} />
            Abrir caja
          </button>
          <button
            className="cash-action-button cash-action-close"
            disabled={!cajaAbierta}
            onClick={() => setActiveModal('cerrar')}
            type="button"
          >
            <LockKeyhole size={19} />
            Cerrar caja
          </button>
          <ContextHelp
            className="context-help-compact"
            items={[cashHelp.abrir, cashHelp.cerrar, cashHelp.ingreso, cashHelp.egreso]}
          />
          {!sucursales.length ? (
            <p className="cash-action-help">Tu usuario no tiene una sucursal principal configurada.</p>
          ) : null}
        </aside>
      </section>

      <section className="cash-movements-panel">
        <div className="cash-card-heading">
          <div>
            <p className="eyebrow">Actividad reciente</p>
            <h3>Últimos movimientos</h3>
          </div>
          <span>{ultimosMovimientos.length} movimientos</span>
        </div>

        {isLoading ? (
          <div className="cash-movement-empty">Cargando movimientos...</div>
        ) : ultimosMovimientos.length ? (
          <div className="cash-movement-list">
            <div className="cash-movement-head">
              <span>Hora</span>
              <span>Tipo</span>
              <span>Concepto</span>
              <span>Monto</span>
              <span>Usuario</span>
            </div>
            {ultimosMovimientos.map((movimiento) => (
              <div className="cash-movement-row" key={movimiento.id}>
                <span>{formatTime(movimiento.fecha)}</span>
                <span className={`cash-type-badge cash-type-${movimiento.tipo}`}>
                  {getMovimientoLabel(movimiento.tipo)}
                </span>
                <strong>{movimiento.descripcion || 'Movimiento de caja'}</strong>
                <span className={movimiento.tipo === 'egreso' ? 'cash-negative' : 'cash-positive'}>
                  {getMovimientoSign(movimiento.tipo)}
                  {formatMoney(movimiento.monto)}
                </span>
                <span>{movimiento.usuario_username || '-'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="cash-movement-empty">Todavía no hay movimientos en esta caja.</div>
        )}
      </section>

      <CajaModal
        eyebrow="Apertura"
        isOpen={activeModal === 'abrir'}
        onClose={() => setActiveModal(null)}
        title="Abrir caja"
      >
        <AbrirCajaForm
          isSubmitting={isSubmitting}
          onCancel={() => setActiveModal(null)}
          onSubmit={handleAbrirCaja}
          sucursales={sucursales}
        />
      </CajaModal>

      <CajaModal
        eyebrow={activeModal === 'ingreso' ? 'Entrada de dinero' : 'Salida de dinero'}
        isOpen={activeModal === 'ingreso' || activeModal === 'egreso'}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
      >
        <MovimientoCajaForm
          isSubmitting={isSubmitting}
          onCancel={() => setActiveModal(null)}
          onSubmit={handleMovimiento}
          tipo={activeModal === 'egreso' ? 'egreso' : 'ingreso'}
        />
      </CajaModal>

      <CajaModal
        eyebrow="Cierre"
        isOpen={activeModal === 'cerrar'}
        onClose={() => setActiveModal(null)}
        title="Cerrar caja"
      >
        <CerrarCajaForm
          caja={cajaAbierta}
          esperado={saldoActual}
          isSubmitting={isSubmitting}
          onCancel={() => setActiveModal(null)}
          onSubmit={handleCerrarCaja}
        />
      </CajaModal>
    </section>
  )
}

export default Caja




