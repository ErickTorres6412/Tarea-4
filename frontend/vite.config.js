import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' permite publicar dist/ en cualquier ruta (p. ej. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [vue()]
})
