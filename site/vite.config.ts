import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site under /<repo>/ — keep in sync with the repo name.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/thewomenshealthrecord/',
})
