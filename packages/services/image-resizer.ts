// services/image-resizer.ts
import sharp from 'sharp';

// Output formats. WebP stays the default so on-page images are unaffected;
// `f=jpeg` exists for social cards, because not every scraper reads WebP —
// LinkedIn in particular may drop the image and render a card with no art.
const CONTENT_TYPES = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
} as const;

type OutputFormat = keyof typeof CONTENT_TYPES;

const resolveFormat = (value: unknown): OutputFormat => {
  const requested = String(value ?? '').toLowerCase();
  if (requested === 'jpeg' || requested === 'jpg') return 'jpeg';
  if (requested === 'png') return 'png';
  return 'webp';
};

export const handler = async (event: any) => {
  const imageUrl = event.queryStringParameters?.url;
  const width = parseInt(event.queryStringParameters?.w || '400', 10);
  const qualityParam = parseInt(event.queryStringParameters?.q || '85', 10);
  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);
  const quality = clamp(isNaN(qualityParam) ? 85 : qualityParam, 50, 95);
  const format = resolveFormat(event.queryStringParameters?.f);

  if (!imageUrl) {
    return {
      statusCode: 400,
      body: 'Missing image URL',
    };
  }

  let requestedUrl = imageUrl;
  const siteBase = process.env.SITE_BASE_URL;
  if (siteBase && requestedUrl.startsWith('/')) {
    requestedUrl = siteBase.replace(/\/+$/, '') + requestedUrl;
  }
  if (siteBase && requestedUrl.startsWith('://')) {
    requestedUrl = `https:${requestedUrl}`;
  }

  const allowedHosts = (process.env.ALLOWED_IMAGE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedHosts.length) {
    allowedHosts.push('airtableusercontent.com');
  }

  let hostname = '';
  try {
    hostname = new URL(requestedUrl).hostname.toLowerCase();
  } catch {
    return {
      statusCode: 400,
      body: 'Invalid image URL',
    };
  }

  const hostAllowed = allowedHosts.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );

  if (!hostAllowed) {
    return {
      statusCode: 403,
      body: 'Image host not permitted',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(requestedUrl, {
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Image fetch failed', {
        requestedUrl,
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error('Failed to fetch image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pipeline = sharp(buffer, { failOn: 'none' }).rotate();

    if (Number.isFinite(width) && width > 0) {
      pipeline.resize(width);
    }

    // PNG ignores `quality` in sharp's encoder, so it's set apart from the
    // lossy formats rather than passed an option it would discard.
    const resized = await (format === 'png'
      ? pipeline.toFormat('png')
      : pipeline.toFormat(format, { quality })
    ).toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': CONTENT_TYPES[format],
        'Cache-Control': 'public, max-age=31536000',
      },
      body: resized.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('Image processing error', {
      requestedUrl,
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
    });
    return {
      statusCode: 500,
      body: 'Image processing error',
    };
  }
};
