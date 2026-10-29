// Mirrors the shapes in src/server/schemas.ts (kept separate so the browser
// bundle never imports server code).

export interface AlignedWord {
  word: string;
  meaning: string[];
  /** 1-based indexes of the corresponding word(s) on the OTHER side. */
  match: number[];
  footnote: string | null;
  latin?: string | null;
  /** 0-based sentence-group index, shared by both sides. Absent on older saved results. */
  sentence?: number;
}

export interface AlignmentResult {
  source: AlignedWord[];
  translation: AlignedWord[];
  /** Translation text that was aligned (machine-generated if `translated_by` is set). */
  target: string;
  translated_by: 'gemini' | 'google-translate' | null;
}

export interface AlignRequest {
  source_lang: string;
  source: string;
  target_lang: string;
  /** Empty when there's no preexisting translation; the server translates first. */
  target: string;
}

export type Side = 'source' | 'translation';
