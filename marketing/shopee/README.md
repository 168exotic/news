# โปรโมตร้าน Shopee แบบไม่เสียเงิน

ชุดเครื่องมือนี้ช่วย **วางแผน + สร้างแคปชัน + checklist** สำหรับร้านของคุณ  
ลิงก์ร้านเริ่มต้น: https://s.shopee.co.th/qjVyIXVuU

## เริ่มใช้ใน 3 นาที

1. แก้ชื่อร้านและสินค้าจริงใน `config.json`
2. รันสร้างเนื้อหา:

```bash
npm run shopee:marketing
```

3. เปิดไฟล์ใน `output/`:
   - `checklist.md` — สิ่งที่ต้องทำใน Seller Centre ทุกวัน/ทุกสัปดาห์
   - `calendar.md` + `posts-day-XX.txt` — โพสต์พร้อมคัดลอก 14 วัน
   - `utm-links.md` — ลิงก์แยกช่องทาง (Facebook / LINE / TikTok …)
   - `listing-seo-samples.md` — ตัวอย่างชื่อสินค้าให้ติดค้นหาใน Shopee

## หน้า Landing แชร์ฟรี

ไฟล์ `landing/index.html` — อัปโหลด GitHub Pages / Cloudflare Pages / hosting ใดก็ได้  
ใส่ใน bio TikTok, ปักหมุด LINE, หรือแชร์ในกลุ่ม Facebook

พารามิเตอร์ (ไม่บังคับ):

- `?title=ชื่อร้าน`
- `?tagline=คำโปรย`
- `?utm=facebook` (ส่งต่อไป Shopee เป็น utm_source)

## สิ่งที่ต้องทำด้วยตัวเอง (เราโพสต์แทน Shopee ไม่ได้)

| งาน | ทำไมถึงสำคัญ |
| --- | --- |
| Boost ฟรี 5 ครั้ง/วัน | ดัน SKU ในหน้าค้นหา Shopee |
| Shopee Live 2 ครั้ง/สัปดาห์ | อัลกอริทึมและ conversion สูง ไม่เสียค่าโฆษณา |
| โพสต์ตามปฏิทิน | ดึง traffic จากนอก Shopee |
| รูป+วิดีโอใน listing | คลิกและอัตรากดซื้อสูงขึ้น |
| ตอบแชทเร็ว | ส่งผลคะแนนร้านและอันดับ |

## ปรับแต่ง

```bash
node scripts/generate-shopee-marketing.mjs --days 30
```

---

**หมายเหตุ:** ถ้าชื่อสินค้าใน `config.json` ยังเป็นตัวอย่าง ให้เปลี่ยนเป็นของจริงจาก Seller Centre ก่อนโพสต์ — ยิ่งตรงมาก ยิ่งขายง่าย
