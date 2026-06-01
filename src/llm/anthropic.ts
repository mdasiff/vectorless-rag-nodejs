import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function invoke(system: string, user: string): Promise<string> {
  const res = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = res.content.find(b => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('Anthropic returned no text content');
  return block.text;
}
