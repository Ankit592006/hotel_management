import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          const ignoreAbort = (err) => {
            if (err && ['ECONNABORTED', 'ECONNRESET', 'EPIPE'].includes(err.code)) {
              return;
            }
            console.error('[vite] socket.io proxy error:', err?.message || err);
          };
          proxy.on('error', ignoreAbort);
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', ignoreAbort);
          });
        }
      }
    }
  }
});
