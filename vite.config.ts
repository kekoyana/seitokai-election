import { defineConfig } from "vite";

export default defineConfig({
  base: "/seitokai-election/",
  build: {
    outDir: "dist",
    target: "es2022",
  },
});
