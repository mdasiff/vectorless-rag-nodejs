import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const client = new GoogleGenAI({ apiKey: config.geminiApiKey });

export async function invoke(system: string, user: string): Promise<string> {
  const res = await client.models.generateContent({
    model: config.geminiModel,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      maxOutputTokens: 1024,
    },
  });
  const text = res.text;
  if (!text) throw new Error('Gemini returned no text content');
  return text;
}
