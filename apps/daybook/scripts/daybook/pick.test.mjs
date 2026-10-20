import assert from 'node:assert/strict';
import { test } from 'node:test';

import { asPick, loadPick, pickError, placement, placePick, sniffImage, withEnglishImages } from './pick.mjs';

const pdfPick = {
  story: 'cover',
  pdf: 'https://www.govinfo.gov/content/pkg/FR-2026-10-14/pdf/2026-20956.pdf',
  quote: 'The response period to a Notice of Intent to Terminate (NOIT) is reduced from thirty to ten days.',
  mark: 'from thirty to ten days',
  caption: 'Interim final rule, Federal Register, Oct. 14, 2026',
};

test('a pick is one of a pdf with a quote, an image link or image data', () => {
  assert.equal(pickError(pdfPick), undefined);
  assert.equal(pickError({ image: 'https://example.org/chart.png' }), undefined);
  assert.equal(pickError({ ...pdfPick, mark: ['thirty', 'ten days'], page: 3 }), undefined);
  assert.equal(pickError({ data: 'iVBORw0KGgo=' }), undefined);
  assert.match(pickError({ ...pdfPick, image: 'https://example.org/x.png' }), /one of/);
  assert.match(pickError({ image: 'https://example.org/x.png', data: 'iVBORw0KGgo=' }), /one of/);
  assert.match(pickError({ story: 'cover' }), /one of/);
  assert.match(pickError({ data: '' }), /base64/);
  assert.match(pickError({ image: 'nope' }, 'social.slides[2].image'), /^social\.slides\[2\]\.image: the image's link/);
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

// A 1x1 PNG, as the desk would send one (2026-10-19).
const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('a slide’s image is a link, a {url}, a pdf or bytes, taken as a pick', () => {
  assert.deepEqual(asPick('https://example.org/a.png'), { image: 'https://example.org/a.png' });
  assert.deepEqual(asPick({ url: 'https://example.org/a.png', caption: 'A', story: 'ignored' }), { image: 'https://example.org/a.png', caption: 'A' });
  assert.deepEqual(asPick({ pdf: 'https://x.org/a.pdf', quote: 'Q' }), { pdf: 'https://x.org/a.pdf', quote: 'Q' });
  assert.deepEqual(asPick({ data: PNG_1PX, type: 'image/png' }), { data: PNG_1PX, type: 'image/png' });
});

test('image bytes are drawn as what they are, whatever they claim', async () => {
  assert.equal(sniffImage(Buffer.from(PNG_1PX, 'base64')), 'image/png');
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), null);

  const shown = await loadPick({ data: PNG_1PX, type: 'image/jpeg' }, { work: '/nonexistent' });
  assert.equal(shown.src, `data:image/png;base64,${PNG_1PX}`);

  const warn = console.warn;
  const said = [];
  console.warn = (...args) => said.push(args.join(' '));
  try {
    assert.equal(await loadPick({ data: Buffer.from('not an image').toString('base64') }, { work: '/nonexistent', label: 'x: ' }), null);
  } finally {
    console.warn = warn;
  }
  assert.match(said[0], /not a PNG, JPEG, WebP or GIF\)\. Text only\./);
});

test('a Spanish slide with no image takes the English one in its place, its caption translated', () => {
  const en = [
    { story: 'cover', line: 'A' },
    { story: 'cover', line: 'B', image: { url: 'https://b.example/fr.png', caption: 'Federal Register', caption_es: 'Registro Federal' } },
  ];
  const es = [{ story: 'cover', line: 'A es' }, { story: 'cover', line: 'B es' }];
  assert.deepEqual(withEnglishImages(es, en), [
    { story: 'cover', line: 'A es' },
    { story: 'cover', line: 'B es', image: { image: 'https://b.example/fr.png', caption: 'Registro Federal', caption_es: 'Registro Federal' } },
  ]);
  // Its own image wins.
  const own = [{ story: 'cover', line: 'A es' }, { story: 'cover', line: 'B es', image: 'https://b.example/es.png' }];
  assert.equal(withEnglishImages(own, en)[1].image, 'https://b.example/es.png');
  // Lists that don't line up are left alone, with a warning.
  const warn = console.warn;
  const said = [];
  console.warn = (...args) => said.push(args.join(' '));
  try {
    assert.deepEqual(withEnglishImages(es.slice(0, 1), en), es.slice(0, 1));
  } finally {
    console.warn = warn;
  }
  assert.match(said[0], /1 entries where the English has 2/);
});

test('a pick can name its story by section number', () => {
  const deck = { date: '2026-10-19', beats: [{ section: 3, headline: 'Three' }] };
  const shown = { src: 'data:image/png;base64,', marks: [], dims: [], caption: '' };
  assert.ok(placePick(deck, shown, 3, 'en'));
  assert.equal(deck.beats[0].pick, shown);
});

test('a photo is cropped to fit, around its focus; a document crop, or an image asked whole, is not', () => {
  const plain = { src: 'data:', marks: [], dims: [] };
  assert.deepEqual(placement({ image: 'https://x.org/a.jpg' }, plain), { photo: true, focus: 'center' });
  assert.deepEqual(placement({ data: 'x', focus: 'Top' }, plain), { photo: true, focus: 'center top' });
  assert.deepEqual(placement({ image: 'https://x.org/a.jpg', focus: '40% 25%' }, plain), { photo: true, focus: '40% 25%' });
  assert.deepEqual(placement({ image: 'https://x.org/a.jpg', focus: 'url(evil)' }, plain), { photo: true, focus: 'center' });
  assert.deepEqual(placement({ image: 'https://x.org/chart.png', fit: 'whole' }, plain), {});
  assert.deepEqual(placement({ pdf: 'https://x.org/a.pdf', quote: 'q' }, { ...plain, marks: [{ l: 0, t: 0, w: 1, h: 1 }] }), {});
});
