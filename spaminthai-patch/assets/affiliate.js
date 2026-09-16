/**
 * SpamInThai — Affiliate Ad Placement
 * แก้โฆษณาได้ที่ AD_CONFIG เท่านั้น
 */
(function () {
  const ORTA_SHOPEE =
    'https://s.shopee.co.th/qjVyIXVuU?utm_source=spaminthai&utm_medium=affiliate&utm_campaign=site';

  const AD_CONFIG = [
    {
      slot: 'sidebar-top',
      enabled: true,
      href: ORTA_SHOPEE,
      image: '',
      badge: 'Sponsored',
      title: 'Orta ชาภูเก็ต — ชาไทยโอต๊ะ',
      desc: 'ชาไทยสไตล์ภูเก็ต 15 ซอง ชงร้อน–เย็น ortaofficial บน Shopee',
      cta: 'ช้อปบน Shopee',
    },
    {
      slot: 'below-result',
      enabled: true,
      href: ORTA_SHOPEE,
      image: '',
      badge: 'Sponsored',
      title: 'Orta Official — ชาไทยภูเก็ต',
      desc: 'หอมมันกลมกล่อม Ceylon & Oolong — ของฝาก/ดื่มเอง',
      cta: 'ดูรายละเอียด',
    },
    {
      slot: 'article-mid',
      enabled: true,
      href: ORTA_SHOPEE,
      image: '',
      badge: 'Sponsored',
      title: 'Orta ortaofficial ชาภูเก็ต',
      desc: 'ชาไทยปรุงสำเร็จ สไตล์ภูเก็ต — สั่งง่ายบน Shopee',
      cta: 'ไปที่ร้าน Orta',
    },
  ];

  function inject() {
    const slots = document.querySelectorAll('.affiliate-slot');
    if (!slots.length) return;
    AD_CONFIG.forEach(function (ad) {
      if (!ad || !ad.enabled) return;
      var slot = document.querySelector('.affiliate-slot[data-slot="' + ad.slot + '"]');
      if (!slot) return;
      slot.innerHTML = renderAd(ad);
    });
  }

  function renderAd(ad) {
    var href = String(ad.href || '').trim();
    var rel = 'rel="sponsored nofollow noopener"';
    var target = 'target="_blank"';
    var isPlaceholder = !href;
    var cls = isPlaceholder ? 'aff-card aff-card--placeholder' : 'aff-card';
    var linkAttr = isPlaceholder ? '' : 'href="' + esc(href) + '" ' + rel + ' ' + target;
    var image = '';
    if (ad.image) {
      image =
        '<img src="' +
        esc(ad.image) +
        '" alt="' +
        esc(ad.title) +
        '" class="aff-card__img" loading="lazy">';
    }
    return (
      '<div class="' +
      cls +
      '">' +
      (isPlaceholder ? '' : '<a ' + linkAttr + ' class="aff-card__link">') +
      (ad.badge ? '<span class="aff-card__badge">' + esc(ad.badge) + '</span>' : '') +
      image +
      '<div class="aff-card__body">' +
      '<div class="aff-card__title">' +
      esc(ad.title) +
      '</div>' +
      '<div class="aff-card__desc">' +
      esc(ad.desc) +
      '</div>' +
      (ad.cta
        ? '<div class="aff-card__cta">' + esc(ad.cta) + (isPlaceholder ? '' : ' →') + '</div>'
        : '') +
      '</div>' +
      (isPlaceholder ? '' : '</a>') +
      '</div>'
    );
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
