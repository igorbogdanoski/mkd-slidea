import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules', 'dist', 'tests/**', 'playwright/**',
      // These files use node:test runner — run them with `node --test` instead
      'src/__tests__/embeddings.test.js',
      'src/__tests__/seoHelpers.test.js',
      'src/__tests__/questionsCore.test.js',
    ],
  },
});
