#!/usr/bin/env node
/**
 * Build SEO landing pages for Shopee shop discovery (Google/Bing).
 * Usage: SITE_URL=https://your-domain.com node shop-seo/scripts/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'dist');
const ASSETS = join(ROOT, 'assets');
const config = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));

const SITE = (process.env.SITE_URL || config.defaultSiteUrl).replace(/\/$/, '');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absUrl(path) {
  if (!path) return `${SITE}${config.defaultOgImage || '/assets/thai-tea-hero.jpg'}`;
  return path.startsWith('http') ? path : `${SITE}${path}`;
}

function keywordsCsv(extra = []) {
  return [...new Set([...config.keywords, ...extra])].join(', ');
}

function layout({ title, description, canonical, ogType = 'website', ogImage, jsonLd, body }) {
  const image = absUrl(ogImage || config.defaultOgImage);
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
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#1a0f0a;--card:#2a1510;--text:#fff8f2;--muted:#e8c4a8;--accent:#e85d04;--accent2:#f48c06;--line:#5c2e1a}
*{box-sizing:border-box}
body{margin:0;font-family:"IBM Plex Sans Thai",system-ui,sans-serif;background:linear-gradient(165deg,#1a0f0a 0%,#3d1a0f 45%,#1a0f0a 100%);color:var(--text);line-height:1.65}
.wrap{max-width:960px;margin:0 auto;padding:1.25rem 1rem 3rem}
.hero{padding:1rem 0 1rem}
.badge{display:inline-block;background:#4a2010;color:#ffd6a5;border:1px solid var(--line);padding:.25rem .65rem;border-radius:999px;font-size:.85rem;margin-bottom:.75rem}
h1{font-size:clamp(1.55rem,4vw,2.15rem);line-height:1.25;margin:.2rem 0 .75rem}
.lead{color:var(--muted);font-size:1.05rem;margin:0 0 1rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1rem 1.1rem;margin:1rem 0}
.card h2,.card h3{font-size:1.12rem;margin:.2rem 0 .55rem}
.card img{width:100%;height:auto;border-radius:10px;margin:.5rem 0}
ul{margin:.3rem 0;padding-left:1.2rem}
li{margin:.25rem 0}
.cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin:1.1rem 0}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:.75rem 1.15rem;border-radius:10px;text-decoration:none;font-weight:600;border:1px solid transparent}
.btn-primary{background:linear-gradient(135deg,var(--accent),#c2410c);color:#fff}
.btn-secondary{background:transparent;color:var(--text);border-color:var(--line)}
.grid{display:grid;gap:1rem}
@media(min-width:720px){.grid-2{grid-template-columns:1fr 1fr}.grid-3{grid-template-columns:repeat(3,1fr)}}
.small{font-size:.9rem;color:var(--muted)}
.hero-img{border-radius:16px;border:1px solid var(--line);width:100%;height:auto;margin:1rem 0}
footer{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}
a{color:#fdba74}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<div class="wrap">
${body}
<footer>
<p>หน้านี้ช่วย SEO ให้ค้นหาแบรนด์ ${esc(config.brandName)} (${esc(config.brandNameTh || '')}) และร้าน Shopee ได้ง่ายขึ้น — สั่งซื้อและชำระเงินบน Shopee Thailand</p>
<p><a href="${esc(config.shopeeShortUrl)}" rel="noopener sponsored">ร้าน Orta official บน Shopee</a>${config.officialWebsite ? ` · <a href="${esc(config.officialWebsite)}" rel="noopener">เว็บไซต์ ${esc(config.brandName)}</a>` : ''} · <a href="${esc(SITE)}/">หน้าแรก</a></p>
</footer>
</div>
</body>
</html>`;
}

function ctaBlock(primaryLabel = 'ช้อปเลยบน Shopee') {
  return `<div class="cta-row">
  <a class="btn btn-primary" href="${esc(config.shopeeShortUrl)}" rel="noopener sponsored">${esc(primaryLabel)}</a>
  <a class="btn btn-secondary" href="${esc(SITE)}/sitemap.xml">Sitemap</a>
</div>`;
}

function buildIndex() {
  const canonical = `${SITE}/`;
  const title = `${config.brandName} ${config.brandNameTh || ''} | ${config.shopName} — Shopee`;
  const description = `${config.tagline}. ${config.about.slice(0, 100)}…`;

  const productCards = config.products
    .map(
      (p) => `<a class="card" href="${esc(SITE)}/${p.slug}.html" style="display:block;color:inherit;text-decoration:none">
  ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="800" height="450">` : ''}
  <h2>${esc(p.name)}</h2>
  <p class="small">${esc(p.description)}</p>
  <p><strong>ดูรายละเอียด →</strong></p>
</a>`
    )
    .join('\n');

  const categoryHtml = (config.categories || [])
    .map((c) => `<div class="card"><h3>${esc(c.name)}</h3><p class="small">${esc(c.description)}</p></div>`)
    .join('\n');

  const faqHtml = config.faq
    .map((f) => `<div class="card"><h2>${esc(f.q)}</h2><p>${esc(f.a)}</p></div>`)
    .join('\n');

  const sameAs = [config.shopeeShortUrl];
  if (config.officialWebsite) sameAs.push(config.officialWebsite);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: `${config.brandName} — ${config.shopName}`,
        url: canonical,
        inLanguage: config.locale,
      },
      {
        '@type': 'Store',
        name: config.shopName,
        url: config.shopeeShortUrl,
        description: config.about,
        brand: { '@type': 'Brand', name: config.brandName },
        sameAs,
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
  <span class="badge">${esc(config.brandName)} · A Taste of Phuket · Shopee</span>
  <h1>${esc(config.shopName)}</h1>
  <p class="lead">${esc(config.tagline)}</p>
  <img class="hero-img" src="${esc(config.defaultOgImage || '/assets/thai-tea-hero.jpg')}" alt="${esc(config.brandName)} ชาไทยสไตล์ภูเก็ต" width="1200" height="675">
  ${ctaBlock()}
</header>

<section class="grid grid-2">
  <div class="card">
    <h2>เกี่ยวกับ ${esc(config.brandName)}</h2>
    <p>${esc(config.about)}</p>
    <ul>${config.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  </div>
  <div class="card">
    <h2>คำค้นหายอดนิยม</h2>
    <p class="small">${esc(keywordsCsv())}</p>
    <p>Google จะแนะนำหน้านี้เมื่อค้นหา ชาไทย ORTA, โอต๊ะ Shopee, ชาไทยสไตล์ภูเก็ต</p>
  </div>
</section>

${categoryHtml ? `<section><h2>หมวดสินค้าใน Shopee</h2><div class="grid grid-2">${categoryHtml}</div></section>` : ''}

<section>
  <h2>สินค้าและเมนูแนะนำ</h2>
  <div class="grid grid-2">${productCards}</div>
</section>

<section>
  <h2>คำถามที่พบบ่อย</h2>
  ${faqHtml}
</section>`;

  return layout({ title, description, canonical, ogImage: config.defaultOgImage, jsonLd, body });
}

function buildProduct(p) {
  const canonical = `${SITE}/${p.slug}.html`;
  const title = `${p.name} | ${config.brandName} ${config.shopName}`;
  const description = p.description;
  const brand = p.brand || config.brandName;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.name,
        description: p.description,
        image: absUrl(p.image),
        brand: { '@type': 'Brand', name: brand },
        category: p.category || 'Beverages',
        url: canonical,
        offers: {
          '@type': 'Offer',
          url: p.shopeeUrl || config.shopeeShortUrl,
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
  <span class="badge">${esc(config.brandName)} · ${esc(p.category || 'สินค้า')}</span>
  <h1>${esc(p.name)}</h1>
  <p class="lead">${esc(p.description)}</p>
  ${p.image ? `<img class="hero-img" src="${esc(p.image)}" alt="${esc(p.name)}" width="1200" height="675">` : ''}
  <div class="cta-row">
    <a class="btn btn-primary" href="${esc(p.shortUrl || p.shopeeUrl || config.shopeeShortUrl)}" rel="noopener sponsored">ซื้อบน Shopee</a>
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

  return layout({ title, description, canonical, ogType: 'product', ogImage: p.image, jsonLd, body });
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
if (existsSync(ASSETS)) {
  cpSync(ASSETS, join(OUT, 'assets'), { recursive: true });
}
writeFileSync(join(OUT, 'index.html'), buildIndex(), 'utf8');
for (const p of config.products) {
  writeFileSync(join(OUT, `${p.slug}.html`), buildProduct(p), 'utf8');
}
writeFileSync(join(OUT, 'robots.txt'), buildRobots(), 'utf8');
writeFileSync(join(OUT, 'sitemap.xml'), buildSitemap(), 'utf8');

console.log(`Built shop SEO site → ${OUT}`);
console.log(`SITE_URL=${SITE}`);
