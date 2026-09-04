import { env } from '$env/dynamic/public';

export const SITE_URL = env.PUBLIC_SITE_URL || 'https://immigrationdaybook.com';

/** Where the newsletter comes from. Linked from the footer and named in the schema. */
export const PUBLISHER_URL = 'https://recoveredfactory.net';
