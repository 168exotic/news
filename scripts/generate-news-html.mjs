#!/usr/bin/env node
/**
 * Generate /news HTML pages for spaminthai.com from article JSON files.
 * Usage: node scripts/generate-news-html.mjs [--publish N] [--output DIR]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'articles');
const QUEUE_DIR = join(ARTICLES_DIR, 'queue');
const PUBLISHED_DIR = join(ARTICLES_DIR, 'published');
const DEFAULT_OUTPUT = join(ROOT, 'spaminthai-output');

const SITE = 'https://spaminthai.com';

const SITE_HEADER = `<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-brand">
      <picture class="site-brand__logo">
        <source srcset="/assets/logo-64.webp" type="image/webp">
        <img src="/assets/logo-64.png" alt="SpamInThai" width="40" height="40">
      </picture>
      <span class="site-brand__text">
        <span class="site-brand__title">SpamInThai</span>
        <span class="site-brand__tag">Block Scam Calls · SMS · URLs</span>
      </span>
    </a>
    <nav class="site-nav" aria-label="หลัก">
      <a href="/check" class="site-nav__link site-nav__link--primary">เช็คเบอร์โทร</a>
      <a href="/news" class="site-nav__link">ข่าวสาร</a>
      <a href="/report" class="site-nav__link">แจ้งเบาะแส</a>
      <a href="/download" class="site-nav__link">ดาวน์โหลดแอป</a>
      <a class="site-nav__link site-nav__link--apk" data-download href="/download/spaminthai-latest.apk" download>ดาวน์โหลด APK</a>
    </nav>
  </div>
  <div class="site-header__mobile">
    <a href="/check" class="site-tab site-tab--active">เช็คเบอร์โทร</a>
    <a href="/report" class="site-tab">แจ้งเบาะแส</a>
    <a href="/download" class="site-tab site-tab--apk" data-download href="/download/spaminthai-latest.apk" download>ดาวน์โหลด APK</a>
  </div>
</header>`;

const SITE_FOOTER = `<footer class="site-footer">
  <div class="site-footer__inner">
    <div>
      <p class="site-footer__title">SpamInThai — หยุดสแปมในไทยร่วมกัน</p>
      <p class="site-footer__desc">ฐานข้อมูลเบอร์ร้องเรียน คัดกรองภัยสังคมออนไลน์ ด้วยพลังประชาชน</p>
      <p class="site-footer__copy">© 2026 spaminthai</p>
    </div>
    <nav class="site-footer__links" aria-label="ลิงก์">
      <a href="/check">เช็คเบอร์โทร</a>
      <a href="/report">แจ้งเบาะแส</a>
      <a href="/download">ดาวน์โหลดแอป</a>
      <a href="/news">ข่าวสาร</a>
      <a href="/blog">บทความ</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="https://line.me/R/ti/p/@spaminthai" target="_blank" rel="noopener">Contact</a>
    </nav>
  </div>
</footer>`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(block) {
  switch (block.type) {
    case 'p':
      return `<p>${block.html || esc(block.text)}</p>`;
    case 'h2':
      return `<h2>${esc(block.text)}</h2>`;
    case 'h3':
      return `<h3>${esc(block.text)}</h3>`;
    case 'ul':
      return `<ul>${block.items.map((i) => `<li>${i.html || esc(i)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${block.items.map((i) => `<li>${i.html || esc(i)}</li>`).join('')}</ol>`;
    case 'box':
      return `<div class="box">${block.html || esc(block.text)}</div>`;
    default:
      return '';
  }
}

function formatThaiDate(iso) {
  const d = new Date(iso + 'T00:00:00+07:00');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const buddhistYear = d.getFullYear() + 543;
  return `${d.getDate()} ${months[d.getMonth()]} ${buddhistYear}`;
}

function renderArticle(article) {
  const slug = article.slug;
  const url = `${SITE}/news/${slug}`;
  const body = article.blocks.map(renderBlock).join('\n  ');
  const sources = (article.sources || [])
    .map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.name)}</a></li>`)
    .join('');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.dateModified || article.date,
    author: { '@type': 'Organization', name: 'SpamInThai' },
    publisher: {
      '@type': 'Organization',
      name: 'SpamInThai',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.png` },
    },
    inLanguage: 'th-TH',
    mainEntityOfPage: url,
  });

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(article.title)} | SpamInThai</title>
<meta name="description" content="${esc(article.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${esc(article.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(article.title)}">
<link rel="icon" href="/assets/favicon.png" type="image/png" sizes="64x64">
<script type="application/ld+json">${jsonLd}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/theme.css">
<link rel="stylesheet" href="/assets/layout.css">
</head>
<body>
<article class="wrap">
  <p class="crumb"><a href="/">หน้าแรก</a> · <a href="/news/">ข่าวสาร</a></p>
  <p class="meta">${formatThaiDate(article.date)}</p>
  <h1>${esc(article.title)}</h1>
  <p class="lead">${esc(article.lead)}</p>

  ${body}

  <h2>แหล่งข้อมูล</h2>
  <p>บทความนี้เรียบเรียงจากข่าวต้นฉบับดังต่อไปนี้ โดยไม่คัดลอกข้อความทั้งประโยค:</p>
  <ul class="sources">
    ${sources}
  </ul>
  <p class="disclaimer">SpamInThai ไม่ใช่สื่อข่าว เนื้อหาจัดทำเพื่อเตือนภัยและให้ข้อมูลอ้างอิง หากพบข้อผิดพลาดกรุณาแจ้งทีมงาน</p>

  <p style="margin-top:24px">สงสัยเบอร์มิจฉาชีพ? <a href="/check">เช็คเบอร์ฟรี</a> หรือ <a href="/report">แจ้งเบาะแส</a></p>
  <a class="cta" href="/check">เช็คเบอร์โทรฟรี</a>
</article>
<script src="/assets/ga4.js" defer></script>
</body>
</html>`;
}

function renderIndex(articles) {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const cards = sorted
    .map(
      (a) =>
        `<a class="card" href="/news/${a.slug}"><time datetime="${a.date}">${formatThaiDate(a.date)}</time><h2>${esc(a.title)}</h2><p>${esc(a.summary)}</p></a>`
    )
    .join('\n  ');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ข่าวสารคดีฉ้อโกง | SpamInThai',
    url: `${SITE}/news`,
    inLanguage: 'th-TH',
    publisher: { '@type': 'Organization', name: 'SpamInThai', url: SITE },
  });

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ข่าวสารคดีฉ้อโกง & แก๊งคอลเซ็นเตอร์ | SpamInThai</title>
<meta name="description" content="รวมข่าวคดีฉ้อโกงออนไลน์ แก๊งคอลเซ็นเตอร์ และการปราบปรามในไทย เรียบเรียงใหม่พร้อมอ้างอิงแหล่งที่มา อัปเดตทุกวัน">
<meta name="keywords" content="ข่าวฉ้อโกง, แก๊งคอลเซ็นเตอร์, มิจฉาชีพ, ข่าวอาชญากรรมออนไลน์">
<link rel="canonical" href="${SITE}/news">
<meta property="og:title" content="ข่าวสารคดีฉ้อโกง & แก๊งคอลเซ็นเตอร์ | SpamInThai">
<meta property="og:description" content="รวมข่าวคดีฉ้อโกงออนไลน์และแก๊งคอลเซ็นเตอร์ เรียบเรียงใหม่พร้อมอ้างอิงแหล่งที่มา">
<meta property="og:url" content="${SITE}/news">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.png" type="image/png" sizes="64x64">
<script type="application/ld+json">${jsonLd}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/theme.css">
<link rel="stylesheet" href="/assets/layout.css">
<style>
.news-index .card time { display:block; font-size:0.85rem; color:var(--muted,#888); margin-bottom:4px; }
.news-index .sub { color:var(--muted,#888); margin-bottom:24px; }
</style>
</head>
<body class="site-body">
${SITE_HEADER}
<main class="site-main site-main--wide news-index">
  <h1>ข่าวสารคดีฉ้อโกง</h1>
  <p class="sub">รวมข่าวคดีฉ้อโกงออนไลน์และแก๊งคอลเซ็นเตอร์จากหลายแหล่ง เรียบเรียงเนื้อหาใหม่และอ้างอิงแหล่งที่มาทุกบทความ อัปเดตวันละ 3–4 เรื่อง</p>

  ${cards}

</main>
${SITE_FOOTER}
<script src="/assets/site.js" defer></script>
<script src="/assets/ga4.js" defer></script>
</body>
</html>`;
}

function loadArticles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let output = DEFAULT_OUTPUT;
  let publish = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) output = args[++i];
    if (args[i] === '--publish') publish = parseInt(args[++i] || '0', 10);
  }
  return { output, publish };
}

function main() {
  const { output, publish } = parseArgs();
  const newsDir = join(output, 'news');
  mkdirSync(newsDir, { recursive: true });

  const published = loadArticles(PUBLISHED_DIR);
  const queue = loadArticles(QUEUE_DIR).sort((a, b) => a.date.localeCompare(b.date));

  let toPublish = [];
  if (publish > 0 && queue.length) {
    toPublish = queue.slice(0, publish);
    mkdirSync(PUBLISHED_DIR, { recursive: true });
    for (const article of toPublish) {
      const src = join(QUEUE_DIR, `${article.slug}.json`);
      const dst = join(PUBLISHED_DIR, `${article.slug}.json`);
      writeFileSync(dst, readFileSync(src));
      console.log(`Published: ${article.slug}`);
    }
  }

  const all = [...published, ...toPublish];
  const unique = Object.values(
    all.reduce((acc, a) => {
      acc[a.slug] = a;
      return acc;
    }, {})
  );

  for (const article of unique) {
    writeFileSync(join(newsDir, `${article.slug}.html`), renderArticle(article));
  }

  writeFileSync(join(newsDir, 'index.html'), renderIndex(unique));

  const manifest = {
    generatedAt: new Date().toISOString(),
    slugs: unique.map((a) => a.slug).sort(),
  };
  writeFileSync(join(output, 'news-manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(ROOT, 'news-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Generated ${unique.length} articles → ${newsDir}`);
  return manifest;
}

main();
