import { useEffect, useMemo, useState } from 'react'

import ContextHelp from '../common/ContextHelp'
import { estadosOrdenCompra } from '../../constants/options'
import { formatCurrency as formatMoney } from '../../utils/formatters'
import { purchaseHelp } from '../../utils/helpText'

const emptyItem = {
  producto: '',
  cantidad: '1.000',
  costo_unitario: '0.01',
}

function toDatetimeLocal(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 16)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16)
  }

  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function buildInitialValues(initialData) {
  if (!initialData) {
    return {
      proveedor: '',
      estado: 'pendiente',
      fecha: toDatetimeLocal(),
      items: [{ ...emptyItem }],
    }
  }

  return {
    proveedor: initialData.proveedor || '',
    estado: initialData.estado || 'pendiente',
    fecha: toDatetimeLocal(initialData.fecha),
    items: initialData.items?.length
      ? initialData.items.map((item) => ({
          producto: item.producto || '',
          cantidad: item.cantidad || '1.000',
          costo_unitario: item.costo_unitario || '0.01',
        }))
      : [{ ...emptyItem }],
  }
}

function getItemSubtotal(item) {
  const cantidad = Number(item.cantidad)
  const costoUnitario = Number(item.costo_unitario)

  if (Number.isNaN(cantidad) || Number.isNaN(costoUnitario)) {
    return 0
  }

  return cantidad * costoUnitario
}

function validate(values) {
  const errors = {}
  const itemErrors = []

  if (!values.proveedor) {
    errors.proveedor = 'El proveedor es obligatorio.'
  }

  if (!values.items.length) {
    errors.items = 'La orden debe tener al menos un item.'
  }

  values.items.forEach((item, index) => {
    const nextItemErrors = {}
    const cantidad = Number(item.cantidad)
    const costoUnitario = Number(item.costo_unitario)

    if (!item.producto) {
      nextItemErrors.producto = 'El producto es obligatorio.'
    }

    if (item.cantidad === '' || Number.isNaN(cantidad) || cantidad <= 0) {
      nextItemErrors.cantidad = 'La cantidad debe ser mayor que cero.'
    }

    if (item.costo_unitario === '' || Number.isNaN(costoUnitario) || costoUnitario <= 0) {
      nextItemErrors.costo_unitario = 'El costo por unidad debe ser mayor que cero.'
    }

    if (Object.keys(nextItemErrors).length > 0) {
      itemErrors[index] = nextItemErrors
    }
  })

  if (itemErrors.length) {
    errors.itemErrors = itemErrors
  }

  return errors
}

function OrdenCompraForm({
  initialData,
  isSubmitting,
  onCancel,
  onSubmit,
  productos,
  proveedores,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialData))
  const [errors, setErrors] = useState({})

  const estimatedTotal = useMemo(
    () => values.items.reduce((total, item) => total + getItemSubtotal(item), 0),
    [values.items],
  )

  useEffect(() => {
    setValues(buildInitialValues(initialData))
    setErrors({})
  }, [initialData])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleItemChange(index, event) {
    const { name, value } = event.target
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }))
  }

  function handleAddItem() {
    setValues((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))
  }

  function handleRemoveItem(index) {
    setValues((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      proveedor: Number(values.proveedor),
      estado: values.estado,
      fecha: values.fecha,
      items: values.items.map((item) => ({
        producto: Number(item.producto),
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
      })),
    })
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <ContextHelp item={purchaseHelp.crearOrden} />

      <section className="form-section">
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <strong>Información de compra</strong>
            <p>Proveedor, fecha y estado operativo de la orden.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Proveedor
            <select name="proveedor" onChange={handleChange} value={values.proveedor}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            {errors.proveedor ? <small>{errors.proveedor}</small> : null}
          </label>

          <label>
            Estado
            <select name="estado" onChange={handleChange} value={values.estado}>
              {estadosOrdenCompra.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fecha
            <input name="fecha" onChange={handleChange} type="datetime-local" value={values.fecha} />
          </label>
        </div>
      </section>

      <section className="form-section purchase-items-panel">
        <div className="form-section-heading">
          <span>2</span>
          <div>
            <strong>Productos comprados</strong>
            <p>Cantidades y costos que ingresarán al inventario al recibir la compra.</p>
          </div>
        </div>

        <div className="purchase-items-heading">
          <h4>Detalle de productos</h4>
          <button className="button button-secondary button-small" onClick={handleAddItem} type="button">
            Agregar producto
          </button>
        </div>

        {errors.items ? <div className="form-error">{errors.items}</div> : null}

        <div className="purchase-items-list">
          {values.items.map((item, index) => {
            const itemErrors = errors.itemErrors?.[index] || {}
            return (
              <div className="purchase-item-row" key={`${index}-${item.producto}`}>
                <label>
                  Producto
                  <select
                    name="producto"
                    onChange={(event) => handleItemChange(index, event)}
                    value={item.producto}
                  >
                    <option value="">Seleccionar</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                  {itemErrors.producto ? <small>{itemErrors.producto}</small> : null}
                </label>

                <label>
                  Cantidad
                  <input
                    min="0.001"
                    name="cantidad"
                    onChange={(event) => handleItemChange(index, event)}
                    step="0.001"
                    type="number"
                    value={item.cantidad}
                  />
                  {itemErrors.cantidad ? <small>{itemErrors.cantidad}</small> : null}
                </label>

                <label>
                  Costo por unidad
                  <input
                    min="0.01"
                    name="costo_unitario"
                    onChange={(event) => handleItemChange(index, event)}
                    step="0.01"
                    type="number"
                    value={item.costo_unitario}
                  />
                  {itemErrors.costo_unitario ? <small>{itemErrors.costo_unitario}</small> : null}
                </label>

                <div className="purchase-item-subtotal">
                  <span>Subtotal estimado</span>
                  <strong>{formatMoney(getItemSubtotal(item))}</strong>
                </div>

                <button
                  className="button button-danger button-small"
                  disabled={values.items.length === 1}
                  onClick={() => handleRemoveItem(index)}
                  type="button"
                >
                  Quitar
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <div className="purchase-total-panel">
        <span>Total estimado</span>
        <strong>{formatMoney(estimatedTotal)}</strong>
        <small>El sistema recalcula totales al guardar.</small>
      </div>

      <ContextHelp item={purchaseHelp.marcarRecibida} />

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default OrdenCompraForm




