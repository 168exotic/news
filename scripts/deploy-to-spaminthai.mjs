#!/usr/bin/env node
/**
 * Full deploy of /news section to spaminthai repo.
 * Only adds news content + nav links — never overwrites existing site files.
 */
import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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

function patchNavLink(html, label, href, afterPattern) {
  if (html.includes(`href="${href}"`)) return html;
  return html.replace(afterPattern, (m) => `${m}\n      <a href="${href}" class="site-nav__link">${label}</a>`);
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
      '<a href="/check" class="site-tab site-tab--active">เช็คเบอร์โทร</a>\n    <a href="#official"',
      '<a href="/check" class="site-tab site-tab--active">เช็คเบอร์โทร</a>\n    <a href="/news" class="site-tab">ข่าวสาร</a>\n    <a href="#official"'
    );
    html = html.replace(
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/blog">บทความ</a>',
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/news">ข่าวสาร</a>\n      <a href="/blog">บทความ</a>'
    );
    writeFileSync(indexPath, html);
    console.log('Patched index.html — added ข่าวสาร link only');
  }
}

function patchSiteChrome(spaminthaiDir) {
  const chromePath = join(spaminthaiDir, 'assets/snippets/site-chrome.html');
  if (!existsSync(chromePath)) return;
  let html = readFileSync(chromePath, 'utf8');

  if (!html.includes('href="/news"')) {
    html = html.replace(
      '<a href="/check" class="site-nav__link site-nav__link--primary">เช็คเบอร์โทร</a>\n      <a href="/report"',
      '<a href="/check" class="site-nav__link site-nav__link--primary">เช็คเบอร์โทร</a>\n      <a href="/news" class="site-nav__link">ข่าวสาร</a>\n      <a href="/report"'
    );
    html = html.replace(
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/blog">บทความ</a>',
      '<a href="/download">ดาวน์โหลดแอป</a>\n      <a href="/news">ข่าวสาร</a>\n      <a href="/blog">บทความ</a>'
    );
    writeFileSync(chromePath, html);
    console.log('Patched site-chrome.html — added ข่าวสาร link only');
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

  patchIndexHtml(spaminthaiDir);
  patchSiteChrome(spaminthaiDir);
  patchApplyThemeChrome(spaminthaiDir);

  execSync(`node ${join(ROOT, 'scripts/generate-news-html.mjs')} --output ${join(ROOT, 'spaminthai-output')}`, {
    stdio: 'inherit',
  });
  execSync(`node ${join(ROOT, 'scripts/sync-to-spaminthai.mjs')} --spaminthai-dir ${spaminthaiDir}`, {
    stdio: 'inherit',
  });

  console.log('Deploy complete (additive only) →', spaminthaiDir);
}

main();
