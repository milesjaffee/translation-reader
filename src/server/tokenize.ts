// =======================================================================
// TOKENIZATION -- generic, handles space-delimited scripts and CJK.
// =======================================================================
// Port of sections 1-2 of the precursor's alignment_pipeline.py. Intl.Segmenter
// is backed by ICU, so it stands in for PyICU's BreakIterator.

export const LATIN_SCRIPT_LANGS = new Set(['en', 'es', 'fr', 'de', 'it', 'pt', 'tr', 'nl', 'sv', 'id', 'vi', 'pl', 'ro', 'hu', 'da', 'fi', 'no', 'cs', 'sk', 'sl', 'hr', 'lt', 'lv', 'et']);

// Scripts that don't use whitespace between words at all.
export const NO_SPACE_SCRIPTS = new Set(['zh', 'ja', 'th', 'lo', 'km', 'my']);

export type CjkGranularity = 'dictionary' | 'char';

// Numbers with internal punctuation stay one token (5,461 / 5.461);
// letter runs are one token; every other symbol is its own token.
// This splits contractions at the apostrophe ("I've" -> "I", "'", "ve")
// since apostrophe isn't a letter -- the few-shot examples match this.
const WORD_OR_PUNCT = /\p{N}+(?:[.,]\p{N}+)*|\p{L}+|[^\s\p{L}\p{N}]/gu;

/**
 * Tokenize `text`. `cjkGranularity` only matters for NO_SPACE_SCRIPTS:
 *
 * - "dictionary": ICU's word-break dictionary (good for modern text,
 *   groups multi-character words like "非常").
 * - "char": one token per character. Safer for classical / literary text,
 *   where a modern segmenter's word groupings can be anachronistic.
 */
export function tokenize(text: string, lang: string, cjkGranularity: CjkGranularity = 'dictionary'): string[] {
  if (!NO_SPACE_SCRIPTS.has(lang)) {
    return text.match(WORD_OR_PUNCT) ?? [];
  }

  if (cjkGranularity === 'char') {
    return [...text].filter((ch) => ch.trim());
  }

  const segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
  // ICU also yields whitespace-only breaks -- skip
  return [...segmenter.segment(text)].map((s) => s.segment).filter((piece) => piece.trim());
}

export function numberedList(tokens: string[]): string {
  return tokens.map((tok, i) => `${i + 1}. ${tok}`).join('\n');
}

// =======================================================================
// SENTENCE SEGMENTATION -- ICU sentence breaks, not a regex lookbehind.
// =======================================================================

export function segmentSentences(text: string, lang: string): string[] {
  const segmenter = new Intl.Segmenter(lang, { granularity: 'sentence' });
  return [...segmenter.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
}
