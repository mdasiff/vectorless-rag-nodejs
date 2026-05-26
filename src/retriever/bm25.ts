import MiniSearch from 'minisearch';
import type { Document, Hit } from '../types.js';

export type Index = MiniSearch<Document>;

export function buildIndex(docs: Document[]): Index {
  const ms = new MiniSearch<Document>({
    fields: ['title', 'text'],
    storeFields: ['id', 'title', 'text', 'metadata'],
    idField: 'id',
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
    },
  });
  ms.addAll(docs);
  return ms;
}

export function search(
  ms: Index,
  query: string,
  topK = 5,
  filter?: (doc: any) => boolean
): Hit[] {
  const results = ms.search(query, filter ? { filter } : undefined);
  return results.slice(0, topK).map(r => ({
    doc: {
      id: r.id as string,
      title: r.title as string,
      text: r.text as string,
      metadata: r.metadata as Record<string, unknown>,
    },
    score: r.score,
  }));
}
