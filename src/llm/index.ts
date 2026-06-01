import { config } from '../config.js';
import { invoke as bedrockInvoke } from './bedrock.js';
import { invoke as anthropicInvoke } from './anthropic.js';
import { invoke as geminiInvoke } from './gemini.js';

export async function invokeModel(system: string, user: string): Promise<string> {
  switch (config.llmProvider) {
    case 'anthropic':
      return anthropicInvoke(system, user);
    case 'bedrock':
      return bedrockInvoke(system, user);
    case 'gemini':
      return geminiInvoke(system, user);
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${config.llmProvider}`);
  }
}

export { SYSTEM, buildUserPrompt } from './prompt.js';
