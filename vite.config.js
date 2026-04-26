import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // Heavy libs split into their own chunks so they only load
          // when actually needed (Recharts only on Analytics/Stats; D3
          // only on word cloud; jszip/tesseract only on PPTX import).
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('canvas-confetti') || id.includes('qrcode')) return 'vendor-fx';
          if (id.includes('jszip') || id.includes('tesseract')) return 'vendor-import';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
})
