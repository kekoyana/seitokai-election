import { defineConfig } from "vite";

const isItch = process.env.BUILD_TARGET === 'itch';

export default defineConfig({
  base: isItch ? "./" : "/seitokai-election/",
  build: {
    outDir: isItch ? "dist-itch" : "dist",
    target: "es2022",
  },
});
