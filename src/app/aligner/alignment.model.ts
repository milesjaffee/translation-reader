// Mirrors the shapes in src/server/schemas.ts (kept separate so the browser
// bundle never imports server code).

export interface AlignedWord {
  word: string;
  meaning: string[];
  /** 1-based indexes of the corresponding word(s) on the OTHER side. */
  match: number[];
  footnote: string | null;
  latin?: string | null;
}

export interface AlignmentResult {
  source: AlignedWord[];
  translation: AlignedWord[];
}

export interface AlignRequest {
  source_lang: string;
  source: string;
  target_lang: string;
  target: string;
}

export type Side = 'source' | 'translation';
