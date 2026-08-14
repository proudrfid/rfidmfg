/*
 * build-articles.js — 生成新闻 & 案例详情页(GEO/SEO 强化版),并把 news.html / cases.html
 * 里的 "Read more" 链接从旧站外链改为本站本地页面。
 * 强化点:答案前置 TL;DR、对比表、关键要点、每页 FAQ(含 FAQPage 结构化数据)、
 *        Article/NewsArticle 的 datePublished/dateModified/author、可见署名与更新时间。
 * 运行: node build-articles.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const SITE = 'https://www.rfidmfg.com';
const IMGBASE = 'images/';
const BUILD_DATE = '2026-06-14';        // 历史日期，仅作首次登记的种子
const DATES = require('./content-dates.js');
const BUILD_DATE_DISPLAY = 'June 14, 2026';
const AUTHOR = 'RFID MFG Editorial Team';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = `      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="products.html">Products</a>
      <a href="guides.html">Guides</a>
      <a href="cases.html">Cases</a>
      <a href="sustainability.html">Sustainability</a>
      <a href="news.html">Blog</a>
      <a href="contact.html">Contact</a>`;
const TOPBAR = `<div class="topbar"><div class="container topbar__inner"><span class="topbar__item">Shenzhen, China · ISO 9001 · 14001 · 45001 site</span><div class="topbar__contact"><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8615815501857">+86 158 1550 1857</a></div></div></div>`;
const HEADER = `<header class="header" id="header"><div class="container header__inner"><a href="index.html" class="brand" aria-label="RFID MFG home"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><nav class="nav" id="nav">
${NAV}
    </nav><a href="contact.html" class="btn btn--primary header__cta">Get a Quote</a><button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>`;
const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing, direct from our Shenzhen plant.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="industries.html">Industries</a><a href="cases.html">Cases</a><a href="sustainability.html">Sustainability</a><a href="news.html">Blog</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8615815501857">+86 158 1550 1857</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;

// ---- content renderers ----
const P = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('\n      ');
// 段落间插入插图:art = [{after: 段落索引, svg, cap}]
const P_ART = (arr, art) => arr.map((t, i) => `<p>${esc(t)}</p>` + (art || []).filter((a) => a.after === i).map((a) => `\n      <figure class="figure figure--article">${a.svg}<figcaption>${esc(a.cap)}</figcaption></figure>`).join('')).join('\n      ');
const POINTS = (arr) => `<ul class="check-list">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
function RELATED(arr) {
  if (!arr || !arr.length) return '';
  const links = arr.map((r) => `<a href="${r[0]}" class="link-arrow" style="display:inline-block;margin:0 16px 8px 0">${esc(r[1])} <span>→</span></a>`).join('');
  return `<h2>Related products &amp; guides</h2>\n      <div style="margin-top:6px">${links}</div>`;
}
// 每篇案例/新闻的相关产品与指南内链(对标竞品:每个概念都链到可购买产品/指南)
const RELATED_MAP = {
  'case-warehouse.html': [['uhf-rfid-label.html', 'UHF RFID label'], ['rfid-vs-barcode.html', 'RFID vs barcode'], ['rfid-readers-hardware-guide.html', 'RFID readers & hardware guide']],
  'case-id-cards.html': [['pvc-cards.html', 'PVC ID cards'], ['rfid-cards-guide.html', 'Complete RFID cards guide'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire']],
  'case-bank-card.html': [['dual-frequency-card.html', 'Dual-frequency card'], ['magnetic-stripe-card.html', 'Magnetic-stripe card'], ['rfid-chips-mifare-ntag-desfire.html', 'Secure chips compared']],
  'case-library.html': [['rfid-library-tag.html', 'RFID library tag'], ['rfid-labels-inlays-guide.html', 'Labels & inlays guide'], ['rfid-frequencies-lf-hf-uhf.html', 'RFID frequencies (HF)']],
  'case-gateways.html': [['rfid-reader-writer.html', 'RFID readers / writers'], ['uhf-rfid-label.html', 'UHF RFID label'], ['rfid-readers-hardware-guide.html', 'Readers & hardware guide']],
  'case-warranty.html': [['rfid-anti-metal-tag.html', 'Anti-metal RFID tag'], ['high-temperature-rfid-tag.html', 'High-temperature tag'], ['products.html#tags', 'Browse RFID tags']],
  'case-scratch-card.html': [['scratch-card.html', 'PVC scratch card'], ['pvc-cards.html', 'PVC cards'], ['rfid-cards-guide.html', 'RFID cards guide']],
  'case-transit.html': [['rfid-nfc-card.html', 'RFID / NFC card'], ['rfid-chips-mifare-ntag-desfire.html', 'Transit chips (MIFARE)'], ['disposable-paper-wristband.html', 'Paper tickets & bands']],
  'case-nfc-honda.html': [['nfc-business-card.html', 'NFC business card'], ['nfc-guide.html', 'NFC guide'], ['rfid-nfc-card.html', 'RFID / NFC card']],
  'case-member-card.html': [['magnetic-stripe-card.html', 'Magnetic member card'], ['pvc-cards.html', 'PVC cards'], ['rfid-cards-guide.html', 'RFID cards guide']],
  'case-logistics.html': [['uhf-rfid-label.html', 'UHF RFID label'], ['rfid-anti-metal-tag.html', 'Anti-metal tag'], ['rfid-vs-barcode.html', 'RFID vs barcode']],
  'case-events.html': [['rfid-wristband.html', 'RFID wristband'], ['rfid-silicone-wristband.html', 'Silicone wristband'], ['disposable-paper-wristband.html', 'Paper wristband']],
  'news-blocking-card.html': [['rfid-blocking-card.html', 'RFID blocking card'], ['rfid-blocking-guide.html', 'RFID blocking guide'], ['rfid-blocking-wallet.html', 'Blocking wallet']],
  'news-rail.html': [['rfid-anti-metal-tag.html', 'Anti-metal RFID tag'], ['high-temperature-rfid-tag.html', 'High-temperature tag'], ['rfid-readers-hardware-guide.html', 'Readers & hardware guide']],
  'news-nfc-stickers.html': [['nfc-printed-label.html', 'NFC printed label'], ['nfc-guide.html', 'NFC guide'], ['rfid-white-label.html', 'White label sticker']],
  'news-wristband.html': [['rfid-wristband.html', 'RFID wristband'], ['rfid-silicone-wristband.html', 'Silicone wristband'], ['case-events.html', 'Events & festivals case']],
  'news-food.html': [['uhf-rfid-label.html', 'UHF RFID label'], ['rfid-labels-inlays-guide.html', 'Labels & inlays guide'], ['case-logistics.html', 'Logistics case']],
  'news-walmart.html': [['uhf-rfid-label.html', 'UHF RFID label'], ['rfid-labels-inlays-guide.html', 'Labels & inlays guide'], ['rfid-vs-barcode.html', 'RFID vs barcode']],
};
function TABLE(t) {
  if (!t) return '';
  const th = t.head.map((h) => `<th style="text-align:left;padding:10px 12px;border-bottom:2px solid var(--brand-deep,#0a1b34);font-weight:700">${esc(h)}</th>`).join('');
  const rows = t.rows.map((r) => `<tr>${r.map((c, i) => `<td style="padding:10px 12px;border-bottom:1px solid #e5e9f0${i === 0 ? ';font-weight:600' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<h2>${esc(t.cap)}</h2>
      <div style="overflow-x:auto;margin:14px 0 6px"><table style="width:100%;border-collapse:collapse;font-size:15px">
        <thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function FAQ_HTML(faqs) {
  if (!faqs || !faqs.length) return '';
  const items = faqs.map((f) => `<details class="faq-item"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
  return `<h2>Frequently asked questions</h2>
      <div class="faq" style="margin-top:8px">${items}</div>`;
}
function FAQ_LD(faqs) {
  if (!faqs || !faqs.length) return '';
  return `\n<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) })}
</script>`;
}

function buildBody(it) {
  const _d = trackArticle(it);
  const lead = it.lead ? `<div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px;margin-bottom:22px"><strong>In short:</strong> ${esc(it.lead)}</div>` : '';
  const byline = `<p style="font-size:13px;color:var(--muted,#6b7a90);margin:-4px 0 18px">By ${esc(AUTHOR)} · Updated ${esc(_d.modifiedHuman)}</p>`;
  const intro = P_ART(it.body, it.art);
  const table = TABLE(it.table);
  const takeaways = it.points && it.points.length ? `<h2>Key takeaways</h2>\n      ${POINTS(it.points)}` : '';
  const help = it.help ? `<h2>How RFID MFG helps</h2>\n      ${P(it.help)}` : '';
  const related = RELATED(it.related || RELATED_MAP[it.slug]);
  const faq = FAQ_HTML(it.faqs);
  return [byline, lead, intro, table, takeaways, help, related, faq].filter(Boolean).join('\n      ');
}

// 指纹只覆盖正文内容，不含日期，避免自我循环。track 幂等，重复调用不会重复计数。
function trackArticle(it) {
  return DATES.track(it.slug, JSON.stringify({ h1: it.h1, lead: it.lead, body: it.body, faqs: it.faqs, tables: it.tables }), it.date || BUILD_DATE);
}

function shell(it) {
  const type = it.crumbCat === 'News' ? 'NewsArticle' : 'Article';
  const _d = trackArticle(it);
  const articleLd = {
    '@context': 'https://schema.org', '@type': type,
    headline: it.h1,
    description: it.lead || it.body[0],
    image: it.img ? SITE + '/' + IMGBASE + it.img : SITE + '/og-image.jpg',
    datePublished: it.date, dateModified: _d.modified,
    author: { '@type': 'Organization', name: 'RFID MFG', url: SITE + '/about.html' },
    publisher: { '@type': 'Organization', name: 'RFID MFG', logo: { '@type': 'ImageObject', url: SITE + '/favicon.svg' } },
    mainEntityOfPage: SITE + '/' + it.slug,
  };
  const ld = `<script type="application/ld+json">
${JSON.stringify(articleLd)}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"${esc(it.crumbCat)}","item":"${SITE}/${esc(it.crumbCatHref)}"},{"@type":"ListItem","position":3,"name":${JSON.stringify(it.h1)},"item":"${SITE}/${it.slug}"}]}
</script>${FAQ_LD(it.faqs)}`;
  const desc = it.lead || it.body[0];
  const hero = it.img ? `<div class="article-hero"><img src="${IMGBASE}${esc(it.img)}" alt="${esc(it.h1)}" /></div>` : '';
  const bodyHtml = buildBody(it);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(it.title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${it.slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(it.title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${it.slug}" />
<meta property="og:image" content="${it.img ? SITE + '/' + IMGBASE + it.img : SITE + '/og-image.jpg'}" />
<meta property="article:published_time" content="${it.date}" />
<meta property="article:modified_time" content="${_d.modified}" />
<meta name="twitter:card" content="summary_large_image" />
${ld}
${FONTS}
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />
<link rel="stylesheet" href="styles.css" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFYMHHLN3Q"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZFYMHHLN3Q');</script>
</head>
<body>
${TOPBAR}
${HEADER}
<main>
<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner" style="padding:54px 24px 48px">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="${it.crumbCatHref}">${esc(it.crumbCat)}</a><span>/</span>${esc(it.h1)}</nav>
    <h1 style="max-width:18em;margin-left:auto;margin-right:auto">${esc(it.h1)}</h1>
    ${it.meta ? `<p style="font-size:14px;color:#9fb2cc">${esc(it.meta)}</p>` : ''}
  </div>
</section>
<section class="section">
  <div class="container article">
    ${hero}
    <div class="article-body">
      ${bodyHtml}
    </div>
    <div class="article-back"><a href="${it.crumbCatHref}" class="link-arrow"><span>←</span> Back to ${esc(it.crumbCat)}</a></div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Talk to RFID MFG about your project</h2><p>OEM/ODM and custom RFID solutions — we reply within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Get a Quote</a>
  </div>
</section>
</main>
${FOOTER}
<a href="#" class="to-top" id="toTop" aria-label="Back to top">↑</a>
<script src="script.js"></script>
</body>
</html>
`;
}

// ---------- CASES (12) ----------
const CASES = [
  {
    slug: 'case-warehouse.html', oldUrl: 'https://www.rfidmfg.com/case/warehouse-management/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Warehouse Management with RFID — Case | RFID MFG', h1: 'Warehouse management with RFID', meta: 'Application · Logistics', img: 'rfid-warehouse-management.webp', date: '2025-03-12',
    lead: 'RFID lets a warehouse read hundreds of items at once without line of sight, turning multi-day stock counts into minutes and cutting picking errors.',
    body: [
      'For decades warehouses relied on barcodes, which must be scanned one at a time and in direct line of sight. RFID removes both limits: a single fixed or handheld reader can capture hundreds of tagged items per second through cartons and packaging, so receiving, put-away, picking and cycle counts all move faster.',
      'In a typical deployment, UHF RFID labels are applied to cartons or pallets, antennas are mounted at dock doors and aisle gateways, and reads flow into the warehouse management system (WMS) in real time. Staff stop hand-scanning every item and instead see what arrived, what shipped and what is on each shelf automatically.',
    ],
    table: { cap: 'Barcode vs RFID in the warehouse', head: ['Aspect', 'Barcode', 'RFID'], rows: [['Line of sight', 'Required', 'Not required'], ['Items per read', 'One', 'Hundreds at once'], ['Typical range', 'A few cm', 'Up to ~10 m (UHF)'], ['Re-writable data', 'No', 'Yes'], ['Stock-count speed', 'Slow, manual', 'Fast, bulk']] },
    points: ['Bulk, no-line-of-sight reads speed up every inbound and outbound step', 'Real-time inventory accuracy reduces shrinkage and stockouts', 'UHF (860–960 MHz) is the usual choice for pallet and carton range', 'Tags, labels and readers integrate with most WMS platforms'],
    help: ['RFID MFG supplies the UHF inlays, labels, hard tags and reader hardware that make warehouse visibility possible — pre-encoded to your numbering scheme and tested for your packaging and read environment.'],
    faqs: [['Which frequency is best for warehouses?', 'UHF (860–960 MHz) is standard for pallet and carton tracking because of its longer read range and fast bulk reads. HF/NFC suits item-level tagging at short range.'], ['Can RFID integrate with our WMS or ERP?', 'Yes. Readers output data over USB, RS232/485, Wi-Fi or Ethernet, and middleware feeds it into common WMS/ERP systems.']],
  },
  {
    slug: 'case-id-cards.html', oldUrl: 'https://www.rfidmfg.com/case/sucessful-case-of-mind-rfid-id-cards/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'RFID ID Cards — Case | RFID MFG', h1: 'RFID ID cards', meta: 'Application · ID Cards', img: 'rfid-id-cards.webp', date: '2024-11-05',
    lead: 'RFID ID cards combine secure identification with contactless access, and can be made in PVC or premium eco materials such as PC and PETG.',
    body: [
      'An ID card is more than a photo and a name — when it carries an RFID or contact chip it becomes the key to doors, time-and-attendance, cashless canteens and secure printing. The right material and chip depend on durability needs, security level and budget.',
      'For this rollout, cards were produced with full personalization: sequential numbering, barcodes, photo ID and chip encoding, all matched to the customer’s access-control system. Premium PC and PETG options were offered for users who needed extra durability over standard PVC.',
    ],
    table: { cap: 'Common ID-card materials', head: ['Material', 'Best for', 'Note'], rows: [['PVC', 'Everyday ID & membership', 'Most economical, easy to print'], ['PET / PETG', 'Higher durability', 'Stronger, more eco-friendly'], ['PC (polycarbonate)', 'High-security ID', 'Laser-engravable, very durable'], ['Eco / BIO', 'Green programs', 'Lower plastic footprint']] },
    points: ['Pre-printing and personalization: numbering, barcode, photo and encoding', 'Choice of chip for access, payment or multi-application use', 'PVC for value; PC/PETG for durability and security', 'Secure, consistent production at volume'],
    help: ['RFID MFG prints, personalizes and encodes ID cards in-house, so each batch arrives ready to issue — matched to your reader, your artwork and your security keys.'],
    faqs: [['Can you encode our access-control keys?', 'Yes. We encode MIFARE, DESFire and other chips with your sectors and keys under NDA, and can pre-number and print each card.'], ['What is the most durable ID-card material?', 'Polycarbonate (PC) is the most durable and is laser-engravable for high-security IDs; PETG is a strong, more eco-friendly mid-tier option.']],
  },
  {
    slug: 'case-bank-card.html', oldUrl: 'https://www.rfidmfg.com/case/smart-ic-bank-card-case/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Smart IC Bank Card — Case | RFID MFG', h1: 'Smart IC bank card', meta: 'Application · Banking', img: 'smart-ic-bank-card.webp', date: '2024-09-20',
    lead: 'Smart IC bank cards add a secure chip to the familiar card format, supporting both contact and contactless (tap) payment with strong on-card security.',
    body: [
      'Payment cards fall into two families: magnetic-stripe cards, which store static data on a stripe, and smart IC cards, which carry a secure microchip. Smart IC cards include contact chip cards (inserted into a reader) and contactless RFID cards (tapped at 13.56 MHz).',
      'The chip performs cryptographic authentication for each transaction, which is far harder to clone than a magnetic stripe. Many cards are now dual-interface, offering both insert and tap in a single card for retail and banking environments.',
      'Producing payment-grade cards is exacting work: the module must be milled and implanted to tight tolerances, the antenna tuned for reliable tap performance, and print and lamination held to financial-industry finish standards across the whole run. Cards can combine a contact chip, a contactless antenna, a magnetic stripe, embossing, a signature panel and hologram in one body, so a single card serves legacy and modern terminals alike — manufactured with the consistency and security controls that banking programmes demand.',
    ],
    table: { cap: 'Bank-card technologies compared', head: ['Type', 'How it works', 'Security'], rows: [['Magnetic stripe', 'Swipe, static data', 'Low — easily copied'], ['Contact IC', 'Insert chip into reader', 'High — dynamic auth'], ['Contactless RFID', 'Tap at 13.56 MHz', 'High — dynamic auth'], ['Dual-interface', 'Insert or tap', 'High — most flexible']] },
    points: ['Chip authentication is far more secure than a magnetic stripe', 'Contactless tap speeds up checkout', 'Dual-interface cards combine insert and tap', 'Manufactured to financial-grade quality and consistency'],
    faqs: [['What is the difference between contact and contactless cards?', 'Contact cards are inserted so the chip touches the reader; contactless cards are tapped and communicate over 13.56 MHz RFID. Dual-interface cards support both.'], ['Are smart IC cards more secure than magnetic stripe?', 'Yes. The chip performs dynamic cryptographic authentication for each transaction, which is much harder to clone than a static magnetic stripe.']],
  },
  {
    slug: 'case-library.html', oldUrl: 'https://www.rfidmfg.com/case/rfid-library-system/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'RFID Library System — Case | RFID MFG', h1: 'RFID library system', meta: 'Application · Public', img: 'rfid-library-system.webp', date: '2025-01-18',
    lead: 'RFID lets library patrons borrow and return books in seconds at self-service kiosks, while staff inventory whole shelves by waving a reader.',
    body: [
      'Libraries were early adopters of RFID because it solves two problems at once: slow circulation desks and time-consuming shelf management. An HF RFID label inside each book lets several items be checked out or returned in a single stack, without scanning each barcode.',
      'The same tags drive security gates at the exit, self-return chutes that pre-sort returns, and handheld readers that let staff inventory or find mis-shelved items in a fraction of the usual time.',
      'Libraries standardise on HF 13.56 MHz labels to ISO 15693 / ISO 18000-3 because that band reads a stack of books reliably at close range with strong anti-collision — where UHF would over-read neighbouring shelves. Tags are thin, paper-thin adhesive labels applied inside the cover, optionally with a printed barcode and the library’s branding so they work alongside legacy systems during migration. We supply the labels pre-encoded to the catalogue scheme, plus matching security-gate and desk hardware, so a branch can convert without re-labelling later.',
    ],
    table: { cap: 'Manual/barcode vs RFID libraries', head: ['Task', 'Barcode', 'RFID'], rows: [['Checkout', 'One book at a time', 'A stack at once'], ['Shelf inventory', 'Hours of scanning', 'Minutes with a wand'], ['Self-service', 'Limited', 'Full self-checkout'], ['Anti-theft', 'Separate system', 'Same tag does both']] },
    points: ['Self-service checkout and return cut queues', 'Whole-shelf inventory in minutes, not hours', 'One tag handles circulation and security', 'Better experience for patrons and staff alike'],
    faqs: [['Which RFID frequency do libraries use?', 'HF 13.56 MHz (ISO 15693 / ISO 18000-3) is the library standard, balancing read reliability at close range with anti-collision for reading stacks of books.'], ['Can RFID tags also work as anti-theft?', 'Yes. The same HF tag drives security gates at the exit, so a single tag handles both circulation and loss prevention.']],
  },
  {
    slug: 'case-gateways.html', oldUrl: 'https://www.rfidmfg.com/case/rfid-gateways-and-portal-applications-keep-track-o/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'RFID Gateways & Portals — Case | RFID MFG', h1: 'RFID gateways & portal applications', meta: 'Application · Tracking', img: 'rfid-gateway-portal.webp', date: '2024-12-03',
    lead: 'Doorway-mounted RFID readers record tagged goods automatically as they pass through, so movement is tracked without anyone scanning anything.',
    body: [
      'A gateway or portal is simply a set of RFID antennas mounted around a doorway, dock or corridor. As tagged items pass through, the reader logs the time, direction and location — creating an automatic chain of custody across a building or site.',
      'This is ideal for tracking goods between zones, confirming shipments at dock doors, and monitoring high-value assets as they move around a facility, all without slowing people down or requiring manual checks.',
      'A dependable portal is an exercise in antenna geometry. Two to four UHF antennas are positioned to flood the opening evenly, reader power is tuned to cover the doorway without reading the next aisle, and direction is inferred from the order in which antennas see the tag. Fast-moving forklift traffic, metal door frames and shrink-wrapped loads all change the read field, so we help select and place the readers, antennas and tag types together and test with your actual goods before go-live.',
    ],
    points: ['Automatic, hands-free recording at every doorway', 'Direction and timestamp give a clear chain of custody', 'Works for shipments, assets and inter-zone moves', 'Pairs with handheld readers for spot checks'],
    help: ['RFID MFG provides the fixed readers, gate antennas and tags that make portal tracking reliable — selected and tuned for your item types, throughput and read environment.'],
    faqs: [['How far can a gateway reader detect tags?', 'UHF portals typically read tags across a 2–6 m doorway depending on antenna layout, tag type and the materials being tagged.'], ['Can a portal tell which direction goods move?', 'Yes. With multiple antennas the system infers direction (in vs out), which is essential for chain-of-custody and shipment confirmation.']],
  },
  {
    slug: 'case-warranty.html', oldUrl: 'https://www.rfidmfg.com/case/rfid-for-warranty/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'RFID for Warranty & Repair — Case | RFID MFG', h1: 'RFID for warranty, returns & repair', meta: 'Application · Service', img: 'rfid-warranty-repair.webp', date: '2024-10-15',
    lead: 'Tagging each product with RFID gives it a reliable service history, so warranty, returns, testing and repairs are verified and recorded automatically.',
    body: [
      'Service operations struggle when they cannot reliably identify which unit is which. RFID solves this by giving every item a unique, scannable identity that links to its full record — purchase date, warranty status, prior repairs and required checks.',
      'When an item arrives for service, a quick read confirms whether it is in warranty and what work or calibration is due, reducing disputes and speeding up turnaround.',
      'The tag has to outlast the product, often on metal and through years of handling, so warranty and repair programmes use rugged on-metal, epoxy or PCB tags rather than paper labels. Each is encoded with a permanent serial and, where anti-counterfeiting matters, a factory-locked chip TID that cannot be transferred to a clone — so a genuine unit can always be told from a grey-market or counterfeit one. We manufacture these durable tags and encode your serial and warranty data before delivery, ready to attach on the line.',
    ],
    points: ['Unique RFID identity per unit links to its full history', 'Instantly verify warranty status and due checks', 'Fewer disputes over coverage and prior work', 'Faster, more accurate returns and repair flow'],
    help: ['RFID MFG supplies durable tags and on-metal labels suited to tools, electronics and equipment — encoded with serial data so each unit carries its identity for life.'],
    faqs: [['How does RFID prove warranty status?', 'Each unit’s tag holds a unique ID linked to its purchase and service record, so a single read confirms whether it is in warranty and what work is due.'], ['What tags suit electronics and tools?', 'Anti-metal (on-metal) tags and rugged epoxy or PCB tags are designed to read reliably on or near metal surfaces.']],
  },
  {
    slug: 'case-scratch-card.html', oldUrl: 'https://www.rfidmfg.com/case/pvc-scratch-card/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'PVC Scratch Card — Case | RFID MFG', h1: 'PVC scratch card', meta: 'Application · Government', img: 'pvc-scratch-card.webp', date: '2024-08-22',
    lead: 'A government project used PVC scratch cards carrying a serial number and hidden PIN for secure website login and registration — won on print quality.',
    body: [
      'Scratch cards pair a printed serial number with a PIN concealed under a scratch-off panel. The user reveals the PIN to authenticate — a low-cost, offline-friendly way to control access to a service or website.',
      'For this government registration project, security and print consistency were critical: every card had to be unique, legible and tamper-evident across a large print run. RFID MFG won the work on print quality and reliable, secure production.',
      'The security is in the production, not just the design. Serials and PINs are generated as a controlled, non-sequential dataset, printed with variable-data equipment so no two cards repeat, and the PIN is hidden under a scratch panel that cannot be resealed once removed. Secure handling keeps unused codes protected through the whole run, and each card can carry a barcode or QR for activation. The same secure numbering approach extends to gift cards, top-up cards, loyalty codes and promotional pins.',
    ],
    points: ['Serial number plus hidden PIN for secure activation', 'Unique, sequential data across the whole run', 'Tamper-evident scratch panel', 'Won on print quality and production reliability'],
    faqs: [['How do scratch cards stay secure?', 'Each card carries a unique serial and a PIN hidden under a scratch panel; the PIN is only revealed by the end user, and unused codes stay protected.'], ['Can you produce unique numbering at volume?', 'Yes. We generate sequential or randomized serials and PINs and print them consistently across large, secure production runs.']],
  },
  {
    slug: 'case-transit.html', oldUrl: 'https://www.rfidmfg.com/case/public-transportation/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Public Transportation — Case | RFID MFG', h1: 'Public transportation', meta: 'Application · Transport', img: 'rfid-public-transport.webp', date: '2025-02-09',
    lead: 'Contactless RFID cards and tickets let passengers tap to pay and board in under a second, keeping transit networks moving at peak times.',
    body: [
      'Public transport runs on speed at the gate. Contactless fare media — cards, tokens and paper tickets with an embedded chip — let passengers tap and go in well under a second, far faster than cash or magnetic tickets.',
      'The same RFID technology RFID MFG supplies for transit also serves library management, animal identification and toll collection, making it a versatile backbone for smart-city services.',
      'Choosing the right fare media matters. Reusable HF cards (typically the MIFARE family) hold a secure, re-loadable balance for regular commuters, while single-use paper tickets with an embedded chip suit tourists and events — cheap to issue and easy to recycle. For open-road tolling, UHF windshield tags read vehicles at speed from several metres. Because we produce cards, tokens, paper tickets and windshield tags in-house, a transit authority can source one supplier for the whole fare ecosystem and encode every credential to its own keys before delivery.',
    ],
    table: { cap: 'RFID frequencies for transit & access', head: ['Band', 'Range', 'Typical use'], rows: [['LF 125 kHz', 'A few cm', 'Simple access tokens'], ['HF 13.56 MHz', 'Tap (up to ~10 cm)', 'Fare cards, ticketing'], ['UHF 860–960 MHz', 'Up to several metres', 'Vehicle / toll tags']] },
    points: ['Sub-second tap-to-pay keeps gates flowing', 'Durable fare cards and disposable paper tickets', 'One platform spans transit, tolls and access', 'HF for fare media, UHF for vehicle tolling'],
    faqs: [['What chip is used for transit fare cards?', 'HF 13.56 MHz cards (e.g. MIFARE family) are the transit standard, balancing fast tap performance with secure, re-loadable stored value.'], ['Can you supply both reusable cards and paper tickets?', 'Yes. We produce durable PVC fare cards as well as single-use paper/RFID tickets and tokens for events and short trips.']],
  },
  {
    slug: 'case-nfc-honda.html', oldUrl: 'https://www.rfidmfg.com/case/nfc-solution-honda-case/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'NFC Solution — Honda Case | RFID MFG', h1: 'NFC solution — Honda', meta: 'Application · Automotive', img: '', date: '2024-07-11',
    lead: 'Using RFID MFG NFC cards, customers tap an NFC-enabled phone to trigger an interaction — bridging a physical product and a digital experience.',
    body: [
      'NFC (Near Field Communication) is the short-range, tap-based subset of 13.56 MHz RFID built into virtually every modern smartphone. That ubiquity makes NFC cards a powerful bridge between a physical touchpoint and a digital experience — no app install required.',
      'Through a strategic partnership begun in 2017, RFID MFG NFC cards let customers tap their phone to open a link, verify authenticity or start an interaction, turning a simple card into an engagement channel.',
      'What makes it work at scale is consistent encoding and locking. Each card is built on an NTAG chip written with an NDEF record — usually a redirect URL — then locked so the destination cannot be overwritten, while the landing page can still be updated centrally without re-issuing a single card. That lets a brand run seasonal campaigns on cards already in customers’ hands. We manufacture, print and encode these NFC cards in volume, with tamper and locking options where authenticity matters.',
    ],
    points: ['NFC works with the phone almost everyone already carries', 'A tap can open a URL, verify a product or launch an action', 'No app needed — the experience opens in the browser', 'Bridges physical products with digital marketing'],
    help: ['RFID MFG manufactures and encodes NTAG-based NFC cards, labels and tags, locking the data where needed so each tap delivers a consistent, secure experience.'],
    faqs: [['Do customers need an app to use NFC cards?', 'No. NTAG NFC cards can store a web link (NDEF), so a tap opens the page directly in the phone’s browser without any app.'], ['Which NFC chips do you support?', 'NTAG213/215/216 and ICODE SLIX are common; we encode and can lock the data so the content cannot be overwritten.']],
  },
  {
    slug: 'case-member-card.html', oldUrl: 'https://www.rfidmfg.com/case/magnetic-member-card-and-holder/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Magnetic Member Card & Holder — Case | RFID MFG', h1: 'Magnetic member card & holder', meta: 'Application · Retail', img: 'magnetic-member-card.webp', date: '2024-06-28',
    lead: 'A new Japanese-cuisine food hall used member cards and holders for payment, top-ups and loyalty, building repeat custom from day one.',
    body: [
      'For a food-and-beverage venue, a membership card is both a payment instrument and a marketing tool. This client needed a complete solution: cards members could use to pay and reload, plus a system to enroll new members and track spend.',
      'RFID MFG supplied the magnetic member cards and matching holders that powered the programme, helping the venue retain customers, encourage prepaid top-ups and understand buying behaviour.',
      'A membership programme is a kit, not just a card. Alongside the magnetic-stripe (or RFID) cards, the venue used branded holders, and can add sleeves, lanyards and welcome packaging so the whole set reinforces the brand at first touch. Cards were personalised in the run with sequential numbering and could carry a barcode or QR for the POS, while an RFID or NFC upgrade path lets a later phase move to tap-to-pay and phone enrolment. Producing cards and accessories together keeps branding, colour and quality consistent across the programme.',
    ],
    points: ['Cards for payment, top-ups and member enrollment', 'Prepaid balances improve cash flow and loyalty', 'Spend tracking informs promotions', 'Branded cards and holders reinforce identity'],
    faqs: [['Can member cards store a prepaid balance?', 'Yes. Cards can hold stored value or link to an account so members top up and pay, which boosts loyalty and prepaid cash flow.'], ['Can you supply matching card holders and accessories?', 'Yes. We produce branded holders, sleeves and lanyards alongside the cards for a complete, consistent membership kit.']],
  },
  {
    slug: 'case-logistics.html', oldUrl: 'https://www.rfidmfg.com/case/logistics-management/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Logistics Management — Case | RFID MFG', h1: 'Logistics management', meta: 'Application · Supply Chain', img: 'rfid-logistics-management.webp', date: '2025-04-02',
    lead: 'RFID tracks shipments accurately end to end with fast bulk reads, long range and secure data — cutting losses and speeding up handling.',
    body: [
      'Logistics is a chain of hand-offs, and every manual scan is a chance for error or delay. RFID lets pallets and parcels be read in bulk as they move — at the dock, on the conveyor and onto the truck — so the system always knows what is where.',
      'The result is fewer lost shipments, faster loading and unloading, and accurate, real-time visibility that both operators and their customers can rely on.',
      'The tag has to survive the journey. Cartons and parcels use economical UHF paper labels; returnable assets such as roll cages, totes and containers use rugged hard tags or on-metal tags that read reliably on steel and last for years of reuse. Pre-encoding to an SSCC or your own numbering scheme means tags work the moment they arrive, and pairing fixed dock-door readers with handheld units gives both automatic gate reads and spot checks. Because we manufacture the inlays, labels and hard tags together, the whole chain is sourced and tuned consistently.',
    ],
    points: ['Bulk reads at every hand-off remove manual bottlenecks', 'End-to-end visibility reduces losses and mis-ships', 'Long-range UHF suits pallet and parcel tracking', 'Real-time data improves customer transparency'],
    help: ['RFID MFG’s UHF labels, inlays and hard tags are built for the knocks of logistics, and can be pre-encoded to your SSCC or internal numbering for plug-in deployment.'],
    faqs: [['How does RFID reduce shipment losses?', 'Because items are read automatically in bulk at each hand-off, discrepancies are caught immediately rather than discovered later, reducing lost and mis-routed goods.'], ['Do tags survive the logistics environment?', 'Yes. We offer rugged labels and hard tags rated for moisture, abrasion and temperature swings common in transport and storage.']],
  },
  {
    slug: 'case-events.html', oldUrl: 'https://www.rfidmfg.com/case/events-and-activity/', crumbCat: 'Cases', crumbCatHref: 'cases.html',
    title: 'Events & Activities — Case | RFID MFG', h1: 'Events & activities', meta: 'Application · Events', img: 'rfid-event-wristbands.webp', date: '2025-05-15',
    lead: 'RFID wristbands, epoxy tags and tickets speed up access and enable cashless payment at festivals and events worldwide — fully customizable by OEM.',
    body: [
      'At a busy event, the wristband is the whole experience: it is the ticket, the wallet and the access pass. RFID wristbands let guests tap to enter, top up and pay, removing queues at gates and bars and giving organisers live attendance data.',
      'RFID MFG offers full OEM customization — chip, shape, material and size — so each wristband, epoxy tag or ticket matches the event’s brand and security needs.',
      'Material choice follows the event. Tyvek paper bands are the low-cost pick for single-day concerts and festivals; woven fabric bands, closed with a one-time slider, suit multi-day festivals where they double as a keepsake; and silicone bands are the durable, waterproof choice for water parks, gyms and VIP access. Chip choice follows the interaction: NTAG or MIFARE for tap-to-pay and social check-ins, or long-range UHF where organisers need to track crowd flow through gates. Operators typically report shorter entry queues and higher on-site spend once cashless wristbands replace cash and paper tickets.',
    ],
    table: { cap: 'Choosing an event wristband material', head: ['Material', 'Best for', 'Reuse'], rows: [['Tyvek paper', 'Single-day events', 'Disposable'], ['Fabric / woven', 'Multi-day festivals', 'Reusable'], ['Silicone', 'Water parks, VIP', 'Reusable']] },
    points: ['One wristband for entry, cashless pay and access', 'Live attendance and spend data for organisers', 'Tyvek, fabric or silicone to fit the event', 'Full OEM: chip, shape, material and artwork'],
    faqs: [['Are RFID wristbands reusable?', 'It depends on the material: Tyvek paper bands are single-use, while fabric and silicone bands are durable and reusable across multiple days or events.'], ['Can wristbands handle cashless payment?', 'Yes. The chip can hold a balance or link to an account, so guests tap to pay at bars and stalls, cutting queues and cash handling.']],
  },
];

// ---------- NEWS (6) ----------
// ── 博客插图库(原创场景隐喻 SVG,图内数字均来自文章事实)──
const ART = {
blocking_thief: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="RFID blocking card stopping a hidden reader from skimming wallet cards at 13.56 MHz">
<defs><pattern id="pbt" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pbt)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">The wallet with a bodyguard</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">A hidden reader tries its luck. The blocking card answers for everyone.</text>
<g><circle cx="205" cy="270" r="34" fill="#fbd38d"/><path d="M171 262 a34 34 0 0 1 68 0 l-6 -20 a30 30 0 0 0 -56 0 Z" fill="#0a1b34"/><circle cx="194" cy="266" r="3.4" fill="#0a1b34"/><circle cx="216" cy="266" r="3.4" fill="#0a1b34"/><path d="M196 284 q9 -5 18 0" fill="none" stroke="#0a1b34" stroke-width="2.5" stroke-linecap="round"/>
<rect x="176" y="308" width="58" height="88" rx="18" fill="#0a1b34"/><line x1="234" y1="330" x2="292" y2="318" stroke="#0a1b34" stroke-width="13" stroke-linecap="round"/>
<rect x="284" y="298" width="56" height="36" rx="8" fill="#5b6b82"/><rect x="292" y="306" width="26" height="20" rx="3" fill="#22d3ee" opacity=".7"/>
<text x="205" y="440" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">the "customer"</text></g>
<g stroke="#0aa2e8" fill="none" stroke-width="4" stroke-linecap="round"><path d="M366 316 c16 -22 16 -58 0 -80"/><path d="M406 326 c26 -32 26 -78 0 -110"/><path d="M446 336 c36 -42 36 -98 0 -140"/></g>
<g><rect x="520" y="200" width="230" height="300" rx="26" fill="#e8d9c3"/><path d="M520 240 q115 -34 230 0 V500 H520 Z" fill="#d9c5a6"/>
<rect x="558" y="150" width="150" height="230" rx="14" fill="#0b6fb8"/><path d="M633 196 l34 14 v30 c0 30 -20 50 -34 56 c-14 -6 -34 -26 -34 -56 v-30 Z" fill="#fffdf6"/><path d="M618 254 l12 12 22 -24" fill="none" stroke="#0b6fb8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="596" y="392" width="180" height="26" rx="13" fill="#0a1b34"/><text x="686" y="410" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">13.56 MHz — BLOCKED</text></g>
<g><rect x="840" y="228" width="140" height="92" rx="12" fill="#fff" stroke="#e4e9f1" stroke-width="2" transform="rotate(-6 910 274)"/><circle cx="884" cy="262" r="4" fill="#0a1b34"/><circle cx="922" cy="262" r="4" fill="#0a1b34"/><path d="M886 284 q18 12 36 0" fill="none" stroke="#0a1b34" stroke-width="3" stroke-linecap="round"/>
<rect x="880" y="340" width="140" height="92" rx="12" fill="#fff" stroke="#e4e9f1" stroke-width="2" transform="rotate(5 950 386)"/><circle cx="926" cy="376" r="4" fill="#0a1b34"/><circle cx="964" cy="376" r="4" fill="#0a1b34"/><path d="M928 398 q18 12 36 0" fill="none" stroke="#0a1b34" stroke-width="3" stroke-linecap="round"/>
<text x="946" y="480" text-anchor="middle" font-size="14" font-weight="700" fill="#15803d">your cards, unbothered</text></g>
<rect x="384" y="530" width="432" height="40" rx="20" fill="#dcfce7"/><text x="600" y="556" text-anchor="middle" font-size="16" font-weight="700" fill="#15803d">One card in the wallet shields the cards around it</text>
</svg>`,
blocking_vs: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Passive shielding versus active jamming RFID blocking cards compared">
<defs><pattern id="pbv" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pbv)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Two bodyguards, two styles</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Same job — stop unauthorized 13.56 MHz reads. Very different personalities.</text>
<rect x="80" y="130" width="480" height="400" rx="20" fill="#fff" stroke="#e4e9f1" stroke-width="2"/>
<text x="320" y="176" text-anchor="middle" font-size="21" font-weight="800" fill="#0b6fb8">PASSIVE — the monk</text>
<rect x="240" y="210" width="160" height="230" rx="16" fill="#0b6fb8"/><circle cx="300" cy="270" r="9" fill="#fffdf6"/><circle cx="340" cy="270" r="9" fill="#fffdf6"/><circle cx="300" cy="270" r="3" fill="#0a1b34"/><circle cx="340" cy="270" r="3" fill="#0a1b34"/><path d="M302 306 q18 8 36 0" fill="none" stroke="#fffdf6" stroke-width="4" stroke-linecap="round"/>
<g stroke="#0aa2e8" fill="none" stroke-width="3.5" stroke-linecap="round"><path d="M150 300 c12 -14 12 -36 0 -50"/><path d="M180 310 c18 -22 18 -50 0 -72"/></g>
<circle cx="228" cy="290" r="5" fill="#0aa2e8"/><circle cx="222" cy="320" r="4" fill="#0aa2e8" opacity=".6"/><circle cx="218" cy="264" r="3.4" fill="#0aa2e8" opacity=".4"/>
<text x="320" y="474" text-anchor="middle" font-size="15" fill="#5b6b82">absorbs and detunes the field</text>
<rect x="200" y="490" width="240" height="30" rx="15" fill="#0a1b34"/><text x="320" y="510" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">No battery. Ever.</text>
<rect x="640" y="130" width="480" height="400" rx="20" fill="#fff" stroke="#e4e9f1" stroke-width="2"/>
<text x="880" y="176" text-anchor="middle" font-size="21" font-weight="800" fill="#d97706">ACTIVE — the bouncer</text>
<rect x="800" y="210" width="160" height="230" rx="16" fill="#f59e0b"/><circle cx="860" cy="270" r="9" fill="#fffdf6"/><circle cx="900" cy="270" r="9" fill="#fffdf6"/><circle cx="862" cy="268" r="3" fill="#0a1b34"/><circle cx="898" cy="268" r="3" fill="#0a1b34"/><path d="M860 308 h40" stroke="#fffdf6" stroke-width="4" stroke-linecap="round"/>
<path d="M770 300 l-36 -20 14 26 -30 -6 22 24" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="842" y="330" width="36" height="58" rx="7" fill="#0a1b34"/><rect x="852" y="322" width="16" height="10" rx="3" fill="#0a1b34"/><rect x="848" y="342" width="24" height="16" fill="#16d6c1"/>
<text x="880" y="474" text-anchor="middle" font-size="15" fill="#5b6b82">emits a disrupting signal</text>
<rect x="760" y="490" width="240" height="30" rx="15" fill="#0a1b34"/><text x="880" y="510" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">Battery included</text>
<circle cx="600" cy="330" r="44" fill="#0a1b34"/><text x="600" y="341" text-anchor="middle" font-size="26" font-weight="900" fill="#f59e0b">VS</text>
<text x="600" y="580" text-anchor="middle" font-size="15" font-weight="700" fill="#5b6b82">Both fit a normal card slot. Both take your branding.</text>
</svg>`,
rail_gate: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Trackside RFID reader identifying passing rail wagons automatically with factory-locked TID chips">
<defs><pattern id="prg" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#prg)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Reads at speed. No clipboards.</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Every wagon announces itself to the trackside reader as it passes.</text>
<rect x="96" y="150" width="26" height="330" rx="6" fill="#0a1b34"/><rect x="76" y="140" width="112" height="56" rx="12" fill="#0b6fb8"/><circle cx="132" cy="168" r="10" fill="#16d6c1"/>
<path d="M188 190 L560 300 L188 410 Z" fill="#0aa2e8" opacity="0.13"/>
<g><path d="M120 508 H1140" stroke="#0a1b34" stroke-width="7"/><path d="M140 522 H1140" stroke="#5b6b82" stroke-width="3" stroke-dasharray="26 18"/></g>
<g><rect x="360" y="330" width="220" height="130" rx="10" fill="#0b6fb8"/><circle cx="410" cy="478" r="22" fill="#0a1b34"/><circle cx="530" cy="478" r="22" fill="#0a1b34"/><rect x="380" y="352" width="180" height="56" rx="6" fill="#fffdf6" opacity=".22"/>
<rect x="470" y="300" width="150" height="30" rx="15" fill="#0a1b34"/><text x="545" y="320" text-anchor="middle" font-size="13.5" font-weight="800" fill="#16d6c1">ID: WGN-0417</text></g>
<g><rect x="650" y="330" width="220" height="130" rx="10" fill="#5b6b82"/><circle cx="700" cy="478" r="22" fill="#0a1b34"/><circle cx="820" cy="478" r="22" fill="#0a1b34"/>
<rect x="760" y="300" width="150" height="30" rx="15" fill="#0a1b34"/><text x="835" y="320" text-anchor="middle" font-size="13.5" font-weight="800" fill="#16d6c1">ID: WGN-0418</text></g>
<g><rect x="940" y="330" width="180" height="130" rx="10" fill="#0b6fb8"/><circle cx="985" cy="478" r="22" fill="#0a1b34"/><circle cx="1075" cy="478" r="22" fill="#0a1b34"/>
<rect x="1000" y="300" width="130" height="30" rx="15" fill="#0a1b34"/><text x="1065" y="320" text-anchor="middle" font-size="13.5" font-weight="800" fill="#16d6c1">reading…</text></g>
<g stroke="#16d6c1" stroke-width="5" stroke-linecap="round"><path d="M330 360 h-64"/><path d="M330 396 h-40"/><path d="M330 432 h-52"/></g>
<rect x="330" y="546" width="540" height="40" rx="20" fill="#0a1b34"/><text x="600" y="572" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Chip TID: factory-locked, hard to forge — real chain of custody</text>
</svg>`,
rail_gauntlet: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Rugged rail RFID tag surviving vibration, grease, weather and wide temperature swings">
<defs><pattern id="prq" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#prq)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">The ugliest job in transport</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Rail tags live outdoors, on metal, next to brakes — and keep answering.</text>
<rect x="450" y="250" width="300" height="140" rx="22" fill="#0b6fb8"/><rect x="470" y="270" width="260" height="100" rx="14" fill="#fffdf6" opacity=".14"/>
<circle cx="486" cy="286" r="7" fill="#fffdf6"/><circle cx="714" cy="286" r="7" fill="#fffdf6"/><circle cx="486" cy="354" r="7" fill="#fffdf6"/><circle cx="714" cy="354" r="7" fill="#fffdf6"/>
<circle cx="600" cy="320" r="26" fill="none" stroke="#16d6c1" stroke-width="4"/><rect x="590" y="310" width="20" height="20" fill="#16d6c1"/>
<g><rect x="120" y="170" width="200" height="96" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><path d="M150 232 l18 -26 14 20 16 -30 14 22 16 -26" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="220" y="252" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">vibration</text></g>
<g><rect x="120" y="360" width="200" height="96" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><path d="M204 388 c-16 22 -16 34 0 46 c16 -12 16 -24 0 -46" fill="#0a1b34"/><circle cx="238" cy="424" r="8" fill="#0a1b34" opacity=".55"/><text x="220" y="442" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">grease</text></g>
<g><rect x="880" y="170" width="200" height="96" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><circle cx="950" cy="202" r="16" fill="#5b6b82" opacity=".35"/><circle cx="976" cy="196" r="20" fill="#5b6b82" opacity=".45"/><g stroke="#0aa2e8" stroke-width="4" stroke-linecap="round"><path d="M942 224 l-6 12"/><path d="M966 224 l-6 12"/><path d="M990 224 l-6 12"/></g><text x="980" y="252" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">weather</text></g>
<g><rect x="880" y="360" width="200" height="96" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><rect x="916" y="378" width="12" height="40" rx="6" fill="none" stroke="#ef4444" stroke-width="4"/><circle cx="922" cy="426" r="9" fill="#ef4444"/><text x="1002" y="404" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">-40…+85 °C</text><text x="1002" y="436" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">temp swings</text></g>
<g stroke="#f59e0b" stroke-width="4" stroke-linecap="round" fill="none"><path d="M330 232 c40 20 70 46 96 70"/><path d="M330 400 c40 -14 70 -34 96 -56"/><path d="M870 232 c-40 20 -70 46 -96 70"/><path d="M870 400 c-40 -14 -70 -34 -96 -56"/></g>
<rect x="330" y="470" width="240" height="34" rx="17" fill="#0a1b34"/><text x="450" y="492" text-anchor="middle" font-size="14.5" font-weight="800" fill="#fff">On-metal UHF range</text>
<rect x="630" y="470" width="240" height="34" rx="17" fill="#0a1b34"/><text x="750" y="492" text-anchor="middle" font-size="14.5" font-weight="800" fill="#fff">High-temp near brakes</text>
<text x="600" y="566" text-anchor="middle" font-size="15" font-weight="700" fill="#5b6b82">Fixed depot readers reconcile every pass against the asset database — no manual inspection error.</text>
</svg>`,
nfc_constellation: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="One phone tap connecting posters, menus, packaging and business cards through NFC stickers">
<defs><pattern id="pnc" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pnc)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">The 2-cent hyperlink</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">A chip under a printed label turns any object into a website. No app, no pairing.</text>
<g stroke="#e4e9f1" stroke-width="2.5" stroke-dasharray="6 7"><path d="M600 330 L240 240"/><path d="M600 330 L950 230"/><path d="M600 330 L260 470"/><path d="M600 330 L950 470"/></g>
<rect x="540" y="220" width="120" height="220" rx="22" fill="#0a1b34"/><rect x="556" y="248" width="88" height="140" rx="8" fill="#0b6fb8"/><circle cx="600" cy="416" r="10" fill="none" stroke="#fffdf6" stroke-width="3"/>
<g stroke="#16d6c1" fill="none" stroke-width="4" stroke-linecap="round"><path d="M676 300 c10 12 10 32 0 44"/><path d="M700 288 c16 20 16 48 0 68"/></g>
<g><rect x="130" y="150" width="150" height="180" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><rect x="150" y="172" width="110" height="64" rx="6" fill="#0aa2e8" opacity=".25"/><path d="M150 260 h110 M150 282 h84 M150 304 h96" stroke="#e4e9f1" stroke-width="7" stroke-linecap="round"/><circle cx="256" cy="310" r="9" fill="#16d6c1"/><text x="205" y="356" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">poster</text></g>
<g><rect x="880" y="140" width="150" height="180" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="955" y="176" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">MENU</text><path d="M902 196 h106 M902 220 h80 M902 244 h92 M902 268 h70" stroke="#e4e9f1" stroke-width="7" stroke-linecap="round"/><circle cx="1006" cy="292" r="9" fill="#16d6c1"/><text x="955" y="346" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">menu</text></g>
<g><path d="M180 420 l80 -34 80 34 v90 l-80 34 -80 -34 Z" fill="#e8d9c3"/><path d="M180 420 l80 34 80 -34" fill="none" stroke="#c9b28e" stroke-width="3"/><path d="M260 454 v90" stroke="#c9b28e" stroke-width="3"/><circle cx="300" cy="440" r="9" fill="#16d6c1"/><text x="260" y="580" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">packaging</text></g>
<g><rect x="880" y="420" width="170" height="104" rx="12" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><rect x="898" y="440" width="52" height="10" rx="5" fill="#0a1b34"/><path d="M898 466 h120 M898 486 h96" stroke="#e4e9f1" stroke-width="6" stroke-linecap="round"/><circle cx="1022" cy="500" r="9" fill="#16d6c1"/><text x="965" y="560" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">business card</text></g>
<rect x="360" y="540" width="200" height="36" rx="18" fill="#0a1b34"/><text x="460" y="563" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">One tap. No app.</text>
<rect x="590" y="540" width="330" height="36" rx="18" fill="#dcfce7"/><text x="755" y="563" text-anchor="middle" font-size="14.5" font-weight="800" fill="#15803d">NTAG213 · 215 · 216 — sized to the data</text>
</svg>`,
nfc_tamper: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Tamper-evident NFC sticker self-destructing on removal while a QR code is easily photocopied">
<defs><pattern id="pnt" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pnt)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Why counterfeiters hate NFC</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">A QR code photocopies in seconds. A locked chip doesn't photocopy at all.</text>
<rect x="90" y="130" width="480" height="410" rx="20" fill="#fff" stroke="#e4e9f1" stroke-width="2"/>
<text x="330" y="172" text-anchor="middle" font-size="19" font-weight="800" fill="#5b6b82">THE QR CODE</text>
<rect x="180" y="200" width="130" height="130" rx="10" fill="#fffdf6" stroke="#0a1b34" stroke-width="3"/>
<g fill="#0a1b34"><rect x="196" y="216" width="30" height="30"/><rect x="264" y="216" width="30" height="30"/><rect x="196" y="284" width="30" height="30"/><rect x="240" y="250" width="14" height="14"/><rect x="270" y="270" width="22" height="12"/><rect x="240" y="292" width="12" height="22"/></g>
<path d="M330 264 h96" stroke="#5b6b82" stroke-width="5" stroke-linecap="round"/><path d="M410 252 l18 12 -18 12" fill="none" stroke="#5b6b82" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="436" y="204" width="118" height="122" rx="10" fill="#fffdf6" stroke="#5b6b82" stroke-width="3" stroke-dasharray="8 6" transform="rotate(6 495 265)"/>
<g fill="#5b6b82" opacity=".75" transform="rotate(6 495 265)"><rect x="450" y="218" width="27" height="27"/><rect x="512" y="218" width="27" height="27"/><rect x="450" y="280" width="27" height="27"/></g>
<rect x="150" y="380" width="360" height="36" rx="18" fill="#fee2e2"/><text x="330" y="404" text-anchor="middle" font-size="15" font-weight="800" fill="#ef4444">copied in seconds — looks identical</text>
<text x="330" y="470" text-anchor="middle" font-size="14.5" fill="#5b6b82">Great for reach. Useless as proof.</text>
<rect x="630" y="130" width="480" height="410" rx="20" fill="#fff" stroke="#16d6c1" stroke-width="2.5"/>
<text x="870" y="172" text-anchor="middle" font-size="19" font-weight="800" fill="#0b6fb8">THE NFC STICKER</text>
<g><path d="M700 240 h150 l-14 16 14 16 h-150 Z" fill="#16d6c1" opacity=".85"/><path d="M866 232 c22 -18 56 -12 64 8" fill="none" stroke="#5b6b82" stroke-width="4" stroke-linecap="round"/>
<circle cx="775" cy="256" r="12" fill="none" stroke="#0a1b34" stroke-width="3"/><rect x="770" y="251" width="10" height="10" fill="#0a1b34"/>
<path d="M852 226 l10 -18 M868 224 l4 -20 M884 226 l14 -16" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/></g>
<text x="700" y="238" text-anchor="middle" font-size="13" font-weight="700" fill="#ef4444" transform="rotate(-8 700 238)">VOID</text>
<text x="820" y="300" text-anchor="middle" font-size="14.5" fill="#5b6b82">peel it — the face shreds, the antenna dies</text>
<g><rect x="700" y="330" width="340" height="80" rx="14" fill="#0a1b34"/><text x="870" y="362" text-anchor="middle" font-size="15.5" font-weight="800" fill="#fff">Locked, unique chip inside</text><text x="870" y="390" text-anchor="middle" font-size="14" fill="#16d6c1">cannot be photocopied · verified by a tap</text></g>
<rect x="700" y="440" width="340" height="36" rx="18" fill="#dcfce7"/><text x="870" y="464" text-anchor="middle" font-size="14.5" font-weight="800" fill="#15803d">QR for reach + hidden NFC for proof</text>
<text x="870" y="516" text-anchor="middle" font-size="14.5" fill="#5b6b82">The pairing brands increasingly ship.</text>
</svg>`,
band_replaces: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="One RFID wristband replacing paper tickets, cash and access keycards at a theme park">
<defs><pattern id="pbr" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pbr)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">One band. Three jobs. Zero pockets.</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Entry, payment and ride access move onto a waterproof strap.</text>
<g><path d="M150 320 a150 105 0 1 0 300 0 a150 105 0 1 0 -300 0" fill="none" stroke="#16d6c1" stroke-width="46"/><rect x="252" y="270" width="96 " height="100" rx="22" fill="#0b6fb8"/><circle cx="300" cy="320" r="22" fill="none" stroke="#fffdf6" stroke-width="4"/><rect x="292" y="312" width="16" height="16" fill="#fffdf6"/>
<text x="300" y="486" text-anchor="middle" font-size="15" font-weight="800" fill="#0b6fb8">the band</text></g>
<path d="M492 320 h120" stroke="#5b6b82" stroke-width="6" stroke-linecap="round"/><path d="M588 304 l26 16 -26 16" fill="none" stroke="#5b6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<text x="552" y="292" text-anchor="middle" font-size="15" font-weight="800" fill="#5b6b82">replaces</text>
<g opacity=".92"><rect x="680" y="180" width="190" height="86" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2" transform="rotate(-7 775 223)"/><circle cx="712" cy="223" r="9" fill="none" stroke="#5b6b82" stroke-width="3" transform="rotate(-7 775 223)"/><path d="M740 206 h96 M740 226 h72 M740 246 h84" stroke="#e4e9f1" stroke-width="7" stroke-linecap="round" transform="rotate(-7 775 223)"/><text x="775" y="286" text-anchor="middle" font-size="13.5" font-weight="700" fill="#5b6b82">paper ticket</text></g>
<g opacity=".92"><rect x="920" y="200" width="190" height="92" rx="10" fill="#dcfce7" stroke="#15803d" stroke-width="2"/><circle cx="1015" cy="246" r="26" fill="none" stroke="#15803d" stroke-width="3"/><text x="1015" y="254" text-anchor="middle" font-size="20" font-weight="800" fill="#15803d">$</text><text x="1015" y="316" text-anchor="middle" font-size="13.5" font-weight="700" fill="#5b6b82">cash handling</text></g>
<g opacity=".92"><rect x="800" y="360" width="190" height="110" rx="12" fill="#fff" stroke="#e4e9f1" stroke-width="2" transform="rotate(5 895 415)"/><rect x="824" y="384" width="56" height="40" rx="6" fill="#0aa2e8" opacity=".3" transform="rotate(5 895 415)"/><path d="M900 396 h70 M900 420 h52 M900 444 h64" stroke="#e4e9f1" stroke-width="7" stroke-linecap="round" transform="rotate(5 895 415)"/><text x="895" y="502" text-anchor="middle" font-size="13.5" font-weight="700" fill="#5b6b82">access card</text></g>
<g stroke="#ef4444" stroke-width="6" stroke-linecap="round"><path d="M690 196 L1106 300"/><path d="M1106 196 L690 300"/></g>
<rect x="210" y="540" width="780" height="40" rx="20" fill="#0a1b34"/><text x="600" y="566" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Tap to enter · tap to pay · tap for rides &amp; lockers — printed edge to edge in park colours</text>
</svg>`,
band_queue: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Theme park queues shrinking after RFID wristbands with live operator dashboard">
<defs><pattern id="pbq" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pbq)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Queues are a hardware problem</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Tickets get fumbled. Taps don't.</text>
<rect x="80" y="130" width="640" height="200" rx="20" fill="#fff" stroke="#e4e9f1" stroke-width="2"/>
<text x="130" y="172" font-size="17" font-weight="800" fill="#ef4444">BEFORE</text>
<rect x="600" y="170" width="18" height="130" rx="6" fill="#0a1b34"/><rect x="560" y="170" width="18" height="130" rx="6" fill="#0a1b34"/>
<g fill="#fbd38d"><circle cx="150" cy="240" r="15"/><circle cx="192" cy="252" r="15"/><circle cx="234" cy="240" r="15"/><circle cx="276" cy="252" r="15"/><circle cx="318" cy="240" r="15"/><circle cx="360" cy="252" r="15"/><circle cx="402" cy="240" r="15"/><circle cx="444" cy="252" r="15"/><circle cx="486" cy="240" r="15"/><circle cx="524" cy="252" r="15"/></g>
<text x="380" y="312" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">paper tickets, one fumble at a time</text>
<rect x="80" y="360" width="640" height="200" rx="20" fill="#fff" stroke="#16d6c1" stroke-width="2.5"/>
<text x="130" y="402" font-size="17" font-weight="800" fill="#15803d">AFTER</text>
<rect x="600" y="400" width="18" height="130" rx="6" fill="#0a1b34"/><rect x="560" y="400" width="18" height="130" rx="6" fill="#0a1b34"/>
<path d="M540 448 c14 -12 34 -12 48 0" fill="none" stroke="#16d6c1" stroke-width="5" stroke-linecap="round"/>
<g fill="#fbd38d"><circle cx="440" cy="470" r="15"/><circle cx="488" cy="478" r="15"/><circle cx="534" cy="470" r="15"/></g>
<text x="330" y="480" text-anchor="middle" font-size="15" font-weight="800" fill="#15803d">tap · walk through</text>
<rect x="770" y="130" width="350 " height="430" rx="20" fill="#0a1b34"/>
<text x="945" y="176" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">OPERATOR VIEW — LIVE</text>
<rect x="810" y="210" width="270" height="10" rx="5" fill="#16d6c1" opacity=".25"/><rect x="810" y="210" width="216" height="10" rx="5" fill="#16d6c1"/><text x="810" y="248" font-size="13.5" fill="#94a3b8">gate throughput</text>
<rect x="810" y="280" width="270" height="10" rx="5" fill="#0aa2e8" opacity=".25"/><rect x="810" y="280" width="176" height="10" rx="5" fill="#0aa2e8"/><text x="810" y="318" font-size="13.5" fill="#94a3b8">cashless spend</text>
<g><rect x="810" y="350" width="60" height="90" rx="6" fill="#16d6c1" opacity=".8"/><rect x="884" y="380" width="60" height="60" rx="6" fill="#16d6c1" opacity=".55"/><rect x="958" y="330" width="60" height="110" rx="6" fill="#16d6c1"/><path d="M810 458 h270" stroke="#334155" stroke-width="2"/></g>
<text x="945" y="500" text-anchor="middle" font-size="13.5" fill="#94a3b8">where guests are · how they spend</text>
<text x="945" y="534" text-anchor="middle" font-size="14.5" font-weight="700" fill="#16d6c1">shorter queues · less cash · live data</text>
</svg>`,
food_pallet: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Barcode scanning one box at a time versus an RFID portal reading a whole pallet automatically">
<defs><pattern id="pfp" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pfp)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Barcode counts boxes. RFID counts pallets.</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">One needs line of sight and patience. The other needs a doorway.</text>
<g><circle cx="200" cy="240" r="26" fill="#fbd38d"/><circle cx="191" cy="236" r="2.6" fill="#0a1b34"/><circle cx="209" cy="236" r="2.6" fill="#0a1b34"/><path d="M192 250 q8 5 16 0" fill="none" stroke="#0a1b34" stroke-width="2.5" stroke-linecap="round"/>
<rect x="178" y="266" width="44" height="64" rx="14" fill="#0b6fb8"/><line x1="222" y1="284" x2="266" y2="272" stroke="#0b6fb8" stroke-width="11" stroke-linecap="round"/>
<rect x="258" y="258" width="40" height="26" rx="6" fill="#5b6b82"/><path d="M298 271 l50 20" stroke="#ef4444" stroke-width="3.5" stroke-dasharray="7 6"/>
<rect x="344" y="272" width="86" height="66" rx="8" fill="#e8d9c3"/><path d="M354 288 h10 M370 288 h4 M382 288 h8 M396 288 h6 M354 300 v22 M366 300 v22 M380 300 v22 M394 300 v22 M408 300 v22" stroke="#0a1b34" stroke-width="3"/>
<text x="290" y="392" text-anchor="middle" font-size="14.5" font-weight="700" fill="#5b6b82">one at a time · line of sight only</text>
<rect x="140" y="430" width="300" height="34" rx="17" fill="#fee2e2"/><text x="290" y="452" text-anchor="middle" font-size="14" font-weight="800" fill="#ef4444">the whole truck? see you at midnight</text></g>
<circle cx="600" cy="320" r="40" fill="#0a1b34"/><text x="600" y="331" text-anchor="middle" font-size="24" font-weight="900" fill="#f59e0b">VS</text>
<g><rect x="720" y="150" width="26" height="360" rx="8" fill="#0b6fb8"/><rect x="1120" y="150" width="26" height="360" rx="8" fill="#0b6fb8"/><rect x="720" y="140" width="426" height="22" rx="8" fill="#0b6fb8"/>
<g stroke="#16d6c1" stroke-width="3.5" fill="none" opacity=".8"><path d="M760 250 c30 22 30 118 0 140"/><path d="M1106 250 c-30 22 -30 118 0 140"/></g>
<g><rect x="820" y="404" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="898" y="404" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="976" y="404" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="820" y="344" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="898" y="344" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="976" y="344" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="858" y="284" width="70" height="52" rx="6" fill="#e8d9c3"/><rect x="936" y="284" width="70" height="52" rx="6" fill="#e8d9c3"/>
<rect x="806" y="464" width="256" height="18" rx="4" fill="#c9b28e"/></g>
<g fill="#15803d"><circle cx="890" cy="404" r="11"/><circle cx="968" cy="404" r="11"/><circle cx="1046" cy="404" r="11"/><circle cx="890" cy="344" r="11"/><circle cx="968" cy="344" r="11"/><circle cx="1046" cy="344" r="11"/><circle cx="928" cy="284" r="11"/><circle cx="1006" cy="284" r="11"/></g>
<g stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M885 404 l4 4 7 -8"/><path d="M963 404 l4 4 7 -8"/><path d="M1041 404 l4 4 7 -8"/><path d="M885 344 l4 4 7 -8"/><path d="M963 344 l4 4 7 -8"/><path d="M1041 344 l4 4 7 -8"/><path d="M923 284 l4 4 7 -8"/><path d="M1001 284 l4 4 7 -8"/></g>
<text x="933" y="540" text-anchor="middle" font-size="14.5" font-weight="700" fill="#15803d">whole pallet, time-stamped, automatic</text></g>
<text x="600" y="588" text-anchor="middle" font-size="15" font-weight="700" fill="#5b6b82">A complete trace from farm or factory to shelf — the backbone of freshness and recalls.</text>
</svg>`,
food_recall: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Targeted food recall pulling only batch B-17 while other traced batches stay on shelf">
<defs><pattern id="pfr" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pfr)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Recall one batch, not the whole aisle</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">When every lot is traced, the crane knows exactly what to lift.</text>
<path d="M330 130 h14 v96 h-14 Z" fill="#5b6b82"/><path d="M200 130 h340 v14 h-340 Z" fill="#5b6b82"/><path d="M337 226 q0 22 22 22 h60" fill="none" stroke="#5b6b82" stroke-width="7" stroke-linecap="round"/>
<g transform="rotate(-4 470 300)"><rect x="400" y="252" width="140" height="96" rx="10" fill="#f59e0b"/><rect x="418" y="270" width="104" height="34" rx="8" fill="#0a1b34"/><text x="470" y="293" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">B-17</text><text x="470" y="330" text-anchor="middle" font-size="13" font-weight="700" fill="#7c2d12">the bad apple</text></g>
<g>
<rect x="130" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="200" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">B-14</text><circle cx="200" cy="478" r="12" fill="#15803d"/><path d="M194 478 l4 5 9 -10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
<rect x="290" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="360" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">B-15</text><circle cx="360" cy="478" r="12" fill="#15803d"/><path d="M354 478 l4 5 9 -10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
<rect x="450" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="520" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">B-16</text><circle cx="520" cy="478" r="12" fill="#15803d"/><path d="M514 478 l4 5 9 -10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
<rect x="610" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2" stroke-dasharray="8 6"/><text x="680" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#94a3b8">B-17</text><text x="680" y="482" text-anchor="middle" font-size="12.5" font-weight="700" fill="#f59e0b">lifted ↑</text>
<rect x="770" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="840" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">B-18</text><circle cx="840" cy="478" r="12" fill="#15803d"/><path d="M834 478 l4 5 9 -10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
<rect x="930" y="410" width="140" height="96" rx="10" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><text x="1000" y="450" text-anchor="middle" font-size="15" font-weight="800" fill="#0a1b34">B-19</text><circle cx="1000" cy="478" r="12" fill="#15803d"/><path d="M994 478 l4 5 9 -10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
</g>
<g><rect x="700" y="180 " width="400" height="150" rx="16" fill="#0a1b34"/><text x="900" y="222" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">Batch + expiry encoded on every label</text><text x="900" y="256" text-anchor="middle" font-size="14.5" fill="#16d6c1">first-expired-first-out rotation</text><text x="900" y="288" text-anchor="middle" font-size="14.5" fill="#16d6c1">cold, damp &amp; freezer-grade constructions</text><text x="900" y="316" text-anchor="middle" font-size="13.5" fill="#94a3b8">applied to packaging — never the food itself</text></g>
<text x="600" y="576" text-anchor="middle" font-size="15" font-weight="700" fill="#15803d">Consumers protected. Waste limited. Auditors satisfied.</text>
</svg>`,
walmart_domino: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Walmart apparel RFID success tipping into fresh food and the wider grocery industry like dominoes">
<defs><pattern id="pwd" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pwd)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">When the biggest shelf moves, shelves move</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Apparel tagging proved it. Fresh food makes it mainstream.</text>
<path d="M110 500 H1090" stroke="#e4e9f1" stroke-width="5" stroke-linecap="round"/>
<g transform="rotate(58 240 500)"><rect x="170" y="230" width="140" height="270" rx="14" fill="#0a1b34"/><text x="240" y="380" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" transform="rotate(-58 240 380)">APPAREL</text><circle cx="240" cy="290" r="14" fill="#16d6c1"/></g>
<g transform="rotate(24 520 500)"><rect x="455" y="260" width="130" height="240" rx="13" fill="#f59e0b"/><text x="520" y="390" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" transform="rotate(-24 520 390)">FRESH FOOD</text><circle cx="520" cy="316" r="12" fill="#fffdf6"/></g>
<g><rect x="700" y="290" width="110" height="210" rx="12" fill="#0b6fb8"/><text x="755" y="404" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">GROCERY</text></g>
<g><rect x="860" y="310" width="96" height="190" rx="11" fill="#0aa2e8"/><text x="908" y="412" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">RETAIL</text></g>
<g><rect x="996" y="330" width="84" height="170" rx="10" fill="#16d6c1"/><text x="1038" y="422" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0a1b34">EVERYONE</text></g>
<path d="M330 250 c60 -40 140 -40 190 -6" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12"/><path d="M506 232 l18 14 -24 6" fill="#ef4444"/>
<rect x="300" y="540" width="600" height="40" rx="20" fill="#0a1b34"/><text x="600" y="566" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Item-level tagging goes mainstream — and label demand goes vertical</text>
</svg>`,
walmart_hostile: `<svg viewBox="0 0 1200 620" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Fresh food environment challenges for RFID labels: cold, condensation, metal shelving and high water content produce">
<defs><pattern id="pwh" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#0b6fb8" opacity="0.07"/></pattern></defs>
<rect width="1200" height="620" rx="18" fill="#fffdf6"/><rect width="1200" height="620" rx="18" fill="url(#pwh)"/>
<text x="600" y="58" text-anchor="middle" font-size="30" font-weight="800" fill="#0a1b34">Fresh food: hostile terrain for a radio</text>
<text x="600" y="90" text-anchor="middle" font-size="16" fill="#5b6b82">Cold, damp, metal and watery produce all detune a standard antenna.</text>
<g><rect x="480" y="260" width="240" height="120" rx="14" fill="#fff" stroke="#0b6fb8" stroke-width="3"/><path d="M508 320 h44 m8 0 h24 m8 0 h44 m8 0 h24" stroke="#0aa2e8" stroke-width="4" stroke-linecap="round"/><circle cx="600" cy="320" r="17" fill="none" stroke="#0b6fb8" stroke-width="3"/><rect x="593" y="313" width="14" height="14" fill="#0b6fb8"/>
<text x="600" y="416" text-anchor="middle" font-size="15" font-weight="800" fill="#0b6fb8">tuned, food-safe label</text></g>
<g><rect x="120" y="150" width="190" height="110" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><g stroke="#0aa2e8" stroke-width="4" stroke-linecap="round"><path d="M215 176 v52"/><path d="M193 189 l44 26"/><path d="M237 189 l-44 26"/></g><text x="215" y="242" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">cold chain</text></g>
<g><rect x="120" y="330" width="190" height="110" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><g fill="#0aa2e8"><path d="M195 356 c-11 15 -11 24 0 32 c11 -8 11 -17 0 -32"/><path d="M230 368 c-9 13 -9 20 0 27 c9 -7 9 -14 0 -27"/></g><text x="215" y="422" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">condensation</text></g>
<g><rect x="890" y="150" width="190" height="110" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><rect x="920" y="180" width="130" height="14" rx="4" fill="#5b6b82"/><rect x="920" y="204" width="130" height="14" rx="4" fill="#94a3b8"/><text x="985" y="242" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">metal shelving</text></g>
<g><rect x="890" y="330" width="190" height="110" rx="16" fill="#fff" stroke="#e4e9f1" stroke-width="2"/><circle cx="944" cy="382" r="22" fill="#dcfce7" stroke="#15803d" stroke-width="3"/><path d="M930 375 q14 -12 28 0 M930 389 q14 -10 28 0" fill="none" stroke="#15803d" stroke-width="2.5"/><text x="1030" y="388" text-anchor="middle" font-size="13" font-weight="800" fill="#15803d">95% water</text><text x="985" y="422" text-anchor="middle" font-size="14" font-weight="700" fill="#5b6b82">wet produce</text></g>
<g stroke="#ef4444" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"><path d="M312 214 c70 30 110 62 160 90"/><path d="M312 380 c70 -14 110 -34 160 -48"/><path d="M888 214 c-70 30 -110 62 -160 90"/><path d="M888 380 c-70 -14 -110 -34 -160 -48"/></g>
<rect x="180" y="480" width="250" height="36" rx="18" fill="#0a1b34"/><text x="305" y="504" text-anchor="middle" font-size="14.5" font-weight="800" fill="#fff">chilled-tuned inlays</text>
<rect x="470" y="480" width="250" height="36" rx="18" fill="#0a1b34"/><text x="595" y="504" text-anchor="middle" font-size="14.5" font-weight="800" fill="#fff">food-safe adhesives</text>
<rect x="760" y="480" width="260" height="36" rx="18" fill="#0a1b34"/><text x="890" y="504" text-anchor="middle" font-size="14.5" font-weight="800" fill="#fff">GS1 EPC / SGTIN encoding</text>
<text x="600" y="574" text-anchor="middle" font-size="15" font-weight="700" fill="#5b6b82">At this scale, manufacturing capacity decides who can actually supply the rollout.</text>
</svg>`,
};

const NEWS = [
  {
    slug: 'news-blocking-card.html', oldUrl: 'https://www.rfidmfg.com/news/chengdu-mind-iot-technology-launches-high-performance-rfid-blocking-card-for-enhanced-data-privacy/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'The Card That Silences Skimmers — Our RFID-Blocking Card | RFID MFG', h1: 'The card that silences skimmers: our high-performance RFID-blocking card', meta: 'Company News · May 25, 2026', img: '', date: '2026-05-25',
    lead: 'Every contactless card is always ready to chat. RFID MFG’s new blocking card makes sure it only chats with readers you actually meant to tap.',
    body: [
      'Every contactless card in your wallet is, technically, always ready to talk — to payment terminals, to door readers, and unfortunately to anyone who walks past with a hidden reader. As tap-to-pay, smart ID and wireless access become everyday habits, that uninvited conversation is the risk. RFID MFG’s new blocking card is designed to end it.',
      'Slip one card into a wallet or cardholder and it disrupts unauthorized reads at 13.56 MHz, so the cards beside it cannot be silently scanned. No app, no pairing, no maintenance — just a printable, everyday card format that banks and brands can hand to customers as peace of mind with a logo on it.',
    ],
    art: [
      { after: 0, svg: ART.blocking_thief, cap: 'The hidden reader gets exactly one answer — and it isn’t from your bank card.' },
      { after: 1, svg: ART.blocking_vs, cap: 'Passive absorbs and detunes the field; active answers back with a disrupting signal. Same card slot, same branding, very different temperament.' },
    ],
    table: { cap: 'Passive vs active blocking cards', head: ['Type', 'How it works', 'Power'], rows: [['Passive shield', 'Detunes/absorbs the field', 'None needed'], ['Active jammer', 'Emits a disrupting signal', 'Built-in battery']] },
    points: ['Protects a whole wallet from contactless skimming', 'Passive shielding or active LED-jamming versions', 'Fully printable for bank and brand promotions', 'Lightweight, everyday card format'],
    faqs: [['How does an RFID-blocking card work?', 'It either absorbs and detunes the 13.56 MHz field (passive) or emits a disrupting signal (active), so nearby contactless cards cannot be read without your knowledge.'], ['Does one blocking card protect all my cards?', 'A single card placed in the same wallet or sleeve shields the contactless cards around it; very large wallets may benefit from one on each side.']],
  },
  {
    slug: 'news-rail.html', oldUrl: 'https://www.rfidmfg.com/news/the-invisible-network-powering-the-future-of-rail-with-rfid/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'Railways Run on Steel, Timetables — and Tiny Radio Chips | RFID MFG', h1: 'Railways run on steel, timetables — and tiny radio chips', meta: 'Industry News · May 12, 2026', img: '', date: '2026-05-12',
    lead: 'A rail network is thousands of near-identical assets with a safety case attached to each one. RFID is how the network remembers which is which — automatically, at speed.',
    body: [
      'A rail network is thousands of moving assets that all look alike, spread over thousands of kilometres, with a safety case attached to every one of them. Reliable identification is not a nice-to-have; it is the whole game. RFID tags on rolling stock, wagons and key components let trackside readers identify assets automatically as they pass — no stopping, no clipboards — building an accurate, real-time picture of the network.',
      'The same reads quietly feed predictive maintenance and spare-parts inventory: knowing exactly which component is where, and when it was last serviced, is what keeps networks safe and trains on time.',
      'The hardware has to withstand a punishing environment — vibration, grease, weather and wide temperature swings — so rail uses rugged on-metal and industrial tags, often UHF for trackside range or specialised high-temperature tags near braking systems. Each tag carries a permanent, factory-locked ID (the chip TID) that is difficult to forge, which supports both authentication and chain-of-custody for safety-critical parts. Tags are typically read by fixed trackside or depot readers and reconciled against the asset database automatically, removing manual inspection error.',
    ],
    art: [
      { after: 0, svg: ART.rail_gate, cap: 'Every wagon announces itself at line speed. The reader logs it, the database reconciles it, and nobody climbs down with a torch.' },
      { after: 2, svg: ART.rail_gauntlet, cap: 'Vibration, grease, weather and -40…+85 °C — in rail, the environment is the spec sheet. Factory-locked TIDs keep every identity honest.' },
    ],
    points: ['Automatic identification of rolling stock and components', 'Real-time asset location across a distributed network', 'Maintenance records tied to each physical asset', 'Supports safety, inventory and operational efficiency'],
    faqs: [['Why is RFID suited to rail asset tracking?', 'RFID reads automatically at speed and without line of sight, so trackside readers can identify passing rolling stock and components without stopping trains or manual scanning.'], ['What tags survive the rail environment?', 'Rugged on-metal and industrial tags rated for vibration, moisture and wide temperature ranges are used so they endure years of outdoor service.']],
  },
  {
    slug: 'news-nfc-stickers.html', oldUrl: 'https://www.rfidmfg.com/news/nfc-stickers-have-entered-every-aspect-of-our-lives/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'The 2-Cent Chip That Turned Everything Into a Website | RFID MFG', h1: 'The 2-cent chip that turned everything into a website', meta: 'Industry News · Feb 28, 2026', img: '', date: '2026-02-28',
    lead: 'NFC stickers are the most underestimated form of RFID: a chip under a printed label that connects any object to the internet with one tap — no app, no pairing, no typing.',
    body: [
      'NFC stickers are the most underestimated form of RFID. Nearly every smartphone ships with an NFC reader built in, which means a tiny chip under a printed label can link any object to digital content with a single tap — no app, no pairing, no squinting at a URL on a poster.',
      'Once you start noticing them, they are everywhere: product packaging that verifies itself and reorders, posters and menus that open with a tap, equipment that carries its own maintenance log, and business cards that introduce you before the handshake ends.',
      'Under the printed face, most stickers use an NTAG chip (213/215/216) sized to the data — a short URL, a vCard or a redirect that you can change later without reprinting. For anti-counterfeiting, a locked, unique chip on a tamper-evident face destroys itself if peeled, so a genuine tap can be trusted. Because the chip is invisible and cannot be photocopied like a QR code, brands increasingly pair a visible QR with a hidden NFC sticker: the QR for reach, the NFC for premium, verifiable interaction. We print and encode these to your artwork with locking and tamper options built in.',
    ],
    art: [
      { after: 1, svg: ART.nfc_constellation, cap: 'Poster, menu, package, business card — one tap each. The chip is the hyperlink; the object becomes the button.' },
      { after: 2, svg: ART.nfc_tamper, cap: 'A QR code photocopies in seconds; a locked NTAG chip does not photocopy at all. That asymmetry is the entire anti-counterfeit business case.' },
    ],
    points: ['Work with almost any modern smartphone', 'A tap opens a link, verifies a product or shares data', 'Thin and printable for packaging and posters', 'Low cost makes large rollouts affordable'],
    help: ['RFID MFG prints and encodes NFC labels and stickers with your artwork, with tamper-evident options and locked data for authentication use cases.'],
    faqs: [['What can an NFC sticker do when tapped?', 'It can open a website, show product or authentication info, share a contact, or trigger an action on the phone — all encoded into the chip as NDEF data.'], ['Can NFC stickers be tamper-evident?', 'Yes. Fragile face materials and special die-cuts destroy the sticker if removal is attempted, which suits anti-counterfeit and seal applications.']],
  },
  {
    slug: 'news-wristband.html', oldUrl: 'https://www.rfidmfg.com/news/rfid-theme-park-wristband/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'One Wristband, Zero Tickets: How Theme Parks Killed the Queue | RFID MFG', h1: 'One wristband, zero tickets: how theme parks killed the queue', meta: 'Industry News · Oct 18, 2025', img: '', date: '2025-10-18',
    lead: 'A park is a small city where everyone carries too much. One waterproof RFID band replaces tickets, cash and access cards — and hands operators live data as a bonus.',
    body: [
      'Theme parks adopted RFID wristbands before almost anyone else, for a simple reason: a park is a small city where every visitor is carrying too much. One waterproof band replaces tickets, cash and access cards — guests tap to enter, tap to pay for food and merchandise, tap into rides and lockers, and nobody excavates a wet pocket at the top of a water slide.',
      'Operators get the other half of the deal: shorter queues, less cash handling, and real-time insight into where guests are and how they spend — the numbers that improve both the experience and the bottom line.',
      'The band itself is engineered for the environment: a waterproof silicone or coated-fabric strap, an adjustable or one-time closure, and an HF/NFC chip (NTAG or MIFARE) that links to a prepaid balance for tap-to-pay, or a UHF chip where the park wants longer-range gate and ride reads. Bands can be printed edge to edge in the park’s colours and pre-encoded so they work the instant a guest puts one on. Reusable silicone bands can also be collected, sanitised and re-issued across seasons to cut cost and waste.',
    ],
    art: [
      { after: 0, svg: ART.band_replaces, cap: 'Entry, payment, rides and lockers move onto one strap — printed edge to edge in the park’s colours and working the instant it goes on.' },
      { after: 1, svg: ART.band_queue, cap: 'The before/after every operations manager wants: fewer fumbles at the gate, and a dashboard that finally tells the truth in real time.' },
    ],
    points: ['One band for entry, payment and ride access', 'Waterproof and comfortable for all-day wear', 'Shorter queues and less cash handling', 'Live guest-flow and spend analytics'],
    faqs: [['Are theme-park wristbands waterproof?', 'Yes. Silicone and coated fabric bands are fully waterproof, which is essential for water parks and all-weather outdoor use.'], ['How does cashless payment on a wristband work?', 'The band’s chip links to a prepaid balance or registered card, so a tap at any point of sale charges the guest’s account securely.']],
  },
  {
    slug: 'news-food.html', oldUrl: 'https://www.rfidmfg.com/news/why-is-it-said-that-the-food-industry-is-in-great-need-of-rfid/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'Why Your Lettuce Needs a Radio | RFID MFG', h1: 'Why your lettuce needs a radio', meta: 'Industry News · Oct 13, 2025', img: '', date: '2025-10-13',
    lead: 'Food safety is a memory problem — where has this product been? Barcodes remember one box at a time. RFID remembers whole pallets, automatically, with timestamps.',
    body: [
      'Food safety is fundamentally a memory problem: where did this product come from, and where has it been? Barcodes remember some of it — one item at a time, with a clear line of sight and a patient human attached. RFID remembers whole pallets automatically, building a complete, time-stamped trace from farm or factory to shelf.',
      'That memory earns its keep on the day something goes wrong: a precise trace lets a recall target only the affected batch — protecting consumers, sparing the stock that was never at risk, and keeping the waste bill small. On calmer days, the same data quietly manages freshness and shelf life.',
      'The labels themselves must be food-safe and survive cold, damp and packaging lines. UHF paper labels applied to cartons and crates give whole-pallet reads for warehousing and distribution, while washable or freezer-grade constructions suit chilled and frozen goods. Applied to outer packaging rather than the food itself, and encoded with batch and expiry data, RFID becomes the backbone of first-expired-first-out rotation and rapid, targeted recalls across grocery and catering.',
    ],
    art: [
      { after: 0, svg: ART.food_pallet, cap: 'One needs line of sight and patience. The other needs a doorway. Guess which one finishes the truck before midnight.' },
      { after: 1, svg: ART.food_recall, cap: 'With batch and expiry encoded on every label, a recall becomes a surgical lift — not a warehouse funeral.' },
    ],
    points: ['Whole-pallet reads build automatic traceability', 'Precise recalls limit waste and protect consumers', 'Better freshness and shelf-life management', 'Supports food-safety compliance and audits'],
    faqs: [['How does RFID improve food recalls?', 'Because each batch is traced automatically through the supply chain, a recall can target only the affected lots instead of pulling entire product lines, reducing waste and risk.'], ['Are RFID labels safe for food packaging?', 'Yes. Food-safe label constructions and adhesives are used, and tags are applied to packaging rather than the food itself.']],
  },
  {
    slug: 'news-walmart.html', oldUrl: 'https://www.rfidmfg.com/news/walmart-will-start-using-rfid-technology-for-fresh-food-products/', crumbCat: 'Blog', crumbCatHref: 'news.html',
    title: 'When Walmart Tags Lettuce, the Whole Industry Listens | RFID MFG', h1: 'When Walmart tags lettuce, the whole industry listens', meta: 'Industry News · Oct 10, 2025', img: '', date: '2025-10-10',
    lead: 'A giant retailer extending RFID from apparel into fresh food is the clearest signal yet that item-level tagging has gone mainstream — and it resets the math for every supplier.',
    body: [
      'When one of the world’s largest retailers extends RFID from apparel into fresh food, nobody in the supply chain gets to shrug. Item-level tagging improves on-shelf availability, speeds up stock counts and tightens freshness management — and a rollout at that scale resets expectations for every grocer watching from the next aisle.',
      'It also resets the supplier math: adoption like this drives demand for reliable, food-safe RFID labels and inlays in serious volume — the point where a manufacturer’s capacity and quality control stop being brochure words and start being the product.',
      'Fresh food is harder to tag than apparel: labels meet cold, moisture and condensation, and often sit near metal shelving or high-water-content products that detune a standard antenna. That pushes retailers toward inlays tuned for chilled and damp conditions, food-safe adhesives, and consistent encoding to a GS1 EPC/SGTIN scheme so every store reads the same data. It is exactly the kind of high-volume, quality-critical program a multi-line factory with direct chip supply is built to serve — which is why upstream manufacturing capacity, not just the tag design, decides who can support a rollout at this scale.',
    ],
    art: [
      { after: 0, svg: ART.walmart_domino, cap: 'Apparel proved the economics; fresh food makes it mainstream. Dominoes rarely fall back up.' },
      { after: 2, svg: ART.walmart_hostile, cap: 'Cold, condensation, metal shelving and 95%-water produce — fresh food detunes a standard antenna, which is why tuned inlays and GS1 encoding decide who can supply the rollout.' },
    ],
    points: ['Signals mainstream, item-level RFID in grocery', 'Improves on-shelf availability and freshness', 'Raises demand for food-safe labels at scale', 'Manufacturing quality and capacity become key'],
    help: ['With in-house reel-to-reel converting and first-hand chip supply, RFID MFG is positioned to deliver food-grade UHF labels and inlays in the volumes that large retail programs require.'],
    faqs: [['Why is fresh-food RFID significant?', 'Fresh food is high-volume and time-sensitive, so applying RFID there shows the technology is now cost-effective and reliable enough for everyday, item-level grocery use.'], ['Can you supply RFID labels at retail volumes?', 'Yes. Our multi-line facility and direct chip sourcing support large, consistent runs of UHF labels and inlays for retail programs.']],
  },
];

// ---- generate ----
let n = 0;
for (const it of CASES) { fs.writeFileSync(path.join(OUT, it.slug), shell(it)); n++; }
for (const it of NEWS) { fs.writeFileSync(path.join(OUT, it.slug), shell(it)); n++; }

// ---------- rewire Read more links to local pages ----------
function rewire(file, items) {
  let html = fs.readFileSync(path.join(OUT, file), 'utf8');
  for (const it of items) {
    html = html.split(`href="${it.oldUrl}" target="_blank" rel="noopener"`).join(`href="${it.slug}"`);
  }
  fs.writeFileSync(path.join(OUT, file), html);
}
rewire('cases.html', CASES);
rewire('news.html', NEWS);

DATES.save('articles');
console.log(`Generated ${n} article pages (12 cases + 6 news) with TL;DR, tables, FAQ schema, dates & author; rewired Read-more links.`);
