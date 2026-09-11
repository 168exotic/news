#!/usr/bin/env node
/**
 * Build SEO landing pages for Shopee shop discovery (Google/Bing).
 * Usage: SITE_URL=https://your-domain.com node shop-seo/scripts/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'dist');
const config = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));

const SITE = (process.env.SITE_URL || config.defaultSiteUrl).replace(/\/$/, '');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function keywordsCsv(extra = []) {
  return [...new Set([...config.keywords, ...extra])].join(', ');
}

function layout({ title, description, canonical, ogType = 'website', jsonLd, body }) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="keywords" content="${esc(keywordsCsv())}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:locale" content="th_TH">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(config.shopName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#0b1220;--card:#121a2b;--text:#e8edf7;--muted:#9fb0cc;--accent:#ff6633;--accent2:#2dd4bf;--line:#243049}
*{box-sizing:border-box}
body{margin:0;font-family:"IBM Plex Sans Thai",system-ui,sans-serif;background:linear-gradient(180deg,#0b1220,#101828);color:var(--text);line-height:1.65}
.wrap{max-width:920px;margin:0 auto;padding:1.25rem 1rem 3rem}
.hero{padding:1.5rem 0 1rem}
.badge{display:inline-block;background:#1e293b;color:var(--accent2);border:1px solid var(--line);padding:.25rem .6rem;border-radius:999px;font-size:.85rem;margin-bottom:.75rem}
h1{font-size:clamp(1.6rem,4vw,2.2rem);line-height:1.25;margin:.2rem 0 .75rem}
.lead{color:var(--muted);font-size:1.05rem;margin:0 0 1.25rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1rem 1.1rem;margin:1rem 0}
.card h2{font-size:1.15rem;margin:.2rem 0 .6rem}
ul{margin:.3rem 0;padding-left:1.2rem}
li{margin:.25rem 0}
.cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin:1.25rem 0}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:.75rem 1.1rem;border-radius:10px;text-decoration:none;font-weight:600;border:1px solid transparent}
.btn-primary{background:var(--accent);color:#fff}
.btn-secondary{background:transparent;color:var(--text);border-color:var(--line)}
.grid{display:grid;gap:1rem}
@media(min-width:720px){.grid-2{grid-template-columns:1fr 1fr}}
.small{font-size:.9rem;color:var(--muted)}
footer{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}
a{color:#7dd3fc}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<div class="wrap">
${body}
<footer>
<p>หน้านี้จัดทำเพื่อช่วยให้ค้นหาร้านค้าบน Shopee ได้ง่ายขึ้น — การสั่งซื้อและชำระเงินดำเนินการบน Shopee Thailand</p>
<p><a href="${esc(config.shopeeShortUrl)}" rel="noopener sponsored">ลิงก์ร้าน Shopee</a> · <a href="${esc(SITE)}/">หน้าแรก</a></p>
</footer>
</div>
</body>
</html>`;
}

function ctaBlock(primaryLabel = 'ไปที่ร้าน Shopee') {
  return `<div class="cta-row">
  <a class="btn btn-primary" href="${esc(config.shopeeShortUrl)}" rel="noopener sponsored">${esc(primaryLabel)}</a>
  <a class="btn btn-secondary" href="${esc(SITE)}/sitemap.xml">Sitemap</a>
</div>`;
}

function buildIndex() {
  const canonical = `${SITE}/`;
  const title = `${config.shopName} | สั่งซื้อผ่าน Shopee Thailand`;
  const description = `${config.tagline} — ${config.about.slice(0, 120)}…`;

  const productCards = config.products
    .map(
      (p) => `<a class="card" href="${esc(SITE)}/${p.slug}.html" style="display:block;color:inherit;text-decoration:none">
  <h2>${esc(p.name)}</h2>
  <p class="small">${esc(p.description)}</p>
  <p><strong>ดูรายละเอียด SEO →</strong></p>
</a>`
    )
    .join('\n');

  const faqHtml = config.faq
    .map((f) => `<div class="card"><h2>${esc(f.q)}</h2><p>${esc(f.a)}</p></div>`)
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: config.shopName,
        url: canonical,
        inLanguage: config.locale,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${canonical}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Store',
        name: config.shopName,
        url: config.shopeeShortUrl,
        description: config.about,
        sameAs: [config.shopeeShortUrl],
      },
      {
        '@type': 'FAQPage',
        mainEntity: config.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  const body = `<header class="hero">
  <span class="badge">Shopee Thailand · Shop ID ${config.shopeeShopId}</span>
  <h1>${esc(config.shopName)}</h1>
  <p class="lead">${esc(config.tagline)}</p>
  ${ctaBlock()}
</header>

<section class="grid grid-2">
  <div class="card">
    <h2>เกี่ยวกับร้าน</h2>
    <p>${esc(config.about)}</p>
    <ul>${config.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  </div>
  <div class="card">
    <h2>คำค้นหาที่เกี่ยวข้อง</h2>
    <p class="small">${esc(keywordsCsv())}</p>
    <p>หน้านี้ช่วยให้ Google และ Bing แนะนำลิงก์ร้าน Shopee เมื่อลูกค้าค้นหาอุปกรณ์บาร์โค้ดและ POS</p>
  </div>
</section>

<section>
  <h2>สินค้าแนะนำ</h2>
  <div class="grid">${productCards}</div>
</section>

<section>
  <h2>คำถามที่พบบ่อย</h2>
  ${faqHtml}
</section>`;

  return layout({ title, description, canonical, jsonLd, body });
}

function buildProduct(p) {
  const canonical = `${SITE}/${p.slug}.html`;
  const title = `${p.name} | ${config.shopName}`;
  const description = p.description;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.name,
        description: p.description,
        brand: { '@type': 'Brand', name: 'Newland' },
        category: 'Barcode Scanner',
        url: canonical,
        offers: {
          '@type': 'Offer',
          url: p.shopeeUrl,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: config.shopName },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: p.name, item: canonical },
        ],
      },
    ],
  };

  const body = `<p class="small"><a href="${esc(SITE)}/">หน้าแรก</a> / ${esc(p.name)}</p>
<header class="hero">
  <span class="badge">สินค้าแนะนำ</span>
  <h1>${esc(p.name)}</h1>
  <p class="lead">${esc(p.description)}</p>
  <div class="cta-row">
    <a class="btn btn-primary" href="${esc(p.shortUrl || config.shopeeShortUrl)}" rel="noopener sponsored">ซื้อบน Shopee</a>
    <a class="btn btn-secondary" href="${esc(SITE)}/">กลับหน้าแรก</a>
  </div>
</header>
<div class="card">
  <h2>จุดเด่น</h2>
  <ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
</div>
<div class="card">
  <h2>คำค้นหา (SEO)</h2>
  <p class="small">${esc(keywordsCsv(p.keywords || []))}</p>
</div>`;

  return layout({ title, description, canonical, ogType: 'product', jsonLd, body });
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
}

function buildSitemap() {
  const urls = [
    { loc: `${SITE}/`, priority: '1.0' },
    ...config.products.map((p) => ({ loc: `${SITE}/${p.slug}.html`, priority: '0.85' })),
  ];
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), buildIndex(), 'utf8');
for (const p of config.products) {
  writeFileSync(join(OUT, `${p.slug}.html`), buildProduct(p), 'utf8');
}
writeFileSync(join(OUT, 'robots.txt'), buildRobots(), 'utf8');
writeFileSync(join(OUT, 'sitemap.xml'), buildSitemap(), 'utf8');

console.log(`Built shop SEO site → ${OUT}`);
console.log(`SITE_URL=${SITE}`);
