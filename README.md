# Vectorless RAG (Node.js + TypeScript)

A question-answering RAG system that uses **BM25 keyword search** instead of vector embeddings, with a pluggable LLM layer (Anthropic API or AWS Bedrock, selectable via env flag). Designed to start with a local JSON dataset and switch to ServiceNow (INC / RITM / CHG) later without changing the rest of the pipeline.

## Why vectorless?

For structured ticket/record data, BM25 + metadata filtering usually beats embeddings and skips the operational cost of an embedding model and a vector DB. The same code works against 10 records or 100k.

## Setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum, paste your ANTHROPIC_API_KEY
```

### LLM provider

The system reads `LLM_PROVIDER` from `.env` to pick which backend to call:

| `LLM_PROVIDER` | Backend | Required env | Notes |
|---|---|---|---|
| `gemini` (default) | Google Gemini via AI Studio | `GEMINI_API_KEY` | Free tier, no card required |
| `anthropic` | Direct Anthropic API | `ANTHROPIC_API_KEY` | Requires paid credits |
| `bedrock` | AWS Bedrock (Claude or any Bedrock-hosted model) | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BEDROCK_MODEL_ID` | Long-term target; blocked on AISPL for now |

To swap providers, change `LLM_PROVIDER` in `.env`. No code changes required.

> **Why Gemini as the default today?** Our AWS account (AISPL/India) has a soft Marketplace hold on Anthropic Claude in Bedrock for new accounts, and the direct Anthropic API now requires paid credits up front. Google AI Studio's free tier (`gemini-2.5-flash`) lets us run thousands of RAG queries with no card, perfect for development and demos. The long-term target is `LLM_PROVIDER=bedrock` once the AWS account is unblocked.

### Google Gemini setup (current default)

1. Open https://aistudio.google.com/apikey and sign in with a Google account.
2. **Create API key** → copy the value (starts with `AIza...`).
3. Paste it into `.env` as `GEMINI_API_KEY=AIza...`. No card required.
4. Free tier limits: ~15 requests/minute on `gemini-2.5-flash` — comfortably more than any demo needs.

### Anthropic API setup

1. Sign up at https://console.anthropic.com.
2. **Plans & Billing** → add a payment method → buy credits (~$5 covers thousands of queries on this dataset).
3. Settings → API Keys → Create Key → copy the `sk-ant-...` value.
4. Paste it into `.env` as `ANTHROPIC_API_KEY=sk-ant-...`, set `LLM_PROVIDER=anthropic`.

### AWS Bedrock setup (long-term target)

1. Bedrock console → Model access → enable Claude Sonnet 4.5 (us-east-1).
2. IAM → create user with `AmazonBedrockFullAccess` → generate access key + secret.
3. Paste creds + `BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0` into `.env`.
4. Set `LLM_PROVIDER=bedrock`.

## Ask a question

### ServiceNow demo (default — `data/sample.json`)

```bash
npm run ask -- "what is INC0012345 about?"
npm run ask -- "list priority 1 incidents"
npm run ask -- "what database change is scheduled?"
npm run ask -- "what database upgrade is scheduled?"
npm run ask -- "what happened with the WAF rules?"
npm run ask -- "list open incidents for the database team"
npm run ask -- "what is the meaning of life?"
```

The last one should return *"I don't have enough information."* — it's the grounding test, confirming the LLM doesn't hallucinate beyond the retrieved sources.

### Property / real-estate demo (set `DATA_PATH=./data/sample-property.json` in `.env`)

Covers property listings, localities, builders, FAQs, and home-buying guides.

```bash
# Property details
npm run ask -- "Tell me about the 3 BHK apartment in Gaur City 2."
npm run ask -- "What is the price of the Ace City apartment?"
npm run ask -- "Which properties are ready to move?"
npm run ask -- "Show me apartments under 80 lakh."
npm run ask -- "Which property has the largest area?"
npm run ask -- "Do you have any residential plots available?"
npm run ask -- "Which property is suitable for a family of 4?"
npm run ask -- "Which properties are available in Noida Extension?"
npm run ask -- "Show me 3 BHK properties under 1 crore."
npm run ask -- "What amenities are available in Gaur City 2?"

# Locality and neighbourhood
npm run ask -- "Is Noida Extension a good place to live?"
npm run ask -- "Tell me about Greater Noida West."
npm run ask -- "What schools are available near Noida Extension?"
npm run ask -- "Are there hospitals near these properties?"
npm run ask -- "Which area is best for first-time home buyers?"
npm run ask -- "How is the connectivity of Noida Extension?"
npm run ask -- "Which locality has the best infrastructure?"
npm run ask -- "Tell me about nearby shopping malls and markets."

# Builder
npm run ask -- "Who is Gaursons?"
npm run ask -- "Is Gaursons a trusted builder?"
npm run ask -- "Which projects are developed by ACE Group?"
npm run ask -- "Tell me about the builder of this property."
npm run ask -- "What is the reputation of ACE Group?"

# Home-buying FAQs and guides
npm run ask -- "What documents should I verify before buying a property?"
npm run ask -- "What is RERA?"
npm run ask -- "How much home loan can I get?"
npm run ask -- "What should I check before booking a flat?"
npm run ask -- "What is the difference between ready-to-move and under-construction properties?"
npm run ask -- "How much down payment is usually required for a home loan?"
npm run ask -- "What are the benefits of buying a ready-to-move property?"

# Cross-record queries
npm run ask -- "Show me 3 BHK apartments under 80 lakh."
npm run ask -- "Which properties have nearby schools?"
npm run ask -- "Which properties are close to hospitals?"
npm run ask -- "Compare Gaur City 2 and Ace City."
npm run ask -- "Which property offers the best value for money?"
npm run ask -- "Which property would you recommend for a family?"
npm run ask -- "Which property is best for investment?"
npm run ask -- "Which property is best for rental income?"

# Persona / scenario-driven
npm run ask -- "I have a budget of 80 lakh. Which property would you recommend?"
npm run ask -- "I have a budget of 60 lakh. What options do I have?"
npm run ask -- "I need a 3 BHK for my family. What are my options?"
npm run ask -- "I want a ready-to-move apartment near good schools."
npm run ask -- "I am a first-time home buyer. Which property should I consider?"
npm run ask -- "I work in Noida. Which property offers good connectivity?"
npm run ask -- "I want a property with modern amenities and clubhouse facilities."
npm run ask -- "I have two children. Which property is near good schools?"
npm run ask -- "Which property has the best location for daily commuting?"
npm run ask -- "Can you recommend a property for long-term investment?"
npm run ask -- "What are the advantages of buying in Noida Extension?"
npm run ask -- "Which property is closest to hospitals and schools?"
npm run ask -- "What are the upcoming developments in Greater Noida West?"
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
├── config.ts           # env loading (LLM_PROVIDER + provider-specific keys)
├── types.ts            # Document, Hit, Answer
├── loaders/
│   ├── index.ts        # picks loader based on config.dataSource
│   └── jsonLoader.ts   # reads + normalizes JSON → Document[]
├── retriever/
│   ├── bm25.ts         # MiniSearch-based BM25 index + query
│   └── filter.ts       # metadata filter helpers (byState, byPriority, ...)
├── llm/
│   ├── index.ts        # provider factory: invokeModel(system, user)
│   ├── gemini.ts       # @google/genai implementation
│   ├── anthropic.ts    # @anthropic-ai/sdk implementation
│   ├── bedrock.ts      # @aws-sdk/client-bedrock-runtime implementation
│   └── prompt.ts       # citation-enforcing system + user prompts
└── rag.ts              # pipeline: load → index → search → invokeModel
data/sample.json        # 9 fake ServiceNow-shaped records for testing
```

## How retrieval works

1. `jsonLoader` reads the JSON file and maps each record to a `Document { id, title, text, metadata }`. For ticket-shaped records it concatenates `short_description + description + work_notes` into `text` and puts everything else into `metadata`.
2. `buildIndex` constructs a [MiniSearch](https://lucaong.github.io/minisearch/) BM25 index over `title` (boosted 2×) and `text`, with prefix and fuzzy matching enabled.
3. `search` runs the query, optionally pre-filtered by metadata (e.g. only `state in ("new","in_progress")`).
4. The top-K hits are formatted into the user prompt with explicit source ids; the system prompt enforces citations and refuses to answer outside the sources.
5. The active LLM provider (Gemini, Anthropic, or Bedrock) is called with the same `invokeModel(system, user)` signature.

The index is cached in-process after the first query.

## Adding metadata filters

`src/retriever/filter.ts` exposes composable filter helpers:

```ts
import { ask } from './src/rag.js';
import { combine, byType, byPriority, byState } from './src/retriever/filter.js';

await ask("what's broken right now?", {
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

LangChain is a framework that sits on top of a model provider. For this design — single-pass BM25 retrieval, one model call, one prompt — it adds abstraction tax (chains, retrievers, callbacks, parsers) without solving a problem we have. If you later need multi-hop retrieval, query rewriting, or tool-using agents, that's the moment to re-evaluate.
