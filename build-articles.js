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
const BUILD_DATE = '2026-06-14';
const BUILD_DATE_DISPLAY = 'June 14, 2026';
const AUTHOR = 'RFID MFG Editorial Team';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = `      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="products.html">Products</a>
      <a href="guides.html">Guides</a>
      <a href="cases.html">Cases</a>
      <a href="sustainability.html">Sustainability</a>
      <a href="news.html">News</a>
      <a href="contact.html">Contact</a>`;
const TOPBAR = `<div class="topbar"><div class="container topbar__inner"><span class="topbar__item">Established 1996 · Shenzhen, China</span><div class="topbar__contact"><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a></div></div></div>`;
const HEADER = `<header class="header" id="header"><div class="container header__inner"><a href="index.html" class="brand" aria-label="RFID MFG home"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><nav class="nav" id="nav">
${NAV}
    </nav><a href="contact.html" class="btn btn--primary header__cta">Get a Quote</a><button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>`;
const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing since 1996.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="cases.html">Cases</a><a href="sustainability.html">Sustainability</a><a href="news.html">News</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;

// ---- content renderers ----
const P = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('\n      ');
const POINTS = (arr) => `<ul class="check-list">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
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
  const lead = it.lead ? `<div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px;margin-bottom:22px"><strong>In short:</strong> ${esc(it.lead)}</div>` : '';
  const byline = `<p style="font-size:13px;color:var(--muted,#6b7a90);margin:-4px 0 18px">By ${esc(AUTHOR)} · Updated ${esc(BUILD_DATE_DISPLAY)}</p>`;
  const intro = P(it.body);
  const table = TABLE(it.table);
  const takeaways = it.points && it.points.length ? `<h2>Key takeaways</h2>\n      ${POINTS(it.points)}` : '';
  const help = it.help ? `<h2>How RFID MFG helps</h2>\n      ${P(it.help)}` : '';
  const faq = FAQ_HTML(it.faqs);
  return [byline, lead, intro, table, takeaways, help, faq].filter(Boolean).join('\n      ');
}

function shell(it) {
  const type = it.crumbCat === 'News' ? 'NewsArticle' : 'Article';
  const articleLd = {
    '@context': 'https://schema.org', '@type': type,
    headline: it.h1,
    description: it.lead || it.body[0],
    image: it.img ? SITE + '/' + IMGBASE + it.img : SITE + '/og-image.jpg',
    datePublished: it.date, dateModified: BUILD_DATE,
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
<meta property="article:modified_time" content="${BUILD_DATE}" />
<meta name="twitter:card" content="summary_large_image" />
${ld}
${FONTS}
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />
<link rel="stylesheet" href="styles.css" />
<!-- Google Analytics 4 — replace G-XXXXXXXXXX with your Measurement ID, then remove this comment wrapper to activate
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
-->
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
    ],
    table: { cap: 'Choosing an event wristband material', head: ['Material', 'Best for', 'Reuse'], rows: [['Tyvek paper', 'Single-day events', 'Disposable'], ['Fabric / woven', 'Multi-day festivals', 'Reusable'], ['Silicone', 'Water parks, VIP', 'Reusable']] },
    points: ['One wristband for entry, cashless pay and access', 'Live attendance and spend data for organisers', 'Tyvek, fabric or silicone to fit the event', 'Full OEM: chip, shape, material and artwork'],
    faqs: [['Are RFID wristbands reusable?', 'It depends on the material: Tyvek paper bands are single-use, while fabric and silicone bands are durable and reusable across multiple days or events.'], ['Can wristbands handle cashless payment?', 'Yes. The chip can hold a balance or link to an account, so guests tap to pay at bars and stalls, cutting queues and cash handling.']],
  },
];

// ---------- NEWS (6) ----------
const NEWS = [
  {
    slug: 'news-blocking-card.html', oldUrl: 'https://www.rfidmfg.com/news/chengdu-mind-iot-technology-launches-high-performance-rfid-blocking-card-for-enhanced-data-privacy/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'RFID MFG Launches High-Performance RFID-Blocking Card | RFID MFG', h1: 'RFID MFG launches a high-performance RFID-blocking card for data privacy', meta: 'Company News · May 25, 2026', img: '', date: '2026-05-25',
    lead: 'RFID MFG’s new blocking card sits in a wallet and disrupts unauthorized 13.56 MHz scans, shielding the cards around it from skimming.',
    body: [
      'As contactless payment, smart ID and wireless access become everyday technology, so does the risk of unauthorized scanning. A criminal with a hidden reader can, in theory, attempt to read a contactless card through a bag or pocket. RFID MFG’s new blocking card is designed to neutralise that threat.',
      'Slipped into a wallet or cardholder, the card disrupts unauthorized reads at 13.56 MHz so the cards beside it cannot be silently scanned. It is a simple, brandable way for banks and businesses to give customers peace of mind.',
    ],
    table: { cap: 'Passive vs active blocking cards', head: ['Type', 'How it works', 'Power'], rows: [['Passive shield', 'Detunes/absorbs the field', 'None needed'], ['Active jammer', 'Emits a disrupting signal', 'Built-in battery']] },
    points: ['Protects a whole wallet from contactless skimming', 'Passive shielding or active LED-jamming versions', 'Fully printable for bank and brand promotions', 'Lightweight, everyday card format'],
    faqs: [['How does an RFID-blocking card work?', 'It either absorbs and detunes the 13.56 MHz field (passive) or emits a disrupting signal (active), so nearby contactless cards cannot be read without your knowledge.'], ['Does one blocking card protect all my cards?', 'A single card placed in the same wallet or sleeve shields the contactless cards around it; very large wallets may benefit from one on each side.']],
  },
  {
    slug: 'news-rail.html', oldUrl: 'https://www.rfidmfg.com/news/the-invisible-network-powering-the-future-of-rail-with-rfid/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'Powering the Future of Rail with RFID | RFID MFG', h1: 'The invisible network: powering the future of rail with RFID', meta: 'Industry News · May 12, 2026', img: '', date: '2026-05-12',
    lead: 'RFID quietly improves rail safety, asset tracking and efficiency — identifying rolling stock and components automatically, without manual scanning.',
    body: [
      'Rail networks are vast, distributed and safety-critical, which makes reliable identification essential. RFID tags on rolling stock, wagons and key components let trackside readers identify assets automatically as they pass, building an accurate, real-time picture of the network.',
      'Beyond identification, the same data underpins predictive maintenance and spare-parts inventory: knowing exactly which component is where, and when it was last serviced, keeps networks safe and running on time.',
    ],
    points: ['Automatic identification of rolling stock and components', 'Real-time asset location across a distributed network', 'Maintenance records tied to each physical asset', 'Supports safety, inventory and operational efficiency'],
    faqs: [['Why is RFID suited to rail asset tracking?', 'RFID reads automatically at speed and without line of sight, so trackside readers can identify passing rolling stock and components without stopping trains or manual scanning.'], ['What tags survive the rail environment?', 'Rugged on-metal and industrial tags rated for vibration, moisture and wide temperature ranges are used so they endure years of outdoor service.']],
  },
  {
    slug: 'news-nfc-stickers.html', oldUrl: 'https://www.rfidmfg.com/news/nfc-stickers-have-entered-every-aspect-of-our-lives/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'NFC Stickers Have Entered Every Aspect of Our Lives | RFID MFG', h1: 'NFC stickers have entered every aspect of our lives', meta: 'Industry News · Feb 28, 2026', img: '', date: '2026-02-28',
    lead: 'Slim, printable and inexpensive, NFC stickers turn ordinary objects into interactive touchpoints — for tap-to-share, smart packaging and authentication.',
    body: [
      'NFC stickers are one of the most versatile forms of RFID. Because nearly every smartphone can read NFC, a tiny chip under a printed label lets any object link to digital content with a single tap — no app, no pairing.',
      'You meet them everywhere now: on product packaging for authentication and reorders, on posters and menus for tap-to-open links, on equipment for maintenance logs, and on business cards for instant contact sharing.',
    ],
    points: ['Work with almost any modern smartphone', 'A tap opens a link, verifies a product or shares data', 'Thin and printable for packaging and posters', 'Low cost makes large rollouts affordable'],
    help: ['RFID MFG prints and encodes NFC labels and stickers with your artwork, with tamper-evident options and locked data for authentication use cases.'],
    faqs: [['What can an NFC sticker do when tapped?', 'It can open a website, show product or authentication info, share a contact, or trigger an action on the phone — all encoded into the chip as NDEF data.'], ['Can NFC stickers be tamper-evident?', 'Yes. Fragile face materials and special die-cuts destroy the sticker if removal is attempted, which suits anti-counterfeit and seal applications.']],
  },
  {
    slug: 'news-wristband.html', oldUrl: 'https://www.rfidmfg.com/news/rfid-theme-park-wristband/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'RFID Theme-Park Wristbands | RFID MFG', h1: 'RFID theme-park wristbands', meta: 'Industry News · Oct 18, 2025', img: '', date: '2025-10-18',
    lead: 'A single RFID wristband handles park entry, cashless payment and ride access — cutting queues for guests and giving operators live data.',
    body: [
      'Theme parks were among the first to embrace RFID wristbands, and it is easy to see why. One waterproof band replaces tickets, cash and access cards: guests tap to enter, tap to pay for food and merchandise, and tap to access rides or lockers.',
      'For operators, that means shorter queues, less cash handling, and real-time insight into where guests are and how they spend — all of which improves both the experience and the bottom line.',
    ],
    points: ['One band for entry, payment and ride access', 'Waterproof and comfortable for all-day wear', 'Shorter queues and less cash handling', 'Live guest-flow and spend analytics'],
    faqs: [['Are theme-park wristbands waterproof?', 'Yes. Silicone and coated fabric bands are fully waterproof, which is essential for water parks and all-weather outdoor use.'], ['How does cashless payment on a wristband work?', 'The band’s chip links to a prepaid balance or registered card, so a tap at any point of sale charges the guest’s account securely.']],
  },
  {
    slug: 'news-food.html', oldUrl: 'https://www.rfidmfg.com/news/why-is-it-said-that-the-food-industry-is-in-great-need-of-rfid/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'Why the Food Industry Needs RFID | RFID MFG', h1: 'Why the food industry needs RFID', meta: 'Industry News · Oct 13, 2025', img: '', date: '2025-10-13',
    lead: 'RFID gives the food industry end-to-end traceability — fast, accurate tracking from production to shelf that supports freshness, recalls and compliance.',
    body: [
      'Food safety depends on knowing where a product came from and where it has been. Barcodes capture some of this, but only one item at a time and only with a clear line of sight. RFID records whole pallets automatically, building a complete, time-stamped trace from farm or factory to shelf.',
      'That visibility matters most when something goes wrong: a precise trace lets a recall target only the affected batch, protecting consumers and limiting waste — while everyday data helps manage freshness and shelf life.',
    ],
    points: ['Whole-pallet reads build automatic traceability', 'Precise recalls limit waste and protect consumers', 'Better freshness and shelf-life management', 'Supports food-safety compliance and audits'],
    faqs: [['How does RFID improve food recalls?', 'Because each batch is traced automatically through the supply chain, a recall can target only the affected lots instead of pulling entire product lines, reducing waste and risk.'], ['Are RFID labels safe for food packaging?', 'Yes. Food-safe label constructions and adhesives are used, and tags are applied to packaging rather than the food itself.']],
  },
  {
    slug: 'news-walmart.html', oldUrl: 'https://www.rfidmfg.com/news/walmart-will-start-using-rfid-technology-for-fresh-food-products/', crumbCat: 'News', crumbCatHref: 'news.html',
    title: 'Walmart to Use RFID for Fresh-Food Products | RFID MFG', h1: 'Walmart to use RFID for fresh-food products', meta: 'Industry News · Oct 10, 2025', img: '', date: '2025-10-10',
    lead: 'A major retailer expanding RFID into fresh food is a strong signal that item-level tagging is going mainstream across grocery and retail.',
    body: [
      'When one of the world’s largest retailers extends RFID from apparel into fresh food, the whole industry takes note. Item-level tagging improves on-shelf availability, speeds up stock counts and tightens freshness management — benefits that apply far beyond a single chain.',
      'Wider adoption like this drives demand for reliable, food-safe RFID labels and inlays at scale, an area where a manufacturer’s capacity and quality control become decisive.',
    ],
    points: ['Signals mainstream, item-level RFID in grocery', 'Improves on-shelf availability and freshness', 'Raises demand for food-safe labels at scale', 'Manufacturing quality and capacity become key'],
    help: ['With six production lines and first-hand chip supply, RFID MFG is positioned to deliver food-grade UHF labels and inlays in the volumes that large retail programs require.'],
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

console.log(`Generated ${n} article pages (12 cases + 6 news) with TL;DR, tables, FAQ schema, dates & author; rewired Read-more links.`);
