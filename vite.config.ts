import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project at https://kane-weng.github.io/my-homepage/,
  // so built asset URLs must be prefixed with the repo name. Dev stays at "/".
  base: command === "build" ? "/my-homepage/" : "/",
  plugins: [react(), tailwindcss()],
}));
