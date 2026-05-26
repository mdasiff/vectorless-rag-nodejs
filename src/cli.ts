import { ask } from './rag.js';

async function main() {
  const question = process.argv.slice(2).join(' ').trim();
  if (!question) {
    console.error('Usage: npm run ask -- "<your question>"');
    process.exit(1);
  }

  try {
    const result = await ask(question);
    console.log('\n' + result.answer + '\n');
    if (result.sources.length > 0) {
      console.log('Sources:');
      for (const s of result.sources) {
        console.log(`  - [${s.id}] ${s.title}  (score=${s.score.toFixed(2)})`);
      }
    } else {
      console.log('Sources: (none matched)');
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
