// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server', // SSR mode for dynamic routes
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare(),
  site: 'https://blog.example.com'
});
// Trigger restart - force cache clear
