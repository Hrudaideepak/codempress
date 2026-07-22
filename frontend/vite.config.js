import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "ws",
    },
    proxy: {
      "/api": {
        target: "http://localhost:8008",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("three") || 
              id.includes("@react-three") || 
              id.includes("fiber") || 
              id.includes("drei")
            ) {
              return "vendor-three";
            }
            return "vendor-core";
          }
        },
      },
    },
  },
});
