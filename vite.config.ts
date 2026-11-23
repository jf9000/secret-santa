import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative paths, so the same build works at a GitHub Pages subpath or a custom domain.
  base: './',
  plugins: [react(), tailwindcss()],
})
