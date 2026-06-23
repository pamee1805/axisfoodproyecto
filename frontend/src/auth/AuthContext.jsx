import { useMemo, useState } from 'react'

import apiClient from '../api/apiClient'
import AuthContext from './authContextValue'

const storageKeys = {
  access: 'axisfood_access',
  refresh: 'axisfood_refresh',
  user: 'axisfood_user',
}

function readStoredUser() {
  const storedUser = localStorage.getItem(storageKeys.user)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(storageKeys.user)
    return null
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(storageKeys.access),
  )
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(storageKeys.refresh),
  )
  const [user, setUser] = useState(readStoredUser)
  const [isAuthReady] = useState(true)

  async function login(credentials) {
    const response = await apiClient.post('auth/login/', credentials)
    const { data } = response
    const userData = data.user || data.usuario

    if (!data.access) {
      throw new Error('La respuesta de login no incluyo access token.')
    }

    localStorage.removeItem('axisfood_auth_message')
    localStorage.setItem(storageKeys.access, data.access)
    localStorage.setItem(storageKeys.refresh, data.refresh || '')
    localStorage.setItem(storageKeys.user, JSON.stringify(userData || null))

    setAccessToken(data.access)
    setRefreshToken(data.refresh || null)
    setUser(userData || null)

    return { ...data, user: userData }
  }

  function logout() {
    localStorage.removeItem(storageKeys.access)
    localStorage.removeItem(storageKeys.refresh)
    localStorage.removeItem(storageKeys.user)
    localStorage.removeItem('axisfood_auth_message')

    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      accessToken,
      isAuthReady,
      refreshToken,
      user,
      login,
      logout,
    }),
    [accessToken, isAuthReady, refreshToken, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


