import {defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  clearScreen: false,
  server: {
    // Tauri expects a fixed port, fail if that port is not available
    port: 3000,
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 3001,
        }
      : undefined,
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'es2022',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Rolldown requires manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/vue/') || id.includes('/pinia/') || id.includes('/vue-router/')) return 'vue';
            if (id.includes('/@tauri-apps/')) return 'tauri';
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.spec.js'],
  },
});
