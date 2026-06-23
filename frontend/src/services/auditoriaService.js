import apiClient from '../api/apiClient'

export function getAuditLogs(params = {}) {
  return apiClient.get('auditoria/', { params })
}

export function getAuditLog(id) {
  return apiClient.get(`auditoria/${id}/`)
}

