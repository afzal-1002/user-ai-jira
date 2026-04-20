import { defineConfig } from 'vite';
import { ngrokConfig } from './src/config/ngrok.config';

const backendTarget =
  process.env['VITE_BACKEND_URL'] ||
  (ngrokConfig.enabled ? ngrokConfig.backend : ngrokConfig.localBackend);

export default defineConfig({
  server: {
    host: true,
    port: 4200,
    allowedHosts: ['**'],
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
