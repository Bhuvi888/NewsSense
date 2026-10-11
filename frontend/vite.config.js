import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://newsense-backend.jollypond-483f70d9.southeastasia.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
