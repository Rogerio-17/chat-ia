import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/openai": {
        target: "https://api.openai.com/v1/chat/completions",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ""),
        headers: {
          Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        },
      },
    },
  },
});
