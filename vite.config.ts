import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { IndexHtmlTransformContext } from 'vite';

// Plugin pour injecter la version dans le service worker (même approche que USV)
const injectVersion = () => {
  return {
    name: 'inject-version',
    buildStart() {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      const version = `${year}.${month}.${day}.${hours}${minutes}.${seconds}`;

      process.env.VITE_APP_VERSION = version;
    },
    writeBundle() {
      const swPath = join(__dirname, 'dist/sw.js');
      const publicSwPath = join(__dirname, 'public/sw.js');

      try {
        let swContent = readFileSync(publicSwPath, 'utf8');
        swContent = swContent.replace(/__BUILD_VERSION__/g, process.env.VITE_APP_VERSION || 'unknown');
        writeFileSync(swPath, swContent);
        console.log(`✅ Service Worker version updated: ${process.env.VITE_APP_VERSION}`);
      } catch (error) {
        console.warn('⚠️ Could not update service worker version:', error);
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), injectVersion()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['react-icons'],
        }
      }
    },
    copyPublicDir: true,
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
