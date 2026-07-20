/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	plugins: [react(), svgr()],

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

	test: {
		environment: 'jsdom',
		globals: false,
		setupFiles: ['./src/test/setup.ts'],
	},
})