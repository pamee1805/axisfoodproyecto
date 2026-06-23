import { useEffect, useState } from 'react'

import ContextHelp from '../common/ContextHelp'
import { tiposMovimiento } from '../../constants/options'
import { inventoryMovementHelp } from '../../utils/helpText'

function buildInitialValues(defaultSucursalId) {
  return {
    producto: '',
    sucursal: defaultSucursalId || '',
    tipo_movimiento: 'entrada',
    cantidad: '1.000',
    costo_unitario: '0.01',
    motivo: '',
  }
}

function validate(values) {
  const errors = {}
  const cantidad = Number(values.cantidad)
  const costoUnitario = Number(values.costo_unitario)

  if (!values.producto) {
    errors.producto = 'El producto es obligatorio.'
  }

  if (!values.sucursal) {
    errors.sucursal = 'La sucursal es obligatoria.'
  }

  if (!values.tipo_movimiento) {
    errors.tipo_movimiento = 'El tipo de movimiento es obligatorio.'
  }

  if (values.cantidad === '' || Number.isNaN(cantidad)) {
    errors.cantidad = 'La cantidad es obligatoria.'
  } else if (values.tipo_movimiento === 'ajuste' && cantidad === 0) {
    errors.cantidad = 'El ajuste no puede tener cantidad cero.'
  } else if (values.tipo_movimiento !== 'ajuste' && cantidad <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor que cero.'
  }

  if (values.costo_unitario === '' || Number.isNaN(costoUnitario) || costoUnitario <= 0) {
    errors.costo_unitario = 'El costo por unidad debe ser mayor que cero.'
  }

  return errors
}

function FieldHelp({ children }) {
  return <span className="field-help-text">{children}</span>
}

function InventarioMovimientoForm({
  defaultSucursalId,
  initialData,
  isSubmitting,
  onCancel,
  onSubmit,
  productos,
}) {
  const [values, setValues] = useState(() => buildInitialValues(defaultSucursalId))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!initialData) {
      setValues(buildInitialValues(defaultSucursalId))
      setErrors({})
      return
    }

    setValues({
      producto: initialData.producto || '',
      sucursal: initialData.sucursal || defaultSucursalId || '',
      tipo_movimiento: initialData.tipo_movimiento || 'entrada',
      cantidad: initialData.cantidad || '1.000',
      costo_unitario: initialData.costo_unitario || '0.01',
      motivo: initialData.motivo || '',
    })
    setErrors({})
  }, [defaultSucursalId, initialData])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      producto: Number(values.producto),
      sucursal: Number(values.sucursal),
      tipo_movimiento: values.tipo_movimiento,
      cantidad: values.cantidad,
      costo_unitario: values.costo_unitario,
      motivo: values.motivo,
    })
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <strong>Información operativa</strong>
            <p>Elegí el producto, la sucursal y el tipo de movimiento.</p>
          </div>
        </div>

        <div className="form-grid">
        <label>
          Producto afectado
          <select name="producto" onChange={handleChange} value={values.producto}>
            <option value="">Seleccionar producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
          {errors.producto ? <small>{errors.producto}</small> : null}
        </label>

        <label>
          Sucursal
          <input
            min="1"
            name="sucursal"
            onChange={handleChange}
            placeholder="Sucursal"
            type="number"
            value={values.sucursal}
          />
          <FieldHelp>Sucursal donde se registra el movimiento de stock.</FieldHelp>
          {errors.sucursal ? <small>{errors.sucursal}</small> : null}
        </label>

        <label>
          Tipo de movimiento
          <select
            name="tipo_movimiento"
            onChange={handleChange}
            value={values.tipo_movimiento}
          >
            {tiposMovimiento.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          {errors.tipo_movimiento ? <small>{errors.tipo_movimiento}</small> : null}
        </label>

        <div className="form-full">
          <ContextHelp item={inventoryMovementHelp[values.tipo_movimiento]} />
        </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <span>2</span>
          <div>
            <strong>Impacto de stock</strong>
            <p>Cargá cantidad, costo y motivo para que el movimiento sea auditable.</p>
          </div>
        </div>

        <div className="form-grid">
        <label>
          Cantidad a mover
          <input
            name="cantidad"
            onChange={handleChange}
            placeholder="Ej: 5"
            step="0.001"
            type="number"
            value={values.cantidad}
          />
          <FieldHelp>Unidades que entran, salen o se ajustan en inventario.</FieldHelp>
          {errors.cantidad ? <small>{errors.cantidad}</small> : null}
        </label>

        <label>
          Costo por unidad
          <input
            min="0.01"
            name="costo_unitario"
            onChange={handleChange}
            placeholder="Ej: 7000"
            step="0.01"
            type="number"
            value={values.costo_unitario}
          />
          <FieldHelp>Lo que cuesta producir o comprar cada unidad.</FieldHelp>
          {errors.costo_unitario ? <small>{errors.costo_unitario}</small> : null}
        </label>

        <label className="form-full">
          Motivo operativo
          <textarea
            name="motivo"
            onChange={handleChange}
            placeholder="Ej: ajuste por conteo de cierre, compra manual o rotura"
            rows="3"
            value={values.motivo}
          />
          <FieldHelp>Explicación breve para que el equipo entienda por qué se movió el stock.</FieldHelp>
        </label>
        </div>
      </section>

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

export default InventarioMovimientoForm




