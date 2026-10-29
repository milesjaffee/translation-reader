import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { ApiError } from '@google/genai';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AlignmentError, alignDocument } from './server/alignment-pipeline';
import { getClient } from './server/gemini-client';
import { TranslateApiError, getTranslationProvider, translate } from './server/translate';

// Secrets (GEMINI_API_KEY etc.) live in a gitignored .env in the project root.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Align a source text with its translation and annotate each word.
 * Body: { source_lang, source, target_lang, target? }
 * If `target` is omitted or empty, the source is machine-translated first
 * (see TRANSLATION_PROVIDER in src/server/translate.ts).
 * Response: { source, translation, target, translated_by }
 */
app.post('/api/align', async (req, res) => {
  const body = req.body ?? {};
  const errors: Record<string, string> = {};
  for (const field of ['source_lang', 'source', 'target_lang', 'target']) {
    const value = body[field];
    if (field === 'target' && (value === undefined || value === null || value === '')) {
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors[field] = 'This field is required.';
    } else if (field.endsWith('_lang') && value.trim().length > 10) {
      errors[field] = 'Ensure this field has no more than 10 characters.';
    }
  }
  if (Object.keys(errors).length) {
    res.status(400).json({ detail: 'Invalid request.', errors });
    return;
  }

  try {
    const client = getClient();
    const sourceLang = body.source_lang.trim();
    const targetLang = body.target_lang.trim();
    const translatedBy = body.target ? null : getTranslationProvider();
    const target: string = body.target || (await translate(client, body.source, sourceLang, targetLang));

    const result = await alignDocument(client, body.source, target, sourceLang, targetLang);
    res.json({ ...result, target, translated_by: translatedBy });
  } catch (e) {
    if (e instanceof AlignmentError) {
      res.status(400).json({ detail: e.message });
    } else if (e instanceof ApiError) {
      res.status(502).json({ detail: `Gemini API error: ${e.message}` });
    } else if (e instanceof TranslateApiError) {
      res.status(502).json({ detail: `Google Translate API error: ${e.message}` });
    } else {
      console.error(e);
      res.status(500).json({ detail: e instanceof Error ? e.message : String(e) });
    }
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
