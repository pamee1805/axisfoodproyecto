import apiClient from '../api/apiClient'

export function getClientes(params = {}) {
  return apiClient.get('clientes/', { params })
}

export function createCliente(data) {
  return apiClient.post('clientes/', data)
}

export function updateCliente(id, data) {
  return apiClient.patch(`clientes/${id}/`, data)
}

export function deleteCliente(id) {
  return apiClient.delete(`clientes/${id}/`)
}

export function getPedidos(params = {}) {
  return apiClient.get('pedidos/', { params })
}

export function createPedido(data) {
  return apiClient.post('pedidos/', data)
}

export function updatePedido(id, data) {
  return apiClient.patch(`pedidos/${id}/`, data)
}

export function deletePedido(id) {
  return apiClient.delete(`pedidos/${id}/`)
}

export function getPagos(params = {}) {
  return apiClient.get('pagos/', { params })
}

export function createPago(data) {
  return apiClient.post('pagos/', data)
}

export function updatePago(id, data) {
  return apiClient.patch(`pagos/${id}/`, data)
}

export function deletePago(id) {
  return apiClient.delete(`pagos/${id}/`)
}

