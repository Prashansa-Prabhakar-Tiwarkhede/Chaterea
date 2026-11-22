import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // sockjs-client expects Node's `global` object, which browsers don't have
  // and Vite (unlike Webpack) doesn't polyfill automatically. Map it to
  // globalThis so sockjs-client works unmodified in the browser.
  define: {
    global: "globalThis",
  },
});