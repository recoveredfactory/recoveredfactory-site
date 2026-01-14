import adapter from 'svelte-kit-sst';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [mdsvex({ extensions: ['.md'] }), vitePreprocess()],
  kit: {
    adapter: adapter(),
  },
};

export default config;
