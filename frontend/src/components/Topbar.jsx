import { useAuth } from '../auth/useAuth'

function Topbar() {
  const { logout, user } = useAuth()
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    user?.['nombre de usuario'] ||
    'Usuario'

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Panel de control</p>
        <h1>AxisFood</h1>
      </div>
      <div className="topbar-user">
        <div className="user-pill">
          <span>{displayName}</span>
          <small>{user?.tenant?.nombre || 'Sin empresa'}</small>
        </div>
        <button className="button button-secondary" type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default Topbar


