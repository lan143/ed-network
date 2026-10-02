import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'edn-network-ui.js',
    },
    minify: true,
    sourcemap: false,
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});
