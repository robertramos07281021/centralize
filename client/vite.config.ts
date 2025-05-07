import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/graphql': {
        target: 'http://172.16.24.31:4000',
        changeOrigin: true,
        secure: false,
        ws: true,  
      },
    },

  },

  build: {
    chunkSizeWarningLimit: 2000, 
  }

})
