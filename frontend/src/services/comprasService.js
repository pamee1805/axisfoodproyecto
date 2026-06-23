import apiClient from '../api/apiClient'

export function getProveedores(params = {}) {
  return apiClient.get('proveedores/', { params })
}

export function createProveedor(data) {
  return apiClient.post('proveedores/', data)
}

export function updateProveedor(id, data) {
  return apiClient.patch(`proveedores/${id}/`, data)
}

export function deleteProveedor(id) {
  return apiClient.delete(`proveedores/${id}/`)
}

export function getOrdenesCompra(params = {}) {
  return apiClient.get('ordenes-compra/', { params })
}

export function createOrdenCompra(data) {
  return apiClient.post('ordenes-compra/', data)
}

export function updateOrdenCompra(id, data) {
  return apiClient.patch(`ordenes-compra/${id}/`, data)
}

export function deleteOrdenCompra(id) {
  return apiClient.delete(`ordenes-compra/${id}/`)
}

