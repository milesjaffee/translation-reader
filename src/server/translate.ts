// Machine translation step, used when the user has no preexisting translation.
// The provider is picked with TRANSLATION_PROVIDER in .env:
//   - "gemini" (default): one extra Gemini call.
//   - "google-translate": Cloud Translation API (Basic/v2), needs GOOGLE_TRANSLATE_API_KEY.

import { GoogleGenAI } from '@google/genai';

import { AlignmentError } from './alignment-pipeline';
import { getModel } from './gemini-client';

export type TranslationProvider = 'gemini' | 'google-translate';

export function getTranslationProvider(): TranslationProvider {
  const provider = process.env['TRANSLATION_PROVIDER'] || 'gemini';
  if (provider !== 'gemini' && provider !== 'google-translate') {
    throw new Error(`Unknown TRANSLATION_PROVIDER "${provider}". Use "gemini" or "google-translate".`);
  }
  return provider;
}

export async function translate(client: GoogleGenAI, sourceText: string, sourceLang: string, targetLang: string): Promise<string> {
  const provider = getTranslationProvider();
  const translation = provider === 'google-translate'
    ? await translateWithGoogle(sourceText, sourceLang, targetLang)
    : await translateWithGemini(client, sourceText, sourceLang, targetLang);

  if (!translation.trim()) {
    throw new AlignmentError(`Translation provider "${provider}" returned an empty translation.`);
  }
  return translation;
}

async function translateWithGemini(client: GoogleGenAI, sourceText: string, sourceLang: string, targetLang: string): Promise<string> {
  const response = await client.models.generateContent({
    model: getModel(),
    contents: [{ role: 'user', parts: [{ text: sourceText }] }],
    config: {
      systemInstruction:
        `You are an expert translator. Translate the user's text from ${sourceLang} into ${targetLang}. ` +
        'Translate faithfully and naturally, keeping sentence boundaries where the target language allows. ' +
        'Reply with the translation only -- no notes, quotes, or commentary.',
    },
  });
  return (response.text ?? '').trim();
}

async function translateWithGoogle(sourceText: string, sourceLang: string, targetLang: string): Promise<string> {
  const apiKey = process.env['GOOGLE_TRANSLATE_API_KEY'];
  if (!apiKey) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is not set. Add it to .env (see .env.example).');
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: sourceText, source: sourceLang, target: targetLang, format: 'text' }),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new TranslateApiError(json?.error?.message || `HTTP ${response.status}`);
  }
  return json.data.translations[0].translatedText;
}

/** Upstream translation-service failure (maps to HTTP 502). */
export class TranslateApiError extends Error {}
