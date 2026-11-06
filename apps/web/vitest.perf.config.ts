import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'web-perf',
    environment: 'node',
    include: ['src/**/*.perf.test.ts'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
