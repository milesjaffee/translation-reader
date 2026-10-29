# Cratylus

Cratylus aligns a source text with its translation word-by-word and annotates each word
(meanings, transliteration, footnotes). Hover a word to highlight its matches
on the other side. Angular port of `ai-translation-precursor-code`

## Setup

```bash
npm install
cp .env.example .env   # then set GEMINI_API_KEY (and optionally GEMINI_MODEL)
npm start              # http://localhost:4200
```

## Translation provider

With "I have a preexisting translation" unchecked, the server translates the
source first and then aligns it. Pick the translator with `TRANSLATION_PROVIDER`
in `.env`:

- `gemini` (default) — one extra Gemini call.
- `google-translate` — Cloud Translation API (Basic/v2); also set `GOOGLE_TRANSLATE_API_KEY`.

Restart `npm start` after editing `.env`.

## Layout

- `src/server/` — Node-only alignment pipeline (tokenization via `Intl.Segmenter`,
  sentence grouping + word alignment via Gemini structured output, few-shot data).
- `src/server/translate.ts` — machine-translation step and provider switch.
- `src/server.ts` — Express routes: `POST /api/align` (`target` optional), `GET /health`. The API key
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
