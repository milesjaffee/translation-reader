// =======================================================================
// FEW-SHOT DATA -- worked examples, tokenized + shaped like the schema.
// =======================================================================
// Copied from section 4 of the precursor's alignment_pipeline.py. Tokenized
// to "every punctuation mark is its own token" and shaped to the narrow
// schema (no 'word' field; 'latin' key absent for Latin-script sides).

import { SentenceGroup, WordAnnotation } from './schemas';

export const DAODEJING_SOURCE_WORDS = ['道', '可', '道', '，', '非', '常', '道'];
export const DAODEJING_TARGET_WORDS = ['The', 'Way', 'that', 'can', 'be', 'spoken', 'of', 'is', 'not', 'the', 'eternal', 'Way'];
export const DAODEJING_SOURCE_ANNOT: WordAnnotation[] = [
  { meaning: ['The Tao', 'way', 'path', 'to speak', 'to guide'], match: [1, 2], latin: 'dào', footnote: null },
  { meaning: ['can', 'may', 'able to'], match: [3, 4], latin: 'kě', footnote: null },
  { meaning: ['The Tao', 'way', 'path', 'to speak', 'to guide'], match: [5, 6, 7], latin: 'dào', footnote: null },
  { meaning: [], match: [], latin: null, footnote: null }, // ，  -- punctuation, nothing to transcribe
  { meaning: ['not', 'non-', 'un-'], match: [8, 9], latin: 'fēi', footnote: null },
  { meaning: ['eternal', 'constant', 'unchanging'], match: [10, 11], latin: 'cháng', footnote: null },
  { meaning: ['The Tao', 'way', 'path', 'to speak', 'to guide'], match: [12], latin: 'dào', footnote: null },
];
export const DAODEJING_TARGET_ANNOT: WordAnnotation[] = [
  { meaning: [], match: [], footnote: null }, // The
  { meaning: ['道'], match: [1], footnote: null }, // Way
  { meaning: [], match: [], footnote: null }, // that
  { meaning: ['可', '能'], match: [2], footnote: null }, // can
  { meaning: [], match: [], footnote: null }, // be
  { meaning: ['言'], match: [3], footnote: "Note that the same character is used for both 'way' and 'to speak', making the direct translation ambiguous." }, // spoken
  { meaning: [], match: [], footnote: null }, // of
  { meaning: [], match: [], footnote: null }, // is
  { meaning: ['不'], match: [5], footnote: null }, // not
  { meaning: [], match: [], footnote: null }, // the
  { meaning: ['常'], match: [6], footnote: null }, // eternal
  { meaning: ['道'], match: [7], footnote: null }, // Way
];

export const SPANISH_JOKE_SOURCE_WORDS = ['¡', 'Socorro', ',', 'me', 'ha', 'picado', 'una', 'víbora', '!', '¿', 'Cobra', '?', 'No', ',', 'gratis', '.'];
export const SPANISH_JOKE_TARGET_WORDS = ['Help', '!', 'I', "'", 've', 'been', 'bitten', 'by', 'a', 'viper', '!', 'Does', 'it', 'cost', 'money', '?', 'No', ',', 'it', "'", 's', 'free', '.'];
export const SPANISH_JOKE_SOURCE_ANNOT: WordAnnotation[] = [
  { meaning: [], match: [], footnote: null }, // ¡
  { meaning: ['Help!'], match: [1], footnote: null }, // Socorro
  { meaning: [], match: [], footnote: null }, // ,
  { meaning: ['me', 'myself'], match: [3], footnote: null }, // me
  { meaning: ['has'], match: [5], footnote: null }, // ha
  { meaning: ['bitten', 'stung'], match: [7], footnote: null }, // picado
  { meaning: ['a', 'one'], match: [9], footnote: null }, // una
  { meaning: ['viper', 'snake'], match: [10], footnote: null }, // víbora
  { meaning: [], match: [], footnote: null }, // !
  { meaning: [], match: [], footnote: null }, // ¿
  { meaning: ['Cobra?', 'Does it cost money?'], match: [12, 13, 14, 15], footnote: "This is a pun -- 'cobra' can mean both 'Cobra' (the snake) and 'Does it cost money?' in Spanish." }, // Cobra
  { meaning: [], match: [], footnote: null }, // ?
  { meaning: ['No,'], match: [17], footnote: null }, // No
  { meaning: [], match: [], footnote: null }, // ,
  { meaning: ['free', 'gratis'], match: [22], footnote: null }, // gratis
  { meaning: [], match: [], footnote: null }, // .
];
export const SPANISH_JOKE_TARGET_ANNOT: WordAnnotation[] = [
  { meaning: ['¡Socorro!', '¡Ayuda!'], match: [2], footnote: null }, // Help
  { meaning: [], match: [], footnote: null }, // !
  { meaning: ['me'], match: [4], footnote: null }, // I
  { meaning: [], match: [], footnote: null }, // '
  { meaning: ['ha'], match: [5], footnote: null }, // ve
  { meaning: ['ha'], match: [5], footnote: null }, // been
  { meaning: ['picado'], match: [6], footnote: null }, // bitten
  { meaning: ['por'], match: [], footnote: null }, // by
  { meaning: ['una'], match: [7], footnote: null }, // a
  { meaning: ['víbora'], match: [8], footnote: null }, // viper
  { meaning: [], match: [], footnote: null }, // !
  { meaning: [], match: [11], footnote: null }, // Does
  { meaning: [], match: [11], footnote: null }, // it
  { meaning: ['cobra'], match: [11], footnote: null }, // cost
  { meaning: ['dinero'], match: [11], footnote: null }, // money
  { meaning: [], match: [], footnote: null }, // ?
  { meaning: ['No'], match: [13], footnote: null }, // No
  { meaning: [], match: [], footnote: null }, // ,
  { meaning: [], match: [], footnote: null }, // it
  { meaning: [], match: [], footnote: null }, // '
  { meaning: [], match: [], footnote: "Spanish elides the copula here -- 'No, gratis' literally reads 'No, free,' with 'it is' left implicit." }, // s
  { meaning: ['gratis'], match: [15], footnote: null }, // free
  { meaning: [], match: [], footnote: null }, // .
];

export interface AlignmentExample {
  sourceWords: string[];
  targetWords: string[];
  sourceAnnot: WordAnnotation[];
  targetAnnot: WordAnnotation[];
  sourceLang: string;
  targetLang: string;
}

export const ALIGNMENT_EXAMPLES: AlignmentExample[] = [
  { sourceWords: DAODEJING_SOURCE_WORDS, targetWords: DAODEJING_TARGET_WORDS, sourceAnnot: DAODEJING_SOURCE_ANNOT, targetAnnot: DAODEJING_TARGET_ANNOT, sourceLang: 'zh', targetLang: 'en' },
  { sourceWords: SPANISH_JOKE_SOURCE_WORDS, targetWords: SPANISH_JOKE_TARGET_WORDS, sourceAnnot: SPANISH_JOKE_SOURCE_ANNOT, targetAnnot: SPANISH_JOKE_TARGET_ANNOT, sourceLang: 'es', targetLang: 'en' },
];

export interface GroupingExample {
  sourceSents: string[];
  targetSents: string[];
  sourceLang: string;
  targetLang: string;
  groups: SentenceGroup[];
}

// Sentence-grouping few-shot examples. The MERGE example is listed first
// and is not optional: if every grouping example shown is 1:1, a small
// model will learn to always emit 1:1 groups, which defeats the purpose
// of grouping instead of zipping.
export const GROUPING_EXAMPLES: GroupingExample[] = [
  {
    sourceSents: ['It started raining.', 'We went inside.'],
    targetSents: ['Como empezó a llover, entramos.'],
    sourceLang: 'en',
    targetLang: 'es',
    groups: [{ source: [1, 2], translation: [1] }],
  },
  {
    sourceSents: ['¡Socorro, me ha picado una víbora!', '¿Cobra?', 'No, gratis.'],
    targetSents: ["Help! I've been bitten by a viper!", 'Does it cost money?', "No, it's free."],
    sourceLang: 'es',
    targetLang: 'en',
    groups: [
      { source: [1], translation: [1] },
      { source: [2], translation: [2] },
      { source: [3], translation: [3] },
    ],
  },
];
