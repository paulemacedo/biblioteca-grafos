import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, o Vite roda em :5173 e repassa /api e /uploads
// para o backend Express em :3000. O build sai direto em server/public,
// de onde o Express serve o site em produção.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
});
