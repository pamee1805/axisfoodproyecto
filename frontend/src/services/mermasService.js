import apiClient from '../api/apiClient'

export function getInventarioMovimientos(params = {}) {
  return apiClient.get('inventario-movimientos/', { params })
}

export function createMermaMovimiento(data) {
  return apiClient.post('inventario-movimientos/', data)
}

export function getProductos(params = {}) {
  return apiClient.get('productos/', { params })
}

