import { requireMember } from '$lib/server/requireMember';

export const load = async (event) => {
  const member = await requireMember(event, { paid: true });
  return { member };
};
