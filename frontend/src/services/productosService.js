import apiClient from '../api/apiClient'

export function getProductos(params = {}) {
  return apiClient.get('productos/', { params })
}

export function createProducto(data) {
  return apiClient.post('productos/', data)
}

export function updateProducto(id, data) {
  return apiClient.patch(`productos/${id}/`, data)
}

export function deleteProducto(id) {
  return apiClient.delete(`productos/${id}/`)
}

export function getCategorias() {
  return apiClient.get('categorias/')
}

export function createCategoria(data) {
  return apiClient.post('categorias/', data)
}

