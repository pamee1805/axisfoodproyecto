import { useEffect, useState } from 'react'

import ContextHelp from '../common/ContextHelp'
import { tiposMerma } from '../../constants/options'
import { mermaTypeHelp } from '../../utils/helpText'

function buildInitialValues(defaultSucursalId) {
  return {
    producto: '',
    sucursal: defaultSucursalId || '',
    tipo_movimiento: 'merma',
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
    errors.producto = 'Elegí el producto afectado.'
  }
  if (!values.sucursal) {
    errors.sucursal = 'Indicá la sucursal.'
  }
  if (!values.tipo_movimiento) {
    errors.tipo_movimiento = 'Elegí el tipo de pérdida.'
  }
  if (values.cantidad === '' || Number.isNaN(cantidad) || cantidad <= 0) {
    errors.cantidad = 'La cantidad tiene que ser mayor que cero.'
  }
  if (values.costo_unitario === '' || Number.isNaN(costoUnitario) || costoUnitario <= 0) {
    errors.costo_unitario = 'El costo por unidad tiene que ser mayor que cero.'
  }

  return errors
}

function MermaForm({
  defaultSucursalId,
  isSubmitting,
  onCancel,
  onSubmit,
  productos,
  sucursalPrincipal,
}) {
  const [values, setValues] = useState(() => buildInitialValues(defaultSucursalId))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues(buildInitialValues(defaultSucursalId))
    setErrors({})
  }, [defaultSucursalId])

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
      motivo: values.motivo.trim(),
    })
  }

  return (
    <form className="entity-form mermas-form" onSubmit={handleSubmit}>
      <div className="mermas-form-alert">
        Todo descarte reduce stock y queda trazado en inventario.
      </div>

      <section className="form-section">
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <strong>Producto descartado</strong>
            <p>Indicá qué producto se perdió y en qué sucursal ocurrió.</p>
          </div>
        </div>

        <div className="form-grid">
        <label>
          Producto
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
          {sucursalPrincipal?.id ? (
            <select name="sucursal" onChange={handleChange} value={values.sucursal}>
              <option value={sucursalPrincipal.id}>{sucursalPrincipal.nombre}</option>
            </select>
          ) : (
            <input
              min="1"
              name="sucursal"
              onChange={handleChange}
              placeholder="Sucursal"
              type="number"
              value={values.sucursal}
            />
          )}
          {errors.sucursal ? <small>{errors.sucursal}</small> : null}
        </label>

        <label>
          Tipo de pérdida
          <select name="tipo_movimiento" onChange={handleChange} value={values.tipo_movimiento}>
            {tiposMerma.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          {errors.tipo_movimiento ? <small>{errors.tipo_movimiento}</small> : null}
        </label>

        <div className="form-full">
          <ContextHelp item={mermaTypeHelp[values.tipo_movimiento]} />
        </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <span>2</span>
          <div>
            <strong>Impacto económico</strong>
            <p>Cargá cantidad, costo y motivo para entender dónde se pierde dinero.</p>
          </div>
        </div>

        <div className="form-grid">
        <label>
          Cantidad
          <input
            min="0.001"
            name="cantidad"
            onChange={handleChange}
            step="0.001"
            type="number"
            value={values.cantidad}
          />
          {errors.cantidad ? <small>{errors.cantidad}</small> : null}
        </label>

        <label>
          Costo por unidad
          <input
            min="0.01"
            name="costo_unitario"
            onChange={handleChange}
            step="0.01"
            type="number"
            value={values.costo_unitario}
          />
          <span className="field-help-text">Lo que cuesta producir o comprar cada unidad.</span>
          {errors.costo_unitario ? <small>{errors.costo_unitario}</small> : null}
        </label>

        <label className="form-full">
          Motivo recomendado
          <textarea
            name="motivo"
            onChange={handleChange}
            placeholder="Ej: vencido, rotura, error de producción, sobrante descartado"
            rows="3"
            value={values.motivo}
          />
        </label>
        </div>
      </section>

      {!values.motivo.trim() ? (
        <p className="mermas-form-help">Cargar un motivo ayuda a encontrar pérdidas repetidas.</p>
      ) : null}

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Registrando...' : 'Registrar pérdida'}
        </button>
      </div>
    </form>
  )
}

export default MermaForm




