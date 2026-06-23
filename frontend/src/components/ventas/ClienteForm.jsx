import { useEffect, useState } from 'react'

const initialValues = {
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
}

function validate(values) {
  const errors = {}

  if (!values.nombre.trim()) {
    errors.nombre = 'Ingresá el nombre del cliente.'
  }

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Ingresá un email válido.'
  }

  return errors
}

function ClienteForm({ initialData, isSubmitting, onCancel, onSubmit }) {
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
      apellido: initialData.apellido || '',
      telefono: initialData.telefono || '',
      email: initialData.email || '',
      direccion: initialData.direccion || '',
      notas: initialData.notas || '',
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
      apellido: values.apellido.trim(),
      telefono: values.telefono.trim(),
      email: values.email.trim(),
      direccion: values.direccion.trim(),
      notas: values.notas.trim(),
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
          Apellido
          <input name="apellido" onChange={handleChange} value={values.apellido} />
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
        <label className="form-full">
          Dirección
          <input name="direccion" onChange={handleChange} value={values.direccion} />
        </label>
        <label className="form-full">
          Notas
          <textarea name="notas" onChange={handleChange} rows="3" value={values.notas} />
        </label>
      </div>

      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  )
}

export default ClienteForm


