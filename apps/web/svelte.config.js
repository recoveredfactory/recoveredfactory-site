import adapter from 'svelte-kit-sst';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { codeToHtml } from 'shiki';

async function highlighter(code, lang) {
  const html = await codeToHtml(code, {
    lang: lang || 'text',
    theme: 'github-light',
  });
  const escaped = html.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return `{@html \`${escaped}\`}`;
}

const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({
      extensions: ['.md'],
      highlight: { highlighter },
    }),
    vitePreprocess(),
  ],
  kit: {
    adapter: adapter(),
  },
};

export default config;
