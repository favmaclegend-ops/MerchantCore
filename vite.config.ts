import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('elk-components')) return 'elk-components'
          if (id.includes('lucide-react')) return 'lucide'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
          return 'vendor'
        },
      },
    },
  },
})
