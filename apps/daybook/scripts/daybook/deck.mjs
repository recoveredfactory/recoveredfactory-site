// The Instagram deck, cut from an edition's markdown: the story beats, the
// round-up, the calendar board. Moved out of pull.mjs so a deck can be built
// from something other than a pull — record-deck.mjs builds one from a
// daybook/1 edition record — without running the pull, which does its work at
// module top level. Everything below is pull.mjs's, moved as it was.

// Standing rubrics ("Upcoming", "Around the system", "Who saw what?",
// "Próximamente", "¿Quién vio qué?", "Alrededor del sistema") are section
// furniture, not beats. They are reliably short where a story headline is a
// full clause, so length separates them without hardcoding a list per language.
// The longest rubric yet is 21 characters; 35 was the cutoff until 2026-09-15,
// and it ate "Spotlight turns to children" (27), "A narrower margin after a job
// ends" (34) and "Public charge returns to the courts" (35) as furniture.
const RUBRIC_MAX_CHARS = 25;

// Length alone stopped being enough on 2026-09-29: "Children before the judge"
// (25) and "ICE’s quieter dragnet" (21) were stories, and the English deck and
// dek lost both while the Spanish kept "La redada más discreta de ICE" (29). So a
// short headline is a rubric only when the section under it is shaped like one —
// see isRubric. A story is a paragraph or two opening on a bolded claim; every
// round-up set as bold-lead paragraphs so far has run four items or more.
const STORY_MAX_LEADS = 3;

// Carousel tuning.
//
// Six slides: cover, two stories, two calendar, the terms. The lede has no
// slide of its own — its nut sentence shares the cover with the hed that was
// written off it — so these two beats are the stories a reader has not been
// told yet.
export const CAROUSEL_BEATS = 2;

// A nut sentence longer than this is one nobody reads off a phone.
const NUT_MAX_CHARS = 320;

// The supporting sentence that rides under the nut on a story slide. The nut is
// the claim; this is the first thing the edition offers in support of it, and
// without it a slide is a headline and a restatement of the headline.
//
// Budgeted against Spanish, which runs 20-30% longer than the English it is
// translated from. The slide scales its own type to fill the frame, so a long
// one costs a size step rather than an overflow — but past this the step is one
// nobody reads at arm's length.
const DETAIL_MAX_CHARS = 280;

// The slide's one block of prose (David, 2026-10-17: "~2 sentences in most
// cases", and only one level of it). The claim, then the first sentence the
// edition offers in support of it, run together as one paragraph. The detail
// tier used to sit under the claim in smaller type, which was a third level on a
// card with room for two.
//
// A whole second sentence may run the line to LINE_WHOLE_MAX. Past that the
// support is cut on a clause within LINE_MAX_CHARS, and never mid-phrase: where
// it has no clause mark in range, or the room left is too short to say
// anything, the claim stands alone. A line ending "…or preserve potential
// vehicle…" reads as a card that broke. The four EN stories of 2026-10-14 ran
// 284-447 characters as two whole sentences; three of them now run whole.
const LINE_MAX_CHARS = 380;
const LINE_WHOLE_MAX = 420;
const LINE_SUPPORT_MIN = 70;

// Publications credited on a story slide. Beyond three the credit line stops
// reading as attribution and starts reading as a list, and the fourth name is
// always the one nobody has heard of.
const CAROUSEL_SOURCES = 3;

// When the bolded claim only says the headline again.
//
// The automation writes a compressed lead for every section, and on a section
// whose headline is already specific that lead can come out as the headline in
// longer words — "Trump signs birthright-citizenship and birth-tourism orders",
// then "President Trump signed two immigration executive orders on Aug. 6." Two
// tiers of a slide saying one thing, and the actual news (what the two orders
// do) pushed off the card.
//
// So a claim that is both short and largely built from the headline's own words
// is dropped, and the sentences under it move up a tier. Both conditions have
// to hold: a long claim carries specifics whatever it shares with the headline
// — the TPS lead repeats "TPS" and "Haitians" and then gives a date, a court
// and an outcome — and a short claim with fresh words is a real second beat.
//
// This edits the edition rather than copying it, which is a bigger licence than
// the rest of this file takes. It is bounded to dropping a sentence the
// headline has already made, it says so on the console when it fires, and no
// deck posts without someone looking at it.
const RESTATEMENT_MAX_CHARS = 100;
const RESTATEMENT_OVERLAP = 0.3;

// A promoted sentence is prose written to run under a claim, not to be one, so
// it gets a tighter budget than a claim written for the job.
const PROMOTED_NUT_MAX = 240;

// Not a linguistic stoplist — just the words common enough on both sides to
// make an overlap ratio meaningless. English and Spanish together, because the
// test runs on whichever language the edition was written in.
const STOPWORDS = new Set(
  ('the and for that with from has have had its are was were will would this these those but not '
    + 'который los las del por con que una unos unas sus son han fue este esta estas estos como para '
    + 'sobre entre mientras donde their there they them then than also into over under after before '
    + 'been being more most some such only other another where which while about')
    .split(/\s+/)
    .filter(Boolean),
);

// Abbreviations that end in a period without ending a sentence. Three-letter
// capitals are deliberately absent: a sentence ending in ICE, DHS or ORR is far
// commoner in this corpus than one that does not.
const ABBREVIATIONS = new Set(
  ('mr mrs ms dr sr sra st no inc rep sen gov vs jan feb mar apr aug sept sep oct nov dec')
    .split(' '),
);

// One calendar slide, up to four dated entries on it, and never fewer than
// three.
//
// This used to be two slides of two, on the reasoning that four deadlines is a
// useful number to screenshot and eight is a document. Four was the right
// number; two slides was not. The entries arrived at 420 characters apiece, so
// each slide came out as two paragraphs of Federal Register prose under a date,
// which is a document at two entries just as surely as at eight — and it cost a
// third of the deck to say what one card says better.
//
// One board instead: every deadline the edition published, in date order, each
// cut to the clause that carries the number. The full text is what the
// newsletter is for.
const UPCOMING_SLIDES = 1;
const UPCOMING_PER_SLIDE = 4;

// A board of two entries is a list; three is a board. Below that the slide is
// dropped rather than shipped half-empty — which is the same rule the two-up
// slides had, set at the number a single board needs.
const UPCOMING_MIN_PER_SLIDE = 3;

// Watch-item summaries are written to explain a rule, not to fit a card, and on
// a board four of them share the room two used to have. So this is a clause
// budget rather than a paragraph one: enough for the fact and the number under
// it — "DHS wants to raise the cost of applying for US citizenship (Form N-400)
// from $760 to $1,330 on paper, and $710 to $1,280 online" — and the rest of the
// rule is in the edition, which is where someone acting on a deadline should be
// reading it anyway.
//
// Set against Spanish rather than English: the same entry runs 20-30% longer in
// Spanish, and a budget that fits the English cut "…de la Oficina de" off the
// end of the Spanish one, which is worse than a smaller type size.
const UPCOMING_MAX_CHARS = 190;

// The round-up slide: the edition's last section, the one that is a list of
// briefs under a short rubric rather than a story under a headline.
//
// The deck used to throw this away entirely. An edition carries three or four
// stories and then six or seven items in a closing list, and the carousel read
// the stories and stopped — so a reader who swiped the whole deck saw a third of
// the day. The list is the cheapest breadth in the newsletter and it was going
// nowhere.
//
// Four of them, and never fewer than three. They run in the edition's own
// order: which item leads a round-up is an editorial call that was already made.
//
// Four rather than three because of how the slide is set. Every size on a
// portrait slide is a multiple of --fit and the fitter grows the type until the
// card is full, so a card with three short briefs on it does not come out
// roomy — it comes out with the briefs set larger than the nut sentence on the
// cover, which says a one-line item matters more than the day's lead. Four
// items is the number that fills the frame at the size this prose should be.
export const BRIEFS = 4;
export const BRIEFS_MIN = 3;

// One sentence each. The bullets open with the news and then qualify it for
// another two sentences — "…the nonbinding resolutions came amid renewed
// progressive anger after recent fatal ICE encounters" — and the qualification
// is what the edition is for.
const BRIEF_MAX_CHARS = 165;

// One publication a brief, not three. A story slide has the room for a credit
// line and the standing to want one; a brief is a single line, and three names
// under it is longer than the news.
const BRIEF_SOURCES = 1;

/**
 * Build the Instagram deck for one language.
 *
 * Everything here is the edition's own copy, re-cut for a 4:5 frame: the hed
 * (including a hand-set one, since this runs after the overrides), then a slide
 * per story section carrying its headline, the bolded sentence underneath, the
 * sentence that follows it, and the publications credited at the end of that
 * paragraph — all of it the automation's own copy, so the slide says what the
 * section says.
 *
 * `beats` and `briefs` are how many story slides and round-up items to take.
 * The pull's deck is the short one, CAROUSEL_BEATS and BRIEFS; the rundown
 * record-deck.mjs builds takes every story and every brief.
 */
export function buildDeck(
  { body, headline },
  date,
  events,
  shape,
  lang,
  { beats: maxBeats = CAROUSEL_BEATS, briefs: maxBriefs = BRIEFS } = {},
) {
  const sections = body.split(/\n(?=## )/);

  // Story sections, in order, rubrics dropped. The first section is the lede
  // and never a rubric whatever its length — the exemption deriveDek makes, for
  // the same reason: on 2026-09-11 "A narrower margin after a job ends" (34
  // chars) fell out here, the ICE-arrests story was taken for the lede, and the
  // cover put its claim under the H-1B hed with no slide left for it.
  const raw = sections
    .filter((section, i) => i === 0 || !isRubric(section))
    .map(readStory)
    .filter((story) => story.headline);

  // The hed on the cover is the deck's hed, which may be hand-set and is what a
  // reader actually sees; the beats are tested against their own headlines.
  const decided =
    shape?.length === raw.length
      ? shape
      : raw.map((story, i) => restatesHeadline(story.claim, i === 0 ? headline : story.headline));

  if (shape && shape.length !== raw.length) {
    console.warn(
      `WARNING: ${date} ${lang}: ${raw.length} story sections where the first language had ` +
        `${shape.length}. Deciding this deck's shape on its own copy — check the two decks match.`,
    );
  }

  const stories = raw.map((story, i) => shapeStory(story, decided[i], date, lang));

  // The lede rides on the cover under the hed and gets no slide of its own —
  // the hed was written off it, so that slide said the same thing twice. The
  // beats are what comes after.
  const { nut = '', detail = '', line = '', sources = [], links = [] } = stories[0] ?? {};
  const beats = stories.slice(1, 1 + maxBeats);

  // The calendar is the payoff, so it goes on a whole slide rather than as a
  // footnote: every deadline the edition published, up to UPCOMING_PER_SLIDE of
  // them, on one board.
  //
  // Cut on a clause rather than a sentence. A watch item's first sentence is
  // typically 200 characters carrying the whole fee schedule, so a
  // sentence-only rule either printed all of it or none of it; the clause is
  // where the number lands.
  const trimmed = events.map((entry) => ({
    ...entry,
    text: trimToClause(entry.text, UPCOMING_MAX_CHARS),
  }));

  const upcoming = [];
  for (let i = 0; i < trimmed.length && upcoming.length < UPCOMING_SLIDES; i += UPCOMING_PER_SLIDE) {
    const entries = trimmed.slice(i, i + UPCOMING_PER_SLIDE);
    // A half-empty board reads as a mistake rather than as a short week.
    if (entries.length >= UPCOMING_MIN_PER_SLIDE) upcoming.push({ entries });
  }

  return {
    deck: {
      date,
      hed: headline,
      nut,
      detail,
      line,
      sources,
      links,
      beats,
      briefs: readBriefs(sections, maxBriefs),
      upcoming,
    },
    shape: decided,
  };
}

/**
 * Is this section standing furniture rather than a story?
 *
 * A long headline is always a story. A short one is a rubric when what sits
 * under it is shaped like one: a list or subheads (the round-up, the calendar),
 * nothing opening on a bolded claim, or more bold-lead items than a story ever
 * runs. See STORY_MAX_LEADS.
 */
export function isRubric(section) {
  const headline = stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? '');
  if (headline.length > RUBRIC_MAX_CHARS) return false;

  const body = section.replace(/^## .+$/m, '');
  if (/^(?:[-*•][ \t]|#{3,6} )/m.test(body)) return true;

  const leads = body.split(/\n[ \t]*\n/).filter((block) => /^\*\*(?!\s)/.test(block.trim()));
  return leads.length === 0 || leads.length > STORY_MAX_LEADS;
}

/**
 * The round-up slide: the edition's closing list of briefs.
 *
 * Found from the end rather than by name. The rubric is different in every
 * Spanish edition — "Alrededor del sistema", "En el resto del sistema", "En todo
 * el sistema" — so a list of headings to match would be wrong within the week.
 * What is stable is the shape: a short rubric where a story has a headline, and
 * bullets where a story has paragraphs. `## Upcoming` is the only other section
 * of that shape, and it runs above this one when it survives at all, so the last
 * match is the round-up.
 *
 * The slide takes the rubric the edition wrote. A word for what these items are
 * is an editorial call and it has already been made three lines up the file.
 */
export function readBriefs(sections, limit = BRIEFS) {
  const section = [...sections]
    .reverse()
    .find(
      (block) =>
        (block.match(/^## (.+)$/m)?.[1]?.trim().length ?? Infinity) <= RUBRIC_MAX_CHARS &&
        /^-\s+\S/m.test(block),
    );
  if (!section) return null;

  const items = section
    .split('\n')
    .filter((line) => /^-\s+\S/.test(line))
    .slice(0, limit)
    .map((line) => {
      const { prose, sources } = splitCredits(line.replace(/^-\s+/, '').trim());
      const [first = ''] = splitSentences(stripInlineMd(prose));
      return {
        text: trimToClause(first, BRIEF_MAX_CHARS),
        sources: sources.slice(0, BRIEF_SOURCES),
      };
    })
    .filter((item) => item.text);

  // Short of a card it is not a round-up, it is a leftover.
  if (items.length < BRIEFS_MIN) return null;

  return { rubric: stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? ''), items };
}

/**
 * One story section, read but not yet cut.
 *
 * Everything comes off the section's lead paragraph, which is where the
 * automation puts the compressed version of the story: a bolded claim, the
 * prose that supports it, and the links it was built from.
 */
function readStory(section) {
  const headline = stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? '');
  const { prose, sources, links } = splitCredits(leadParagraph(section));

  return {
    headline,
    claim: stripInlineMd(prose.match(/\*\*(?!\s)([^*]+?)\*\*/)?.[1] ?? ''),
    rest: stripInlineMd(prose.replace(/^[\s\S]*?\*\*(?!\s)[^*]+?\*\*/, '')),
    sources: sources.slice(0, CAROUSEL_SOURCES),
    links: links.slice(0, CAROUSEL_SOURCES),
  };
}

/**
 * Cut a story into the slide's two tiers: the claim, and what supports it.
 *
 * Normally those are the bolded lead and the prose under it, straight off the
 * edition. When `promote` is set the claim only said the headline again, so it
 * comes off and everything moves up — the first sentence under it becomes the
 * claim, and the rest becomes the support. See RESTATEMENT_MAX_CHARS.
 */
function shapeStory({ headline, claim, rest, sources, links }, promote, date, lang) {
  if (!promote) {
    return {
      headline,
      nut: trimToClause(claim, NUT_MAX_CHARS),
      detail: trimToClause(rest, DETAIL_MAX_CHARS),
      line: storyLine(trimToClause(claim, NUT_MAX_CHARS), rest),
      sources,
      links,
    };
  }

  const [first = '', ...others] = splitSentences(rest);
  console.log(`${date} ${lang}: "${headline}" — dropped a claim the headline already made.`);

  return {
    headline,
    nut: trimToClause(first, PROMOTED_NUT_MAX),
    detail: trimToClause(others.join(' '), DETAIL_MAX_CHARS),
    line: storyLine(trimToClause(first, PROMOTED_NUT_MAX), others.join(' ')),
    sources,
    links,
  };
}

/**
 * The claim and its first supporting sentence as one paragraph, within `max`.
 * See LINE_MAX_CHARS.
 */
export function storyLine(claim, support) {
  const [first = ''] = splitSentences(support ?? '');
  if (!claim) return trimToClause(first, LINE_MAX_CHARS);
  if (!first) return claim;
  if (claim.length + 1 + first.length <= LINE_WHOLE_MAX) return `${claim} ${first}`;

  const room = LINE_MAX_CHARS - claim.length - 1;
  if (room < LINE_SUPPORT_MIN) return claim;
  const cut = first.slice(0, room);
  const at = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' — '));
  return at > room * 0.5 ? `${claim} ${cut.slice(0, at)}…` : claim;
}

/**
 * Calendar entries onto boards of `per`, in order, never past `chars` of text
 * on one board. A short tail (fewer than `per`) is spread back over the boards
 * before it, one entry each, when the whole tail fits that way. That makes a
 * fourth entry rather than a thin last board: 7 short entries pack 3 + 4, and 8
 * pack 4 + 4. When the tail can't be spread whole, it keeps its own board, as
 * five entries do (3 + 2).
 */
export function packBoards(entries, per, chars) {
  const length = (board) => board.reduce((n, entry) => n + entry.text.length, 0);
  const boards = [];
  for (const entry of entries) {
    const last = boards.at(-1);
    if (last && last.length < per && length(last) + entry.text.length <= chars) last.push(entry);
    else boards.push([entry]);
  }

  // The boards are re-cut from the list in order, so the calendar stays in
  // date order: the tail's entries are the latest, and the boards before it
  // each give their last place to the next entry along.
  const tail = boards.at(-1);
  if (boards.length > 1 && tail.length < per) {
    const sizes = boards.slice(0, -1).map((board) => board.length);
    const k = tail.length;
    if (k <= sizes.length && sizes.slice(-k).every((n) => n === per)) {
      for (let i = sizes.length - k; i < sizes.length; i++) sizes[i] += 1;
      const flat = boards.flat();
      let at = 0;
      const recut = sizes.map((n) => flat.slice(at, (at += n)));
      if (recut.every((board) => length(board) <= chars)) return recut;
    }
  }
  return boards;
}

/**
 * Is this claim just the headline again?
 *
 * Content words on both sides, accents folded and a crude suffix stripped so
 * "signs" and "signed" match "sign". A short claim mostly built from the
 * headline's own words is a restatement; a long one is carrying specifics
 * whatever it shares. See RESTATEMENT_MAX_CHARS for why both tests.
 */
function restatesHeadline(claim, headline) {
  if (!claim || claim.length > RESTATEMENT_MAX_CHARS) return false;

  const words = contentWords(claim);
  if (!words.length) return false;

  const inHeadline = new Set(contentWords(headline));
  const shared = words.filter((word) => inHeadline.has(word)).length;
  return shared / words.length >= RESTATEMENT_OVERLAP;
}

function contentWords(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .map((word) => word.replace(/(ing|ed|es|s)$/, ''));
}

/**
 * Split prose into sentences, without breaking on abbreviations.
 *
 * A period only ends a sentence when what follows is capitalised, and when the
 * token before it is not an abbreviation. Both halves earn their keep in this
 * corpus: "Aug. 6" is saved by the capital test (a digit follows), and the
 * Spanish "de EE. UU. donde" by the abbreviation one. Three-letter capitals are
 * deliberately NOT treated as abbreviations — a sentence ending in ICE, DHS or
 * ORR is far commoner here than one that does not.
 */
export function splitSentences(text) {
  const boundary = /([.?!])\s+(?=[“"'(\[]?\p{Lu})/gu;
  const out = [];
  let start = 0;

  for (const match of text.matchAll(boundary)) {
    const token = text.slice(start, match.index).match(/([\p{L}.]+)$/u)?.[1] ?? '';
    const bare = token.toLowerCase().replace(/\.$/, '');
    if (ABBREVIATIONS.has(bare) || /^\p{Lu}{1,2}$/u.test(token)) continue;

    out.push(text.slice(start, match.index + 1).trim());
    start = match.index + match[0].length;
  }

  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}


// The section's lead paragraph: the first one carrying a bolded claim. Sections
// open with it, but the Spanish editions sometimes carry a translator's note
// above it, and a rubric section opens with a list.
function leadParagraph(section) {
  return (
    section
      .replace(/^## .+$/m, '')
      .split('\n\n')
      .map((p) => p.trim())
      .find((p) => /\*\*(?!\s)[^*]+?\*\*/.test(p)) ?? ''
  );
}

/**
 * Split a paragraph into its prose and the publications credited at the end.
 *
 * Editions credit sources as a run of links after the final sentence —
 * `… reduce backlogs. [Axios](…), [USCIS](…)`. Only that trailing run counts:
 * links inside a sentence are part of the prose ("The [citizenship order](…)
 * requires guidance within 30 days"), and reading those as credits would put
 * half a sentence in the credit line.
 *
 * The run is allowed to close with a period, because roughly half of them do —
 * `[Newsweek](…), [Bloomberg Law](…).` — and an anchored match without it read
 * that whole edition as having no sources at all. The period belongs to the
 * citation list rather than to the prose, so it goes out with the credits.
 */
export function splitCredits(paragraph) {
  const tail = paragraph.match(/((?:\[[^\]]+\]\([^)]*\)(?:\s*,\s*)?)+)\s*\.?\s*$/);
  if (!tail) return { prose: paragraph, sources: [], links: [] };

  // The names are what the credit prints; the links ride along so the carousel
  // can set each publication's own mark beside its name (og.mjs, citeRow).
  const links = [...tail[1].matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)].map((m) => ({
    name: stripInlineMd(m[1]),
    url: m[2].trim(),
  }));
  return { prose: paragraph.slice(0, tail.index).trim(), sources: links.map((l) => l.name), links };
}

/**
 * Trim prose to a budget without leaving it mid-thought.
 *
 * A whole sentence where one lands near the budget; a whole clause where none
 * does — which is the usual case, because the sentence under a claim is often a
 * single long one carrying a list. An ellipsis after "…births in US territories
 * or" strands half that list and reads as software that ran out of room; one
 * after the item before it reads as a card that stopped, which is the truth.
 * Word-break is the last resort, for prose with no clause marks at all.
 */
export function trimToClause(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;

  const cut = text.slice(0, max);

  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (sentence > max * 0.45) return cut.slice(0, sentence + 1);

  const clause = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' — '));
  const at = clause > max * 0.5 ? clause : cut.lastIndexOf(' ');
  return `${cut.slice(0, at).replace(/[\s,;:—–-]+$/, '')}…`;
}

export function stripInlineMd(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
