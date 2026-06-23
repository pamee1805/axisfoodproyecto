import { useEffect, useMemo, useState } from 'react'

import ContextHelp from '../common/ContextHelp'
import { canalesPedido, estadosPedido } from '../../constants/options'
import { formatCurrency as formatMoney } from '../../utils/formatters'
import { salesHelp } from '../../utils/helpText'

const emptyItem = {
  producto: '',
  cantidad: '1.000',
  precio_unitario: '0.01',
}

function buildInitialValues(initialData, sucursales) {
  return {
    cliente: initialData?.cliente || '',
    sucursal: initialData?.sucursal || sucursales[0]?.id || '',
    canal: initialData?.canal || 'mostrador',
    estado: initialData?.estado || 'pendiente',
    descuento: initialData?.descuento || '0.00',
    items: initialData?.items?.length
      ? initialData.items.map((item) => ({
          producto: item.producto || '',
          cantidad: item.cantidad || '1.000',
          precio_unitario: item.precio_unitario || '0.01',
        }))
      : [{ ...emptyItem }],
  }
}

function getItemSubtotal(item) {
  const cantidad = Number(item.cantidad)
  const precio = Number(item.precio_unitario)

  if (Number.isNaN(cantidad) || Number.isNaN(precio)) {
    return 0
  }

  return cantidad * precio
}

function validate(values) {
  const errors = {}
  const itemErrors = []
  const descuento = Number(values.descuento || 0)

  if (!values.cliente) {
    errors.cliente = 'Elegí un cliente.'
  }

  if (!values.sucursal) {
    errors.sucursal = 'Elegí una sucursal.'
  }

  if (!values.items.length) {
    errors.items = 'Agregá al menos un producto.'
  }

  if (Number.isNaN(descuento) || descuento < 0) {
    errors.descuento = 'El descuento no puede ser negativo.'
  }

  values.items.forEach((item, index) => {
    const nextItemErrors = {}
    const cantidad = Number(item.cantidad)
    const precio = Number(item.precio_unitario)

    if (!item.producto) {
      nextItemErrors.producto = 'Elegí un producto.'
    }

    if (item.cantidad === '' || Number.isNaN(cantidad) || cantidad <= 0) {
      nextItemErrors.cantidad = 'La cantidad tiene que ser mayor a cero.'
    }

    if (item.precio_unitario === '' || Number.isNaN(precio) || precio <= 0) {
      nextItemErrors.precio_unitario = 'El precio tiene que ser mayor a cero.'
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

function PedidoForm({
  clientes,
  initialData,
  isSubmitting,
  onCancel,
  onSubmit,
  productos,
  sucursales,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialData, sucursales))
  const [errors, setErrors] = useState({})

  const subtotal = useMemo(
    () => values.items.reduce((total, item) => total + getItemSubtotal(item), 0),
    [values.items],
  )
  const descuento = Number(values.descuento || 0)
  const total = Math.max(subtotal - (Number.isNaN(descuento) ? 0 : descuento), 0)

  useEffect(() => {
    setValues(buildInitialValues(initialData, sucursales))
    setErrors({})
  }, [initialData, sucursales])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleItemChange(index, event) {
    const { name, value } = event.target
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        if (name === 'producto') {
          const producto = productos.find((candidate) => String(candidate.id) === value)
          return {
            ...item,
            producto: value,
            precio_unitario: producto?.precio || item.precio_unitario,
          }
        }

        return { ...item, [name]: value }
      }),
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
      cliente: Number(values.cliente),
      sucursal: Number(values.sucursal),
      canal: values.canal,
      estado: values.estado,
      descuento: values.descuento || '0.00',
      items: values.items.map((item) => ({
        producto: Number(item.producto),
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    })
  }

  return (
    <form className="entity-form sales-order-form sales-saas-order-form" onSubmit={handleSubmit}>
      <section className="sales-modal-section">
        <div>
          <h4>Información del pedido</h4>
          <p>Cliente, sucursal y canal de venta.</p>
        </div>
        <div className="form-grid sales-compact-grid">
          <label>
            Cliente
            <select name="cliente" onChange={handleChange} value={values.cliente}>
              <option value="">Elegir cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {`${cliente.nombre} ${cliente.apellido || ''}`.trim()}
                </option>
              ))}
            </select>
            {errors.cliente ? <small>{errors.cliente}</small> : null}
          </label>
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
            Canal
            <select name="canal" onChange={handleChange} value={values.canal}>
              {canalesPedido.map((canal) => (
                <option key={canal.value} value={canal.value}>
                  {canal.label}
                </option>
              ))}
            </select>
          </label>
          {initialData ? (
            <label>
              Estado
              <select name="estado" onChange={handleChange} value={values.estado}>
                {estadosPedido.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="sales-modal-section">
        <div className="sales-section-heading">
          <div>
            <h4>Productos vendidos</h4>
            <p>Armá el pedido con productos, cantidad y precio por unidad.</p>
          </div>
          <button className="button button-secondary" onClick={handleAddItem} type="button">
            Agregar producto
          </button>
        </div>
        {errors.items ? <div className="form-error">{errors.items}</div> : null}
        <div className="sales-order-items-table">
          <div className="sales-order-items-head">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio por unidad</span>
            <span>Subtotal</span>
            <span>Acciones</span>
          </div>
          {values.items.map((item, index) => {
            const itemErrors = errors.itemErrors?.[index] || {}
            return (
              <div className="sales-order-item-row" key={`${index}-${item.producto}`}>
                <label>
                  <select
                    name="producto"
                    onChange={(event) => handleItemChange(index, event)}
                    value={item.producto}
                  >
                    <option value="">Elegir producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                  {itemErrors.producto ? <small>{itemErrors.producto}</small> : null}
                </label>
                <label>
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
                  <input
                    min="0.01"
                    name="precio_unitario"
                    onChange={(event) => handleItemChange(index, event)}
                    step="0.01"
                    type="number"
                    value={item.precio_unitario}
                  />
                  {itemErrors.precio_unitario ? <small>{itemErrors.precio_unitario}</small> : null}
                </label>
                <div className="sales-item-total">
                  <strong>{formatMoney(getItemSubtotal(item))}</strong>
                </div>
                <button
                  className="sales-action-btn sales-action-danger"
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

      <section className="sales-summary-box sales-summary-card">
        <div>
          <h4>Resumen comercial</h4>
          <p>Revisá subtotal, descuento y total antes de guardar.</p>
        </div>
        <label>
          Descuento
          <input
            min="0"
            name="descuento"
            onChange={handleChange}
            step="0.01"
            type="number"
            value={values.descuento}
          />
          {errors.descuento ? <small>{errors.descuento}</small> : null}
        </label>
        <div className="sales-summary-values">
          <span>Subtotal <strong>{formatMoney(subtotal)}</strong></span>
          <span>Total estimado <strong>{formatMoney(total)}</strong></span>
        </div>
      </section>

      <ContextHelp item={salesHelp.crearPedido} />

      <div className="modal-actions sales-modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Guardando...' : initialData ? 'Guardar pedido' : 'Guardar pedido'}
        </button>
      </div>
    </form>
  )
}

export default PedidoForm






