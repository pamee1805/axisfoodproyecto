import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

const authStorageKeys = [
  'axisfood_access',
  'axisfood_refresh',
  'axisfood_user',
]

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('axisfood_access')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isLoginRequest = requestUrl.includes('auth/login/')

    if (status === 401 && !isLoginRequest) {
      authStorageKeys.forEach((key) => localStorage.removeItem(key))
      localStorage.setItem(
        'axisfood_auth_message',
        'Tu sesión expiró. Iniciá sesión nuevamente.',
      )

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient

