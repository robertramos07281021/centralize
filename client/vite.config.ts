import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), flowbiteReact()] as PluginOption[],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/graphql': {
        target: 'http://172.16.24.31:4000',
        changeOrigin: true,
        ws: true,  
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, 
  }
})