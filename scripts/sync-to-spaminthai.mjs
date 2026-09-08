#!/usr/bin/env node
/**
 * Sync generated news HTML to spaminthai repo and update sitemap NEWS_SLUGS.
 * Usage: node scripts/sync-to-spaminthai.mjs --spaminthai-dir /path/to/spaminthai
 */
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let spaminthaiDir = join(ROOT, 'spaminthai');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spaminthai-dir' && args[i + 1]) spaminthaiDir = args[++i];
  }
  return { spaminthaiDir };
}

function updateSitemap(spaminthaiDir, slugs) {
  const sitemapPath = join(spaminthaiDir, 'functions/api/sitemap.js');
  let content = readFileSync(sitemapPath, 'utf8');

  const newsSlugsBlock = `const NEWS_SLUGS = [\n${slugs.map((s) => `  '${s}',`).join('\n')}\n];`;

  if (content.includes('const NEWS_SLUGS')) {
    content = content.replace(/const NEWS_SLUGS = \[[\s\S]*?\];/, newsSlugsBlock);
  } else {
    content = content.replace(
      /const BLOG_SLUGS = \[[\s\S]*?\];/,
      (match) => `${match}\n\n${newsSlugsBlock}`
    );
  }

  if (!content.includes("loc: '/news'")) {
    content = content.replace(
      /{ loc: '\/blog', priority: '0\.7', changefreq: 'weekly' },/,
      `{ loc: '/blog', priority: '0.7', changefreq: 'weekly' },\n  { loc: '/news', priority: '0.8', changefreq: 'daily' },`
    );
  }

  if (!content.includes('for (const slug of NEWS_SLUGS)')) {
    content = content.replace(
      /for \(const slug of BLOG_SLUGS\) \{[\s\S]*?\}\n\n/,
      (match) =>
        `${match}  for (const slug of NEWS_SLUGS) {
    lines.push(urlEntry(\`/news/\${slug}\`, { priority: '0.78', changefreq: 'weekly', lastmod }));
  }

`
    );
  }

  writeFileSync(sitemapPath, content);
  console.log(`Updated sitemap with ${slugs.length} news slugs`);
}

function main() {
  const { spaminthaiDir } = parseArgs();
  const manifestPath = join(ROOT, 'news-manifest.json');
  const newsOutput = join(ROOT, 'spaminthai-output/news');

  if (!existsSync(manifestPath)) {
    console.error('Run generate-news-html.mjs first');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const srcNews = existsSync(newsOutput) ? newsOutput : join(spaminthaiDir, 'news');

  mkdirSync(join(spaminthaiDir, 'news'), { recursive: true });
  cpSync(srcNews, join(spaminthaiDir, 'news'), { recursive: true, force: true });

  updateSitemap(spaminthaiDir, manifest.slugs);
  console.log(`Synced news → ${join(spaminthaiDir, 'news')}`);
}

main();
