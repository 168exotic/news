#!/usr/bin/env node
/**
 * Sync generated news HTML to spaminthai repo and update sitemap NEWS_SLUGS.
 * Usage: node scripts/sync-to-spaminthai.mjs --spaminthai-dir /path/to/spaminthai
 */
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
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

function updateSitemap(spaminthaiDir, slugs, pageCount) {
  const sitemapPath = join(spaminthaiDir, 'functions/api/sitemap.js');
  let content = readFileSync(sitemapPath, 'utf8');

  const newsSlugsBlock = `const NEWS_SLUGS = [\n${slugs.map((s) => `  '${s}',`).join('\n')}\n];`;
  const newsPageCountBlock = `const NEWS_PAGE_COUNT = ${pageCount};`;

  if (content.includes('const NEWS_SLUGS')) {
    content = content.replace(/const NEWS_SLUGS = \[[\s\S]*?\];/, newsSlugsBlock);
  } else {
    content = content.replace(
      /const BLOG_SLUGS = \[[\s\S]*?\];/,
      (match) => `${match}\n\n${newsSlugsBlock}`
    );
  }

  if (content.includes('const NEWS_PAGE_COUNT')) {
    content = content.replace(/const NEWS_PAGE_COUNT = \d+;/, newsPageCountBlock);
  } else {
    content = content.replace(/const NEWS_SLUGS = \[[\s\S]*?\];/, (match) => `${match}\n\n${newsPageCountBlock}`);
  }

  if (!content.includes("loc: '/news-1'")) {
    content = content.replace(
      /{ loc: '\/news', priority: '0\.8', changefreq: 'daily' },/,
      `{ loc: '/news-1', priority: '0.8', changefreq: 'daily' },`
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

  if (!content.includes('for (let p = 1; p <= NEWS_PAGE_COUNT')) {
    content = content.replace(
      /for \(const slug of NEWS_SLUGS\) \{[\s\S]*?\}\n\n/,
      (match) =>
        `${match}  for (let p = 1; p <= NEWS_PAGE_COUNT; p++) {
    lines.push(urlEntry(\`/news-\${p}\`, { priority: p === 1 ? '0.8' : '0.72', changefreq: 'daily', lastmod }));
  }

`
    );
  }

  writeFileSync(sitemapPath, content);
  console.log(`Updated sitemap with ${slugs.length} news slugs, ${pageCount} pages`);
}

function syncPaginatedIndex(spaminthaiDir, outputRoot) {
  const existing = readdirSync(spaminthaiDir).filter((f) => /^news-\d+\.html$/.test(f));
  for (const f of existing) {
    unlinkSync(join(spaminthaiDir, f));
  }

  if (!existsSync(outputRoot)) return;
  const pages = readdirSync(outputRoot).filter((f) => /^news-\d+\.html$/.test(f));
  for (const f of pages) {
    cpSync(join(outputRoot, f), join(spaminthaiDir, f));
  }
  console.log(`Synced ${pages.length} paginated news index page(s)`);
}

function updateRedirects(spaminthaiDir) {
  const redirectsPath = join(spaminthaiDir, '_redirects');
  let content = existsSync(redirectsPath) ? readFileSync(redirectsPath, 'utf8') : '';
  const rule = '/news /news-1 301';
  if (!content.includes(rule)) {
    content = content.trimEnd() + (content.endsWith('\n') ? '' : '\n') + `\n${rule}\n`;
    writeFileSync(redirectsPath, content);
    console.log('Added /news → /news-1 redirect');
  }
}

function main() {
  const { spaminthaiDir } = parseArgs();
  const manifestPath = join(ROOT, 'news-manifest.json');

  if (!existsSync(manifestPath)) {
    console.error('Run generate-news-html.mjs first');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const outputRoot = join(ROOT, 'spaminthai-output');
  const srcNews = existsSync(join(outputRoot, 'news')) ? join(outputRoot, 'news') : join(spaminthaiDir, 'news');

  mkdirSync(join(spaminthaiDir, 'news'), { recursive: true });
  cpSync(srcNews, join(spaminthaiDir, 'news'), { recursive: true, force: true });

  syncPaginatedIndex(spaminthaiDir, outputRoot);
  updateRedirects(spaminthaiDir);
  updateSitemap(spaminthaiDir, manifest.slugs, manifest.pageCount || 1);
  console.log(`Synced news → ${join(spaminthaiDir, 'news')}`);
}

main();
