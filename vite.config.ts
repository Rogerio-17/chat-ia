import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              // Adiciona o header de autorização usando a variável carregada
              const apiKey = env.VITE_OPENAI_API_KEY;
              if (apiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
                console.log("Proxy: Authorization header added");
              } else {
                console.error("Proxy: VITE_OPENAI_API_KEY not found");
              }
            });
          },
        },
      },
    },
  };
});
