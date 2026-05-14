import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jsontools.erikdao.com',
  integrations: [preact(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
