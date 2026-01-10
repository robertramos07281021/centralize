import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    flowbiteReact(),
  ] as PluginOption[],
  server: {
    port: 3000,
    host: true,
 
    // middlewareMode: true,// prod
    proxy: {
      "/graphql": {
        target: "http://localhost:4000",
        changeOrigin: true,
        ws: true,
      },
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3000,
    },
  },
  build: {
    // outDir: "dist", // prod
    chunkSizeWarningLimit: 5000,
  },
});
