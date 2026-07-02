import { defineConfig } from 'astro/config';

// https://astro.build
export default defineConfig({
  site: 'https://wadenormanwatercolors.com',
  image: {
    // Sharp is the default service; explicit for clarity.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
