#!/usr/bin/env node
/**
 * สร้างแผนโปรโมต Shopee แบบไม่เสียเงิน: ปฏิทินโพสต์, แคปชัน, UTM, checklist
 * Usage: node scripts/generate-shopee-marketing.mjs [--config path] [--days 14]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_CONFIG = join(ROOT, 'marketing/shopee/config.json');
const OUTPUT_DIR = join(ROOT, 'marketing/shopee/output');

function parseArgs() {
  const args = process.argv.slice(2);
  let config = DEFAULT_CONFIG;
  let days = 14;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) config = args[++i];
    if (args[i] === '--days' && args[i + 1]) days = Math.max(1, parseInt(args[++i], 10) || 14);
  }
  return { config, days };
}

function withUtm(baseUrl, source, medium, campaign) {
  const sep = baseUrl.includes('?') ? '&' : '?';
  const q = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  return `${baseUrl}${sep}${q.toString()}`;
}

const POST_TEMPLATES = [
  (cfg, p, link) =>
    `🔥 ${p.name}\n${p.benefit}\n💰 ${p.priceHint}\n\n✅ สั่งใน Shopee ปลอดภัย มีระบบคืนเงิน\n👉 ${link}\n\n${cfg.hashtags.join(' ')}`,
  (cfg, p, link) =>
    `ใครกำลังหา ${p.keywords[0] || 'ของดี'} แนะนำตัวนี้เลย\n「${p.name}」— ${p.benefit}\n\nช้อปที่ร้าน ${cfg.shopName}\n${link}\n\n${cfg.hashtags.slice(0, 3).join(' ')}`,
  (cfg, p, link) =>
    `📦 ส่งจาก Shopee | ${cfg.shopName}\n\n${p.name}\n${p.benefit}\n\nกดลิงก์ร้าน 👇\n${link}`,
  (cfg, _p, link) =>
    `ฝากติดตามร้าน ${cfg.shopName} บน Shopee\n${cfg.tagline}\n\n🛒 รวมสินค้าขายดี + โปรอัปเดตทุกวัน\n${link}\n\n${cfg.hashtags.join(' ')}`,
  (cfg, p, link) =>
    `รีวิวจากร้าน (ยังไม่มีรีวิวลูกค้า? ใส่รูปจริง + วิดีโอสั้นใน Shopee Live แทนข้อความนี้)\n\n${p.name}: ${p.benefit}\nช้อป: ${link}`,
];

const CHANNEL_ROTATION = [
  { channel: 'Facebook / กลุ่มซื้อขาย', source: 'facebook', medium: 'group', campaign: 'organic_week' },
  { channel: 'LINE OpenChat / สตอรี่', source: 'line', medium: 'social', campaign: 'organic_week' },
  { channel: 'TikTok / Reels (คำบรรยาย)', source: 'tiktok', medium: 'video', campaign: 'organic_week' },
  { channel: 'X (Twitter)', source: 'twitter', medium: 'social', campaign: 'organic_week' },
  { channel: 'Shopee Feed / แชร์ในแอป', source: 'shopee', medium: 'feed', campaign: 'organic_week' },
];

function buildCalendar(cfg, days) {
  const lines = [`# ปฏิทินโปรโมต ${days} วัน — ${cfg.shopName}`, '', `ลิงก์ร้าน: ${cfg.shopUrl}`, '', '| วัน | ช่องทาง | งานใน Shopee Seller | โพสต์พร้อมคัดลอก |', '| --- | --- | --- | --- |'];
  const postsMd = ['# แคปชันโซเชียล (คัดลอกไปโพสต์)', ''];

  for (let d = 1; d <= days; d++) {
    const ch = CHANNEL_ROTATION[(d - 1) % CHANNEL_ROTATION.length];
    const product = cfg.products[(d - 1) % cfg.products.length];
    const template = POST_TEMPLATES[(d - 1) % POST_TEMPLATES.length];
    const link = withUtm(cfg.shopUrl, ch.source, ch.medium, `${ch.campaign}_d${d}`);
    const caption = template(cfg, product, link);

    let sellerTask = 'กด Boost สินค้า (ฟรี 5 ครั้ง/วัน) + ตอบแชทภายใน 15 นาที';
    if (d % 3 === 0) sellerTask = 'อัปโหลดวิดีโอสั้น 15–30 วิ. ในรายการสินค้า top 3';
    if (d % 7 === 0) sellerTask = 'Shopee Live 30 นาที (โชว์ของ + ตอบคำถาม + ปักหมุดสินค้า)';
    if (d % 5 === 0) sellerTask = 'ปรับชื่อสินค้าใส่คีย์เวิร์ดค้นหา (ไม่ยัดคำซ้ำ)';

    lines.push(`| วัน ${d} | ${ch.channel} | ${sellerTask} | ดู posts-day-${String(d).padStart(2, '0')}.txt |`);

    postsMd.push(`## วัน ${d} — ${ch.channel}`, '', caption, '', '---', '');
    writeFileSync(join(OUTPUT_DIR, `posts-day-${String(d).padStart(2, '0')}.txt`), caption + '\n', 'utf8');
  }

  writeFileSync(join(OUTPUT_DIR, 'calendar.md'), lines.join('\n') + '\n', 'utf8');
  writeFileSync(join(OUTPUT_DIR, 'all-posts.md'), postsMd.join('\n'), 'utf8');
}

function buildChecklist(cfg) {
  const c = cfg.sellerCenterChecklist || {};
  const text = `# Checklist โปรโมต Shopee ไม่เสียเงิน (ทำซ้ำทุกสัปดาห์)

## ใน Shopee Seller Centre (ทุกวัน)
- [ ] ใช้ **Boost ฟรี** ${c.dailyBoostSlots ?? 5} ครั้ง/วัน กับ SKU ที่มาร์จินดีและมีสต็อก
- [ ] ตอบแชทภายใน **${c.replyChatWithinMinutes ?? 15} นาที** (อัตราตอบกลับส่งผลอัลกอริทึม)
- [ ] ตรวจสต็อก — อย่า Boost ของใกล้หมด
- [ ] ขอรีวิวอย่างสุภาพหลังส่งของ (การ์ดขอบคุณในกล่อง — ต้นทุนต่ำมาก)

## รายการสินค้า (ครั้งเดียว + ปรับรายสัปดาห์)
- [ ] ชื่อสินค้า: **คีย์เวิร์ดหลัก + จุดเด่น + ขนาด/สี** (อ่านเป็นประโยค)
- [ ] รูปอย่างน้อย **${c.newListingPhotosMin ?? 5}** รูป + 1 รูป infographic จุดเด่น
- [ ] ${c.videoPerTopSku ? 'วิดีโอ 15–30 วิ. ทุก SKU ขายดี' : 'วิดีโอสั้นบน SKU ขายดี'}
- [ ] คำอธิบาย: bullet จุดเด่น + วิธีใช้ + การรับประกัน + คำค้นที่ลูกค้าพิมพ์หา

## Shopee Live (ฟรี) — เป้า **${c.livePerWeek ?? 2} ครั้ง/สัปดาห์**
- [ ] ปักหมุดสินค้า 3–5 ชิ้น
- [ ] โปรเฉพาะ Live (ส่วนลดเล็กน้อยจากกำไร ไม่ต้องซื้อโฆษณา)
- [ ] ประกาศเวลา Live ล่วงหน้าใน Feed / โซเชียล (ใช้แคปชันจาก output/)

## โซเชียล $0 (ใช้ไฟล์ใน output/)
- [ ] โพสต์ตาม \`calendar.md\` — หมุน Facebook กลุ่ม / LINE / TikTok
- [ ] ใส่ลิงก์ที่มี UTM เพื่อดูว่าช่องทางไหนกดมา (ดูใน Shopee analytics ถ้ามี)

## สิ่งที่ **ไม่** ต้องจ่ายเงินก็ได้ผล
- Affiliate ให้คนอื่นช่วยรีวิว (Shopee Affiliate Program)
- คูปองส่วนลดเล็กน้อยจากกำไร (กระตุ้นครั้งแรก ไม่ใช่ Shopee Ads)
- ขอรีวิวรูป/วิดีโอจากลูกค้าจริง

## ลิงก์ร้าน
${cfg.shopUrl}

---
แก้ชื่อสินค้า/แคปชันให้ตรงร้านจริงใน \`marketing/shopee/config.json\` แล้วรัน \`npm run shopee:marketing\`
`;
  writeFileSync(join(OUTPUT_DIR, 'checklist.md'), text, 'utf8');
}

function buildUtmSheet(cfg) {
  const rows = [
    '# ลิงก์ร้านพร้อม UTM (วัดว่าช่องไหนได้คลิก)',
    '',
    `ร้าน: ${cfg.shopName}`,
    '',
    '| ช่องทาง | ลิงก์ |',
    '| --- | --- |',
  ];
  for (const ch of CHANNEL_ROTATION) {
    rows.push(`| ${ch.channel} | ${withUtm(cfg.shopUrl, ch.source, ch.medium, ch.campaign)} |`);
  }
  rows.push('', `| ลิงก์ต้นฉบับ | ${cfg.shopUrl} |`, '');
  writeFileSync(join(OUTPUT_DIR, 'utm-links.md'), rows.join('\n') + '\n', 'utf8');
}

function buildListingSeoHints(cfg) {
  const seo = cfg.seo || {};
  const primary = (seo.primaryKeywords || []).join(', ');
  const lines = [
    '# SEO Shopee — Orta | ortaofficial | ชาภูเก็ต',
    '',
    'คีย์เวิร์ดหลัก: **Orta**, **ortaofficial**, **ชาภูเก็ต**, ชาไทยภูเก็ต, โอต๊ะ',
    '',
    '## โปรไฟล์ร้าน (วางใน Shopee → ตั้งค่าร้าน → คำอธิบายร้าน)',
    '',
    '```',
    seo.shopBioShopee || `${cfg.shopName} ชาไทยภูเก็ต Orta ortaofficial`,
    '```',
    '',
    '## รูปสินค้า — Alt / ข้อความบนรูป (ช่วยค้นหาในแอป)',
    '',
    '- Orta ชาภูเก็ต ชาไทยโอต๊ะ 15 ซอง',
    '- ortaofficial ชาไทยสไตล์ภูเก็ต Ceylon Oolong',
    '- ชงเย็น หอมมัน รสชาติไทยแท้ Phuket Signature',
    '',
  ];

  const main = cfg.products[0];
  if (main) {
    lines.push(
      '## SKU หลัก — ชื่อสินค้า (เลือก 1 ชื่อ ไม่เปลี่ยนบ่อย)',
      '',
      ...(main.shopeeTitleVariants || []).map((t, i) => `${i + 1}. ${t}`),
      '',
      '## SKU หลัก — รายละเอียดสินค้า (คัดลอกไป Shopee)',
      '',
      '```',
      buildShopeeDescription(cfg, main),
      '```',
      '',
    );
  }

  lines.push('---', '', '## สินค้าอื่น / คีย์เวิร์ดเสริม', '');
  for (const p of cfg.products) {
    const kw = (p.keywords || []).join(' ');
    lines.push(`### ${p.name}`, '', `- คำค้น: ${kw}`, `- จุดขาย: ${p.benefit}`, '');
  }

  lines.push(
    '## คำค้นที่ควรมีในแชท/รีวิว (ช่วย long-tail)',
    '',
    '- Orta ชาภูเก็ต',
    '- ortaofficial ชาไทย',
    '- ชาไทยภูเก็ต 15 ซอง',
    '- ของฝากภูเก็ต ชาไทย',
    '',
    `Secondary: ${(seo.secondaryKeywords || []).join(', ')}`,
    '',
  );

  writeFileSync(join(OUTPUT_DIR, 'listing-seo-samples.md'), lines.join('\n'), 'utf8');
}

function buildShopeeDescription(cfg, product) {
  const seo = cfg.seo || {};
  return [
    '🍵 Orta | ortaofficial — ชาไทยตราโอต๊ะ สไตล์ภูเก็ต (ชาภูเก็ต)',
    '',
    product.benefit,
    '',
    '✅ ถุง 15 ซอง — ชงร้อนและเย็นได้',
    '✅ คัดสรร Ceylon & Oolong · รสชาติไทยแท้ หอมมันกลมกล่อม',
    '✅ Phuket Signature · เหมาะดื่มเองและเป็นของฝาก',
    '',
    'วิธีชงเย็น (แนะนำ): น้ำร้อน 120 ml ต่อ 1 ซอง → คน → น้ำแข็ง + นม',
    'วิธีชงร้อน: น้ำร้อน 180 ml ต่อ 1 ซอง → คน → พร้อมดื่ม',
    '',
    '🔎 ค้นหา: Orta, ortaofficial, ชาภูเก็ต, ชาไทยภูเก็ต, โอต๊ะ',
    '',
    `ร้าน: ${cfg.shopName} บน Shopee Thailand`,
    seo.metaDescription ? '' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSeoPasteFiles(cfg) {
  const main = cfg.products[0];
  const seo = cfg.seo || {};
  if (main?.shopeeTitleVariants?.[0]) {
    writeFileSync(join(OUTPUT_DIR, 'shopee-title.txt'), main.shopeeTitleVariants[0] + '\n', 'utf8');
  }
  if (main) {
    writeFileSync(join(OUTPUT_DIR, 'shopee-description.txt'), buildShopeeDescription(cfg, main) + '\n', 'utf8');
  }
  if (seo.shopBioShopee) {
    writeFileSync(join(OUTPUT_DIR, 'shopee-shop-bio.txt'), seo.shopBioShopee + '\n', 'utf8');
  }
  const kwLines = [
    '# คีย์เวิร์ด Orta SEO',
    '',
    ...(seo.primaryKeywords || []).map((k) => `primary: ${k}`),
    ...(seo.secondaryKeywords || []).map((k) => `secondary: ${k}`),
    '',
    'Shopee search: Orta | ortaofficial | ชาภูเก็ต | ชาไทยภูเก็ต | โอต๊ะ',
    '',
  ];
  writeFileSync(join(OUTPUT_DIR, 'seo-keywords.txt'), kwLines.join('\n'), 'utf8');
}

function buildContentIdeas(cfg) {
  if (!cfg.contentIdeas?.length) return;
  const lines = ['# ไอเดียคอนเทนต์ Orta (ไม่เสียค่าโฆษณา)', '', ...cfg.contentIdeas.map((x) => `- ${x}`), ''];
  writeFileSync(join(OUTPUT_DIR, 'content-ideas.md'), lines.join('\n'), 'utf8');
}

function main() {
  const { config, days } = parseArgs();
  if (!existsSync(config)) {
    console.error('ไม่พบ config:', config);
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(config, 'utf8'));
  mkdirSync(OUTPUT_DIR, { recursive: true });
  buildCalendar(cfg, days);
  buildChecklist(cfg);
  buildUtmSheet(cfg);
  buildListingSeoHints(cfg);
  buildSeoPasteFiles(cfg);
  buildContentIdeas(cfg);
  console.log('สร้างไฟล์แล้วที่', OUTPUT_DIR);
  console.log('- listing-seo-samples.md, shopee-title.txt, shopee-description.txt, shopee-shop-bio.txt, seo-keywords.txt');
  console.log(`- posts-day-01.txt … posts-day-${String(days).padStart(2, '0')}.txt`);
}

main();
