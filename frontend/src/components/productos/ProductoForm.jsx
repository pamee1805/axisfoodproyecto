import { useEffect, useState } from 'react'

import ContextHelp from '../common/ContextHelp'

const initialValues = {
  nombre: '',
  descripcion: '',
  categoria: '',
  precio: '0.00',
  costo: '0.00',
  stock_minimo: '0.000',
  stock_maximo: '0.000',
  punto_reposicion: '0.000',
  estado: 'activo',
}

function validate(values) {
  const errors = {}
  const numericFields = [
    'precio',
    'costo',
    'stock_minimo',
    'stock_maximo',
    'punto_reposicion',
  ]

  if (!values.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
  }

  numericFields.forEach((field) => {
    const value = Number(values[field])
    if (Number.isNaN(value) || value < 0) {
      errors[field] = 'Debe ser mayor o igual a cero.'
    }
  })

  return errors
}

function FieldHelp({ children }) {
  return <span className="field-help-text">{children}</span>
}

function ProductoForm({ categorias, initialData, isSubmitting, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!initialData) {
      setValues(initialValues)
      setErrors({})
      return
    }

    setValues({
      nombre: initialData.nombre || '',
      descripcion: initialData.descripcion || '',
      categoria: initialData.categoria || '',
      precio: initialData.precio || '0.00',
      costo: initialData.costo || '0.00',
      stock_minimo: initialData.stock_minimo || '0.000',
      stock_maximo: initialData.stock_maximo || '0.000',
      punto_reposicion: initialData.punto_reposicion || '0.000',
      estado: initialData.estado || 'activo',
    })
    setErrors({})
  }, [initialData])

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
      ...values,
      categoria: values.categoria ? Number(values.categoria) : null,
    })
  }

  return (
    <form className="entity-form product-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <strong>Información general</strong>
            <p>Datos que identifican el producto y ayudan a definir su margen.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Nombre
            <input
              name="nombre"
              onChange={handleChange}
              placeholder="Ej: Pizza muzzarella"
              value={values.nombre}
            />
            {errors.nombre ? <small>{errors.nombre}</small> : null}
          </label>

          <label>
            Categoría
            <select name="categoria" onChange={handleChange} value={values.categoria}>
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="form-full">
            Descripción
            <textarea
              name="descripcion"
              onChange={handleChange}
              placeholder="Ej: Pizza clásica con salsa, muzzarella y aceitunas"
              rows="3"
              value={values.descripcion}
            />
          </label>

          <label>
            Precio de venta
            <input
              min="0"
              name="precio"
              onChange={handleChange}
              placeholder="Ej: 12000"
              step="0.01"
              type="number"
              value={values.precio}
            />
            <FieldHelp>Valor final que paga el cliente.</FieldHelp>
            {errors.precio ? <small>{errors.precio}</small> : null}
          </label>

          <label>
            Costo por unidad
            <input
              min="0"
              name="costo"
              onChange={handleChange}
              placeholder="Ej: 7000"
              step="0.01"
              type="number"
              value={values.costo}
            />
            <FieldHelp>Lo que cuesta producir o comprar este producto.</FieldHelp>
            {errors.costo ? <small>{errors.costo}</small> : null}
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <span>2</span>
          <div>
            <strong>Control de stock</strong>
            <p>Parámetros para compras, alertas e inventario operativo.</p>
          </div>
        </div>

        <ContextHelp
          className="context-help-compact"
          item={{
            label: '¿Qué significa stock recomendado mínimo?',
            description:
              "Ejemplo: si actualmente tiene 35 unidades y configura 'Stock recomendado mínimo 20', el sistema podrá advertirle que conviene comprar antes de llegar al stock crítico.",
          }}
        />

        <div className="stock-example-card">
          <span>Stock actual: 35</span>
          <span>Stock recomendado mínimo: 20</span>
          <span>Stock mínimo permitido: 10</span>
        </div>

        <div className="form-grid">
          <label>
            Stock mínimo
            <input
              min="0"
              name="stock_minimo"
              onChange={handleChange}
              step="0.001"
              type="number"
              value={values.stock_minimo}
            />
            <FieldHelp>
              Nivel crítico. Si el stock baja de este valor, requiere atención inmediata.
            </FieldHelp>
            {errors.stock_minimo ? <small>{errors.stock_minimo}</small> : null}
          </label>

          <label>
            Stock máximo
            <input
              min="0"
              name="stock_maximo"
              onChange={handleChange}
              step="0.001"
              type="number"
              value={values.stock_maximo}
            />
            <FieldHelp>Cantidad ideal para mantener disponible.</FieldHelp>
            {errors.stock_maximo ? <small>{errors.stock_maximo}</small> : null}
          </label>

          <label>
            Stock recomendado mínimo
            <input
              min="0"
              name="punto_reposicion"
              onChange={handleChange}
              step="0.001"
              type="number"
              value={values.punto_reposicion}
            />
            <FieldHelp>
              Cuando el stock llegue a esta cantidad, el sistema lo marcará para reposición.
            </FieldHelp>
            {errors.punto_reposicion ? <small>{errors.punto_reposicion}</small> : null}
          </label>

          <label>
            Estado
            <select name="estado" onChange={handleChange} value={values.estado}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="agotado">Agotado</option>
            </select>
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

export default ProductoForm





