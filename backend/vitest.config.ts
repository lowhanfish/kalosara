import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*', ...(process.env.RUN_DB_TESTS === '1' ? [] : ['**/*.db.test.ts'])],
  },
});
