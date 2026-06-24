import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function envList(value) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'
  const allowedHosts = envList(env.VITE_ALLOWED_HOSTS)

  return {
    plugins: [react()],
    server: {
      allowedHosts,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
