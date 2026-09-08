# SpamInThai News

ระบบข่าวสารคดีฉ้อโกงสำหรับ [spaminthai.com/news](https://spaminthai.com/news)

## หลักการ

- นำข่าวคดีฉ้อโกงจากแหล่งข่าวต่าง ๆ มา**เรียบเรียงเนื้อหาใหม่**
- **อ้างอิงแหล่งที่มาทุกบทความ** — ห้ามคัดลอกทั้งประโยค
- **ห้ามบิดเบือนข้อเท็จจริง** — เนื้อหาต้องไม่ผิดกฎหมาย
- เผยแพร่ **วันละ 3–4 โพสต์** ผ่าน GitHub Actions

## โครงสร้าง

```
articles/
  published/   ← บทความที่เผยแพร่แล้ว (JSON)
  queue/       ← บทความรอเผยแพร่ (JSON)
scripts/
  generate-news-html.mjs  ← สร้าง HTML จาก JSON
  sync-to-spaminthai.mjs  ← sync ไปยัง spaminthai repo
  publish-daily.mjs       ← เผยแพร่จาก queue
```

## เพิ่มข่าวใหม่

1. สร้างไฟล์ JSON ใน `articles/queue/` ตามรูปแบบ:

```json
{
  "slug": "unique-slug-here",
  "title": "หัวข้อข่าว",
  "description": "คำอธิบายสำหรับ SEO",
  "summary": "สรุปสั้น ๆ สำหรับหน้า index",
  "date": "2025-09-08",
  "lead": "ย่อหน้าเปิดเรื่อง",
  "blocks": [
    { "type": "h2", "text": "หัวข้อย่อย" },
    { "type": "p", "text": "เนื้อหา..." },
    { "type": "ul", "items": ["รายการ 1", "รายการ 2"] },
    { "type": "box", "text": "กล่องเตือนภัย" }
  ],
  "sources": [
    { "name": "ชื่อแหล่งข่าว", "url": "https://..." }
  ]
}
```

2. Push ไป main — GitHub Actions จะเผยแพร่อัตโนมัติ 1 บทความต่อรอบ (4 รอบ/วัน)

## รันด้วยตนเอง

```bash
# สร้าง HTML ทั้งหมด
node scripts/generate-news-html.mjs --output ./spaminthai-output

# เผยแพร่ 1 บทความจาก queue
node scripts/publish-daily.mjs --count 1 --spaminthai-dir ../spaminthai
```

## GitHub Secrets ที่ต้องตั้ง

| Secret | คำอธิบาย |
|--------|----------|
| `SPAMINTHAI_DEPLOY_TOKEN` | GitHub PAT ที่มีสิทธิ์ push ไปยัง `168exotic/spaminthai` |
