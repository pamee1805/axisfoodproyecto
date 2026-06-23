import apiClient from '../api/apiClient'

export function getMovimientos(params = {}) {
  return apiClient.get('inventario-movimientos/', { params })
}

export function createMovimiento(data) {
  return apiClient.post('inventario-movimientos/', data)
}

export function updateMovimiento(id, data) {
  return apiClient.patch(`inventario-movimientos/${id}/`, data)
}

export function deleteMovimiento(id) {
  return apiClient.delete(`inventario-movimientos/${id}/`)
}

