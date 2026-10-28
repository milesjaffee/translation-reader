import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | undefined;

/** Load Gemini API (lazily, so a missing key only fails on first use). */
export function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to .env (see .env.example).');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function getModel(): string {
  return process.env['GEMINI_MODEL'] || 'gemini-flash-latest';
}
