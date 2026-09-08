#!/usr/bin/env node
/**
 * Full deploy of /news section to spaminthai repo.
 * Applies patch files + generated news HTML + sitemap update.
 */
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PATCH_DIR = join(ROOT, 'spaminthai-patch');

function parseArgs() {
  const args = process.argv.slice(2);
  let spaminthaiDir = join(ROOT, 'spaminthai');
  let publishCount = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spaminthai-dir' && args[i + 1]) spaminthaiDir = args[++i];
    if (args[i] === '--publish' && args[i + 1]) publishCount = parseInt(args[++i], 10);
  }
  return { spaminthaiDir, publishCount };
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
}

function patchIndexHtml(spaminthaiDir) {
  const indexPath = join(spaminthaiDir, 'index.html');
  if (!existsSync(indexPath)) return;
  let html = readFileSync(indexPath, 'utf8');

  if (!html.includes('href="/news"')) {
    html = html.replace(
      '<a href="/check" class="site-nav__link site-nav__link--primary">เช็คเบอร์โทร</a>\n      <a href="/report"',
      '<a href="/check" class="site-nav__link site-nav__link--primary">เช็คเบอร์โทร</a>\n      <a href="/news" class="site-nav__link">ข่าวสาร</a>\n      <a href="/report"'
    );
    html = html.replace(
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/blog">บทความ</a>',
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/news">ข่าวสาร</a>\n      <a href="/blog">บทความ</a>'
    );
    writeFileSync(indexPath, html);
    console.log('Patched index.html nav links');
  }
}

function patchApplyThemeChrome(spaminthaiDir) {
  const scriptPath = join(spaminthaiDir, 'scripts/apply-theme-chrome.py');
  if (!existsSync(scriptPath)) return;
  let content = readFileSync(scriptPath, 'utf8');
  if (!content.includes('"news/index.html"')) {
    content = content.replace(
      'CONTENT_PAGES = [\n    "blog/index.html",',
      'CONTENT_PAGES = [\n    "news/index.html",\n    "blog/index.html",'
    );
    writeFileSync(scriptPath, content);
    console.log('Patched apply-theme-chrome.py');
  }
}

function main() {
  const { spaminthaiDir, publishCount } = parseArgs();

  if (publishCount > 0) {
    execSync(`node ${join(ROOT, 'scripts/publish-daily.mjs')} --count ${publishCount} --spaminthai-dir ${spaminthaiDir}`, {
      stdio: 'inherit',
    });
    return;
  }

  // Apply static patches
  copyDir(join(PATCH_DIR, 'news'), join(spaminthaiDir, 'news'));
  copyDir(join(PATCH_DIR, 'assets'), join(spaminthaiDir, 'assets'));
  if (existsSync(join(PATCH_DIR, 'functions/api/sitemap.js'))) {
    mkdirSync(join(spaminthaiDir, 'functions/api'), { recursive: true });
    cpSync(join(PATCH_DIR, 'functions/api/sitemap.js'), join(spaminthaiDir, 'functions/api/sitemap.js'), { force: true });
  }

  patchIndexHtml(spaminthaiDir);
  patchApplyThemeChrome(spaminthaiDir);

  // Regenerate news HTML from published articles
  execSync(`node ${join(ROOT, 'scripts/generate-news-html.mjs')} --output ${join(ROOT, 'spaminthai-output')}`, {
    stdio: 'inherit',
  });
  execSync(`node ${join(ROOT, 'scripts/sync-to-spaminthai.mjs')} --spaminthai-dir ${spaminthaiDir}`, {
    stdio: 'inherit',
  });

  console.log('Full deploy complete →', spaminthaiDir);
}

main();
