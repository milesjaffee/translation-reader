import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | undefined;

/** Load Gemini API (lazily, so a missing key only fails on first use). */
export function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to .env (see .env.example).');
    }
    client = new GoogleGenAI({
      apiKey,
      // The free tier regularly returns 429/503 under load; back off and retry
      // (408, 429 and 5xx by default) instead of failing the whole pipeline.
      // `timeout` (ms) bounds each attempt, so an overloaded model can't hang a request forever.
      httpOptions: { timeout: 90_000, retryOptions: { attempts: 4, initialDelay: 2, maxDelay: 30 } },
    });
  }
  return client;
}

export function getModel(): string {
  return process.env['GEMINI_MODEL'] || 'gemini-3.5-flash';
}
