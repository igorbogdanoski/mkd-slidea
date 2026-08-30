import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Slow hardware (and og-png's WASM cold start) needs more than the 5s
    // default before a test is declared dead.
    testTimeout: 30000,
    hookTimeout: 30000,
    // One file at a time: parallel forks workers time out starting on slow
    // machines, which made the collected file set differ from run to run.
    fileParallelism: false,
    // threads, not forks: spawning child-process workers exceeds the pool's
    // start budget on memory-pressured machines.
    pool: 'threads',
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
