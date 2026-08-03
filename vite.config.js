import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  esbuild: {
    // CRA-style project: JSX lives in .js files (not .jsx)
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
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
});
