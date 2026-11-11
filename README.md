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
- `src/server.ts` — Express routes: `POST /api/align` (`target` optional; requires a Firebase ID
  token, see `src/server/verify-auth.ts`), `GET /health`. The API key is only read here and never
  reaches the browser.
- `src/app/aligner/` — the translate form.
- `src/app/firebase/` — Firebase config, `AuthService`, route guards, and the Firestore-backed
  `TranslationStore`.
- `src/app/{login,saved-page,translation-page,user-page}/` — `/login`, `/saved`, `/t/:id`, `/you`.

## Auth & storage

Sign-in is Firebase Auth with Google or email/password. `/translate`, `/saved` and `/you` redirect to
`/login` when signed out, and render client-side only (`src/app/app.routes.server.ts`).

Firestore holds three collections (the data model is documented at the top of `firestore.rules`):

- `translations/{id}` — a user's saved translation, readable only by its owner.
- `shares/{id}` — the public copy behind a share link (`/t/:id`), present only while shared. It has
  no owner uid, so anonymous shares can't be traced to an account.
- `users/{uid}` — plan and `savedCount`. The rules require every save/delete to move the counter in
  the same batch, which enforces the Casual plan's 50-translation limit server-side.

One-time setup: enable the **Google** and **Email/Password** providers in the Firebase console
(Authentication → Sign-in method), then deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Building / tests

```bash
ng build
ng test
```
