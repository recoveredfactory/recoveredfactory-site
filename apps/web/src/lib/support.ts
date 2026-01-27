import { env } from '$env/dynamic/public';

const FALLBACK_LINKS = {
  monthly12: 'https://buy.stripe.com/test_9B628semw6lPbMdeKa9IQ00',
  monthly75: 'https://buy.stripe.com/test_7sYaEY3HS7pTdUl7hI9IQ01',
  oneTime: 'https://buy.stripe.com/test_4gM28s7Y8dOh4jL31s9IQ02',
};

export const SUPPORT_LINKS = {
  monthly12: env.PUBLIC_SUPPORT_LINK_MONTHLY_12 || FALLBACK_LINKS.monthly12,
  monthly75: env.PUBLIC_SUPPORT_LINK_MONTHLY_75 || FALLBACK_LINKS.monthly75,
  oneTime: env.PUBLIC_SUPPORT_LINK_ONCE || FALLBACK_LINKS.oneTime,
};

export const SUPPORT_CONTACT_URL = 'mailto:davideads@recoveredfactory.net';
