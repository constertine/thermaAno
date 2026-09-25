import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/ml-api': {
        target: 'https://thermal-anomaly-api.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml-api/, ''),
        secure: false
      }
    }
  }
})
