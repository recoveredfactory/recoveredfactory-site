import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pickError, placePick } from './pick.mjs';

const pdfPick = {
  story: 'cover',
  pdf: 'https://www.govinfo.gov/content/pkg/FR-2026-10-14/pdf/2026-20956.pdf',
  quote: 'The response period to a Notice of Intent to Terminate (NOIT) is reduced from thirty to ten days.',
  mark: 'from thirty to ten days',
  caption: 'Interim final rule, Federal Register, Oct. 14, 2026',
};

test('a pick is a pdf with a quote, or an image, never both', () => {
  assert.equal(pickError(pdfPick), undefined);
  assert.equal(pickError({ image: 'https://example.org/chart.png' }), undefined);
  assert.equal(pickError({ ...pdfPick, mark: ['thirty', 'ten days'], page: 3 }), undefined);
  assert.match(pickError({ ...pdfPick, image: 'https://example.org/x.png' }), /not both/);
  assert.match(pickError({ story: 'cover' }), /not both/);
  assert.match(pickError({ ...pdfPick, quote: '' }), /quote/);
  assert.match(pickError({ ...pdfPick, pdf: 'file:///etc/passwd' }), /http/);
  assert.match(pickError({ ...pdfPick, page: 0 }), /page/);
  assert.match(pickError([pdfPick]), /object/);
});

test('a pick goes on the cover, or on the story its words name, or nowhere', () => {
  const deck = () => ({ date: '2026-10-14', beats: [{ headline: 'Texas prosecutor says an ICE vehicle strike may have been intentional' }] });
  const shown = { src: 'data:image/png;base64,', marks: [], dims: [], caption: '' };

  const cover = deck();
  assert.ok(placePick(cover, shown, undefined, 'en'));
  assert.equal(cover.pick, shown);

  const story = deck();
  assert.ok(placePick(story, shown, 'ICE vehicle strike', 'en'));
  assert.equal(story.beats[0].pick, shown);
  assert.equal(story.pick, undefined);

  const missing = deck();
  assert.equal(placePick(missing, shown, 'San Antonio', 'en'), false);
  assert.equal(missing.pick, undefined);
  assert.equal(missing.beats[0].pick, undefined);
});
