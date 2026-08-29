import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  // @desafio/shared e TypeScript cru; deixar o Vite compilar em vez de
  // pre-empacotar como dependencia.
  optimizeDeps: { exclude: ["@desafio/shared"] },
});
