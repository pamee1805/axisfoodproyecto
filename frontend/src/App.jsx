import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './auth/useAuth'
import Layout from './components/Layout'
import Auditoria from './pages/Auditoria'
import Caja from './pages/Caja'
import Compras from './pages/Compras'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Login from './pages/Login'
import Mermas from './pages/Mermas'
import Productos from './pages/Productos'
import Usuarios from './pages/Usuarios'
import Ventas from './pages/Ventas'

function ProtectedRoute({ children }) {
  const { accessToken, isAuthReady } = useAuth()

  if (!isAuthReady) {
    return <div className="route-loading">Cargando sesión...</div>
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { accessToken, isAuthReady } = useAuth()

  if (!isAuthReady) {
    return <div className="route-loading">Cargando sesión...</div>
  }

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="mermas" element={<Mermas />} />
        <Route path="compras" element={<Compras />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="caja" element={<Caja />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="auditoria" element={<Auditoria />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App


