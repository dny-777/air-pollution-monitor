import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://your-app-name.vercel.app' 
          : 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
