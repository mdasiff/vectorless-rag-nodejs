import { config } from './config.js';
import { loader } from './loaders/index.js';
import { buildIndex, search, type Index } from './retriever/bm25.js';
import type { DocFilter } from './retriever/filter.js';
import { invokeClaude } from './llm/bedrock.js';
import { SYSTEM, buildUserPrompt } from './llm/prompt.js';
import type { Answer } from './types.js';

let cachedIndex: Index | null = null;

async function getIndex(): Promise<Index> {
  if (cachedIndex) return cachedIndex;
  const docs = await loader().load();
  cachedIndex = buildIndex(docs);
  return cachedIndex;
}

export interface AskOptions {
  topK?: number;
  filter?: DocFilter;
}

export async function ask(question: string, opts: AskOptions = {}): Promise<Answer> {
  const index = await getIndex();
  const hits = search(index, question, opts.topK ?? config.topK, opts.filter);
  const answerText = await invokeClaude(SYSTEM, buildUserPrompt(question, hits));
  return {
    question,
    answer: answerText,
    sources: hits.map(h => ({ id: h.doc.id, title: h.doc.title, score: h.score })),
  };
}
