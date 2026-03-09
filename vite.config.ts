import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const nodeModulesDir = path.join(dirname, 'node_modules');
const allowedFsPaths = [dirname];

if (fs.existsSync(nodeModulesDir)) {
  allowedFsPaths.push(fs.realpathSync(nodeModulesDir));
}

export default defineConfig({
  plugins: [tailwindcss(), react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    fs: {
      allow: allowedFsPaths
    },
    watch: {
      ignored: ["**/src-tauri/**"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src")
    }
  }
});
