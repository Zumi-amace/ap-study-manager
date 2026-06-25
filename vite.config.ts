import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isGitHubPages = env.GITHUB_PAGES === 'true';

  return {
    base: isGitHubPages ? '/ap-study-manager/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'AP Study Manager',
          short_name: 'AP Study',
          lang: 'ja',
          dir: 'ltr',
          description: '応用情報技術者試験 午前対策の学習管理アプリ',
          theme_color: '#0f766e',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: 'index.html',
          runtimeCaching: []
        }
      })
    ]
  };
});
