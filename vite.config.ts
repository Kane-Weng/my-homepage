import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this project under the repo name, so all asset URLs
  // must be prefixed with it. Applied in dev and preview too, so local runs
  // (http://localhost:5173/my-homepage/) match production exactly.
  base: "/my-homepage/",
  plugins: [react(), tailwindcss()],
});
