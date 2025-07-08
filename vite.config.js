import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_API_BASE_URL;
  console.log('VITE running in mode:', mode);
  console.log('Using backend URL:', backendUrl); // Debugging line to check the URL
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api/v1': {
          target: backendUrl,
          changeOrigin: true,
          ws: false,
        },
      },
    },
  };
});
