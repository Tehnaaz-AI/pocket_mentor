/**
 * Unicode dash and hyphen variants folded to ASCII '-'.
 *
 * Language models emit these interchangeably: a smoke test showed the same
 * model returning "Boyce\u2011Codd Normal Form" (U+2011 non-breaking hyphen) in
 * one call and "Boyce-Codd Normal Form" (ASCII) in the next. Because the
 * normaliser below keeps ASCII '-' but strips anything outside its allow-list,
 * the two spellings produced different keys — and therefore two Topic
 * documents for one concept.
 *
 *   U+2010 hyphen          U+2013 en dash        U+2015 horizontal bar
 *   U+2011 non-breaking    U+2014 em dash        U+2212 minus sign
 *   U+2012 figure dash
 */
const DASH_VARIANTS = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g;

export const foldDashes = (value) => String(value ?? '').replace(DASH_VARIANTS, '-');

/**
 * Name normalisation for matching AI-produced concept strings against stored
 * subjects and topics.
 *
 * The AI returns free text, so "Mutual Exclusion", "mutual exclusion" and
 * "Mutual  Exclusion." must all resolve to one topic. Without this the topic
 * catalogue would fragment on every quiz.
 *
 * Dash folding runs FIRST, before the allow-list strip, so every hyphen
 * spelling of a concept lands on the same key.
 */
export const normalizeKey = (value) =>
  foldDashes(value)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9\s'-]/g, ' ')  // drop punctuation, keep words
    .replace(/\s+/g, ' ')
    .trim();

export const titleCase = (value) =>
  foldDashes(value)
    .trim()
    .replace(/\s+/g, ' ');

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const round = (n, places = 0) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};
