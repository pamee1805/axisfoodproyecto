import { useEffect, useState } from 'react'

import ContextHelp from '../common/ContextHelp'
import { estadosPago, metodosPago } from '../../constants/options'
import { salesHelp } from '../../utils/helpText'

function buildInitialValues(initialData, pedido) {
  return {
    pedido: initialData?.pedido || pedido?.id || '',
    monto: initialData?.monto || pedido?.total || '0.01',
    metodo_pago: initialData?.metodo_pago || 'efectivo',
    estado: initialData?.estado || 'aprobado',
  }
}

function validate(values) {
  const errors = {}
  const monto = Number(values.monto)

  if (!values.pedido) {
    errors.pedido = 'Elegí un pedido.'
  }

  if (values.monto === '' || Number.isNaN(monto) || monto <= 0) {
    errors.monto = 'El monto tiene que ser mayor a cero.'
  }

  return errors
}

function PagoForm({ initialData, isSubmitting, onCancel, onSubmit, pedido, pedidos }) {
  const [values, setValues] = useState(() => buildInitialValues(initialData, pedido))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues(buildInitialValues(initialData, pedido))
    setErrors({})
  }, [initialData, pedido])

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
      pedido: Number(values.pedido),
      monto: values.monto,
      metodo_pago: values.metodo_pago,
      estado: values.estado,
    })
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <strong>Información del cobro</strong>
            <p>Relacioná el pago con un pedido y registrá cómo se cobró.</p>
          </div>
        </div>

        <div className="form-grid form-grid-single">
          <label>
            Pedido
            <select disabled={Boolean(pedido)} name="pedido" onChange={handleChange} value={values.pedido}>
              <option value="">Elegir pedido</option>
              {pedidos.map((item) => (
                <option key={item.id} value={item.id}>
                  Pedido #{item.id} - {item.cliente_nombre || 'Cliente'}
                </option>
              ))}
            </select>
            {errors.pedido ? <small>{errors.pedido}</small> : null}
          </label>

          <label>
            Importe cobrado
            <input
              min="0.01"
              name="monto"
              onChange={handleChange}
              placeholder="Ej: 12000"
              step="0.01"
              type="number"
              value={values.monto}
            />
            <span className="field-help-text">Monto real que ingresa por este pedido.</span>
            {errors.monto ? <small>{errors.monto}</small> : null}
          </label>

          <label>
            Método de pago
            <select name="metodo_pago" onChange={handleChange} value={values.metodo_pago}>
              {metodosPago.map((metodo) => (
                <option key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado
            <select name="estado" onChange={handleChange} value={values.estado}>
              {estadosPago.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <ContextHelp item={salesHelp.registrarPago} />

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Guardando...' : 'Guardar pago'}
        </button>
      </div>
    </form>
  )
}

export default PagoForm




