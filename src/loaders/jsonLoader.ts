import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Document, Loader } from '../types.js';

interface RawRecord {
  id: string;
  type?: string;
  short_description?: string;
  description?: string;
  work_notes?: string;
  state?: string;
  priority?: string;
  assignment_group?: string;
  opened_at?: string;
  [k: string]: unknown;
}

export function jsonLoader(path: string): Loader {
  return {
    async load(): Promise<Document[]> {
      const raw = await readFile(resolve(path), 'utf8');
      const records = JSON.parse(raw) as RawRecord[];
      return records.map(toDocument);
    },
  };
}

function toDocument(r: RawRecord): Document {
  const title = r.short_description ?? r.id;
  const text = [r.short_description, r.description, r.work_notes]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join('\n');
  const { id, short_description, description, work_notes, ...metadata } = r;
  return { id, title, text, metadata };
}
