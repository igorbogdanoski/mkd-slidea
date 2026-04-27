import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Only split truly leaf, non-React-dependent libs into separate chunks.
        // React-using libs (recharts, framer-motion, lucide) MUST remain with
        // React in the base vendor chunk to avoid circular import errors like
        // "Cannot read properties of undefined (reading 'forwardRef')".
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('jszip') || id.includes('tesseract')) return 'vendor-import';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('canvas-confetti') || id.includes('qrcode')) return 'vendor-fx';
          return 'vendor';
        },
      },
    },
  },
})
