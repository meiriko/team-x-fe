import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"', // for example, lint .ts & .tsx
      },
    }),
  ],
  server: {
    proxy: {
      // "/venues": "http://52.49.59.222",
      // "/event-types": "http://52.49.59.222",
      // "/parking-lots": "http://52.49.59.222",
      "^/api": {
        target: "http://52.49.59.222",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
      },
    },
  },
});
