import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: '/app/',

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,

    watch: {
      usePolling: true,
    },

    hmr: {
      host: 'localhost',
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})