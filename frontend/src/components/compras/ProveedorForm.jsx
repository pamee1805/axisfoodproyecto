import { useEffect, useState } from 'react'

const initialValues = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  estado: 'activo',
}

function validate(values) {
  const errors = {}
  const email = values.email.trim()

  if (!values.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresá un email válido.'
  }

  return errors
}

function ProveedorForm({ initialData, isSubmitting, onCancel, onSubmit }) {
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
      telefono: initialData.telefono || '',
      email: initialData.email || '',
      direccion: initialData.direccion || '',
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
      nombre: values.nombre.trim(),
      telefono: values.telefono.trim(),
      email: values.email.trim(),
      direccion: values.direccion.trim(),
      estado: values.estado,
    })
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Nombre
          <input name="nombre" onChange={handleChange} value={values.nombre} />
          {errors.nombre ? <small>{errors.nombre}</small> : null}
        </label>

        <label>
          Teléfono
          <input name="telefono" onChange={handleChange} value={values.telefono} />
        </label>

        <label>
          Email
          <input name="email" onChange={handleChange} type="email" value={values.email} />
          {errors.email ? <small>{errors.email}</small> : null}
        </label>

        <label>
          Estado
          <select name="estado" onChange={handleChange} value={values.estado}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>

        <label className="form-full">
          Dirección
          <textarea
            name="direccion"
            onChange={handleChange}
            rows="3"
            value={values.direccion}
          />
        </label>
      </div>

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

export default ProveedorForm


