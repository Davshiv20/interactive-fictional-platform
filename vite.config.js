import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['tesseract.js'],
    include: ['tesseract.js']
  },
  resolve: {
    alias: {
      // Ensure proper resolution of tesseract.js
    }
  }
})

