import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        testing: new URL("./testing.html", import.meta.url).pathname,
      },
    },
  },
});