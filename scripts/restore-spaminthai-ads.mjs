#!/usr/bin/env node
/**
 * Restore affiliate ad slots + assets on spaminthai.com checkout.
 * Usage: node scripts/restore-spaminthai-ads.mjs --spaminthai-dir ../spaminthai
 */
import { readFileSync, writeFileSync, cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PATCH_ASSETS = join(ROOT, 'spaminthai-patch/assets');

const AFF_CSS = '<link rel="stylesheet" href="/assets/affiliate.css">';
const AFF_SCRIPT = '<script src="/assets/affiliate.js"></script>';
const SLOT_SIDEBAR = '<div class="affiliate-slot" data-slot="sidebar-top" aria-label="โฆษณา"></div>';
const SLOT_BELOW = '<div class="affiliate-slot" data-slot="below-result" aria-label="โฆษณา"></div>';
const SLOT_ARTICLE = '<aside class="affiliate-slot" data-slot="article-mid" aria-label="โฆษณา"></aside>';

function parseArgs() {
  const args = process.argv.slice(2);
  let spaminthaiDir = join(ROOT, 'spaminthai');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spaminthai-dir' && args[i + 1]) spaminthaiDir = args[++i];
  }
  return { spaminthaiDir };
}

function syncAffiliateAssets(spaminthaiDir) {
  const dest = join(spaminthaiDir, 'assets');
  for (const file of ['affiliate.js', 'affiliate.css']) {
    const src = join(PATCH_ASSETS, file);
    if (!existsSync(src)) continue;
    cpSync(src, join(dest, file));
    console.log('Synced assets/' + file);
  }
}

function ensureAffiliateHead(html) {
  if (html.includes('/assets/affiliate.css')) return html;
  if (html.includes('/assets/layout.css')) {
    return html.replace(
      '<link rel="stylesheet" href="/assets/layout.css">',
      '<link rel="stylesheet" href="/assets/layout.css">\n' + AFF_CSS
    );
  }
  return html.replace('</head>', AFF_CSS + '\n</head>');
}

function ensureAffiliateScript(html) {
  if (html.includes('/assets/affiliate.js')) return html;
  if (html.includes('/assets/ga4.js')) {
    return html.replace(
      '<script src="/assets/ga4.js" defer></script>',
      AFF_SCRIPT + '\n<script src="/assets/ga4.js" defer></script>'
    );
  }
  return html.replace('</body>', AFF_SCRIPT + '\n</body>');
}

function patchIndexHtml(spaminthaiDir) {
  const path = join(spaminthaiDir, 'index.html');
  if (!existsSync(path)) return;
  let html = readFileSync(path, 'utf8');
  const before = html;
  html = ensureAffiliateHead(html);
  if (!html.includes('data-slot="below-result"')) {
    html = html.replace(
      '\n      <!-- Download CTA -->',
      '\n\n      ' + SLOT_BELOW + '\n\n      <!-- Download CTA -->'
    );
  }
  if (!html.includes('data-slot="sidebar-top"')) {
    html = html.replace(
      '    <!-- Right: Sidebar (tips + report first on mobile) -->',
      '    <!-- Right: Sidebar (tips + report first on mobile) -->\n      ' + SLOT_SIDEBAR
    );
  }
  html = ensureAffiliateScript(html);
  if (html !== before) {
    writeFileSync(path, html);
    console.log('Patched index.html affiliate slots/scripts');
  }
}

function patchCheckHtml(spaminthaiDir) {
  const path = join(spaminthaiDir, 'check.html');
  if (!existsSync(path)) return;
  let html = readFileSync(path, 'utf8');
  const before = html;
  html = ensureAffiliateHead(html);
  if (!html.includes('data-slot="below-result"')) {
    html = html.replace(
      '  </section>\n\n  <section class="cta">',
      '  </section>\n\n  ' + SLOT_BELOW + '\n\n  <section class="cta">'
    );
  }
  html = ensureAffiliateScript(html);
  if (html !== before) {
    writeFileSync(path, html);
    console.log('Patched check.html affiliate');
  }
}

function patchArticleHtml(html) {
  let out = ensureAffiliateHead(html);
  out = ensureAffiliateScript(out);
  if (out.includes('data-slot="article-mid"')) return out;
  if (out.includes('<p class="lead">')) {
    out = out.replace(/(<p class="lead">[\s\S]*?<\/p>)/, `$1\n\n  ${SLOT_ARTICLE}`);
  } else if (out.includes('<h1')) {
    out = out.replace(/(<h1[\s\S]*?<\/h1>)/, `$1\n\n  ${SLOT_ARTICLE}`);
  }
  return out;
}

function patchNewsIndexHtml(html) {
  let out = ensureAffiliateHead(html);
  out = ensureAffiliateScript(out);
  if (!out.includes('data-slot="sidebar-top"') && out.includes('<p class="sub">')) {
    out = out.replace(/(<p class="sub">[\s\S]*?<\/p>)/, `$1\n\n  ${SLOT_SIDEBAR}`);
  }
  return out;
}

function walkHtmlFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtmlFiles(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function patchContentPages(spaminthaiDir) {
  const roots = [
    join(spaminthaiDir, 'news'),
    join(spaminthaiDir, 'blog'),
    join(spaminthaiDir, 'guide'),
  ];
  let count = 0;
  for (const root of roots) {
    for (const file of walkHtmlFiles(root)) {
      let html = readFileSync(file, 'utf8');
      const before = html;
      html = patchArticleHtml(html);
      if (html !== before) {
        writeFileSync(file, html);
        count++;
      }
    }
  }
  for (const name of readdirSync(spaminthaiDir)) {
    if (!/^news-\d+\.html$/.test(name)) continue;
    const file = join(spaminthaiDir, name);
    let html = readFileSync(file, 'utf8');
    const before = html;
    html = patchNewsIndexHtml(html);
    if (html !== before) {
      writeFileSync(file, html);
      count++;
    }
  }
  console.log(`Patched ${count} content HTML files with affiliate slots`);
}

function main() {
  const { spaminthaiDir } = parseArgs();
  if (!existsSync(spaminthaiDir)) {
    console.error('spaminthai dir not found:', spaminthaiDir);
    process.exit(1);
  }
  syncAffiliateAssets(spaminthaiDir);
  patchIndexHtml(spaminthaiDir);
  patchCheckHtml(spaminthaiDir);
  patchContentPages(spaminthaiDir);
  console.log('Affiliate restore complete');
}

main();
