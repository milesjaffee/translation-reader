import { AlignedWord } from './alignment.model';

/** Languages written without spaces between words (mirrors NO_SPACE_SCRIPTS in src/server/tokenize.ts). */
const NO_SPACE_LANGS = new Set(['zh', 'lzh', 'yue', 'wuu', 'ja', 'th', 'lo', 'km', 'my']);

export function isNoSpaceLang(lang: string): boolean {
  return NO_SPACE_LANGS.has(lang.trim().split(/[-_]/)[0].toLowerCase());
}

/**
 * For each token, whether whitespace precedes it in the original text, so
 * "I've", "¡Socorro," and "道可道，" render as written instead of with a
 * space between every token. Falls back to a space between tokens when the
 * text is missing or a token can't be located (e.g. older saved results).
 */
export function precedingSpaces(text: string | null | undefined, words: AlignedWord[]): boolean[] {
  let cursor = 0;
  return words.map((w, i) => {
    const pos = text ? text.indexOf(w.word, cursor) : -1;
    if (pos < 0) {
      return i > 0;
    }
    const gap = text!.slice(cursor, pos);
    cursor = pos + w.word.length;
    return i > 0 && /\s/.test(gap);
  });
}
