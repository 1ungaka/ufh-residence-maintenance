import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server runs on port 5173 and talks to the API on port 4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true // also reachable from another device on the same network
  }
});
