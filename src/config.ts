import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  bedrockModelId: required('BEDROCK_MODEL_ID'),
  topK: Number(process.env.TOP_K ?? 5),
  dataPath: process.env.DATA_PATH ?? './data/sample.json',
  dataSource: (process.env.DATA_SOURCE ?? 'json') as 'json' | 'servicenow',
};
