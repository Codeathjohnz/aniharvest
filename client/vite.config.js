import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the production build run from http://localhost/April/client/dist/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
});
