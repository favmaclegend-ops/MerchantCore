import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // react-progressive-graceful-image's observer dependency relies on
      // ReactDOM.findDOMNode, which was removed in React 19. Point it at a small
      // local, React 19-safe replacement.
      '@researchgate/react-intersection-observer': path.resolve(
        __dirname,
        './src/lib/intersectionObserverStub.tsx',
      ),
    },
  },
  build: {
    // Every eagerly-loaded chunk stays well under 250 kB; the only chunks above this
    // limit are the lazy FortuneSheet editor (core ~2.4 MB / excel ~1.2 MB), fetched
    // only when the spreadsheet route is opened. 2500 keeps that on-demand split quiet
    // while still flagging any accidentally-large eager chunk.
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // FortuneSheet matches `react` below (its package path contains "react"),
          // so it must be bucketed first — otherwise the whole editor (~2 MB) gets
          // pulled into the eagerly-loaded react chunk. Kept in its own chunks, it is
          // only fetched when the lazy-loaded spreadsheet route is opened.
          if (id.includes('@fortune-sheet/react')) return 'fortune-sheet-react'
          if (id.includes('@fortune-sheet')) return 'fortune-sheet-core'
          if (id.includes('@corbe30/fortune-excel')) return 'fortune-excel'
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
