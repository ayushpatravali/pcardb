import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ['d70a6c1fe0725c.lhr.life', '.lhr.life', '.loca.lt', '.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    hmr: { clientPort: 443 },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/token': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    allowedHosts: ['marlys-cavate-notionally.ngrok-free.dev', '.ngrok-free.dev', '.lhr.life', '.loca.lt']
  }
})
