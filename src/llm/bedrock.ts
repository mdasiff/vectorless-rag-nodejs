import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';

const client = new BedrockRuntimeClient({ region: config.awsRegion });

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export async function invokeClaude(system: string, user: string): Promise<string> {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  };

  const res = await client.send(
    new InvokeModelCommand({
      modelId: config.bedrockModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    })
  );

  const parsed = JSON.parse(new TextDecoder().decode(res.body)) as ClaudeResponse;
  const text = parsed.content.find(c => c.type === 'text')?.text;
  if (!text) throw new Error('Bedrock returned no text content');
  return text;
}
