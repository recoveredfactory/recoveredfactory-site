import adapter from 'svelte-kit-sst';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Immigration Daybook's own site. A SvelteKit app of its own rather than a
// host-aware render of the Recovered Factory site: the two are separate
// publications with separate designs, and they only share an AWS account.
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
