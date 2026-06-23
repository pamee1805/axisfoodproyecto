import { useState } from 'react'

const initialValues = {
  nombre: '',
  descripcion: '',
  estado: 'activo',
}

function CategoriaModal({ isOpen, isSubmitting, onClose, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')

  if (!isOpen) {
    return null
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!values.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    onSubmit(values, () => {
      setValues(initialValues)
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Categorías</p>
            <h3>Nueva categoría</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="entity-form" onSubmit={handleSubmit}>
          <div className="form-grid form-grid-single">
            <label>
              Nombre
              <input name="nombre" onChange={handleChange} value={values.nombre} />
            </label>

            <label>
              Descripción
              <textarea
                name="descripcion"
                onChange={handleChange}
                rows="3"
                value={values.descripcion}
              />
            </label>

            <label>
              Estado
              <select name="estado" onChange={handleChange} value={values.estado}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <div className="modal-actions">
            <button className="button button-secondary" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="button button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CategoriaModal


