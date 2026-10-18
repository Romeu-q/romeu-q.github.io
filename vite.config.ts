import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// base "./" = caminhos relativos no build: funciona em romeu-q.github.io
// e também em romeu-q.github.io/qualquer-repo/ sem mudar nada.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") } // padrão do shadcn/21st.dev
  }
});
