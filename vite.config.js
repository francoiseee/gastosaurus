import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep images as their own cached files instead of inlining them into the JS bundle.
    assetsInlineLimit: 1024,
  },
  server: {
    // Forward /api/* to the Express backend (cd server && npm run dev)
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
