import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  // server: {
  //   proxy: {
  //     '/graphql': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  // server: {
  //   port: 3000,
  //   host: "0.0.0.0"
  // }
  build: {
    chunkSizeWarningLimit: 2000, // in kB
  }

})
