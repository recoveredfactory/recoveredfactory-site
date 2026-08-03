import { env } from '$env/dynamic/public';

type ResizeOptions = {
  width?: number;
  quality?: number;
  /** Defaults to WebP on the resizer. See `getSocialImageUrl`. */
  format?: 'webp' | 'jpeg' | 'png';
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const getResizedImageUrl = (source: string, options: ResizeOptions = {}) => {
  if (!source) return '';

  const resizer = env.PUBLIC_IMAGE_RESIZER_URL;
  if (resizer) {
    const url = new URL(resizer);
    url.searchParams.set('url', source);
    if (options.width) {
      url.searchParams.set('w', String(options.width));
    }
    if (options.quality) {
      url.searchParams.set('q', String(options.quality));
    }
    if (options.format) {
      url.searchParams.set('f', options.format);
    }
    return url.toString();
  }

  if (isAbsoluteUrl(source)) {
    return source;
  }

  if (env.PUBLIC_SITE_URL) {
    return new URL(source, env.PUBLIC_SITE_URL).href;
  }

  return source;
};

/**
 * Variant for `og:image` / `twitter:image`.
 *
 * Forces JPEG. The resizer's default is WebP, which not every social scraper
 * reads reliably — LinkedIn's may skip the image and render a card with no art.
 * Still goes through the resizer rather than linking the raw file, so an
 * oversized source (some previewImages are multi-megabyte photos) can't push a
 * card past the platforms' file-size limits.
 */
export const getSocialImageUrl = (source: string, width = 1200) =>
  getResizedImageUrl(source, { width, format: 'jpeg', quality: 90 });
