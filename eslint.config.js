import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'node_modules', 'public', 'test-results', 'playwright-report'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Only the two classic hooks rules — eslint-plugin-react-hooks v7's
      // "recommended" preset also bundles dozens of experimental React
      // Compiler diagnostics (preserve-manual-memoization, refs,
      // set-state-in-effect, purity, ...) that flag long-standing, working
      // patterns across the whole codebase. Those are a React Compiler
      // migration concern, not a lint-hygiene one — out of scope here.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['api/**/*.js', 'scripts/**/*.{js,mjs}', '*.config.js', 'vitest.*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js', 'src/__tests__/**/*.js', 'tests/**/*.js', 'playwright/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
];
