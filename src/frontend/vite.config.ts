import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],

	base: '/',

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

		proxy: {
			'/auth': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false,
			},
		},
	},

	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
})