import apiClient from '../api/apiClient'

export function getCajas(params = {}) {
  return apiClient.get('cajas/', { params })
}

export function abrirCaja(data) {
  return apiClient.post('cajas/', data)
}

export function cerrarCaja(id, data) {
  return apiClient.patch(`cajas/${id}/`, data)
}

export function getMovimientosCaja(params = {}) {
  return apiClient.get('movimientos-caja/', { params })
}

export function crearMovimientoCaja(data) {
  return apiClient.post('movimientos-caja/', data)
}

