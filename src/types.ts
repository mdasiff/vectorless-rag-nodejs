export interface Document {
  id: string;
  title: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface Hit {
  doc: Document;
  score: number;
}

export interface Answer {
  question: string;
  answer: string;
  sources: Array<{ id: string; title: string; score: number }>;
}

export interface Loader {
  load(): Promise<Document[]>;
}
