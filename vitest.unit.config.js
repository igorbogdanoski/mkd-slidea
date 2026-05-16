import { defineConfig } from 'vitest/config';

// Unit-only config: без React plugin (vitest 4 + @vitejs/plugin-react клинч)
// и без jsdom (овие тестови се pure JS utilities).
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'tests/**', 'playwright/**'],
  },
});
