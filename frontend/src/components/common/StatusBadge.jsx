import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Route,
  Settings2,
  ShieldCheck,
  Truck,
  Wallet,
  XCircle,
} from 'lucide-react'

const statusPresentation = {
  abierto: { icon: Wallet, label: 'Abierta', tone: 'success' },
  abierta: { icon: Wallet, label: 'Abierta', tone: 'success' },
  activo: { icon: CheckCircle2, label: 'Activo', tone: 'success' },
  agotado: { icon: AlertTriangle, label: 'Agotado', tone: 'warning' },
  aprobado: { icon: CheckCircle2, label: 'Aprobado', tone: 'success' },
  aprobada: { icon: CheckCircle2, label: 'Aprobada', tone: 'success' },
  ajuste: { icon: Settings2, label: 'Ajuste', tone: 'neutral' },
  autom: { icon: RefreshCw, label: 'Automático', tone: 'info' },
  automatico: { icon: RefreshCw, label: 'Automático', tone: 'info' },
  cancelado: { icon: Ban, label: 'Cancelado', tone: 'danger' },
  cerrada: { icon: ShieldCheck, label: 'Cerrada', tone: 'neutral' },
  desperdicio: { icon: AlertTriangle, label: 'Desperdicio', tone: 'orange' },
  devolucion: { icon: ArrowUpCircle, label: 'Devolución', tone: 'success' },
  egreso: { icon: ArrowDownCircle, label: 'Egreso', tone: 'danger' },
  en_camino: { icon: Truck, label: 'En camino', tone: 'info' },
  en_preparacion: { icon: Clock3, label: 'En preparación', tone: 'info' },
  entrada: { icon: ArrowUpCircle, label: 'Entrada', tone: 'success' },
  entregado: { icon: PackageCheck, label: 'Entregado', tone: 'info' },
  finalizado: { icon: CheckCircle2, label: 'Finalizado', tone: 'success' },
  inactivo: { icon: Ban, label: 'Inactivo', tone: 'neutral' },
  ingreso: { icon: ArrowUpCircle, label: 'Ingreso', tone: 'success' },
  listo: { icon: CheckCircle2, label: 'Listo', tone: 'success' },
  manual: { icon: Settings2, label: 'Manual', tone: 'neutral' },
  merma: { icon: AlertTriangle, label: 'Producto perdido', tone: 'orange' },
  pendiente: { icon: Clock3, label: 'Pendiente', tone: 'warning' },
  recibida: { icon: PackageCheck, label: 'Recibida', tone: 'success' },
  rechazado: { icon: XCircle, label: 'Rechazado', tone: 'danger' },
  rechazada: { icon: XCircle, label: 'Rechazada', tone: 'danger' },
  reintegrado: { icon: Route, label: 'Reintegrado', tone: 'info' },
  salida: { icon: ArrowDownCircle, label: 'Salida', tone: 'danger' },
  suspendido: { icon: Ban, label: 'Suspendido', tone: 'danger' },
  vacaciones: { icon: Clock3, label: 'Vacaciones', tone: 'info' },
  vencimiento: { icon: AlertTriangle, label: 'Vencimiento', tone: 'violet' },
}

function humanize(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StatusBadge({ className = '', label, tone, value }) {
  const key = String(value || label || '').toLowerCase()
  const presentation = statusPresentation[key] || {}
  const Icon = presentation.icon || CheckCircle2
  const displayLabel = label || presentation.label || humanize(value)
  const resolvedTone = tone || presentation.tone || 'neutral'

  return (
    <span
      className={[
        'status-badge-common',
        'status-badge-pro',
        `status-badge-${resolvedTone}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon size={13} />
      {displayLabel}
    </span>
  )
}

export default StatusBadge





