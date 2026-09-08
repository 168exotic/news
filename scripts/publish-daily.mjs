#!/usr/bin/env node
/**
 * Publish articles from queue and sync to spaminthai.
 * Usage: node scripts/publish-daily.mjs [--count N] [--spaminthai-dir DIR]
 */
import { readdirSync, renameSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const QUEUE_DIR = join(ROOT, 'articles/queue');
const PUBLISHED_DIR = join(ROOT, 'articles/published');

function parseArgs() {
  const args = process.argv.slice(2);
  let count = 1;
  let spaminthaiDir = join(ROOT, 'spaminthai');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) count = parseInt(args[++i], 10);
    if (args[i] === '--spaminthai-dir' && args[i + 1]) spaminthaiDir = args[++i];
  }
  return { count, spaminthaiDir };
}

function main() {
  const { count, spaminthaiDir } = parseArgs();
  mkdirSync(PUBLISHED_DIR, { recursive: true });

  if (!existsSync(QUEUE_DIR)) {
    console.log('No queue directory — nothing to publish');
    return;
  }

  const queued = readdirSync(QUEUE_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .slice(0, count);

  if (!queued.length) {
    console.log('Queue empty — nothing to publish');
    return;
  }

  for (const file of queued) {
    renameSync(join(QUEUE_DIR, file), join(PUBLISHED_DIR, file));
    console.log(`Moved to published: ${file}`);
  }

  execSync(`node ${join(ROOT, 'scripts/generate-news-html.mjs')} --output ${join(ROOT, 'spaminthai-output')}`, {
    stdio: 'inherit',
  });

  execSync(
    `node ${join(ROOT, 'scripts/sync-to-spaminthai.mjs')} --spaminthai-dir ${spaminthaiDir}`,
    { stdio: 'inherit' }
  );

  console.log(`Published ${queued.length} article(s)`);
}

main();
