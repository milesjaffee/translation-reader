// Port of the precursor's alignment_pipeline.py (sections 5-7), using Gemini
// structured output in place of OpenAI's responses.parse.

import { Content, GoogleGenAI } from '@google/genai';

import { ALIGNMENT_EXAMPLES, GROUPING_EXAMPLES } from './few-shot';
import { getModel } from './gemini-client';
import { Alignment, AlignedWord, SENTENCE_GROUPING_SCHEMA, SentenceGroup, SentenceGrouping, WordAnnotation, alignmentSchema } from './schemas';
import { CjkGranularity, numberedList, segmentSentences, tokenize } from './tokenize';

/** Bad input or a model response that doesn't fit the request (maps to HTTP 400). */
export class AlignmentError extends Error {}

async function generateJson<T>(client: GoogleGenAI, systemInstruction: string, contents: Content[], schema: unknown): Promise<T> {
  const response = await client.models.generateContent({
    model: getModel(),
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  });
  try {
    return JSON.parse(response.text ?? '') as T;
  } catch {
    throw new AlignmentError('Model returned invalid JSON.');
  }
}

const user = (text: string): Content => ({ role: 'user', parts: [{ text }] });
const model = (text: string): Content => ({ role: 'model', parts: [{ text }] });

// =======================================================================
// WORD-LEVEL ALIGNMENT CALL.
// =======================================================================

export function buildAlignmentPrompt(sourceTokens: string[], targetTokens: string[], sourceLang: string, targetLang: string, context = ''): string {
  const ctx = context ? `Surrounding context (for meaning/footnotes only -- do NOT index into this):\n${context}\n\n` : '';
  return (
    `${ctx}` +
    `SOURCE (${sourceLang}), numbered:\n${numberedList(sourceTokens)}\n\n` +
    `TRANSLATION (${targetLang}), numbered:\n${numberedList(targetTokens)}\n\n` +
    'For every source word, list the index/indexes of the translation ' +
    'word(s) it corresponds to, and vice versa. Only use the numbers ' +
    'shown above. A word\'s match should reflect actual meaning ' +
    'correspondence, not position -- do not default to a word\'s own ' +
    'index or a running count unless that genuinely is the correct ' +
    'correspondence at that point. ' +
    'For every source word, determine its translation in the other language (which may be one or more words, or nothing for a grammatical particle). ' +
    'Then, find the index or indexes of the specific instance of that lexeme in the opposite text. '
  );
}

function alignmentFewShotContents(): Content[] {
  return ALIGNMENT_EXAMPLES.flatMap((ex) => [
    user(buildAlignmentPrompt(ex.sourceWords, ex.targetWords, ex.sourceLang, ex.targetLang)),
    model(JSON.stringify({ source: ex.sourceAnnot, translation: ex.targetAnnot }, null, 2)),
  ]);
}

export async function alignAndAnnotate(
  client: GoogleGenAI,
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string,
  context = '',
  cjkGranularity: CjkGranularity = 'dictionary',
): Promise<Alignment> {
  const sourceTokens = tokenize(sourceText, sourceLang, cjkGranularity);
  const targetTokens = tokenize(targetText, targetLang, cjkGranularity);
  const schema = alignmentSchema(sourceLang, targetLang, sourceTokens.length, targetTokens.length);

  const parsed = await generateJson<Alignment<WordAnnotation>>(
    client,
    'You are an expert translator and linguist doing word-level alignment.',
    [...alignmentFewShotContents(), user(buildAlignmentPrompt(sourceTokens, targetTokens, sourceLang, targetLang, context))],
    schema,
  );

  // Gemini treats minItems/maxItems as a strong hint rather than a hard
  // grammar constraint, so check the lengths that Pydantic used to enforce.
  if (parsed.source?.length !== sourceTokens.length || parsed.translation?.length !== targetTokens.length) {
    throw new AlignmentError(
      `Model returned ${parsed.source?.length}/${parsed.translation?.length} annotations for ${sourceTokens.length}/${targetTokens.length} tokens.`,
    );
  }

  return {
    source: parsed.source.map((w, i) => ({ ...w, word: sourceTokens[i] })),
    translation: parsed.translation.map((w, i) => ({ ...w, word: targetTokens[i] })),
  };
}

// =======================================================================
// SENTENCE-GROUPING CALL -- replaces a naive regex-split + zip.
// =======================================================================
// Because it's a grouping (not a positional zip), it handles merges,
// splits, reorders, and dropped/added sentences.

export function buildGroupingPrompt(sourceSents: string[], targetSents: string[], sourceLang: string, targetLang: string): string {
  return (
    `SOURCE (${sourceLang}) sentences, numbered:\n${numberedList(sourceSents)}\n\n` +
    `TRANSLATION (${targetLang}) sentences, numbered:\n${numberedList(targetSents)}\n\n` +
    'Group these into corresponding units, in order. A group is usually ' +
    'one source sentence and one translation sentence, but translators ' +
    'often merge two source sentences into one translated sentence, ' +
    'split one into several, reorder them, or drop/add a sentence ' +
    'entirely -- represent those cases honestly rather than forcing a ' +
    '1:1 mapping. Every sentence on both sides must appear in exactly ' +
    'one group.'
  );
}

function groupingFewShotContents(): Content[] {
  return GROUPING_EXAMPLES.flatMap((ex) => [
    user(buildGroupingPrompt(ex.sourceSents, ex.targetSents, ex.sourceLang, ex.targetLang)),
    model(JSON.stringify({ groups: ex.groups })),
  ]);
}

export async function groupSentences(
  client: GoogleGenAI,
  sourceSents: string[],
  targetSents: string[],
  sourceLang: string,
  targetLang: string,
): Promise<SentenceGroup[]> {
  const parsed = await generateJson<SentenceGrouping>(
    client,
    'You are an expert translator aligning sentences between a source text and its translation.',
    [...groupingFewShotContents(), user(buildGroupingPrompt(sourceSents, targetSents, sourceLang, targetLang))],
    SENTENCE_GROUPING_SCHEMA,
  );

  const inRange = (idxs: number[], n: number) => idxs.every((i) => Number.isInteger(i) && i >= 1 && i <= n);
  if (!parsed.groups?.every((g) => inRange(g.source, sourceSents.length) && inRange(g.translation, targetSents.length))) {
    throw new AlignmentError('Model returned an out-of-range sentence grouping.');
  }
  return parsed.groups;
}

// =======================================================================
// TOP-LEVEL ORCHESTRATION.
// =======================================================================

export async function alignDocument(
  client: GoogleGenAI,
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string,
  cjkGranularity: CjkGranularity = 'dictionary',
): Promise<Alignment> {
  const sourceSents = segmentSentences(sourceText, sourceLang);
  const targetSents = segmentSentences(targetText, targetLang);
  const groups = await groupSentences(client, sourceSents, targetSents, sourceLang, targetLang);

  const combinedSource: AlignedWord[] = [];
  const combinedTranslation: AlignedWord[] = [];
  let srcOffset = 0;
  let tgtOffset = 0;

  const unaligned = (word: string): AlignedWord => ({ word, meaning: [], match: [], footnote: null });

  for (let gi = 0; gi < groups.length; gi++) {
    const { source: srcIdxs, translation: tgtIdxs } = groups[gi];

    if (!srcIdxs.length || !tgtIdxs.length) {
      // Pure insertion/deletion: nothing on the other side to align
      // to, so there's no alignment call to make.
      for (const i of srcIdxs) {
        const tokens = tokenize(sourceSents[i - 1], sourceLang, cjkGranularity);
        combinedSource.push(...tokens.map(unaligned));
        srcOffset += tokens.length;
      }
      for (const i of tgtIdxs) {
        const tokens = tokenize(targetSents[i - 1], targetLang, cjkGranularity);
        combinedTranslation.push(...tokens.map(unaligned));
        tgtOffset += tokens.length;
      }
      continue;
    }

    const srcText = srcIdxs.map((i) => sourceSents[i - 1]).join(' ');
    const tgtText = tgtIdxs.map((i) => targetSents[i - 1]).join(' ');

    // Neighboring group's raw text as inert context -- informs meaning
    // and footnotes without being indexable, so it can't reintroduce
    // the forward-reference problem.
    const prevGroup = gi > 0 ? groups[gi - 1] : undefined;
    const nextGroup = gi + 1 < groups.length ? groups[gi + 1] : undefined;
    const contextBits: string[] = [];
    if (prevGroup?.source.length) {
      contextBits.push(sourceSents[prevGroup.source[prevGroup.source.length - 1] - 1]);
    }
    if (nextGroup?.source.length) {
      contextBits.push(sourceSents[nextGroup.source[0] - 1]);
    }
    const context = contextBits.join(' ');

    const piece = await alignAndAnnotate(client, srcText, tgtText, sourceLang, targetLang, context, cjkGranularity);
    for (const w of piece.source) {
      w.match = w.match.map((m) => m + tgtOffset);
    }
    for (const w of piece.translation) {
      w.match = w.match.map((m) => m + srcOffset);
    }
    combinedSource.push(...piece.source);
    combinedTranslation.push(...piece.translation);
    srcOffset += piece.source.length;
    tgtOffset += piece.translation.length;
  }

  return { source: combinedSource, translation: combinedTranslation };
}
