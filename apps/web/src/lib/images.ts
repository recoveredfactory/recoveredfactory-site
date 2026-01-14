import { env } from '$env/dynamic/public';
import { SITE_URL } from '$lib/config';

type ResizeOptions = {
  width?: number;
  quality?: number;
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
    return url.toString();
  }

  if (isAbsoluteUrl(source)) {
    return source;
  }

  return new URL(source, SITE_URL).href;
};
