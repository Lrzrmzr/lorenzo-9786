import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_TARGET = 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo el navegador solo habla con Vite (mismo origen) y Vite reenvía /api al servidor.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
})
