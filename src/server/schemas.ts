// =======================================================================
// PER-REQUEST SCHEMA -- 'latin' structurally absent where it can't apply.
// =======================================================================
// JSON Schema equivalents of the precursor's Pydantic models, passed to
// Gemini as `responseJsonSchema`.

import { LATIN_SCRIPT_LANGS } from './tokenize';

/** What the model returns per word. Deliberately excludes 'word' -- we already
 * know the word text from our own tokenizer, so the model is never asked to
 * regenerate (and potentially desync from) it. */
export interface WordAnnotation {
  meaning: string[];
  match: number[];
  footnote: string | null;
  latin?: string | null;
}

export interface AlignedWord extends WordAnnotation {
  word: string;
}

export interface Alignment<W = AlignedWord> {
  source: W[];
  translation: W[];
}

export interface SentenceGroup {
  source: number[];
  translation: number[];
}

export interface SentenceGrouping {
  groups: SentenceGroup[];
}

function wordAnnotationSchema(needsLatin: boolean) {
  const properties: Record<string, unknown> = {
    meaning: { type: 'array', items: { type: 'string' }, description: 'Meanings in the other language.' },
    match: { type: 'array', items: { type: 'integer' }, description: 'Indexes of corresponding word(s) on the OTHER side.' },
    footnote: { type: ['string', 'null'] },
  };
  const required = ['meaning', 'match', 'footnote'];
  if (needsLatin) {
    properties['latin'] = {
      type: ['string', 'null'],
      description: "Latin-alphabet transcription; null if there's nothing to transcribe (e.g. punctuation, numerals).",
    };
    required.push('latin');
  }
  return { type: 'object', properties, required };
}

/**
 * `numSource`/`numTarget` pin exact array lengths (minItems == maxItems ==
 * token count) so the decoder can't return a source/translation list shorter
 * or longer than the tokens it's meant to annotate one-for-one.
 */
export function alignmentSchema(sourceLang: string, targetLang: string, numSource: number, numTarget: number) {
  return {
    type: 'object',
    properties: {
      source: { type: 'array', items: wordAnnotationSchema(!LATIN_SCRIPT_LANGS.has(sourceLang)), minItems: numSource, maxItems: numSource },
      translation: { type: 'array', items: wordAnnotationSchema(!LATIN_SCRIPT_LANGS.has(targetLang)), minItems: numTarget, maxItems: numTarget },
    },
    required: ['source', 'translation'],
  };
}

export const SENTENCE_GROUPING_SCHEMA = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      description: 'Groups IN ORDER, covering every sentence on both sides exactly once.',
      items: {
        type: 'object',
        properties: {
          source: {
            type: 'array',
            items: { type: 'integer' },
            description: '1-based source sentence indices in this group. Empty if this group is a pure insertion (nothing on the source side).',
          },
          translation: {
            type: 'array',
            items: { type: 'integer' },
            description: '1-based translation sentence indices in this group. Empty if the source sentence(s) were dropped/untranslated.',
          },
        },
        required: ['source', 'translation'],
      },
    },
  },
  required: ['groups'],
};
