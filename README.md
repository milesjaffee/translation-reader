# Translation Reader

Aligns a source text with its translation word-by-word and annotates each word
(meanings, transliteration, footnotes). Hover a word to highlight its matches
on the other side. Angular port of `ai-translation-precursor-code`, using Gemini.

## Setup

```bash
npm install
cp .env.example .env   # then set GEMINI_API_KEY (and optionally GEMINI_MODEL)
npm start              # http://localhost:4200
```

## Layout

- `src/server/` — Node-only alignment pipeline (tokenization via `Intl.Segmenter`,
  sentence grouping + word alignment via Gemini structured output, few-shot data).
- `src/server.ts` — Express routes: `POST /api/align`, `GET /health`. The API key
  is only read here and never reaches the browser.
- `src/app/aligner/` — form and hoverable word output.
- `src/app/firebase/` — stubs for Firebase config, auth (fixed local dev user), and
  `TranslationStore` (local-storage implementation; swap for Firestore in
  `app.config.ts`).

## Building / tests

```bash
ng build
ng test
```
