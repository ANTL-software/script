/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOSTING_PLATFORM?: 'cloudflare' | 'vercel';
}
