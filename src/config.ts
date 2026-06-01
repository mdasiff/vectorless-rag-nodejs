import 'dotenv/config';

type LlmProvider = 'anthropic' | 'bedrock';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const llmProvider = (process.env.LLM_PROVIDER ?? 'anthropic') as LlmProvider;
if (llmProvider !== 'anthropic' && llmProvider !== 'bedrock') {
  throw new Error(`Invalid LLM_PROVIDER: ${llmProvider} (expected 'anthropic' or 'bedrock')`);
}

export const config = {
  llmProvider,
  topK: Number(process.env.TOP_K ?? 5),
  dataPath: process.env.DATA_PATH ?? './data/sample.json',
  dataSource: (process.env.DATA_SOURCE ?? 'json') as 'json' | 'servicenow',

  anthropicApiKey: llmProvider === 'anthropic' ? required('ANTHROPIC_API_KEY') : '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929',

  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  bedrockModelId: llmProvider === 'bedrock' ? required('BEDROCK_MODEL_ID') : (process.env.BEDROCK_MODEL_ID ?? ''),
};
