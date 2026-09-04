type EventData = Record<string, unknown>;

type Umami = {
  track: (event: string, data?: EventData) => void;
};

export const trackEvent = (event: string, data?: EventData) => {
  if (typeof window === 'undefined') return;
  const umami = (window as { umami?: Umami }).umami;
  if (!umami || typeof umami.track !== 'function') return;
  umami.track(event, data);
};
