import type { Hit } from '../types.js';

export const SYSTEM = `You answer questions strictly from the provided SOURCES.

Rules:
- If the answer is not in the sources, say exactly: "I don't have enough information."
- Cite source ids in square brackets like [INC0012345] after any claim that uses them.
- Be concise. Prefer bullet points when listing multiple records.
- Do not invent record numbers, dates, names, or fields not present in the sources.`;

export function buildUserPrompt(question: string, hits: Hit[]): string {
  if (hits.length === 0) {
    return `SOURCES: (none retrieved)\n\nQUESTION: ${question}`;
  }
  const ctx = hits
    .map(
      h =>
        `[${h.doc.id}] ${h.doc.title}\n${h.doc.text}\nMETADATA: ${JSON.stringify(h.doc.metadata)}`
    )
    .join('\n\n---\n\n');
  return `SOURCES:\n\n${ctx}\n\nQUESTION: ${question}`;
}
