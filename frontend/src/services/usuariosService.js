import apiClient from '../api/apiClient'

export function getUsuarios() {
  return apiClient.get('usuarios/')
}

export function createUsuario(data) {
  return apiClient.post('usuarios/', data)
}

export function updateUsuario(id, data) {
  return apiClient.patch(`usuarios/${id}/`, data)
}

export function deleteUsuario(id) {
  return apiClient.delete(`usuarios/${id}/`)
}

export function getRoles() {
  return apiClient.get('roles/')
}

export function getPermisos() {
  return apiClient.get('permisos/')
}

export function getUserRoles() {
  return apiClient.get('user-roles/')
}

export function assignRole(data) {
  return apiClient.post('user-roles/', data)
}

export function removeUserRole(id) {
  return apiClient.delete(`user-roles/${id}/`)
}

