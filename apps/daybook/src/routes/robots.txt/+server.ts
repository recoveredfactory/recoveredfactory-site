import { env } from '$env/dynamic/public';
import { SITE_URL } from '$lib/config';

// A route rather than a static file so the staging stage, which runs the same
// build, gets a blanket disallow instead of competing with the real site.
const IS_PROD = env.PUBLIC_STAGE === 'prod';

// Named explicitly because the archive is meant to be read by these, and
// silence is not the same as permission. Google-Extended and Applebot-Extended
// are the opt-out controls for training use, so allowing them is a deliberate
// yes to that.
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'Amazonbot',
  'cohere-ai',
];

export const GET = () => {
  const sitemap = new URL('/sitemap.xml', SITE_URL).href;

  const body = IS_PROD
    ? [
        ...AI_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        `Sitemap: ${sitemap}`,
        '',
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
