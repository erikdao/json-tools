import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    coverage: { include: ['src/lib/**'], reporter: ['text', 'lcov'] },
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
