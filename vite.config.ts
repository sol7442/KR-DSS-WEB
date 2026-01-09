import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    server: {
      port: 5173,
      open: true,
      proxy: { // 백엔드 API 프록시
        '/kr-dss': { // /kr-dss 로 시작하는 요청은 전부 백엔드로 전달
          target: 'http://localhost:8081', // 백엔드 서버 주소
          changeOrigin: true,
          secure: false,
        },   
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
