import { error } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages';

export const load = () => {
  throw error(404, m.post_not_found());
};
