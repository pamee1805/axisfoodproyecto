import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [sessionMessage, setSessionMessage] = useState(() => {
    const message = localStorage.getItem('axisfood_auth_message') || ''
    localStorage.removeItem('axisfood_auth_message')
    return message
  })
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSessionMessage('')
    setIsLoading(true)

    try {
      await login(credentials)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <div className="brand-mark brand-mark-large">AF</div>
          <p className="eyebrow">AxisFood</p>
          <h1>Entrá al panel</h1>
          <p>
            Ventas, caja, stock y compras en una sola vista clara para operar el
            negocio sin perder tiempo.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuario
            <input
              autoComplete="username"
              name="username"
              onChange={handleChange}
              required
              type="text"
              value={credentials.username}
            />
          </label>

          <label>
            Contraseña
            <input
              autoComplete="current-password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={credentials.password}
            />
          </label>

          {sessionMessage ? (
            <div className="state-panel state-panel-warning">{sessionMessage}</div>
          ) : null}
          {error ? <div className="form-error">{error}</div> : null}

          <button className="button button-primary" disabled={isLoading} type="submit">
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login


