import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'

import ContextHelp from '../components/common/ContextHelp'
import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import {
  assignRole,
  createUsuario,
  deleteUsuario,
  getPermisos,
  getRoles,
  getUserRoles,
  getUsuarios,
  removeUserRole,
  updateUsuario,
} from '../services/usuariosService'
import { rolePresentation as friendlyRolePresentation } from '../utils/helpText'

const estadosUsuario = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'vacaciones', label: 'Vacaciones' },
]

const emptyUsuario = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  telefono: '',
  estado: 'activo',
  password: '',
}

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  }

  if (error.response?.status === 403) {
    return 'No tenés permisos para gestionar usuarios'
  }

  const data = error.response?.data
  if (!data) {
    return 'No se pudo conectar con el servidor. Revisá que el backend esté activo.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  if (Array.isArray(data)) {
    return data.join(' ')
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
      return `${field}: ${text}`
    })
    .join(' ')
}

function getDisplayName(usuario) {
  const fullName = `${usuario.first_name || ''} ${usuario.last_name || ''}`.trim()
  return fullName || usuario.username
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('axisfood_user')) || null
  } catch {
    return null
  }
}

function valueMatchesStoredEntity(value, entity) {
  if (!entity) {
    return false
  }

  return String(value) === String(entity.id)
}

function getTenantName(usuario) {
  const currentUser = getStoredUser()
  const tenant = usuario.tenant

  if (tenant?.nombre || tenant?.razon_social) {
    return tenant.nombre || tenant.razon_social
  }

  if (usuario.tenant_nombre || usuario.tenant_razon_social) {
    return usuario.tenant_nombre || usuario.tenant_razon_social
  }

  if (valueMatchesStoredEntity(tenant, currentUser?.tenant)) {
    return currentUser.tenant.nombre || currentUser.tenant.razon_social || 'AxisFood Demo'
  }

  if (String(usuario.username || '').startsWith('axisfood_demo_') && /^\d+$/.test(String(tenant))) {
    return 'AxisFood Demo'
  }

  if (/^\d+$/.test(String(tenant))) {
    return 'Empresa asignada'
  }

  return tenant || '-'
}

function getSucursalName(usuario) {
  const currentUser = getStoredUser()
  const sucursal = usuario.sucursal_principal

  if (sucursal?.nombre) {
    return sucursal.nombre
  }

  if (usuario.sucursal_principal_nombre || usuario.sucursal_nombre) {
    return usuario.sucursal_principal_nombre || usuario.sucursal_nombre
  }

  if (valueMatchesStoredEntity(sucursal, currentUser?.sucursal_principal)) {
    return currentUser.sucursal_principal.nombre || 'Sucursal Central'
  }

  if (String(usuario.username || '').startsWith('axisfood_demo_') && /^\d+$/.test(String(sucursal))) {
    return 'Sucursal Central'
  }

  if (/^\d+$/.test(String(sucursal))) {
    return 'Sucursal asignada'
  }

  return sucursal || '-'
}

function getRoleCode(rol) {
  return rol.rol_codigo || rol.codigo || ''
}

function humanizeRoleCode(code) {
  return String(code || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getRoleLabel(rol) {
  const code = getRoleCode(rol)
  return friendlyRolePresentation[code]?.label || humanizeRoleCode(rol.nombre) || humanizeRoleCode(code) || 'Rol'
}

function getRoleDescriptionById(roles, rolId) {
  const selectedRole = roles.find((rol) => String(rol.id) === String(rolId))
  const code = getRoleCode(selectedRole || {})
  return friendlyRolePresentation[code]?.description || selectedRole?.descripcion || 'Define que puede hacer este usuario.'
}

function UsuarioModal({ initialData, isOpen, isSubmitting, onClose, onSubmit }) {
  const [formData, setFormData] = useState(emptyUsuario)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        telefono: initialData.telefono || '',
        estado: initialData.estado || 'activo',
        password: '',
      })
    } else {
      setFormData(emptyUsuario)
    }
  }, [initialData, isOpen])

  if (!isOpen) {
    return null
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      telefono: formData.telefono.trim(),
      estado: formData.estado,
    }

    if (!initialData || formData.password) {
      payload.password = formData.password
    }

    onSubmit(payload)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Usuarios</p>
            <h3>{initialData ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="entity-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <div className="form-section-heading">
              <span>1</span>
              <div>
                <strong>Información personal</strong>
                <p>Datos visibles para identificar al integrante del equipo.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Nombre
                <input
                  name="first_name"
                  onChange={handleChange}
                  type="text"
                  value={formData.first_name}
                />
              </label>
              <label>
                Apellido
                <input
                  name="last_name"
                  onChange={handleChange}
                  type="text"
                  value={formData.last_name}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  onChange={handleChange}
                  type="email"
                  value={formData.email}
                />
              </label>
              <label>
                Teléfono
                <input
                  name="telefono"
                  onChange={handleChange}
                  type="tel"
                  value={formData.telefono}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>2</span>
              <div>
                <strong>Acceso al sistema</strong>
                <p>Usuario, estado y contraseña inicial.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Usuario
                <input
                  name="username"
                  onChange={handleChange}
                  required
                  type="text"
                  value={formData.username}
                />
              </label>
              <label>
                Estado
                <select name="estado" onChange={handleChange} value={formData.estado}>
                  {estadosUsuario.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </label>
              {!initialData ? (
                <label className="form-full">
                  Contraseña temporal
                  <input
                    minLength="8"
                    name="password"
                    onChange={handleChange}
                    required
                    type="password"
                    value={formData.password}
                  />
                </label>
              ) : null}
            </div>
          </section>

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

function AssignRoleModal({
  assignedRoleIds,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  roles,
  usuario,
}) {
  const availableRoles = useMemo(
    () => roles.filter((rol) => !assignedRoleIds.has(rol.id)),
    [assignedRoleIds, roles],
  )
  const [rolId, setRolId] = useState('')
  const knownRoles = useMemo(
    () => availableRoles.filter((rol) => friendlyRolePresentation[getRoleCode(rol)]),
    [availableRoles],
  )
  const selectedRole = availableRoles.find((rol) => String(rol.id) === String(rolId))
  const selectedRoleDescription = getRoleDescriptionById(availableRoles, rolId)

  useEffect(() => {
    setRolId(availableRoles[0]?.id ? String(availableRoles[0].id) : '')
  }, [availableRoles])

  if (!isOpen || !usuario) {
    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!rolId) {
      return
    }
    onSubmit({ usuario: usuario.id, rol: Number(rolId) })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">RBAC</p>
            <h3>Asignar rol</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="entity-form" onSubmit={handleSubmit}>
          <p className="muted-text">
            Usuario: <strong>{getDisplayName(usuario)}</strong>
          </p>
          <label>
            Rol
            <select
              disabled={!availableRoles.length}
              onChange={(event) => setRolId(event.target.value)}
              value={rolId}
            >
              {availableRoles.length ? (
                availableRoles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {getRoleLabel(rol)}
                  </option>
                ))
              ) : (
                <option value="">Sin roles disponibles</option>
              )}
            </select>
          </label>
          <ContextHelp
            item={{
              label: getRoleLabel(selectedRole || {}),
              description: selectedRoleDescription,
            }}
          />

          {knownRoles.length ? (
            <div aria-label="Descripción de roles" className="role-help-list">
              {knownRoles.map((rol) => (
                <ContextHelp
                  className="context-help-compact"
                  item={{
                    label: getRoleLabel(rol),
                    description: friendlyRolePresentation[getRoleCode(rol)].description,
                  }}
                  key={rol.id}
                />
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="button button-secondary" onClick={onClose} type="button">
              Cancelar
            </button>
            <button
              className="button button-primary"
              disabled={isSubmitting || !availableRoles.length}
              type="submit"
            >
              {isSubmitting ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Usuarios() {
  const [activeTab, setActiveTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [assigningUsuario, setAssigningUsuario] = useState(null)

  const userRolesByUser = useMemo(() => {
    return userRoles.reduce((groups, item) => {
      const key = item.usuario
      const current = groups.get(key) || []
      current.push(item)
      groups.set(key, current)
      return groups
    }, new Map())
  }, [userRoles])

  const assignedRoleIds = useMemo(() => {
    if (!assigningUsuario) {
      return new Set()
    }

    return new Set((userRolesByUser.get(assigningUsuario.id) || []).map((item) => item.rol))
  }, [assigningUsuario, userRolesByUser])

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [usuariosResponse, rolesResponse, permisosResponse, userRolesResponse] =
        await Promise.all([getUsuarios(), getRoles(), getPermisos(), getUserRoles()])

      setUsuarios(normalizeList(usuariosResponse.data))
      setRoles(normalizeList(rolesResponse.data))
      setPermisos(normalizeList(permisosResponse.data))
      setUserRoles(normalizeList(userRolesResponse.data))
    } catch (requestError) {
      setUsuarios([])
      setRoles([])
      setPermisos([])
      setUserRoles([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleNewUsuario() {
    setEditingUsuario(null)
    setUsuarioModalOpen(true)
  }

  function handleEditUsuario(usuario) {
    setEditingUsuario(usuario)
    setUsuarioModalOpen(true)
  }

  function handleAssignRole(usuario) {
    setAssigningUsuario(usuario)
    setAssignModalOpen(true)
  }

  async function handleSubmitUsuario(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, data)
        setSuccess('Usuario actualizado.')
      } else {
        await createUsuario(data)
        setSuccess('Usuario creado.')
      }

      setUsuarioModalOpen(false)
      setEditingUsuario(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUsuario(usuario) {
    const confirmed = window.confirm(`¿Eliminar usuario "${usuario.username}"?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteUsuario(usuario.id)
      setSuccess('Usuario eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  async function handleSubmitAssignRole(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await assignRole(data)
      setSuccess('Rol asignado.')
      setAssignModalOpen(false)
      setAssigningUsuario(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveUserRole(userRole) {
    const confirmed = window.confirm(`¿Quitar rol "${getRoleLabel(userRole)}"?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await removeUserRole(userRole.id)
      setSuccess('Rol removido.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  function renderUsuarios() {
    if (isLoading) {
      return <EmptyState text="Cargando usuarios..." title="Usuarios" />
    }

    if (!usuarios.length) {
      return <EmptyState text="No hay usuarios para mostrar." title="Sin usuarios" />
    }

    return (
      <div className="data-table-wrapper">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Empresa</th>
              <th>Sucursal</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const assignedRoles = userRolesByUser.get(usuario.id) || []
              const rolesFromUsuario = usuario.roles || []
              const visibleRoles = assignedRoles.length ? assignedRoles : rolesFromUsuario

              return (
                <tr key={usuario.id}>
                  <td>
                    <strong>{getDisplayName(usuario)}</strong>
                    <small>{usuario.username}</small>
                  </td>
                  <td>{usuario.email || '-'}</td>
                  <td>
                    <StatusBadge label={usuario.estado} value={usuario.estado} />
                  </td>
                  <td>{getTenantName(usuario)}</td>
                  <td>{getSucursalName(usuario)}</td>
                  <td>
                    <div className="role-chip-list">
                      {visibleRoles.length ? (
                        visibleRoles.map((rol) => {
                          const label = getRoleLabel(rol)
                          return (
                            <span className="role-chip" key={rol.id || label}>
                              {label}
                              {rol.rol_codigo ? (
                                <button
                                  aria-label={`Quitar rol ${label}`}
                                  className="role-chip-remove"
                                  onClick={() => handleRemoveUserRole(rol)}
                                  type="button"
                                >
                                  ×
                                </button>
                              ) : null}
                            </span>
                          )
                        })
                      ) : (
                        <span className="empty-text">Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="button button-secondary button-small"
                        onClick={() => handleEditUsuario(usuario)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="button button-secondary button-small"
                        onClick={() => handleAssignRole(usuario)}
                        type="button"
                      >
                        Asignar rol
                      </button>
                      <button
                        className="button button-danger button-small"
                        onClick={() => handleDeleteUsuario(usuario)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function renderSimpleTable(items, emptyText, type = 'default') {
    if (isLoading) {
      return <EmptyState text="Cargando datos..." title="Accesos" />
    }

    if (!items.length) {
      return <EmptyState text={emptyText} title="Sin datos" />
    }

    return (
      <div className="data-table-wrapper">
        <table className="data-table rbac-table">
          <thead>
            <tr>
              <th>{type === 'roles' ? 'Rol' : 'Código'}</th>
              <th>Nombre</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{type === 'roles' ? getRoleLabel(item) : humanizeRoleCode(item.codigo)}</strong>
                </td>
                <td>{type === 'roles' ? getRoleLabel(item) : humanizeRoleCode(item.nombre)}</td>
                <td>{item.descripcion || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div className="page-title-block">
          <span className="page-title-icon">
            <Users size={32} />
          </span>
          <div>
            <p className="eyebrow">Accesos y permisos</p>
            <h2>Equipo y permisos</h2>
          </div>
        </div>
        {activeTab === 'usuarios' ? (
          <button className="button button-primary" onClick={handleNewUsuario} type="button">
            Crear usuario
          </button>
        ) : null}
      </div>

      <section className="panel tabs-panel">
        <div aria-label="Usuarios y RBAC" className="tabs" role="tablist">
          <button
            aria-selected={activeTab === 'usuarios'}
            className={`tab-button ${activeTab === 'usuarios' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
            role="tab"
            type="button"
          >
            Usuarios
          </button>
          <button
            aria-selected={activeTab === 'roles'}
            className={`tab-button ${activeTab === 'roles' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('roles')}
            role="tab"
            type="button"
          >
            Roles
          </button>
          <button
            aria-selected={activeTab === 'permisos'}
            className={`tab-button ${activeTab === 'permisos' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('permisos')}
            role="tab"
            type="button"
          >
            Permisos
          </button>
        </div>
      </section>

      {success && !error ? (
        <div className="state-panel state-panel-success">{success}</div>
      ) : null}

      {error ? (
        <div className="state-panel state-panel-error">{error}</div>
      ) : (
        <section className="panel products-table-panel">
          {activeTab === 'usuarios' ? renderUsuarios() : null}
          {activeTab === 'roles'
            ? renderSimpleTable(roles, 'No hay roles para mostrar.', 'roles')
            : null}
          {activeTab === 'permisos'
            ? renderSimpleTable(permisos, 'No hay permisos para mostrar.')
            : null}
        </section>
      )}

      <UsuarioModal
        initialData={editingUsuario}
        isOpen={usuarioModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setUsuarioModalOpen(false)
          setEditingUsuario(null)
        }}
        onSubmit={handleSubmitUsuario}
      />

      <AssignRoleModal
        assignedRoleIds={assignedRoleIds}
        isOpen={assignModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setAssignModalOpen(false)
          setAssigningUsuario(null)
        }}
        onSubmit={handleSubmitAssignRole}
        roles={roles}
        usuario={assigningUsuario}
      />
    </section>
  )
}

export default Usuarios




