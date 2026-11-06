import { redirect } from '@sveltejs/kit';

// recoveredfactory.net/police: a short address people can type, for the Cleveland Police Discipline
// video (11/5), since Instagram won't make its links clickable. Temporary (302) so it can point
// somewhere else later; the UTM tags show Signal Cleveland where the visits came from.
export const GET = () => {
  throw redirect(
    302,
    'https://cleveland-police-discipline.signalcleveland.org/?utm_source=recoveredfactory&utm_medium=social&utm_campaign=police-video',
  );
};
