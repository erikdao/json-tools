import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jsontools.erikdao.com',
  integrations: [preact(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
