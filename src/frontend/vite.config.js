import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',  // Racine du projet (où se trouve index.html)
  build: {
    outDir: 'dist',  // Dossier de sortie
    emptyOutDir: true,  // Nettoie le dossier dist avant le build
  },
});