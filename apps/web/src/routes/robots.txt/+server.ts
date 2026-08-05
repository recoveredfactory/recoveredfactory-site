import { env } from '$env/dynamic/public';
import { SITE_URL } from '$lib/config';

// Served as a route rather than a static file for one reason that matters: the
// staging stage (cms--stage.recoveredfactory.net) runs the same build as
// production, and with no robots.txt at all — the state this site was in until
// now — every staging URL was crawlable and competing with the real one. Staging
// gets a blanket disallow; production gets the real file.
const IS_PROD = env.PUBLIC_STAGE === 'prod';

// Named explicitly because the Daybook archive is meant to be read by these,
// and silence is not the same as permission — several of these agents treat an
// absent or ambiguous rule conservatively. Google-Extended and
// Applebot-Extended are not crawlers at all: they are the opt-out controls for
// training use, so allowing them is a deliberate yes to that.
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
