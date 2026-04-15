import { defineConfig } from 'vite';
import { ngrokConfig } from './src/config/ngrok.config';

export default defineConfig({
  server: {
    host: true,
    port: 4200,
    allowedHosts: ['**'],
    proxy: {
      '/api': {
        target: ngrokConfig.localBackend,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
