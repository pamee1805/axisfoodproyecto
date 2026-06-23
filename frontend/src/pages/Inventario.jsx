import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'

import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import InventarioMovimientoModal from '../components/inventario/InventarioMovimientoModal'
import { tiposMovimiento } from '../constants/options'
import { getProductos } from '../services/productosService'
import {
  createMovimiento,
  deleteMovimiento,
  getMovimientos,
  updateMovimiento,
} from '../services/inventarioService'
import { formatCurrency as formatMoney, formatDateTime as formatDate } from '../utils/formatters'

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('axisfood_user')) || null
  } catch {
    return null
  }
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
    return 'No tenés permisos para gestionar inventario.'
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

function getTipoLabel(value) {
  return tiposMovimiento.find((tipo) => tipo.value === value)?.label || value
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function isMovimientoAutomatico(movimiento) {
  const motivo = normalizeText(movimiento.motivo)
  return (
    motivo.includes('entrada automatica por compra #') ||
    motivo.includes('salida automatica por pedido #')
  )
}

function getDefaultSucursalId() {
  const user = getStoredUser()
  return user?.sucursal_principal?.id || ''
}

function Inventario() {
  const [movimientos, setMovimientos] = useState([])
  const [productos, setProductos] = useState([])
  const [productoFilter, setProductoFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [sucursalFilter, setSucursalFilter] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState(null)

  const defaultSucursalId = useMemo(() => getDefaultSucursalId(), [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = {}
      if (productoFilter) {
        params.producto = productoFilter
      }
      if (tipoFilter) {
        params.tipo_movimiento = tipoFilter
      }
      if (sucursalFilter) {
        params.sucursal = sucursalFilter
      }

      const [movimientosResponse, productosResponse] = await Promise.all([
        getMovimientos(params),
        getProductos({ estado: 'activo' }),
      ])

      setMovimientos(normalizeList(movimientosResponse.data))
      setProductos(normalizeList(productosResponse.data))
    } catch (requestError) {
      setMovimientos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [productoFilter, tipoFilter, sucursalFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleNewMovimiento() {
    setEditingMovimiento(null)
    setModalOpen(true)
  }

  function handleEditMovimiento(movimiento) {
    setEditingMovimiento(movimiento)
    setModalOpen(true)
  }

  async function handleSubmitMovimiento(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingMovimiento) {
        await updateMovimiento(editingMovimiento.id, data)
        setSuccess('Movimiento actualizado.')
      } else {
        await createMovimiento(data)
        setSuccess('Movimiento creado.')
      }

      setModalOpen(false)
      setEditingMovimiento(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteMovimiento(movimiento) {
    const confirmed = window.confirm(
      `¿Eliminar movimiento de ${movimiento.producto_nombre || 'producto'}?`,
    )
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteMovimiento(movimiento.id)
      setSuccess('Movimiento eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="inventory-page">
      <div className="page-heading">
        <div className="page-title-block">
          <span className="page-title-icon">
            <Boxes size={32} />
          </span>
          <div>
            <p className="eyebrow">Movimientos de stock</p>
            <h2>Inventario</h2>
          </div>
        </div>
        <button className="button button-primary" onClick={handleNewMovimiento} type="button">
          Nuevo movimiento
        </button>
      </div>

      <section className="panel products-toolbar inventory-toolbar">
        <label>
          Producto
          <select
            onChange={(event) => setProductoFilter(event.target.value)}
            value={productoFilter}
          >
            <option value="">Todos</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tipo
          <select onChange={(event) => setTipoFilter(event.target.value)} value={tipoFilter}>
            <option value="">Todos</option>
            {tiposMovimiento.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sucursal
          <input
            min="1"
            onChange={(event) => setSucursalFilter(event.target.value)}
            placeholder={defaultSucursalId ? 'Sucursal principal' : 'Sucursal'}
            type="number"
            value={sucursalFilter}
          />
        </label>
      </section>

      {success && !error ? (
        <div className="state-panel state-panel-success">{success}</div>
      ) : null}

      {error ? (
        <div className="state-panel state-panel-error">{error}</div>
      ) : (
        <section className="panel products-table-panel">
          {isLoading ? (
            <EmptyState text="Cargando movimientos..." title="Inventario" />
          ) : movimientos.length ? (
            <div className="data-table-wrapper">
              <table className="data-table inventory-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Sucursal</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Cantidad</th>
                    <th>Costo por unidad</th>
                    <th>Costo total</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => {
                    const automatico = isMovimientoAutomatico(movimiento)
                    return (
                      <tr key={movimiento.id}>
                        <td>{formatDate(movimiento.fecha)}</td>
                        <td>{movimiento.producto_nombre || '-'}</td>
                        <td>{movimiento.sucursal_nombre || movimiento.sucursal}</td>
                        <td>
                          <StatusBadge
                            label={getTipoLabel(movimiento.tipo_movimiento)}
                            value={movimiento.tipo_movimiento}
                          />
                        </td>
                        <td>
                          <StatusBadge
                            label={automatico ? 'Automático' : 'Manual'}
                            value={automatico ? 'automatico' : 'manual'}
                          />
                        </td>
                        <td className="table-cell-number">{movimiento.cantidad}</td>
                        <td className="table-cell-money">{formatMoney(movimiento.costo_unitario)}</td>
                        <td className="table-cell-money">{formatMoney(movimiento.costo_total)}</td>
                        <td>{movimiento.motivo || '-'}</td>
                        <td>{movimiento.usuario_username || '-'}</td>
                        <td>
                          {automatico ? (
                            <span className="table-action-muted">Protegido</span>
                          ) : (
                            <div className="table-actions">
                              <button
                                className="button button-secondary button-small"
                                onClick={() => handleEditMovimiento(movimiento)}
                                type="button"
                              >
                                Editar
                              </button>
                              <button
                                className="button button-danger button-small"
                                onClick={() => handleDeleteMovimiento(movimiento)}
                                type="button"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="Todavía no hay movimientos de inventario." title="Sin movimientos" />
          )}
        </section>
      )}

      <InventarioMovimientoModal
        defaultSucursalId={defaultSucursalId}
        initialData={editingMovimiento}
        isOpen={modalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setModalOpen(false)
          setEditingMovimiento(null)
        }}
        onSubmit={handleSubmitMovimiento}
        productos={productos}
      />
    </section>
  )
}

export default Inventario




