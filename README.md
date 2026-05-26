# Vectorless RAG (Node.js + TypeScript + AWS Bedrock)

A question-answering RAG system that uses **BM25 keyword search** instead of vector embeddings, and **AWS Bedrock Claude** for answer generation. Designed to start with a local JSON dataset and switch to ServiceNow (INC / RITM / CHG) later without changing the rest of the pipeline.

## Why vectorless?

For structured ticket/record data, BM25 + metadata filtering usually beats embeddings and skips the operational cost of an embedding model and a vector DB. The same code works against 10 records or 100k.

## Setup

```bash
npm install
cp .env.example .env
# edit .env if your region or model id differ
```

`.env` keys:
- `AWS_REGION` — e.g. `us-east-1`
- `BEDROCK_MODEL_ID` — Bedrock model id. The default is `us.anthropic.claude-sonnet-4-5-20250929-v1:0` (a US cross-region inference profile). Confirm the exact id in the Bedrock console under **Model catalog → Inference**.
- `TOP_K` — number of documents to retrieve per query (default 5)
- `DATA_PATH` — path to your JSON data file (default `./data/sample.json`)

AWS credentials are picked up via the standard AWS SDK chain (env vars, `~/.aws/credentials`, SSO, IAM role). Verify with:

```bash
aws sts get-caller-identity
```

## Ask a question

```bash
npm run ask -- "what is INC0012345 about?"
npm run ask -- "list priority 1 incidents"
npm run ask -- "what database change is scheduled?"
```

Output shape:

```
<grounded answer with [INC0012345]-style citations>

Sources:
  - [INC0012345] Login page returns 500 for SSO users  (score=56.57)
  - ...
```

## Project layout

```
src/
├── cli.ts              # CLI entry — parses argv, prints answer + sources
├── config.ts           # env loading
├── types.ts            # Document, Hit, Answer
├── loaders/
│   ├── index.ts        # picks loader based on config.dataSource
│   └── jsonLoader.ts   # reads + normalizes JSON → Document[]
├── retriever/
│   ├── bm25.ts         # MiniSearch-based BM25 index + query
│   └── filter.ts       # metadata filter helpers (byState, byPriority, ...)
├── llm/
│   ├── bedrock.ts      # @aws-sdk/client-bedrock-runtime wrapper
│   └── prompt.ts       # citation-enforcing system + user prompts
└── rag.ts              # pipeline: load → index → search → invoke Claude
data/sample.json        # 9 fake ServiceNow-shaped records for testing
```

## How retrieval works

1. `jsonLoader` reads the JSON file and maps each record to a `Document { id, title, text, metadata }`. For ticket-shaped records it concatenates `short_description + description + work_notes` into `text` and puts everything else into `metadata`.
2. `buildIndex` constructs a [MiniSearch](https://lucaong.github.io/minisearch/) BM25 index over `title` (boosted 2×) and `text`, with prefix and fuzzy matching enabled.
3. `search` runs the query, optionally pre-filtered by metadata (e.g. only `state in ("new","in_progress")`).
4. The top-K hits are formatted into the user prompt with explicit source ids; the system prompt enforces citations and refuses to answer outside the sources.

The index is cached in-process after the first query.

## Adding metadata filters

`src/retriever/filter.ts` exposes composable filter helpers:

```ts
import { ask } from './src/rag.js';
import { combine, byType, byPriority, byState } from './src/retriever/filter.js';

await ask('what's broken right now?', {
  filter: combine(byType('incident'), byPriority('1', '2'), byState('new', 'in_progress')),
});
```

## Migrating to ServiceNow (later)

1. Add `src/loaders/serviceNowLoader.ts` that calls `/api/now/table/incident`, `/sc_req_item`, `/change_request`.
2. Map each record to the same `Document` shape — put `number`, `state`, `priority`, `assignment_group`, `sys_created_on`, etc. into `metadata`.
3. Wire it in `src/loaders/index.ts` under the `'servicenow'` case.
4. Set `DATA_SOURCE=servicenow` in `.env`.
5. (Optional) Persist the BM25 index with `index.toJSON()` / `MiniSearch.loadJSON()` and refresh on a schedule so you're not refetching ServiceNow every query.

No other code changes are needed.

## Why not LangChain?

LangChain is a framework that sits on top of a model provider like Bedrock. For this design — single-pass BM25 retrieval, one model call, one prompt — it adds abstraction tax (chains, retrievers, callbacks, parsers) without solving a problem we have. If you later need multi-hop retrieval, query rewriting, or tool-using agents, that's the moment to re-evaluate.

## Why Bedrock (not the Anthropic API directly)?

You're in AWS already. Bedrock gives you a single billing path, IAM-based access, and stays inside your VPC if you set up VPC endpoints. Call shape is similar enough to the Anthropic API that swapping later is one file (`src/llm/bedrock.ts`).
