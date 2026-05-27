// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    functionPerRoute: false,
    edgeMiddleware: false,
  }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['lucide-react', '@xyflow/react']
    }
  }
});