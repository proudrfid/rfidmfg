/*
 * build-content.js — 生成 SEO/GEO 内容资产:对比/选型页、支柱指南、术语表、内容中心页。
 * 这些是"信息型/对比型/定义型"内容,既吃自然搜索长尾,也最容易被 AI 整段引用。
 * 运行: node build-content.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const SITE = 'https://www.rfidmfg.com';
const UPDATED = 'June 15, 2026';
const UPDATED_ISO = '2026-06-15';
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
const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing since 1996.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="cases.html">Cases</a><a href="guides.html">Guides</a><a href="sustainability.html">Sustainability</a><a href="news.html">News</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;
const ICONS = `<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />`;
const GA4 = `<!-- Google Analytics 4 — replace G-XXXXXXXXXX with your Measurement ID, then remove this comment wrapper to activate
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
-->`;

// ---- renderers ----
const P = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('\n      ');
const POINTS = (arr) => `<ul class="check-list">${arr.map((t) => `<li>${t}</li>`).join('')}</ul>`;
function TABLE(t) {
  const th = t.head.map((h) => `<th style="text-align:left;padding:10px 12px;border-bottom:2px solid var(--brand-deep,#0a1b34);font-weight:700">${esc(h)}</th>`).join('');
  const rows = t.rows.map((r) => `<tr>${r.map((c, i) => `<td style="padding:10px 12px;border-bottom:1px solid #e5e9f0${i === 0 ? ';font-weight:600' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('');
  return `${t.cap ? `<h2>${esc(t.cap)}</h2>` : ''}
      <div style="overflow-x:auto;margin:14px 0 6px"><table style="width:100%;border-collapse:collapse;font-size:15px">
        <thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
const SECTIONS = (arr) => arr.map((s) => `<h2>${esc(s.h)}</h2>\n      ${P(s.p)}`).join('\n      ');
function FAQ_HTML(faqs) {
  const items = faqs.map((f) => `<details class="faq-item"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
  return `<h2>Frequently asked questions</h2>\n      <div class="faq" style="margin-top:8px">${items}</div>`;
}
function RELATED(links) {
  if (!links || !links.length) return '';
  return `<h2>Related reading</h2>\n      <ul class="check-list">${links.map((l) => `<li><a href="${l[0]}">${esc(l[1])}</a></li>`).join('')}</ul>`;
}

function shell({ slug, title, desc, h1, lead, crumb, bodyHtml, faqs, howto }) {
  const ld = [];
  ld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, image: SITE + '/og-image.jpg', datePublished: UPDATED_ISO, dateModified: UPDATED_ISO, author: { '@type': 'Organization', name: 'RFID MFG', url: SITE + '/about.html' }, publisher: { '@type': 'Organization', name: 'RFID MFG', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } }, mainEntityOfPage: SITE + '/' + slug });
  ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Guides', item: SITE + '/guides.html' }, { '@type': 'ListItem', position: 3, name: crumb, item: SITE + '/' + slug }] });
  if (faqs && faqs.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) });
  if (howto) ld.push({ '@context': 'https://schema.org', '@type': 'HowTo', name: howto.name, step: howto.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s[0], text: s[1] })) });
  const ldHtml = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x)}\n</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta property="article:modified_time" content="${UPDATED_ISO}" />
<meta name="twitter:card" content="summary_large_image" />
${ldHtml}
${FONTS}
${ICONS}
<link rel="stylesheet" href="styles.css" />
${GA4}
</head>
<body>
${TOPBAR}
${HEADER}
<main>
<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner" style="padding:54px 24px 48px">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="guides.html">Guides</a><span>/</span>${esc(crumb)}</nav>
    <h1 style="max-width:20em;margin-left:auto;margin-right:auto">${esc(h1)}</h1>
  </div>
</section>
<section class="section">
  <div class="container article">
    <div class="article-body">
      <p style="font-size:13px;color:var(--muted,#6b7a90);margin:0 0 18px">By ${esc(AUTHOR)} · Updated ${esc(UPDATED)}</p>
      <div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px;margin-bottom:22px"><strong>In short:</strong> ${esc(lead)}</div>
      ${bodyHtml}
      ${faqs && faqs.length ? FAQ_HTML(faqs) : ''}
    </div>
    <div class="article-back"><a href="guides.html" class="link-arrow"><span>←</span> All guides</a></div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Need help choosing the right RFID product?</h2><p>Tell us your application — we'll recommend the chip, frequency and format and quote within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Get Expert Advice</a>
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

// ================= COMPARISON / SELECTION PAGES =================
const COMPARISONS = [
  {
    slug: 'rfid-frequencies-lf-hf-uhf.html', crumb: 'LF vs HF vs UHF',
    title: 'RFID Frequencies: LF vs HF vs UHF — Which to Choose | RFID MFG',
    desc: 'LF, HF and UHF RFID compared: read range, speed, cost and best uses. A practical guide to choosing the right RFID frequency for your application.',
    h1: 'RFID frequencies explained: LF vs HF vs UHF',
    lead: 'LF (125 kHz) suits short-range access and animal ID; HF/NFC (13.56 MHz) suits tap cards, tickets and libraries; UHF (860–960 MHz) suits long-range, bulk reads in retail and logistics.',
    body: [
      { h: 'The three RFID frequency bands', p: ['RFID systems operate in three main frequency bands, and the band determines almost everything about performance: read range, read speed, how well the tag works near metal or liquid, and cost. Choosing the wrong band is the most common — and most expensive — RFID mistake.', 'Below is a side-by-side comparison, followed by how to pick the right one for your use case.'] },
    ],
    tables: [{ cap: 'LF vs HF vs UHF at a glance', head: ['Property', 'LF (125 kHz)', 'HF / NFC (13.56 MHz)', 'UHF (860–960 MHz)'], rows: [['Read range', '~10 cm', 'Up to ~10 cm (tap)', 'Up to ~10 m'], ['Read speed', 'Slow', 'Medium', 'Fast (100s/sec)'], ['Bulk reading', 'No', 'Limited', 'Excellent'], ['Works near metal/liquid', 'Best', 'Good', 'Needs anti-metal design'], ['Phone-readable (NFC)', 'No', 'Yes', 'No'], ['Typical cost/tag', 'Higher', 'Low–medium', 'Lowest at volume'], ['Standards', 'ISO 11784/85, 14223', 'ISO 14443/15693', 'ISO 18000-6C / EPC Gen2']] }],
    body2: [
      { h: 'Low Frequency (LF, 125–134 kHz)', p: ['LF tags read at very short range and slowly, but their long wavelength penetrates water and works well around the body and metal. That makes LF the standard for animal identification (ISO 11784/85), access-control fobs and some industrial uses where reliability beats range.'] },
      { h: 'High Frequency (HF / NFC, 13.56 MHz)', p: ['HF is the "tap" band. It powers smart cards, transit tickets, library books, event wristbands and — as NFC — every modern smartphone. Read range is short (a few centimetres) which is a feature for security and one-card-at-a-time use. NFC is a subset of HF designed for phone interaction.'] },
      { h: 'Ultra-High Frequency (UHF, 860–960 MHz)', p: ['UHF delivers metres of range and can read hundreds of tags per second, which is why it dominates retail inventory, warehouse and supply-chain tagging. The trade-off: UHF is more sensitive to metal and liquid, so on-metal items need anti-metal tag designs.'] },
    ],
    howto: { name: 'How to choose an RFID frequency', steps: [['Define the read distance', 'Tap or a few cm → HF/NFC. Up to a few metres or bulk reads → UHF. Very short range near metal/animals → LF.'], ['Check the environment', 'Metal or liquid nearby favours LF or anti-metal UHF designs.'], ['Decide if a phone must read it', 'If users tap with a smartphone, you need HF/NFC.'], ['Weigh cost at volume', 'For millions of item-level tags, UHF inlays are usually cheapest.']] },
    faqs: [
      ['Which RFID frequency has the longest range?', 'UHF (860–960 MHz) has the longest range — up to about 10 metres passively — versus a few centimetres for HF/NFC and LF.'],
      ['Is NFC the same as HF RFID?', 'NFC is a subset of HF RFID at 13.56 MHz, standardised for short-range, two-way communication with smartphones. All NFC is HF, but not all HF is NFC.'],
      ['What frequency works best on metal?', 'LF works naturally near metal; for UHF you use specially designed anti-metal (on-metal) tags with a ferrite or spacer layer.'],
    ],
    related: [['rfid-vs-nfc.html', 'RFID vs NFC: what is the difference?'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire chips'], ['products.html#tags', 'Browse RFID tags by frequency']],
  },
  {
    slug: 'rfid-vs-nfc.html', crumb: 'RFID vs NFC',
    title: 'RFID vs NFC: What Is the Difference? | RFID MFG',
    desc: 'RFID vs NFC explained simply: NFC is a short-range subset of HF RFID for smartphones. Compare range, use cases and when to choose each.',
    h1: 'RFID vs NFC: what is the difference?',
    lead: 'NFC is a short-range (≈4 cm) subset of 13.56 MHz HF RFID built for two-way phone interaction. "RFID" more broadly also covers LF and long-range UHF used for tracking and inventory.',
    body: [{ h: 'They are related, not rival, technologies', p: ['One of the most common questions in the industry is whether to use "RFID" or "NFC". The short answer: NFC is a type of RFID. Both use radio waves and passive tags powered by the reader. The difference is range, interaction model and ecosystem.', 'NFC operates only at 13.56 MHz, works at a few centimetres, supports two-way communication, and is built into virtually every smartphone — making it ideal for tap-to-share, authentication and marketing without an app. "RFID" as a category also includes LF and UHF, and is typically a one-way identification system optimised for range and bulk reading.'] }],
    tables: [{ cap: 'RFID vs NFC', head: ['Aspect', 'NFC', 'RFID (general)'], rows: [['Frequency', '13.56 MHz only', 'LF, HF or UHF'], ['Range', '≈ up to 4 cm', 'Up to ~10 m (UHF)'], ['Communication', 'Two-way', 'Mostly one-way'], ['Phone support', 'Built into smartphones', 'Needs a dedicated reader'], ['Reads many tags at once', 'No', 'Yes (UHF)'], ['Best for', 'Tap marketing, auth, access', 'Inventory, logistics, tracking']] }],
    body2: [{ h: 'When to choose NFC', p: ['Choose NFC when end users will tap with a phone: product authentication, tap-to-reorder packaging, smart posters, digital business cards and tap-to-pay. No app or pairing is needed because NFC is native to the phone.'] }, { h: 'When to choose broader RFID', p: ['Choose UHF RFID when you need to read many items quickly from a distance — retail stock counts, warehouse gates, asset tracking. Choose LF for animal ID or access near metal. These need a dedicated reader rather than a phone.'] }],
    faqs: [['Can a smartphone read RFID?', 'Smartphones can read NFC (HF 13.56 MHz) tags natively. They cannot read LF or UHF RFID without an external reader accessory.'], ['Is NFC less secure than RFID?', 'Security depends on the chip, not the category. Both NFC and RFID offer secure chips (e.g. DESFire) with encryption; short NFC range also limits eavesdropping.'], ['Which is cheaper, NFC or UHF RFID?', 'For high-volume item-level tagging, UHF inlays are usually the cheapest per tag; NFC labels cost a little more but enable phone interaction.']],
    related: [['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF frequencies'], ['nfc-printed-label.html', 'NFC printed labels'], ['rfid-nfc-card.html', 'RFID / NFC cards']],
  },
  {
    slug: 'rfid-vs-barcode.html', crumb: 'RFID vs Barcode',
    title: 'RFID vs Barcode: Pros, Cons and When to Switch | RFID MFG',
    desc: 'RFID vs barcode compared: line of sight, read speed, range, durability and cost. Learn when RFID is worth it and when barcodes still win.',
    h1: 'RFID vs barcode: which should you use?',
    lead: 'Barcodes are cheap but need line of sight and one-at-a-time scanning. RFID reads many tags at once, without line of sight, and stores re-writable data — at a higher per-tag cost.',
    body: [{ h: 'The core difference', p: ['Barcodes are printed patterns read optically, one at a time, in direct line of sight. RFID tags are read by radio, in bulk, through packaging and without aiming. For many operations RFID turns a multi-hour stock count into minutes — but barcodes remain unbeatable on raw cost for simple, low-volume needs.'] }],
    tables: [{ cap: 'RFID vs barcode', head: ['Factor', 'Barcode', 'RFID'], rows: [['Line of sight', 'Required', 'Not required'], ['Items per scan', 'One', 'Hundreds at once'], ['Range', 'A few cm', 'Up to ~10 m (UHF)'], ['Re-writable data', 'No', 'Yes'], ['Durability', 'Low (print wears)', 'High (sealed tag)'], ['Unit cost', 'Near zero', 'Cents and up'], ['Reads through packaging', 'No', 'Yes']] }],
    body2: [{ h: 'When RFID is worth it', p: ['RFID pays off when labour, speed or accuracy matter: warehouse and retail inventory, asset tracking, returnable assets, work-in-progress, and anywhere manual scanning is a bottleneck. The tag cost is offset by faster counts, fewer errors and less shrinkage.'] }, { h: 'When barcodes still win', p: ['For low-volume, single-item checkout, disposable packaging or tight per-unit budgets, barcodes are still the rational choice. Many operations run both — barcodes at the consumer level, RFID for cases and pallets.'] }],
    faqs: [['Is RFID replacing barcodes?', 'Not entirely. RFID is replacing barcodes where bulk, no-line-of-sight reading adds value (inventory, logistics), but barcodes remain common for low-cost, single-item use.'], ['How much more does an RFID tag cost than a barcode?', 'A printed barcode is essentially free; a UHF RFID inlay costs from a few cents upward depending on volume and type, which is justified by labour and accuracy savings.'], ['Can RFID and barcodes be combined?', 'Yes. Many RFID labels are also printed with a barcode and human-readable text so they work with both systems.']],
    related: [['rfid-frequencies-lf-hf-uhf.html', 'RFID frequencies guide'], ['case-warehouse.html', 'Case: warehouse management with RFID'], ['products.html#labels', 'RFID labels & inlays']],
  },
  {
    slug: 'rfid-chips-mifare-ntag-desfire.html', crumb: 'MIFARE vs NTAG vs DESFire',
    title: 'MIFARE vs NTAG vs DESFire: RFID Chip Comparison | RFID MFG',
    desc: 'Compare the most common 13.56 MHz RFID chips — MIFARE Classic, NTAG, MIFARE DESFire — by memory, security and use case to pick the right one.',
    h1: 'MIFARE vs NTAG vs DESFire: choosing an HF chip',
    lead: 'NTAG is the go-to for NFC phone tap and marketing; MIFARE Classic suits access and closed-loop transit; DESFire is the secure, encrypted choice for payment, transit and high-security ID.',
    body: [{ h: 'Why the chip matters', p: ['At 13.56 MHz the antenna and card body can be identical — the chip decides memory, speed, security and price. Picking the right chip prevents costly re-issues later, especially for access control and payment where security is non-negotiable.'] }],
    tables: [{ cap: 'Common HF/NFC chips compared', head: ['Chip', 'Memory', 'Security', 'Best for'], rows: [['NTAG213/215/216', '144–888 bytes', 'Basic, password', 'NFC tap, marketing, auth'], ['MIFARE Classic 1K/4K', '1–4 KB', 'CRYPTO1 (legacy)', 'Access, loyalty, closed transit'], ['MIFARE Ultralight', '48–192 bytes', 'Basic', 'Disposable tickets'], ['MIFARE DESFire EV2/EV3', '2–8 KB', 'AES, strong', 'Payment, transit, secure ID'], ['ICODE SLIX', '~1 KB', 'Basic', 'Library, long-range HF']] }],
    body2: [{ h: 'NTAG (NFC)', p: ['NTAG chips are tuned for NFC phone interaction. They store a URL or vCard, can be locked, and are inexpensive — ideal for tap-to-engage marketing, product authentication and digital business cards.'] }, { h: 'MIFARE Classic', p: ['A long-standing workhorse for access control and closed-loop loyalty/transit. Its CRYPTO1 cipher is now considered legacy, so for new high-security projects DESFire is preferred.'] }, { h: 'MIFARE DESFire', p: ['DESFire EV2/EV3 adds AES encryption and a flexible file system, making it the modern choice for payment, public transit and government ID where security and multi-application support matter.'] }],
    faqs: [['Which RFID chip is most secure?', 'Among common HF chips, MIFARE DESFire EV2/EV3 is the most secure, using AES encryption and mutual authentication — suited to payment, transit and ID.'], ['Which chip should I use for NFC marketing?', 'NTAG213/215/216 are the standard for NFC marketing and authentication: phone-readable, lockable and low cost. NTAG215 is popular for its 504-byte capacity.'], ['Can you encode chips with our keys?', 'Yes — RFID MFG encodes MIFARE, DESFire and NTAG chips with your sectors, keys and data under NDA before delivery.']],
    related: [['rfid-frequencies-lf-hf-uhf.html', 'RFID frequencies guide'], ['rfid-nfc-card.html', 'RFID / NFC cards'], ['contact-ic-chip-card.html', 'Contact IC chip cards']],
  },
  {
    slug: 'rfid-dry-vs-wet-inlay.html', crumb: 'Dry vs Wet Inlay',
    title: 'RFID Dry Inlay vs Wet Inlay: Differences & Uses | RFID MFG',
    desc: 'Dry inlay vs wet inlay explained: adhesive, conversion, cost and applications. Learn which RFID inlay type fits your label or product workflow.',
    h1: 'RFID dry inlay vs wet inlay',
    lead: 'A dry inlay is the chip-and-antenna with no adhesive — for laminating or embedding. A wet inlay adds adhesive so you can peel and stick it straight onto products.',
    body: [{ h: 'What an inlay is', p: ['An RFID inlay is the working core of a smart label: an antenna with the chip attached, on a thin substrate. Whether it is "dry" or "wet" simply describes whether adhesive has been applied — and that decides how you convert it into a finished product.'] }],
    tables: [{ cap: 'Dry vs wet inlay', head: ['Property', 'Dry inlay', 'Wet inlay'], rows: [['Adhesive', 'None', 'Pressure-sensitive adhesive'], ['Use', 'Laminate / embed into product', 'Peel and stick directly'], ['Typical buyer', 'Label converters, card makers', 'End users, packers'], ['Cost', 'Lower (no adhesive)', 'Slightly higher'], ['Format', 'Reel', 'Reel, ready to apply']] }],
    body2: [{ h: 'Choose a dry inlay when', p: ['You manufacture your own labels, cards or tickets and will laminate the inlay between layers, or embed it into a product. Dry inlays give converters maximum flexibility and the lowest cost.'] }, { h: 'Choose a wet inlay when', p: ['You want to apply tags directly to products, cartons or documents with no extra converting step. Wet inlays peel off the liner and stick down immediately, ideal for retail and logistics tagging.'] }],
    faqs: [['What is the difference between a dry and wet RFID inlay?', 'A dry inlay has no adhesive and is meant for laminating or embedding; a wet inlay has a pressure-sensitive adhesive so it can be peeled and stuck directly onto an item.'], ['Which inlay do label printers use?', 'RFID label printers typically use white-faced wet inlays (printable RFID labels) so the label can be printed and encoded, then applied in one step.'], ['Can inlays be pre-encoded?', 'Yes, both dry and wet inlays can be supplied blank or pre-encoded to your numbering scheme.']],
    related: [['rfid-dry-inlay.html', 'RFID dry inlay product'], ['rfid-wet-inlay.html', 'RFID wet inlay product'], ['rfid-labels-inlays-guide.html', 'RFID labels & inlays guide']],
  },
  {
    slug: 'rfid-card-materials.html', crumb: 'Card Materials',
    title: 'RFID Card Materials: PVC vs PET vs Eco vs Metal | RFID MFG',
    desc: 'Compare RFID card materials — PVC, PET/PETG, PC, eco/BIO, wood and metal — by durability, print, sustainability and cost to choose the right card.',
    h1: 'RFID card materials compared',
    lead: 'PVC is the economical default; PET/PETG and PC add durability and security; eco/BIO and wood cut plastic; metal signals premium. The right pick balances durability, look, sustainability and cost.',
    body: [{ h: 'Why card material matters', p: ['The chip and antenna can be identical across cards — the body material decides durability, print quality, feel, sustainability and price. Matching the material to how the card is used (daily access vs. a premium VIP card vs. a green-branded membership) avoids early wear and reissue costs.'] }],
    tables: [{ cap: 'RFID card materials', head: ['Material', 'Durability', 'Best for', 'Note'], rows: [['PVC', 'Good', 'Everyday ID, membership, gift', 'Most economical, easy to print'], ['PET / PETG', 'High', 'Durable ID, eco-leaning', 'Stronger, more recyclable'], ['PC (polycarbonate)', 'Very high', 'High-security ID', 'Laser-engravable'], ['Eco / BIO paper', 'Medium', 'Green programs, events', 'Biodegradable, lower plastic'], ['Wood / bamboo', 'Medium', 'Premium, eco branding', 'FSC-certified, warm feel'], ['Metal', 'Very high', 'VIP, black cards', 'Premium weight, optional NFC']] }],
    body2: [{ h: 'Balancing cost, durability and image', p: ['For mass-issued cards where cost rules, PVC is the standard. Where cards must survive years of daily use or carry high-security ID, PET/PETG or PC are worth the premium. For brands that lead with sustainability, eco/BIO paper and FSC wood communicate values; for luxury tiers, metal makes a statement.'] }],
    howto: { name: 'How to choose an RFID card material', steps: [['Match durability to lifespan', 'Daily, multi-year use → PET/PETG or PC; short-term or low-cost → PVC or BIO paper.'], ['Decide on brand image', 'Premium → metal or wood; green positioning → eco/BIO.'], ['Confirm print & security needs', 'High-security ID with laser engraving → PC.'], ['Check sustainability goals', 'To cut plastic, choose BIO paper, recycled PVC or FSC wood.']] },
    faqs: [['What is the most durable RFID card material?', 'Polycarbonate (PC) and metal are the most durable. PC is laser-engravable for secure ID; metal is premium and very long-lasting.'], ['Are there eco-friendly RFID cards?', 'Yes — biodegradable BIO paper, recycled PVC, FSC-certified wood and PLA cards offer lower-plastic alternatives with comparable performance.'], ['Can metal cards still have RFID/NFC?', 'Yes, via a hybrid construction that embeds the antenna and chip so the metal card still works contactlessly.']],
    related: [['eco-friendly-card.html', 'Eco-friendly cards'], ['metal-card.html', 'Metal cards'], ['rfid-cards-guide.html', 'Complete RFID cards guide']],
  },
];

function comparisonPage(c) {
  const body = [
    SECTIONS(c.body),
    ...c.tables.map(TABLE),
    SECTIONS(c.body2 || []),
    c.howto ? `<h2>${esc(c.howto.name)}</h2>\n      <ol class="num-list">${c.howto.steps.map((s) => `<li><strong>${esc(s[0])}.</strong> ${esc(s[1])}</li>`).join('')}</ol>` : '',
    RELATED(c.related),
  ].filter(Boolean).join('\n      ');
  return shell({ slug: c.slug, title: c.title, desc: c.desc, h1: c.h1, lead: c.lead, crumb: c.crumb, bodyHtml: body, faqs: c.faqs, howto: c.howto });
}

// ================= PILLAR GUIDES =================
const GUIDES = [
  {
    slug: 'rfid-cards-guide.html', crumb: 'RFID Cards Guide',
    title: 'RFID Cards: The Complete Guide (Types, Chips, Uses) | RFID MFG',
    desc: 'A complete guide to RFID and smart cards: frequencies, chips, materials, printing and applications — everything you need to specify the right card.',
    h1: 'RFID cards: the complete guide',
    lead: 'RFID cards combine a chip and antenna inside a card body to enable contactless access, payment, ID and loyalty. This guide covers frequencies, chips, materials, printing and how to specify the right card.',
    sections: [
      { h: 'What is an RFID card?', p: ['An RFID card carries a microchip and a thin antenna laminated inside the card. When it enters a reader’s field, the reader powers the chip and exchanges data — no battery, no contact. The same principle drives access badges, transit cards, hotel keys, membership and payment cards.'] },
      { h: 'Frequencies: LF, HF/NFC and UHF', p: ['Cards come in LF (125 kHz) for simple access, HF/NFC (13.56 MHz) for tap cards, transit and phone interaction, and UHF (860–960 MHz) for longer-range reads. HF/NFC is by far the most common card frequency. See our frequency guide for a full comparison.'] },
      { h: 'Chips: matching security to use', p: ['The chip sets memory and security. NTAG suits NFC marketing; MIFARE Classic suits access and closed-loop loyalty; MIFARE DESFire (AES) suits payment, transit and secure ID. Choosing the right chip up front avoids costly re-issues.'] },
      { h: 'Materials and finishes', p: ['PVC is the economical standard; PET/PETG and PC add durability and security; eco/BIO and wood reduce plastic; metal signals premium. Finishes include matte/gloss, frosted, transparent, signature panels, magnetic stripes, embossing and foil.'] },
      { h: 'Printing and personalization', p: ['Cards can be offset or silkscreen printed in full colour, then personalized with sequential numbers, barcodes/QR, photos, and chip encoding. RFID MFG prints and encodes in-house so cards arrive ready to issue.'] },
      { h: 'Common applications', p: ['Access control, public transit, hotel keycards, membership and loyalty, payment, campus and event credentials, and NFC marketing. The card body and print stay flexible while the chip and frequency are matched to the system.'] },
    ],
    table: { cap: 'Quick card selector', head: ['Need', 'Recommended'], rows: [['Phone tap / marketing', 'HF/NFC card with NTAG'], ['Access control', 'HF card with MIFARE / DESFire'], ['Payment / transit / secure ID', 'DESFire (AES)'], ['Premium / VIP', 'Metal or wood card'], ['Green branding', 'Eco / BIO or FSC wood card']] },
    faqs: [['How do I specify an RFID card?', 'Define four things: frequency (LF/HF/UHF), chip (e.g. NTAG, MIFARE, DESFire), material (PVC, PET, PC, eco, metal) and personalization (print, numbering, encoding). Share these and we will confirm the build.'], ['Can one card hold multiple applications?', 'Yes. Chips like MIFARE DESFire support multiple applications (e.g. access plus cashless) on one card with separate, secured files.'], ['What is the minimum order for custom cards?', 'MOQ is flexible and depends on configuration — share your target quantity and we will advise.']],
    related: [['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire'], ['rfid-card-materials.html', 'RFID card materials'], ['products.html#cards', 'Browse all cards']],
  },
  {
    slug: 'nfc-guide.html', crumb: 'NFC Guide',
    title: 'NFC Cards, Tags & Labels: A Practical Guide | RFID MFG',
    desc: 'A practical NFC guide: how NFC works, NTAG chips, cards vs tags vs labels, encoding, and real applications from marketing to authentication.',
    h1: 'NFC cards, tags & labels: a practical guide',
    lead: 'NFC is short-range 13.56 MHz technology built into every modern phone. A tap can open a link, verify a product or share data — no app needed — which makes NFC ideal for marketing, authentication and access.',
    sections: [
      { h: 'How NFC works', p: ['NFC (Near Field Communication) is a subset of HF RFID standardised for two-way phone interaction at a few centimetres. The phone powers the passive NFC tag and reads its stored data (NDEF), typically a URL or contact — opening it directly in the browser with no app or pairing.'] },
      { h: 'NTAG chips', p: ['Most NFC products use NTAG213/215/216, differing mainly in memory (144–888 bytes). NTAG215 (504 bytes) is popular for vCards and richer data. Chips can be locked so the content cannot be overwritten — important for authentication.'] },
      { h: 'Cards vs tags vs labels', p: ['NFC comes in many forms: printed cards (membership, business cards), durable tags and keyfobs (access, asset), and thin printed labels/stickers (packaging, posters). The form factor changes; the NFC principle stays the same.'] },
      { h: 'Encoding and security', p: ['Tags are encoded with your URL, vCard or command and can be password-protected or permanently locked. For anti-counterfeiting, tamper-evident materials and unique, locked IDs make copying impractical.'] },
      { h: 'Applications', p: ['Tap-to-share business cards, smart packaging and product authentication, tap-to-reorder, smart posters and menus, access control, and interactive marketing. NFC bridges a physical product and a digital experience in one tap.'] },
    ],
    table: { cap: 'NFC form factors', head: ['Form', 'Best for'], rows: [['NFC card', 'Membership, digital business cards'], ['NFC label / sticker', 'Packaging, posters, authentication'], ['NFC tag / keyfob', 'Access, asset tracking'], ['NFC wristband', 'Events, cashless, access']] },
    faqs: [['Do NFC tags need an app?', 'No. NTAG tags store an NDEF record (e.g. a URL), so a tap opens it directly in the phone’s browser without any app.'], ['Can NFC be used for anti-counterfeiting?', 'Yes. A locked, unique NFC chip plus tamper-evident material lets customers verify authenticity with a tap and makes cloning impractical.'], ['Which NFC chip should I choose?', 'NTAG213 for short URLs, NTAG215 for vCards/richer data, NTAG216 for the most memory. We can advise based on your content.']],
    related: [['rfid-vs-nfc.html', 'RFID vs NFC'], ['nfc-printed-label.html', 'NFC printed labels'], ['rfid-nfc-card.html', 'RFID / NFC cards'], ['news-nfc-stickers.html', 'NFC stickers in everyday life']],
  },
  {
    slug: 'rfid-labels-inlays-guide.html', crumb: 'Labels & Inlays Guide',
    title: 'RFID Labels & Inlays: The Complete Guide | RFID MFG',
    desc: 'Understand RFID labels and inlays: dry vs wet inlays, white labels, UHF vs HF, encoding and converting — choose the right smart label for tagging at scale.',
    h1: 'RFID labels & inlays: the complete guide',
    lead: 'RFID labels put a chip and antenna into a thin, applic­able format for tagging items at scale. The choices are frequency (HF or UHF), inlay type (dry or wet) and face (blank or printable).',
    sections: [
      { h: 'Inlays are the core', p: ['An inlay is the antenna-plus-chip on a thin substrate. A dry inlay has no adhesive (for laminating or embedding); a wet inlay adds adhesive to peel and stick. White (printable) labels add a coated face so you can print and encode in one pass.'] },
      { h: 'HF vs UHF labels', p: ['HF labels (13.56 MHz) suit item-level, short-range uses like libraries and pharmacy. UHF labels (860–960 MHz) suit retail and logistics where long range and bulk reads matter. The choice follows the read environment, not the label shape.'] },
      { h: 'Printable RFID labels', p: ['White-faced labels work with RFID-capable thermal printers (e.g. Zebra), letting you print barcode and text and encode the chip on demand — the standard for retail and warehouse roll-out.'] },
      { h: 'Converting and application', p: ['Converters laminate dry inlays into tickets, cards and tags. End users apply wet inlays directly to cartons and products. Supply is reel-to-reel with custom pitch for automated application.'] },
    ],
    table: { cap: 'Which label type?', head: ['Need', 'Choose'], rows: [['Apply directly to items', 'Wet inlay / sticker'], ['Laminate or embed', 'Dry inlay'], ['Print + encode on demand', 'White printable label'], ['Retail / logistics range', 'UHF label'], ['Library / item-level', 'HF label']] },
    faqs: [['What is the difference between an inlay and a label?', 'An inlay is the bare antenna-and-chip; a label is a finished inlay with a printable face and often adhesive, ready to apply.'], ['Can I print RFID labels in-house?', 'Yes, with an RFID-capable thermal printer and white printable RFID labels you can print and encode on demand.'], ['What read range do UHF labels achieve?', 'Typically 1–8 m depending on chip, antenna size, reader and what the label is applied to.']],
    related: [['rfid-dry-vs-wet-inlay.html', 'Dry vs wet inlay'], ['rfid-dry-inlay.html', 'Dry inlay'], ['rfid-wet-inlay.html', 'Wet inlay'], ['rfid-white-label.html', 'White printable label']],
  },
  {
    slug: 'rfid-blocking-guide.html', crumb: 'RFID Blocking Guide',
    title: 'RFID Blocking: How It Works & What You Need | RFID MFG',
    desc: 'How RFID blocking protects contactless cards from skimming: passive vs active blocking, cards, sleeves and wallets, and what actually works.',
    h1: 'RFID blocking: how it works and what you need',
    lead: 'RFID-blocking products stop unauthorized 13.56 MHz reads of contactless cards. Passive shields detune the field; active cards emit a jamming signal. A single card, sleeve or wallet lining protects what is around it.',
    sections: [
      { h: 'The risk it addresses', p: ['As contactless payment, smart ID and access cards become universal, so does the theoretical risk of "skimming" — an unauthorized reader trying to read a card through a bag or pocket. RFID blocking neutralises that by interfering with reads at 13.56 MHz.'] },
      { h: 'Passive vs active blocking', p: ['Passive shielding uses conductive material to absorb and detune the reader field, needing no power. Active cards contain a tiny circuit that emits a disrupting signal when it senses a read attempt. Both stop nearby contactless cards from being read silently.'] },
      { h: 'Cards, sleeves and wallets', p: ['A blocking card sits in a wallet and protects the cards around it. Sleeves wrap individual cards or passports. Wallets and card holders build the shielding into the lining for everyday protection. All can be branded — popular as bank and corporate giveaways.'] },
    ],
    table: { cap: 'Blocking options', head: ['Product', 'How it protects', 'Best for'], rows: [['Blocking card', 'Shields the whole wallet', 'Banks, promotions'], ['Sleeve', 'Wraps one card/passport', 'Travel, giveaways'], ['Wallet / holder', 'Shielded lining', 'Everyday carry']] },
    faqs: [['Does RFID blocking really work?', 'Yes — a properly made passive shield or active jamming card prevents nearby contactless cards from being read at 13.56 MHz. Independent of brand, the physics of shielding the field is sound.'], ['Do I need to block every card?', 'One blocking card or a shielded sleeve/wallet protects the contactless cards stored with it; very large wallets may benefit from a shield on each side.'], ['Can blocking cards be branded?', 'Yes, they are fully printable and widely used as bank and corporate promotional gifts.']],
    related: [['rfid-blocking-card.html', 'RFID blocking card'], ['rfid-blocking-sleeves.html', 'Blocking sleeves'], ['rfid-blocking-wallet.html', 'Blocking wallet'], ['news-blocking-card.html', 'News: new blocking card']],
  },
  {
    slug: 'rfid-readers-hardware-guide.html', crumb: 'Readers & Hardware Guide',
    title: 'RFID Readers & Hardware: A Buyer’s Guide | RFID MFG',
    desc: 'Choose RFID hardware with confidence: reader types (desktop, fixed, handheld), frequencies, interfaces, antennas and SDKs for your deployment.',
    h1: 'RFID readers & hardware: a buyer’s guide',
    lead: 'RFID readers come as desktop encoders, fixed readers with antennas, and handhelds — across LF, HF and UHF. The right choice depends on frequency, range, interface and whether you need an SDK to integrate.',
    sections: [
      { h: 'Reader types', p: ['Desktop/USB readers encode and personalize cards at a workstation. Fixed readers with external antennas cover doorways, conveyors and shelves for hands-free reads. Handheld (often Android) readers suit mobile inventory and field work.'] },
      { h: 'Frequency and range', p: ['Match the reader to the tag: LF and HF readers for short-range cards and tickets; UHF readers for metres of range and bulk reads. Antenna count and placement largely determine real-world coverage.'] },
      { h: 'Interfaces and integration', p: ['Readers connect over USB, RS232/RS485, Wi-Fi, Ethernet/PoE or Bluetooth. For software integration, look for a documented SDK and demo apps so the reader feeds your WMS/ERP or access system cleanly.'] },
      { h: 'Modules and terminals', p: ['Beyond standalone readers, embeddable modules, barcode scan engines and IoT DTU/RTU terminals let you build RFID into kiosks, gates, vending and remote monitoring.'] },
    ],
    table: { cap: 'Reader selector', head: ['Task', 'Reader type'], rows: [['Encode / personalize cards', 'Desktop USB reader'], ['Doorway / conveyor reads', 'Fixed UHF reader + antennas'], ['Mobile inventory', 'Handheld UHF reader'], ['Embed into a device', 'OEM module / scan engine']] },
    faqs: [['Do your readers come with an SDK?', 'Yes — readers ship with an SDK and demo software so you can integrate with your own application and back-end systems.'], ['Which reader do I need to encode cards?', 'A desktop USB HF/UHF reader/writer is used to encode and personalize cards at a workstation.'], ['Can one reader handle LF, HF and UHF?', 'Most readers target one band. For multiple frequencies you typically use separate readers or a multi-frequency model where available.']],
    related: [['rfid-reader-writer.html', 'RFID readers / writers'], ['barcode-scan-module.html', 'Barcode scan modules'], ['industrial-iot-dtu-rtu.html', 'IoT DTU / RTU'], ['products.html#hardware', 'Browse hardware']],
  },
];

function guidePage(g) {
  const body = [
    SECTIONS(g.sections),
    g.table ? TABLE(g.table) : '',
    RELATED(g.related),
  ].filter(Boolean).join('\n      ');
  return shell({ slug: g.slug, title: g.title, desc: g.desc, h1: g.h1, lead: g.lead, crumb: g.crumb, bodyHtml: body, faqs: g.faqs });
}

// ================= GLOSSARY =================
const TERMS = [
  ['RFID', 'Radio-Frequency Identification — using radio waves to identify tagged objects without contact or line of sight.'],
  ['NFC', 'Near Field Communication — a short-range (≈4 cm) subset of 13.56 MHz HF RFID built for two-way smartphone interaction.'],
  ['LF', 'Low Frequency RFID (125–134 kHz) — short range, good near metal and water; used for animal ID and access.'],
  ['HF', 'High Frequency RFID (13.56 MHz) — the "tap" band for cards, tickets, libraries and NFC.'],
  ['UHF', 'Ultra-High Frequency RFID (860–960 MHz) — long range and bulk reading for retail and logistics.'],
  ['Inlay', 'The antenna and chip on a thin substrate that forms the working core of a smart label or card.'],
  ['Dry inlay', 'An inlay with no adhesive, intended for laminating or embedding into a product.'],
  ['Wet inlay', 'An inlay with pressure-sensitive adhesive, ready to peel and stick onto an item.'],
  ['Antenna', 'The conductive coil or trace that couples with the reader field to power the chip and exchange data.'],
  ['Chip / IC', 'The integrated circuit that stores the ID and data and handles communication and security.'],
  ['NDEF', 'NFC Data Exchange Format — the standard record format (e.g. a URL or vCard) stored on NFC tags.'],
  ['NTAG', 'A family of NXP NFC chips (213/215/216) widely used for phone tap, marketing and authentication.'],
  ['MIFARE', 'A family of NXP 13.56 MHz chips (Classic, Ultralight, DESFire) for access, transit and payment.'],
  ['DESFire', 'A secure MIFARE chip with AES encryption used for payment, transit and high-security ID.'],
  ['EPC Gen2', 'The dominant UHF RFID air-interface standard (ISO 18000-6C) used in retail and supply chain.'],
  ['Read range', 'The distance at which a reader can reliably communicate with a tag — from cm (LF/HF) to metres (UHF).'],
  ['Anti-collision', 'A protocol that lets a reader identify many tags in its field without their signals clashing.'],
  ['Anti-metal tag', 'A tag designed with a ferrite or spacer layer so it reads reliably when mounted on metal.'],
  ['On-metal', 'Describes tags or designs that function when attached to metal surfaces.'],
  ['Encoding', 'Writing data (an ID, URL or keys) onto a chip, often with personalization, before delivery.'],
  ['Personalization', 'Adding unique data to each card/tag — numbering, barcode, photo or chip encoding.'],
  ['CR80', 'The standard credit-card size (85.6 × 54 mm) used for most ID and smart cards.'],
  ['PVC', 'Polyvinyl chloride — the economical, easy-to-print standard material for cards.'],
  ['PETG', 'A durable, more recyclable card material, stronger than PVC.'],
  ['Polycarbonate (PC)', 'A very durable, laser-engravable card material used for high-security ID.'],
  ['BIO card', 'A biodegradable or bio-based card material that reduces plastic waste.'],
  ['FSC', 'Forest Stewardship Council certification — traceable, responsibly sourced wood and paper.'],
  ['Tamper-evident', 'A material or design that visibly destroys or marks itself if removal is attempted.'],
  ['Passive tag', 'A tag with no battery, powered entirely by the reader’s field (most RFID tags).'],
  ['Active tag', 'A battery-powered tag with long range, used for real-time location and high-value assets.'],
  ['Reader / interrogator', 'The device that powers tags and reads/writes their data over an antenna.'],
  ['SDK', 'Software Development Kit — code and tools to integrate a reader with your application.'],
  ['OEM / ODM', 'Original Equipment / Design Manufacturing — building products to a customer’s brand or design.'],
  ['MOQ', 'Minimum Order Quantity — the smallest batch a manufacturer will produce for an order.'],
  ['ISO 14443', 'The standard for proximity (tap) HF smart cards such as MIFARE.'],
  ['ISO 15693', 'The standard for vicinity HF cards/labels (longer HF range), used in libraries.'],
  ['ISO 11784/85', 'The standards for LF animal identification (FDX-B).'],
];
function glossaryPage() {
  const slug = 'rfid-glossary.html';
  const items = TERMS.map(([t, d]) => `<div style="padding:14px 0;border-bottom:1px solid #e5e9f0"><dt id="${t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}" style="font-family:var(--display);font-weight:700;font-size:17px;color:var(--ink)">${esc(t)}</dt><dd style="margin:6px 0 0;color:var(--muted)">${esc(d)}</dd></div>`).join('\n      ');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'RFID & NFC Glossary', url: SITE + '/' + slug, hasDefinedTerm: TERMS.map(([t, d]) => ({ '@type': 'DefinedTerm', name: t, description: d })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Guides', item: SITE + '/guides.html' }, { '@type': 'ListItem', position: 3, name: 'Glossary', item: SITE + '/' + slug }] },
  ];
  const ldHtml = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x)}\n</script>`).join('\n');
  const desc = 'An A–Z glossary of RFID and NFC terms — frequencies, chips, inlays, standards and card materials explained in plain language by RFID MFG.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RFID & NFC Glossary: Key Terms Explained | RFID MFG</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="RFID & NFC Glossary | RFID MFG" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
${ldHtml}
${FONTS}
${ICONS}
<link rel="stylesheet" href="styles.css" />
${GA4}
</head>
<body>
${TOPBAR}
${HEADER}
<main>
<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner" style="padding:54px 24px 48px">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="guides.html">Guides</a><span>/</span>Glossary</nav>
    <h1>RFID &amp; NFC glossary</h1>
    <p>Key RFID and NFC terms — explained in plain language.</p>
  </div>
</section>
<section class="section">
  <div class="container article">
    <div class="article-body">
      <p style="margin-bottom:18px">A quick reference to the terms that come up when specifying RFID and NFC products. For deeper dives, see our <a href="guides.html">guides</a> and <a href="rfid-frequencies-lf-hf-uhf.html">frequency comparison</a>.</p>
      <dl style="margin:0">
      ${items}
      </dl>
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Still not sure which RFID product you need?</h2><p>Our engineers will recommend the right chip, frequency and format for your project.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Ask an Expert</a>
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

// ================= HUB PAGE =================
function hubPage() {
  const slug = 'guides.html';
  const card = (href, title, desc) => `<a class="cat-item" href="${href}" style="text-decoration:none"><div class="cat-item__body" style="padding:18px"><h3 style="margin:0 0 6px">${esc(title)}</h3><p style="margin:0;color:var(--muted)">${esc(desc)}</p></div></a>`;
  const guides = GUIDES.map((g) => card(g.slug, g.crumb.replace(' Guide', '') + ' guide', g.lead)).join('\n      ');
  const comps = card('/tools/rfid-selector/', '★ RFID Selector tool', 'Answer 5 quick questions and get an instant frequency, chip and product recommendation.') + '\n      ' + COMPARISONS.map((c) => card(c.slug, c.crumb, c.lead)).join('\n      ');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'RFID & NFC Guides and Resources', url: SITE + '/' + slug, description: 'Guides, comparisons and a glossary to help you choose the right RFID and NFC products.' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Guides', item: SITE + '/' + slug }] },
  ];
  const ldHtml = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x)}\n</script>`).join('\n');
  const desc = 'RFID and NFC guides, comparisons and a glossary from RFID MFG — choose the right frequency, chip, material and format for your project.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RFID &amp; NFC Guides, Comparisons & Glossary | RFID MFG</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="RFID & NFC Guides, Comparisons & Glossary | RFID MFG" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
${ldHtml}
${FONTS}
${ICONS}
<link rel="stylesheet" href="styles.css" />
${GA4}
</head>
<body>
${TOPBAR}
${HEADER}
<main>
<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span>Guides</nav>
    <h1>RFID &amp; NFC guides and resources</h1>
    <p>Independent, practical guidance to help you choose the right RFID and NFC products — from frequencies and chips to materials and hardware.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section__head"><span class="eyebrow">Pillar guides</span><h2 class="section__title">Complete guides</h2></div>
    <div class="catalog-grid">
      ${guides}
    </div>
  </div>
</section>
<section class="section section--alt">
  <div class="container">
    <div class="section__head"><span class="eyebrow">Compare & choose</span><h2 class="section__title">Comparisons & selection</h2></div>
    <div class="catalog-grid">
      ${comps}
      ${card('rfid-glossary.html', 'RFID & NFC glossary', 'A–Z of RFID and NFC terms explained in plain language.')}
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Prefer to just ask an expert?</h2><p>Tell us your application and we’ll recommend the right RFID solution — quote within 24 hours.</p></div>
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

// ---- generate ----
let n = 0;
for (const c of COMPARISONS) { fs.writeFileSync(path.join(OUT, c.slug), comparisonPage(c)); n++; }
for (const g of GUIDES) { fs.writeFileSync(path.join(OUT, g.slug), guidePage(g)); n++; }
fs.writeFileSync(path.join(OUT, 'rfid-glossary.html'), glossaryPage()); n++;
fs.writeFileSync(path.join(OUT, 'guides.html'), hubPage()); n++;
console.log(`Generated ${n} content pages (${COMPARISONS.length} comparisons + ${GUIDES.length} guides + glossary + hub).`);
