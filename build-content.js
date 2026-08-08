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
const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing since 1996.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="industries.html">Industries</a><a href="cases.html">Cases</a><a href="guides.html">Guides</a><a href="sustainability.html">Sustainability</a><a href="news.html">News</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;
const ICONS = `<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />`;
const GA4 = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFYMHHLN3Q"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZFYMHHLN3Q');</script>`;

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

// 指南/对比页配图(对标竞品的富媒体):slug -> [文件, alt(描述性,利好图片SEO), 说明]
const CONTENT_IMG = {
  'rfid-frequencies-lf-hf-uhf.html': ['images/hf-usb-rfid-card-reader.webp', 'RFID reader/writer used across LF, HF and UHF frequency bands', 'LF, HF and UHF each trade off read range, speed and cost.'],
  'rfid-vs-nfc.html': ['images/nfc-metal-card.webp', 'NFC metal card — NFC is a short-range subset of 13.56 MHz HF RFID', 'NFC is a branch of HF RFID at 13.56 MHz, built for secure tap range.'],
  'rfid-vs-barcode.html': ['images/barcode-scan-module.webp', 'Barcode scan module compared with contactless RFID reading', 'RFID reads many tags at once without line of sight; barcodes need a direct scan.'],
  'rfid-chips-mifare-ntag-desfire.html': ['images/contact-ic-chip-card.webp', 'Smart-card chip module from the MIFARE, NTAG and DESFire families', 'MIFARE, NTAG and DESFire trade off memory, speed and security.'],
  'rfid-dry-vs-wet-inlay.html': ['images/rfid-dry-inlay.webp', 'RFID dry inlay (antenna and chip on film, without adhesive)', 'Dry inlays ship without adhesive; wet inlays add an adhesive backing.'],
  'rfid-card-materials.html': ['images/metal-rfid-card.webp', 'Metal RFID card among PVC, PET and eco material options', 'Card material drives durability, feel, printing and cost.'],
  'rfid-cards-guide.html': ['images/transparent-pvc-card.webp', 'Custom PVC RFID card with embedded chip and full-color print', 'RFID cards span PVC, PET, eco, metal and wood constructions.'],
  'nfc-guide.html': ['images/nfc-metal-card.webp', 'NFC metal business card built on an NTAG chip', 'NFC cards, tags and labels use NTAG chips at 13.56 MHz.'],
  'rfid-labels-inlays-guide.html': ['images/nfc-printed-label.webp', 'Printed NFC/RFID smart label with inlay inside', 'RFID labels pair an inlay with a printable face for tagging at scale.'],
  'rfid-blocking-guide.html': ['images/rfid-blocking-card.webp', 'RFID blocking card that shields a wallet from skimming', 'Blocking cards, sleeves and wallets stop unauthorized 13.56 MHz reads.'],
  'rfid-readers-hardware-guide.html': ['images/hf-usb-rfid-card-reader.webp', 'HF USB RFID card reader/writer for encoding and access', 'Readers range from desktop USB encoders to fixed and handheld UHF units.'],
  'nfc-vs-rfid-wristband.html': ['images/rfid-event-wristbands.webp', 'NFC and RFID event wristbands for access and cashless payment', 'HF/NFC bands tap for payment; UHF bands read from metres for crowd flow.'],
  'ntag213-vs-215-vs-216.html': ['images/nfc-metal-card.webp', 'NFC product built on an NXP NTAG chip (NTAG213/215/216)', 'NTAG213/215/216 differ mainly in user memory: 144 / 504 / 888 bytes.'],
  'uhf-vs-hf-rfid-label.html': ['images/nfc-printed-label.webp', 'Printed RFID smart label — available in UHF or HF', 'UHF labels read from metres; HF labels tap at close range and are phone-readable.'],
  'rfid-wristband-materials.html': ['images/leather-rfid-wristband.webp', 'RFID wristbands in silicone, fabric, Tyvek and vinyl materials', 'Material drives comfort, durability, waterproofing, reuse and cost.'],
  'rfid-key-fob-guide.html': ['images/rfid-keyfob.webp', 'RFID key fob — a rugged keyring token for contactless access', 'Key fobs come in LF, HF/NFC and UHF for access, membership and ID.'],
};

function shell({ slug, title, desc, h1, lead, crumb, bodyHtml, faqs, howto }) {
  const _wc = String(bodyHtml || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(2, Math.round(_wc / 200));
  const cimg = CONTENT_IMG[slug];
  const figureHtml = cimg ? `<figure style="margin:6px auto 26px;max-width:560px"><img src="${cimg[0]}" alt="${esc(cimg[1])}" loading="lazy" width="300" height="300" style="width:100%;height:auto;border-radius:12px;border:1px solid var(--line,#e5e9f0)" /><figcaption style="font-size:13px;color:var(--muted,#6b7a90);margin-top:8px;text-align:center">${esc(cimg[2] || cimg[1])}</figcaption></figure>` : '';
  const ld = [];
  ld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, image: cimg ? SITE + '/' + cimg[0] : SITE + '/og-image.jpg', datePublished: UPDATED_ISO, dateModified: UPDATED_ISO, author: { '@type': 'Organization', name: 'RFID MFG', url: SITE + '/about.html' }, publisher: { '@type': 'Organization', name: 'RFID MFG', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } }, mainEntityOfPage: SITE + '/' + slug });
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
      <p style="font-size:13px;color:var(--muted,#6b7a90);margin:0 0 18px">By ${esc(AUTHOR)} · Updated ${esc(UPDATED)} · ${readMins} min read</p>
      <div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px;margin-bottom:22px"><strong>In short:</strong> ${esc(lead)}</div>
      ${figureHtml}
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
      { h: 'Ultra-High Frequency (UHF, 860–960 MHz)', p: ['UHF delivers metres of range and can read hundreds of tags per second, which is why it dominates retail inventory, warehouse and supply-chain tagging. The trade-off: UHF is more sensitive to metal and liquid, so on-metal items need anti-metal tag designs.', 'Note that UHF regulations differ by region: North America uses 902–928 MHz, Europe 865–868 MHz, and China 920–925 MHz. A tag antenna tuned for one region still reads elsewhere but at slightly reduced range, so for global rollouts we recommend broadband-tuned inlays.'] },
      { h: 'Typical read range by tag form factor', p: ['Frequency sets the ceiling, but the tag itself decides real-world range. As a rough guide: an LF fob reads at 3–10 cm; an HF/NFC card or label taps at 1–10 cm; a standard UHF paper label reads at 3–8 m; a UHF on-metal hard tag reads at 1–4 m through interference; and a large UHF windshield or asset tag can exceed 10 m with a fixed reader. Antenna size, reader power and orientation all shift these figures.'] },
      { h: 'Matching frequency to your industry', p: ['LF (125 kHz) is the default for livestock and pet identification, and for access fobs used near metal. HF/NFC (13.56 MHz) powers payment and transit cards, library books, event wristbands, product authentication and any tap-with-a-phone marketing. UHF (860–960 MHz) runs retail item-level inventory, warehouse and logistics gates, laundry and linen tracking, tooling and returnable-asset control, and vehicle tolling. Many buyers combine bands — an access card that is LF for a legacy door and HF for a new one, for example.'] },
    ],
    howto: { name: 'How to choose an RFID frequency', steps: [['Define the read distance', 'Tap or a few cm → HF/NFC. Up to a few metres or bulk reads → UHF. Very short range near metal/animals → LF.'], ['Check the environment', 'Metal or liquid nearby favours LF or anti-metal UHF designs.'], ['Decide if a phone must read it', 'If users tap with a smartphone, you need HF/NFC.'], ['Weigh cost at volume', 'For millions of item-level tags, UHF inlays are usually cheapest.']] },
    faqs: [
      ['Which RFID frequency has the longest range?', 'UHF (860–960 MHz) has the longest range — up to about 10 metres passively — versus a few centimetres for HF/NFC and LF.'],
      ['Is NFC the same as HF RFID?', 'NFC is a subset of HF RFID at 13.56 MHz, standardised for short-range, two-way communication with smartphones. All NFC is HF, but not all HF is NFC.'],
      ['What frequency works best on metal?', 'LF works naturally near metal; for UHF you use specially designed anti-metal (on-metal) tags with a ferrite or spacer layer.'],
      ['Can one tag work at multiple frequencies?', 'Yes. Dual-frequency cards and tags combine two chips — commonly LF + HF (for mixed access systems) or HF + UHF — so one credential works across readers that use different bands.'],
      ['Does UHF frequency differ by country?', 'Yes. UHF RFID uses 902–928 MHz in North America, 865–868 MHz in Europe and 920–925 MHz in China. Tags read across regions but perform best on an antenna tuned for the target market; broadband inlays suit global deployments.'],
    ],
    related: [['rfid-vs-nfc.html', 'RFID vs NFC: what is the difference?'], ['uhf-vs-hf-rfid-label.html', 'UHF vs HF RFID labels'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire chips'], ['products.html#tags', 'Browse RFID tags by frequency']],
  },
  {
    slug: 'rfid-vs-nfc.html', crumb: 'RFID vs NFC',
    title: 'RFID vs NFC: What Is the Difference? | RFID MFG',
    desc: 'RFID vs NFC explained simply: NFC is a short-range subset of HF RFID for smartphones. Compare range, use cases and when to choose each.',
    h1: 'RFID vs NFC: what is the difference?',
    lead: 'NFC is a short-range (≈4 cm) subset of 13.56 MHz HF RFID built for two-way phone interaction. "RFID" more broadly also covers LF and long-range UHF used for tracking and inventory.',
    body: [{ h: 'They are related, not rival, technologies', p: ['One of the most common questions in the industry is whether to use "RFID" or "NFC". The short answer: NFC is a type of RFID. Both use radio waves and passive tags powered by the reader. The difference is range, interaction model and ecosystem.', 'NFC operates only at 13.56 MHz, works at a few centimetres, supports two-way communication, and is built into virtually every smartphone — making it ideal for tap-to-share, authentication and marketing without an app. "RFID" as a category also includes LF and UHF, and is typically a one-way identification system optimised for range and bulk reading.'] }, { h: 'How they work — and why NFC is really "HF RFID"', p: ['Every RFID and NFC system pairs a reader, an antenna and a passive tag. The reader radiates an electromagnetic field; the tag harvests that energy to power its chip and reply — no battery required. NFC uses the same 13.56 MHz HF band as HF RFID and follows the same core air-interface standards — ISO/IEC 14443 and ISO/IEC 15693 — plus ISO/IEC 18092 for the peer-to-peer mode that lets two phones exchange data. That shared foundation is why NFC is best understood as a consumer-friendly branch of HF RFID rather than a separate technology.', 'The practical split is range and direction. Passive HF/NFC reads at roughly 1–10 cm and can exchange data both ways; passive UHF RFID (860–960 MHz) reads up to about 10 metres and is built to read hundreds of tags per second in a single pass. That is why supply-chain, retail inventory and warehouse gates run on UHF, while tap-to-pay, access control and product authentication run on HF/NFC.'] }],
    tables: [{ cap: 'RFID vs NFC', head: ['Aspect', 'NFC', 'RFID (general)'], rows: [['Frequency', '13.56 MHz only', 'LF, HF or UHF'], ['Range', '≈ up to 4 cm', 'Up to ~10 m (UHF)'], ['Communication', 'Two-way', 'Mostly one-way'], ['Phone support', 'Built into smartphones', 'Needs a dedicated reader'], ['Reads many tags at once', 'No', 'Yes (UHF)'], ['Best for', 'Tap marketing, auth, access', 'Inventory, logistics, tracking']] }],
    body2: [{ h: 'When to choose NFC', p: ['Choose NFC when end users will tap with a phone: product authentication, tap-to-reorder packaging, smart posters, digital business cards and tap-to-pay. No app or pairing is needed because NFC is native to the phone.'] }, { h: 'When to choose broader RFID', p: ['Choose UHF RFID when you need to read many items quickly from a distance — retail stock counts, warehouse gates, asset tracking. Choose LF for animal ID or access near metal. These need a dedicated reader rather than a phone.'] }, { h: 'Cost, volume and sourcing', p: ['For item-level tagging at scale, passive UHF inlays are usually the lowest cost per piece, while NFC labels and cards cost a little more but unlock phone interaction. As a manufacturer we supply both families — NTAG, MIFARE and DESFire for HF/NFC, and NXP UCODE and Impinj for UHF — with low MOQs, free samples and custom encoding. If you are unsure which fits, tell us the use case and volume and we will recommend the chip, frequency and format and quote within 24 hours.'] }],
    faqs: [['Can a smartphone read RFID?', 'Smartphones can read NFC (HF 13.56 MHz) tags natively. They cannot read LF or UHF RFID without an external reader accessory.'], ['Is NFC less secure than RFID?', 'Security depends on the chip, not the category. Both NFC and RFID offer secure chips (e.g. DESFire) with encryption; short NFC range also limits eavesdropping.'], ['Which is cheaper, NFC or UHF RFID?', 'For high-volume item-level tagging, UHF inlays are usually the cheapest per tag; NFC labels cost a little more but enable phone interaction.'], ['Do NFC or RFID tags need a battery?', 'No. Standard NFC and passive RFID tags are unpowered — they harvest energy from the reader field. Only active UHF tags used for long-range tracking carry a built-in battery.']],
    related: [['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF frequencies'], ['nfc-vs-rfid-wristband.html', 'NFC vs RFID wristbands'], ['nfc-printed-label.html', 'NFC printed labels'], ['rfid-nfc-card.html', 'RFID / NFC cards']],
  },
  {
    slug: 'rfid-vs-barcode.html', crumb: 'RFID vs Barcode',
    title: 'RFID vs Barcode: Pros, Cons and When to Switch | RFID MFG',
    desc: 'RFID vs barcode compared: line of sight, read speed, range, durability and cost. Learn when RFID is worth it and when barcodes still win.',
    h1: 'RFID vs barcode: which should you use?',
    lead: 'Barcodes are cheap but need line of sight and one-at-a-time scanning. RFID reads many tags at once, without line of sight, and stores re-writable data — at a higher per-tag cost.',
    body: [{ h: 'The core difference', p: ['Barcodes are printed patterns read optically, one at a time, in direct line of sight. RFID tags are read by radio, in bulk, through packaging and without aiming. For many operations RFID turns a multi-hour stock count into minutes — but barcodes remain unbeatable on raw cost for simple, low-volume needs.'] }],
    tables: [{ cap: 'RFID vs barcode', head: ['Factor', 'Barcode', 'RFID'], rows: [['Line of sight', 'Required', 'Not required'], ['Items per scan', 'One', 'Hundreds at once'], ['Range', 'A few cm', 'Up to ~10 m (UHF)'], ['Re-writable data', 'No', 'Yes'], ['Durability', 'Low (print wears)', 'High (sealed tag)'], ['Unit cost', 'Near zero', 'Cents and up'], ['Reads through packaging', 'No', 'Yes']] }],
    body2: [{ h: 'When RFID is worth it', p: ['RFID pays off when labour, speed or accuracy matter: warehouse and retail inventory, asset tracking, returnable assets, work-in-progress, and anywhere manual scanning is a bottleneck. The tag cost is offset by faster counts, fewer errors and less shrinkage.'] }, { h: 'When barcodes still win', p: ['For low-volume, single-item checkout, disposable packaging or tight per-unit budgets, barcodes are still the rational choice. Many operations run both — barcodes at the consumer level, RFID for cases and pallets.'] }, { h: 'The ROI math', p: ['The business case for RFID is rarely the tag price — it is labour and accuracy. A cycle count that takes hours by barcode scanning can drop to minutes with a UHF handheld reading hundreds of tags per second. In retail, moving from manual counts to RFID typically lifts inventory accuracy from roughly 65% to 95% or higher, which cuts stockouts, over-ordering and shrinkage. Those recurring savings usually pay back the one-time tag and reader investment within the first year for medium-to-high volume operations.'] }, { h: 'A hybrid approach is common', p: ['Most operations do not switch overnight. A practical path is to keep barcodes at the item and consumer level, add RFID at the case, pallet or asset level where bulk reading pays off, and use dual RFID-plus-barcode labels during the transition so both systems keep working.'] }],
    faqs: [['Is RFID replacing barcodes?', 'Not entirely. RFID is replacing barcodes where bulk, no-line-of-sight reading adds value (inventory, logistics), but barcodes remain common for low-cost, single-item use.'], ['How much more does an RFID tag cost than a barcode?', 'A printed barcode is essentially free; a UHF RFID inlay costs from a few cents upward depending on volume and type, which is justified by labour and accuracy savings.'], ['How accurate is RFID inventory versus barcode?', 'Barcode-based manual counts often leave inventory accuracy around 65%. RFID cycle counting commonly raises accuracy to 95–99% because every tagged item is read quickly and without line of sight.'], ['Can RFID and barcodes be combined?', 'Yes. Many RFID labels are also printed with a barcode and human-readable text so they work with both systems.']],
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
    body2: [{ h: 'NTAG (NFC)', p: ['NTAG chips are tuned for NFC phone interaction. They store a URL or vCard, can be locked, and are inexpensive — ideal for tap-to-engage marketing, product authentication and digital business cards.'] }, { h: 'MIFARE Classic', p: ['A long-standing workhorse for access control and closed-loop loyalty/transit. Its CRYPTO1 cipher is now considered legacy, so for new high-security projects DESFire is preferred.'] }, { h: 'MIFARE DESFire', p: ['DESFire EV2/EV3 adds AES encryption and a flexible file system, making it the modern choice for payment, public transit and government ID where security and multi-application support matter.'] }, { h: 'Ultralight and ICODE — tickets and libraries', p: ['Two more families round out the HF world. MIFARE Ultralight (and Ultralight EV1/C) is a low-cost, small-memory chip built for high-volume disposable use — single-ride transit tickets and event entry. NXP ICODE (SLIX/SLIX2, ISO 15693) offers longer HF read range and anti-collision, which is why it dominates library book tagging and some retail and healthcare applications where you scan a shelf of items at once.'] }, { h: 'Match the chip to your memory and security needs', p: ['Start from two questions: how much data must the tag hold, and how sensitive is it. For a URL or simple ID, NTAG213 (144 bytes) is plenty; for richer payloads or gaming, NTAG215 (504 bytes) and NTAG216 (888 bytes) give headroom. For access with legacy infrastructure, MIFARE Classic 1K/4K still fits; for anything touching money, identity or multiple applications on one card, choose DESFire EV2/EV3 with AES. Getting this right up front avoids a costly re-issue later.'] }],
    faqs: [['Which RFID chip is most secure?', 'Among common HF chips, MIFARE DESFire EV2/EV3 is the most secure, using AES encryption and mutual authentication — suited to payment, transit and ID.'], ['Which chip should I use for NFC marketing?', 'NTAG213/215/216 are the standard for NFC marketing and authentication: phone-readable, lockable and low cost. NTAG215 is popular for its 504-byte capacity.'], ['What is the difference between NTAG213, 215 and 216?', 'They differ mainly in user memory: NTAG213 has 144 bytes, NTAG215 has 504 bytes and NTAG216 has 888 bytes. NTAG213 suits URLs and simple records; 215 and 216 suit richer data, vCards and gaming tokens.'], ['Can you encode chips with our keys?', 'Yes — RFID MFG encodes MIFARE, DESFire and NTAG chips with your sectors, keys and data under NDA before delivery.']],
    related: [['ntag213-vs-215-vs-216.html', 'NTAG213 vs 215 vs 216'], ['rfid-frequencies-lf-hf-uhf.html', 'RFID frequencies guide'], ['rfid-nfc-card.html', 'RFID / NFC cards'], ['contact-ic-chip-card.html', 'Contact IC chip cards']],
  },
  {
    slug: 'rfid-dry-vs-wet-inlay.html', crumb: 'Dry vs Wet Inlay',
    title: 'RFID Dry Inlay vs Wet Inlay: Differences & Uses | RFID MFG',
    desc: 'Dry inlay vs wet inlay explained: adhesive, conversion, cost and applications. Learn which RFID inlay type fits your label or product workflow.',
    h1: 'RFID dry inlay vs wet inlay',
    lead: 'A dry inlay is the chip-and-antenna with no adhesive — for laminating or embedding. A wet inlay adds adhesive so you can peel and stick it straight onto products.',
    body: [{ h: 'What an inlay is', p: ['An RFID inlay is the working core of a smart label: an antenna with the chip attached, on a thin substrate. Whether it is "dry" or "wet" simply describes whether adhesive has been applied — and that decides how you convert it into a finished product.'] }],
    tables: [{ cap: 'Dry vs wet inlay', head: ['Property', 'Dry inlay', 'Wet inlay'], rows: [['Adhesive', 'None', 'Pressure-sensitive adhesive'], ['Use', 'Laminate / embed into product', 'Peel and stick directly'], ['Typical buyer', 'Label converters, card makers', 'End users, packers'], ['Cost', 'Lower (no adhesive)', 'Slightly higher'], ['Format', 'Reel', 'Reel, ready to apply']] }],
    body2: [{ h: 'Choose a dry inlay when', p: ['You manufacture your own labels, cards or tickets and will laminate the inlay between layers, or embed it into a product. Dry inlays give converters maximum flexibility and the lowest cost.'] }, { h: 'Choose a wet inlay when', p: ['You want to apply tags directly to products, cartons or documents with no extra converting step. Wet inlays peel off the liner and stick down immediately, ideal for retail and logistics tagging.'] }, { h: 'How inlays become finished products', p: ['A dry inlay is the input for converters: it gets laminated between a printed face and a backing to become a card, ticket or hang tag, or embedded inside a product. A wet inlay skips a step — it is laminated to a printable face and a release liner to become a white RFID label, which an RFID printer then prints and encodes before it is peeled and applied. The face stock (paper or PET), antenna size and liner are all specified to match your printer and application surface.'] }, { h: 'Chip options inside an inlay', p: ['The inlay is where you choose the chip. UHF inlays commonly use NXP UCODE 8/9 or Impinj M730/M750 for long-range item and carton tracking; HF/NFC inlays use NTAG or ICODE for tap and library use. Antenna designs are tuned to the chip and to whether the item is paper, plastic, glass or near metal.'] }],
    faqs: [['What is the difference between a dry and wet RFID inlay?', 'A dry inlay has no adhesive and is meant for laminating or embedding; a wet inlay has a pressure-sensitive adhesive so it can be peeled and stuck directly onto an item.'], ['Which inlay do label printers use?', 'RFID label printers typically use white-faced wet inlays (printable RFID labels) so the label can be printed and encoded, then applied in one step.'], ['What chips come in RFID inlays?', 'UHF inlays typically use NXP UCODE 8/9 or Impinj M730/M750; HF/NFC inlays use NTAG or NXP ICODE. We match the chip and antenna to your read range, surface and budget.'], ['Can inlays be pre-encoded?', 'Yes, both dry and wet inlays can be supplied blank or pre-encoded to your numbering scheme.']],
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
    body2: [{ h: 'Balancing cost, durability and image', p: ['For mass-issued cards where cost rules, PVC is the standard. Where cards must survive years of daily use or carry high-security ID, PET/PETG or PC are worth the premium. For brands that lead with sustainability, eco/BIO paper and FSC wood communicate values; for luxury tiers, metal makes a statement.'] }, { h: 'Standard format and finishes', p: ['Most RFID cards ship in the CR80 format — 85.6 × 54 mm at 0.76 mm (30 mil) thick, the same as a bank card — so they fit standard wallets, printers and slot readers. On top of the base material you can add finishes that change both look and durability: glossy or matte lamination, spot UV, frosted or transparent bodies, signature panels, hologram overlays, embossing and hot-stamped gold or silver foil. Metal and wood cards use laser engraving instead of offset printing.'] }, { h: 'Printing and personalisation by material', p: ['PVC, PET and BIO paper take full-colour offset (CMYK) and Pantone printing beautifully; PC is usually printed then laser-engraved for tamper-resistant security text; metal and wood are laser-engraved or screen-printed. Every material supports variable data — sequential numbering, barcodes/QR, magstripe and chip encoding — so cards can be personalised in the same run.'] }],
    howto: { name: 'How to choose an RFID card material', steps: [['Match durability to lifespan', 'Daily, multi-year use → PET/PETG or PC; short-term or low-cost → PVC or BIO paper.'], ['Decide on brand image', 'Premium → metal or wood; green positioning → eco/BIO.'], ['Confirm print & security needs', 'High-security ID with laser engraving → PC.'], ['Check sustainability goals', 'To cut plastic, choose BIO paper, recycled PVC or FSC wood.']] },
    faqs: [['What is the most durable RFID card material?', 'Polycarbonate (PC) and metal are the most durable. PC is laser-engravable for secure ID; metal is premium and very long-lasting.'], ['Are there eco-friendly RFID cards?', 'Yes — biodegradable BIO paper, recycled PVC, FSC-certified wood and PLA cards offer lower-plastic alternatives with comparable performance.'], ['How thick is a standard RFID card?', 'The standard CR80 card is 85.6 × 54 mm and 0.76 mm (30 mil) thick — the same size and thickness as a credit card — so it fits standard printers, wallets and slot readers. Custom thicknesses are available for special formats.'], ['Can metal cards still have RFID/NFC?', 'Yes, via a hybrid construction that embeds the antenna and chip so the metal card still works contactlessly.']],
    related: [['eco-friendly-card.html', 'Eco-friendly cards'], ['metal-card.html', 'Metal cards'], ['rfid-cards-guide.html', 'Complete RFID cards guide']],
  },
  {
    slug: 'nfc-vs-rfid-wristband.html', crumb: 'NFC vs RFID Wristband',
    title: 'NFC vs RFID Wristbands: Which to Choose for Events | RFID MFG',
    desc: 'NFC vs RFID wristbands compared for events: read range, cashless payment, crowd tracking and cost. Learn when to choose HF/NFC vs UHF bands.',
    h1: 'NFC vs RFID wristbands: which is right for your event?',
    lead: 'HF/NFC wristbands work at a tap (a few centimetres) for cashless payment, access and phone/social interaction; UHF RFID wristbands read from several metres for automatic gate access and crowd tracking. Most events use HF/NFC.',
    body: [
      { h: 'They are both RFID — the difference is range', p: ['"NFC wristband" and "RFID wristband" are often used as if they were opposites, but NFC is itself a type of HF RFID. What really separates event wearables is the frequency band, because that sets read range, whether a phone can read the band, and how the system is built.', 'HF/NFC bands operate at 13.56 MHz and are read within roughly 1–10 cm — a deliberate tap. UHF bands operate at 860–960 MHz and can be read from 1–5 metres or more, which suits hands-free gate reads and locating attendees, but needs dedicated readers rather than phones.'] },
      { h: 'How each is used at an event', p: ['HF/NFC is the default for cashless payment and access: a guest taps the band at a bar, gate or activation, and (because NFC is built into phones) the same chip can power social check-ins and tap-to-win games. UHF shines where you want to read many bands at once from a distance — automatic entry lanes, zone counting and real-time crowd flow — without anyone tapping.'] },
    ],
    tables: [{ cap: 'NFC (HF) vs UHF event wristbands', head: ['Aspect', 'NFC / HF band', 'UHF band'], rows: [['Frequency', '13.56 MHz', '860–960 MHz'], ['Read range', '≈ 1–10 cm (tap)', '≈ 1–5 m+'], ['Phone-readable', 'Yes', 'No (needs reader)'], ['Best for', 'Cashless pay, access, social', 'Gate flow, crowd tracking'], ['Chip examples', 'NTAG, MIFARE', 'UCODE, Impinj'], ['Interaction', 'Deliberate tap', 'Hands-free / bulk']] }],
    body2: [
      { h: 'Choose NFC/HF when', p: ['Your priority is cashless spend, secure access and phone/social interaction — festivals, conferences, VIP and brand activations. This is the most common event setup because it is secure at close range and works with the phones guests already carry.'] },
      { h: 'Choose UHF when', p: ['You need to read many attendees automatically from a distance — high-throughput entry lanes, timing, or live zone-occupancy analytics at large venues. UHF is usually paired with fixed gate readers.'] },
      { h: 'Sourcing both', p: ['We manufacture both HF/NFC and UHF wristbands in silicone, fabric and Tyvek, pre-encoded to your system, so you can match the band to the use case (or run a dual-frequency band) and get one branded, ready-to-issue batch. Tell us your event size and interactions and we will recommend the chip and material.'] },
    ],
    faqs: [
      ['Is an NFC wristband the same as an RFID wristband?', 'NFC is a short-range subset of HF RFID (13.56 MHz). All NFC bands are RFID, but "RFID wristband" can also mean a longer-range UHF band. The practical difference is tap range vs metres of range.'],
      ['Which is better for cashless payment at events?', 'HF/NFC wristbands are the standard for cashless payment — secure at tap range and readable by phones and bar terminals. UHF is used more for hands-free gate access and crowd tracking.'],
      ['Can one wristband do both payment and gate tracking?', 'Yes — a dual-frequency band combines an HF/NFC chip for tap-to-pay with a UHF chip for long-range gate reads. Tell us your workflow and we will advise.'],
    ],
    related: [['rfid-wristband.html', 'RFID wristbands'], ['rfid-silicone-wristband.html', 'Silicone wristbands'], ['rfid-wristband-materials.html', 'Wristband materials compared'], ['case-events.html', 'Case: events & festivals']],
  },
  {
    slug: 'ntag213-vs-215-vs-216.html', crumb: 'NTAG213 vs 215 vs 216',
    title: 'NTAG213 vs NTAG215 vs NTAG216: NFC Chip Comparison | RFID MFG',
    desc: 'NTAG213 vs 215 vs 216 compared: user memory (144/504/888 bytes), price and best uses. Choose the right NXP NTAG chip for your NFC project.',
    h1: 'NTAG213 vs NTAG215 vs NTAG216: which NFC chip?',
    lead: 'The three chips are near-identical except for user memory: NTAG213 holds 144 bytes, NTAG215 holds 504 bytes and NTAG216 holds 888 bytes. Pick 213 for URLs, 215 for vCards and gaming, 216 for the most data.',
    body: [
      { h: 'Same family, different memory', p: ['NTAG213, 215 and 216 are NXP\'s mainstream NFC chips — all operate at 13.56 MHz, follow ISO/IEC 14443A and the NFC Forum Type 2 standard, and are read by every modern smartphone. They share the same features (password protection, a scan counter, a unique 7-byte UID); the headline difference is how much data they can store.', 'That memory decides what you can encode. A short URL fits comfortably in NTAG213; a full vCard, several records or a game token needs the room of 215 or 216.'] },
    ],
    tables: [{ cap: 'NTAG213 vs 215 vs 216', head: ['Chip', 'User memory', 'Total memory', 'Typical use', 'Relative cost'], rows: [['NTAG213', '144 bytes', '180 bytes', 'URLs, simple records, marketing', 'Lowest'], ['NTAG215', '504 bytes', '540 bytes', 'vCards, gaming tokens, rich records', 'Mid'], ['NTAG216', '888 bytes', '924 bytes', 'Largest payloads, multiple records', 'Highest']] }],
    body2: [
      { h: 'Choose NTAG213', p: ['For the vast majority of tap-to-open marketing, product labels and simple authentication: it stores a URL or short record cheaply, which matters at high volume.'] },
      { h: 'Choose NTAG215', p: ['When you need more room — a full vCard, several NDEF records, or a gaming token (215\'s 504 bytes is the well-known amiibo capacity). A popular balance of memory and cost for NFC business cards and collectibles.'] },
      { h: 'Choose NTAG216', p: ['When you need the most on-tag data — larger payloads or many records without an internet lookup. Choose it when 215 is not enough.'] },
    ],
    faqs: [
      ['What is the difference between NTAG213, 215 and 216?', 'Mainly user memory: NTAG213 has 144 bytes, NTAG215 has 504 bytes and NTAG216 has 888 bytes. They otherwise share the same 13.56 MHz operation, features and phone compatibility.'],
      ['Which NTAG chip is used for amiibo and gaming?', 'NTAG215, because its 504-byte user memory fits the data these tokens use. It is a common choice for NFC gaming and collectibles.'],
      ['Can I lock an NTAG chip so it cannot be changed?', 'Yes. All three support password protection and permanent locking, which is important for authentication and anti-tamper use. We can pre-encode and lock chips before delivery.'],
    ],
    related: [['nfc-guide.html', 'NFC cards, tags & labels guide'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire'], ['nfc-business-card.html', 'NFC business cards'], ['nfc-printed-label.html', 'NFC printed labels']],
  },
  {
    slug: 'uhf-vs-hf-rfid-label.html', crumb: 'UHF vs HF Labels',
    title: 'UHF vs HF RFID Labels: Which Frequency to Choose | RFID MFG',
    desc: 'UHF vs HF RFID labels compared: read range, bulk reading, phone compatibility and best uses. Choose the right smart label frequency for your application.',
    h1: 'UHF vs HF RFID labels: which frequency?',
    lead: 'UHF labels (860–960 MHz) read from metres away and scan hundreds at once — ideal for retail and logistics. HF labels (13.56 MHz) read at a few centimetres, are phone-readable, and suit libraries, pharma and NFC marketing.',
    body: [
      { h: 'Frequency decides the job', p: ['A smart label\'s frequency is the single biggest factor in how it performs. UHF is built for range and speed; HF is built for short-range, reliable, item-by-item reads and phone interaction. Picking the wrong one is the most common labelling mistake.', 'UHF (EPC Gen2 / ISO 18000-6C) reads passive labels at roughly 1–8 metres and can capture hundreds per second, which is why retail item-level tagging, warehouse gates and logistics run on it. HF (ISO 14443 / 15693, which includes NFC) reads within about 10 cm — a feature for libraries, pharmacy and any tap-with-a-phone use.'] },
    ],
    tables: [{ cap: 'UHF vs HF RFID labels', head: ['Aspect', 'UHF label', 'HF label'], rows: [['Frequency', '860–960 MHz', '13.56 MHz'], ['Read range', '≈ 1–8 m', '≈ up to 10 cm'], ['Bulk reading', 'Excellent (100s/sec)', 'Limited'], ['Phone-readable (NFC)', 'No', 'Yes'], ['Best for', 'Retail, warehouse, logistics', 'Library, pharma, marketing'], ['Chip examples', 'UCODE, Impinj', 'NTAG, ICODE'], ['Cost at volume', 'Lowest per label', 'Low–medium']] }],
    body2: [
      { h: 'Choose UHF labels when', p: ['You need range, speed and volume: apparel and retail item tagging, carton and pallet tracking, warehouse dock-door portals and asset management. UHF inlays are also usually the cheapest per label at scale.'] },
      { h: 'Choose HF labels when', p: ['You need close, reliable single-item reads or phone interaction: library book tagging (ICODE/ISO 15693), pharmacy and healthcare item control, access, and NFC marketing where consumers tap with a phone (NTAG).'] },
      { h: 'Not sure? Match it to the read environment', p: ['The decision follows how the label will be read, not its shape. Tell us the read distance, the surface (paper, plastic, metal or liquid) and volume, and we will spec the chip, antenna and face material and supply the labels blank or pre-encoded.'] },
    ],
    faqs: [
      ['Is UHF or HF better for RFID labels?', 'Neither is universally better — UHF suits long-range, bulk reading (retail, logistics), while HF suits short-range, phone-readable, item-level uses (library, pharma, marketing). Match the frequency to how the label is read.'],
      ['Can a phone read a UHF RFID label?', 'No. Phones read only HF/NFC (13.56 MHz). UHF labels need a dedicated UHF reader. For any tap-with-a-phone use, choose an HF/NFC label.'],
      ['Which RFID label is cheapest?', 'At high volume, passive UHF inlays are usually the lowest cost per label, which is one reason retail and logistics adopted UHF for item-level tagging.'],
    ],
    related: [['uhf-rfid-label.html', 'UHF RFID labels'], ['nfc-printed-label.html', 'NFC printed labels'], ['rfid-labels-inlays-guide.html', 'RFID labels & inlays guide'], ['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF frequencies']],
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
      { h: 'How an RFID card is made', p: ['A finished card is a sandwich. An inlay layer (the antenna and chip) sits between printed core sheets, with clear overlays on top and bottom. The stack is laminated under heat and pressure into a rigid sheet, then die-punched into individual CR80 cards. Personalisation — numbering, magstripe, signature panel, hot-stamped foil, embossing and chip encoding — is added before final QC. Because the print and body are independent of the chip, you can change artwork without changing the electronics.'] },
      { h: 'Cost, MOQ and lead time', p: ['Card pricing depends on chip, material, printing and quantity — a plain PVC proximity card is inexpensive at volume, while DESFire, metal or heavily finished cards cost more. MOQs are flexible (often from a few hundred pieces), free samples are available to verify print and chip, and typical production runs 7–15 days after artwork and encoding are approved. Share your spec and quantity for an exact wholesale quote within 24 hours.'] },
    ],
    table: { cap: 'Quick card selector', head: ['Need', 'Recommended'], rows: [['Phone tap / marketing', 'HF/NFC card with NTAG'], ['Access control', 'HF card with MIFARE / DESFire'], ['Payment / transit / secure ID', 'DESFire (AES)'], ['Premium / VIP', 'Metal or wood card'], ['Green branding', 'Eco / BIO or FSC wood card']] },
    faqs: [['How do I specify an RFID card?', 'Define four things: frequency (LF/HF/UHF), chip (e.g. NTAG, MIFARE, DESFire), material (PVC, PET, PC, eco, metal) and personalization (print, numbering, encoding). Share these and we will confirm the build.'], ['Can one card hold multiple applications?', 'Yes. Chips like MIFARE DESFire support multiple applications (e.g. access plus cashless) on one card with separate, secured files.'], ['What is the minimum order for custom cards?', 'MOQ is flexible and depends on configuration — share your target quantity and we will advise.'], ['How long does RFID card production take?', 'After artwork and encoding are approved, a typical custom run ships in about 7–15 days; free pre-production samples are available first so you can verify print, material and chip.']],
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
      { h: 'How to encode an NFC card or tag', p: ['Encoding writes an NDEF record — usually a URL, vCard or app command — onto the chip. For small batches you can use a free phone app (e.g. NXP TagWriter) to write and then lock a tag; for production volumes an NFC encoder writes and verifies thousands per hour. We supply tags blank, pre-encoded to your data, or encoded with a redirect URL so you can change the destination later without re-issuing the tag. Locking prevents anyone from overwriting the content — essential for authentication.'] },
      { h: 'NFC vs QR code', p: ['NFC and QR both link a physical item to digital content, but they behave differently. QR is free to print and works on any camera, yet it is visible, easy to copy and can be swapped by a sticker. NFC is invisible inside the product, feels premium (a tap, no aiming), and — with a locked, unique chip — is far harder to clone, which is why brands use NFC for authentication and premium experiences while QR stays the low-cost option. Many products carry both.'] },
    ],
    table: { cap: 'NFC form factors', head: ['Form', 'Best for'], rows: [['NFC card', 'Membership, digital business cards'], ['NFC label / sticker', 'Packaging, posters, authentication'], ['NFC tag / keyfob', 'Access, asset tracking'], ['NFC wristband', 'Events, cashless, access']] },
    faqs: [['Do NFC tags need an app?', 'No. NTAG tags store an NDEF record (e.g. a URL), so a tap opens it directly in the phone’s browser without any app.'], ['Can NFC be used for anti-counterfeiting?', 'Yes. A locked, unique NFC chip plus tamper-evident material lets customers verify authenticity with a tap and makes cloning impractical.'], ['Which NFC chip should I choose?', 'NTAG213 for short URLs, NTAG215 for vCards/richer data, NTAG216 for the most memory. We can advise based on your content.'], ['Does NFC work on iPhone and Android?', 'Yes. Modern Android phones read NFC natively, and iPhones have read NFC tags in the background since the iPhone XS/XR — users simply tap the tag, no app required.']],
    related: [['ntag213-vs-215-vs-216.html', 'NTAG213 vs 215 vs 216'], ['rfid-vs-nfc.html', 'RFID vs NFC'], ['nfc-printed-label.html', 'NFC printed labels'], ['rfid-nfc-card.html', 'RFID / NFC cards'], ['news-nfc-stickers.html', 'NFC stickers in everyday life']],
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
      { h: 'Choosing the chip and antenna', p: ['Inside every label, the chip and antenna set performance. UHF labels commonly use NXP UCODE 8/9 or Impinj M730/M750 — the newer chips add sensitivity and memory for item-level retail. HF/NFC labels use NTAG (phone tap) or NXP ICODE (library, longer HF range). Antenna size is the other lever: a bigger antenna reads farther, so a large carton label outperforms a small jewelry label. Tell us the read distance, item and volume and we match chip and antenna for you.'] },
      { h: 'The application surface matters', p: ['A label that flies on cardboard can fail on metal or liquid, which detune a standard UHF antenna. For metal assets use on-metal labels with a foam or ferrite spacer; for bottles and bags of fluid use inlays designed for high-water-content items. Temperature and adhesive matter too — freezer, autoclave and outdoor uses each need the right face stock and adhesive. Sharing the surface and environment up front prevents read failures in the field.'] },
    ],
    table: { cap: 'Which label type?', head: ['Need', 'Choose'], rows: [['Apply directly to items', 'Wet inlay / sticker'], ['Laminate or embed', 'Dry inlay'], ['Print + encode on demand', 'White printable label'], ['Retail / logistics range', 'UHF label'], ['Library / item-level', 'HF label']] },
    faqs: [['What is the difference between an inlay and a label?', 'An inlay is the bare antenna-and-chip; a label is a finished inlay with a printable face and often adhesive, ready to apply.'], ['Can I print RFID labels in-house?', 'Yes, with an RFID-capable thermal printer and white printable RFID labels you can print and encode on demand.'], ['What read range do UHF labels achieve?', 'Typically 1–8 m depending on chip, antenna size, reader and what the label is applied to.'], ['Can RFID labels go on metal or liquid?', 'Not standard ones — metal and liquid detune the antenna. Use on-metal labels with a spacer/ferrite for metal assets, and inlays designed for high-water-content items for bottles and bags. Tell us the surface and we will spec the right label.']],
    related: [['uhf-vs-hf-rfid-label.html', 'UHF vs HF RFID labels'], ['rfid-dry-vs-wet-inlay.html', 'Dry vs wet inlay'], ['rfid-dry-inlay.html', 'Dry inlay'], ['rfid-wet-inlay.html', 'Wet inlay'], ['rfid-white-label.html', 'White printable label']],
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
      { h: 'What blocking does — and does not — do', p: ['RFID blocking stops contactless reads at 13.56 MHz: contactless bank cards, access badges, and the chip in e-passports. It is honest to note that modern EMV contactless payment already has cryptographic protections that make real-world skimming difficult, so a blocking product is best framed as added peace of mind rather than the only defence. Blocking does not affect the magnetic stripe or contact chip, and a single blocking card only protects cards stored close to it.'] },
      { h: 'How to test a blocking product', p: ['You can verify a shield in seconds. Place a contactless card behind the blocking card, sleeve or wallet panel and try to read it with an NFC phone or a desktop reader; a working shield prevents the read, while the same card reads instantly when removed. For production QA we test every design against a calibrated 13.56 MHz reader so branded giveaways actually perform, not just look the part.'] },
    ],
    table: { cap: 'Blocking options', head: ['Product', 'How it protects', 'Best for'], rows: [['Blocking card', 'Shields the whole wallet', 'Banks, promotions'], ['Sleeve', 'Wraps one card/passport', 'Travel, giveaways'], ['Wallet / holder', 'Shielded lining', 'Everyday carry']] },
    faqs: [['Does RFID blocking really work?', 'Yes — a properly made passive shield or active jamming card prevents nearby contactless cards from being read at 13.56 MHz. Independent of brand, the physics of shielding the field is sound.'], ['Do I need to block every card?', 'One blocking card or a shielded sleeve/wallet protects the contactless cards stored with it; very large wallets may benefit from a shield on each side.'], ['Can blocking cards be branded?', 'Yes, they are fully printable and widely used as bank and corporate promotional gifts.'], ['Does an RFID blocking card affect my phone or car key?', 'No. Blocking products only shield cards stored right next to them at 13.56 MHz. They do not affect your phone, or a car key fob, which uses different frequencies and needs to transmit freely.']],
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
      { h: 'Antennas and read zones', p: ['With UHF, the antenna often matters more than the reader. Circularly polarised antennas read tags at any orientation and suit mixed inventory; linear antennas reach farther in one plane and suit conveyors where tags line up. Higher gain (measured in dBi) extends range but narrows the beam, so a doorway, a shelf and a tunnel each call for a different antenna and aiming. Keep cable runs short — every metre of coax loses signal — and tune reader power to cover the read zone without spilling into the next one.'] },
      { h: 'Planning a deployment', p: ['A reliable system starts with a pilot. Map where tags must be read and where they must not, choose readers and antennas for those zones, then test with your actual tagged items — read rates change with product, packaging and metal nearby. Confirm power, network and mounting, and how tag data will flow into your WMS, ERP or access software through the SDK. We help specify the reader, antennas and tags together so the pieces work as one system.'] },
    ],
    table: { cap: 'Reader selector', head: ['Task', 'Reader type'], rows: [['Encode / personalize cards', 'Desktop USB reader'], ['Doorway / conveyor reads', 'Fixed UHF reader + antennas'], ['Mobile inventory', 'Handheld UHF reader'], ['Embed into a device', 'OEM module / scan engine']] },
    faqs: [['Do your readers come with an SDK?', 'Yes — readers ship with an SDK and demo software so you can integrate with your own application and back-end systems.'], ['Which reader do I need to encode cards?', 'A desktop USB HF/UHF reader/writer is used to encode and personalize cards at a workstation.'], ['Can one reader handle LF, HF and UHF?', 'Most readers target one band. For multiple frequencies you typically use separate readers or a multi-frequency model where available.'], ['What read range can a UHF reader achieve?', 'A fixed UHF reader with a good antenna typically reads passive tags from about 3 to 10+ metres; handhelds read a few metres. Actual range depends on the tag, antenna gain, reader power and the environment.']],
    related: [['rfid-reader-writer.html', 'RFID readers / writers'], ['barcode-scan-module.html', 'Barcode scan modules'], ['industrial-iot-dtu-rtu.html', 'IoT DTU / RTU'], ['products.html#hardware', 'Browse hardware']],
  },
  {
    slug: 'rfid-wristband-materials.html', crumb: 'Wristband Materials',
    title: 'RFID Wristband Materials: Silicone vs Fabric vs Tyvek vs Vinyl | RFID MFG',
    desc: 'Compare RFID wristband materials — silicone, woven fabric, Tyvek paper, vinyl and elastic — by durability, comfort, waterproofing, reuse and cost to pick the right band.',
    h1: 'RFID wristband materials compared',
    lead: 'Silicone is the durable, waterproof, reusable choice; woven fabric suits multi-day festivals; Tyvek paper is the low-cost single-use option; vinyl is tough and adjustable. Match the material to the event length, environment and budget.',
    sections: [
      { h: 'Why material matters more than the chip', p: ['In a wristband the RFID chip is often the same across options — the material decides comfort, durability, waterproofing, whether the band is reusable, and cost. A one-day concert and a season-long water park need very different bands even with identical NFC chips inside.'] },
      { h: 'Silicone', p: ['Flexible, durable, fully waterproof and comfortable for long wear, silicone is the premium reusable choice — ideal for water parks, gyms, spas, VIP and any multi-use programme. Bands can be moulded in custom colours, debossed or printed, and collected and sanitised for re-issue across seasons.'] },
      { h: 'Woven fabric / textile', p: ['Soft, breathable and hard to remove without cutting, woven fabric bands are the festival standard. A one-time slider closure makes them non-transferable for multi-day access, and they double as a keepsake — which is why attendees keep wearing them long after the event.'] },
      { h: 'Tyvek / synthetic paper', p: ['Lightweight, tear-resistant and the lowest cost, Tyvek paper bands are made for single-day, high-volume events — concerts, day festivals and promotions. They are disposable and print edge to edge, so they are economical to brand and issue in the tens of thousands.'] },
      { h: 'Vinyl and elastic', p: ['Vinyl (plastic) bands are waterproof, tough and usually close with an adjustable snap, suiting hospitals, theme parks and multi-day use where comfort and a secure fit matter. Elastic bands stretch on and off for casual or repeated wear, such as hotel or leisure passes.'] },
      { h: 'Closures and customization', p: ['Closure is part of the security decision: a one-time snap or slider is non-transferable (good for paid access), while adjustable and elastic closures favour comfort and reuse. Every material supports full-colour printing (or debossing on silicone), custom sizing, serial numbering and NFC/UHF chips pre-encoded to your system.'] },
    ],
    table: { cap: 'Wristband material selector', head: ['Material', 'Best for', 'Reuse', 'Note'], rows: [['Silicone', 'Water parks, gyms, VIP', 'Reusable', 'Waterproof, premium feel'], ['Woven fabric', 'Multi-day festivals', 'Reusable', 'Non-transferable, keepsake'], ['Tyvek paper', 'Single-day events', 'Disposable', 'Lowest cost, print edge-to-edge'], ['Vinyl / plastic', 'Hospitals, theme parks', 'Reusable', 'Tough, adjustable snap'], ['Elastic', 'Casual / leisure', 'Reusable', 'Stretch on/off']] },
    faqs: [
      ['Which RFID wristband material is most durable and waterproof?', 'Silicone — it is fully waterproof, comfortable for long wear and reusable across seasons, making it the top choice for water parks, gyms and VIP programmes.'],
      ['What is the cheapest RFID wristband material?', 'Tyvek synthetic paper is the lowest cost and is designed for single-use, high-volume events like concerts and day festivals.'],
      ['Which wristband stops guests sharing or transferring it?', 'Woven fabric bands with a one-time slider, and vinyl bands with a one-time snap, cannot be removed and re-used without cutting — ideal for paid, non-transferable access.'],
    ],
    related: [['rfid-wristband.html', 'RFID wristbands'], ['rfid-silicone-wristband.html', 'Silicone wristbands'], ['disposable-paper-wristband.html', 'Paper wristbands'], ['nfc-vs-rfid-wristband.html', 'NFC vs RFID wristbands']],
  },
  {
    slug: 'rfid-key-fob-guide.html', crumb: 'Key Fob Guide',
    title: 'RFID Key Fobs: The Complete Buyer’s Guide (Types, Chips, Uses) | RFID MFG',
    desc: 'A complete RFID key fob guide: LF vs HF vs UHF fobs, chips (T5577, MIFARE, NTAG), shapes, materials and applications — everything to specify and order the right fob.',
    h1: 'RFID key fobs: the complete buyer’s guide',
    lead: 'An RFID key fob is a durable keyring token with an embedded chip for contactless access, membership and identification. The right fob comes down to frequency (LF, HF or UHF), chip and shape.',
    sections: [
      { h: 'What is an RFID key fob?', p: ['A key fob is a small, rugged ABS token — usually on a keyring — with an RFID antenna and chip sealed inside. Held near a reader, it identifies the holder for door access, time-and-attendance, gym and club membership, transit and loyalty. It does the same job as an access card in a tougher, pocket-friendly form.'] },
      { h: 'Frequencies: LF, HF and UHF fobs', p: ['LF (125 kHz) fobs (T5577, EM4200) are the classic proximity token for building access — simple and reliable near metal. HF/NFC (13.56 MHz) fobs (MIFARE, NTAG) add security and phone readability for encrypted access, cashless and NFC interactions. UHF (860–960 MHz) fobs give longer range for vehicle or hands-free access. Match the fob to your existing reader’s frequency.'] },
      { h: 'Chips and security', p: ['The chip sets security and memory. For basic access, T5577 (LF) or MIFARE Classic (HF) are common; for encrypted, high-security access and multi-application use, MIFARE DESFire (AES) is preferred; for NFC/phone interaction, NTAG. We can encode your existing sectors and keys under NDA so new fobs drop into your current system.'] },
      { h: 'Shapes, materials and branding', p: ['Fobs come in teardrop, round, square and custom shapes, moulded in durable ABS in your choice of colour, with options for epoxy, silicone or metal finishes. They can be printed or laser-marked with your logo and sequentially numbered, and paired with a keyring, strap or carabiner.'] },
      { h: 'Applications', p: ['Access control and intercom entry, gym and club membership, hotel and apartment access, employee time-and-attendance, transit and parking, and event or loyalty tokens. Because the fob is sealed and rugged, it withstands daily keyring wear for years.'] },
    ],
    table: { cap: 'Which key fob?', head: ['Need', 'Choose'], rows: [['Basic building access', 'LF 125 kHz (T5577 / EM4200)'], ['Secure / encrypted access', 'HF MIFARE DESFire'], ['NFC / phone interaction', 'HF NTAG'], ['Vehicle / longer range', 'UHF fob'], ['Match an existing reader', 'Same frequency & chip as your cards']] },
    faqs: [
      ['What frequency is an RFID key fob?', 'Fobs come in LF (125 kHz) for basic proximity access, HF/NFC (13.56 MHz) for secure and phone-readable access, and UHF (860–960 MHz) for longer range. Choose the frequency your reader uses.'],
      ['Can you copy or clone our existing key fobs?', 'We can supply new fobs encoded to your system when you provide the chip type and access credentials/keys (under NDA). We do not clone third-party secured credentials without authorisation.'],
      ['What is the minimum order for custom key fobs?', 'MOQ is flexible — often from a few hundred pieces — and free samples are available. Share your frequency, chip, colour and quantity for a wholesale quote.'],
    ],
    related: [['rfid-keyfob.html', 'RFID key fob product'], ['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF frequencies'], ['rfid-chips-mifare-ntag-desfire.html', 'MIFARE vs NTAG vs DESFire'], ['rfid-cards-guide.html', 'Complete RFID cards guide']],
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
  ['ISO 18092', 'The NFC standard that defines peer-to-peer communication between devices such as two phones.'],
  ['RAIN RFID', 'The industry term for passive UHF RFID based on the EPC Gen2 / ISO 18000-6C standard.'],
  ['EPC', 'Electronic Product Code — the unique identifier stored on a UHF tag to distinguish each item.'],
  ['TID', 'Tag Identifier — a permanent, factory-locked serial in a UHF chip, useful for authentication.'],
  ['UCODE', 'A family of NXP UHF chips (e.g. UCODE 8/9) widely used in retail and logistics labels.'],
  ['ICODE', 'A family of NXP HF (ISO 15693) chips used for library, retail and healthcare item tagging.'],
  ['Impinj', 'A leading maker of UHF RFID chips (Monza / M-series) and reader silicon.'],
  ['EAS', 'Electronic Article Surveillance — anti-theft tags that trigger an alarm at store exits.'],
  ['EMV', 'The global standard for chip bank cards, including secure contactless (tap) payment.'],
  ['Magnetic stripe', 'A magnetic band on a card storing data read by swiping; often combined with a chip.'],
  ['Proximity card', 'A contactless card (125 kHz or 13.56 MHz) read at short range for access control.'],
  ['Transponder', 'Another name for an RFID tag — it "responds" to a reader’s interrogation signal.'],
  ['Lamination', 'Bonding card layers under heat and pressure into a durable, sealed card body.'],
  ['Hot stamping', 'Applying metallic foil or holograms to a card surface for security or premium styling.'],
  ['Dual-frequency', 'A card or tag combining two chips/bands (e.g. LF+HF or HF+UHF) to work across systems.'],
  ['Duty cycle', 'How often a reader transmits; with read rate it governs how many tags are processed per second.'],
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
// ── 指南卡片原创 SVG 插图(与产品页示意图同一视觉语言)──
const GUIDE_ART = {
  'rfid-cards-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID cards illustration"><g>
<rect x="118" y="34" rx="12" width="150" height="94" fill="var(--bg-alt)" stroke="var(--line)" transform="rotate(-8 193 81)"/>
<rect x="148" y="28" rx="12" width="150" height="94" fill="#fff" stroke="var(--line)" transform="rotate(-3 223 75)"/>
<rect x="178" y="24" rx="12" width="150" height="94" fill="#fff" stroke="var(--brand-deep)" stroke-width="2"/>
<circle cx="216" cy="58" r="13" fill="none" stroke="var(--brand)" stroke-width="2.5"/><circle cx="216" cy="58" r="6.5" fill="none" stroke="var(--brand)" stroke-width="2"/><rect x="211" y="53" width="10" height="10" fill="var(--brand-deep)"/>
<path d="M240 58h66M240 76h66M240 94h44" stroke="var(--line)" stroke-width="7" stroke-linecap="round"/>
<path d="M196 118h114" stroke="var(--brand-2)" stroke-width="4" stroke-linecap="round"/></g></svg>`,
  'nfc-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NFC phone tap illustration"><g>
<rect x="96" y="18" rx="16" width="72" height="118" fill="#fff" stroke="var(--brand-deep)" stroke-width="2"/>
<rect x="108" y="34" rx="4" width="48" height="70" fill="var(--bg-alt)"/><circle cx="132" cy="120" r="6" fill="none" stroke="var(--line)" stroke-width="2"/>
<g stroke="var(--brand)" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M186 62c8 8 8 20 0 28"/><path d="M202 52c14 14 14 34 0 48"/><path d="M218 42c20 20 20 48 0 68"/></g>
<circle cx="284" cy="76" r="30" fill="var(--bg-alt)" stroke="var(--line)"/><circle cx="284" cy="76" r="17" fill="none" stroke="var(--brand)" stroke-width="2.5"/><rect x="279" y="71" width="10" height="10" fill="var(--brand-deep)"/>
<text x="322" y="82" font-size="13" fill="var(--muted)" font-weight="700">Tap</text></g></svg>`,
  'rfid-labels-inlays-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID labels and inlays illustration"><g>
<circle cx="86" cy="66" r="44" fill="var(--bg-alt)" stroke="var(--line)"/><circle cx="86" cy="66" r="13" fill="#fff" stroke="var(--line)"/>
<path d="M86 110 H360" stroke="var(--line)" stroke-width="12" stroke-linecap="round"/>
<g stroke="var(--brand-deep)" fill="#fff"><rect x="150" y="99" rx="6" width="56" height="22"/><rect x="226" y="99" rx="6" width="56" height="22"/><rect x="302" y="99" rx="6" width="56" height="22"/></g>
<g stroke="var(--brand)" fill="none" stroke-width="2"><path d="M158 110h18m5 0h10"/><path d="M234 110h18m5 0h10"/><path d="M310 110h18m5 0h10"/></g>
<rect x="238" y="26" rx="8" width="96" height="40" fill="#fff" stroke="var(--brand-deep)" stroke-width="2" transform="rotate(6 286 46)"/>
<path d="M250 46h28m6 0h14" stroke="var(--brand)" stroke-width="2.5" transform="rotate(6 286 46)"/></g></svg>`,
  'rfid-blocking-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID blocking illustration"><g>
<g stroke="var(--brand)" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M96 96c8-10 8-22 0-32"/><path d="M112 104c14-16 14-32 0-48"/><path d="M128 112c20-22 20-42 0-64"/></g>
<path d="M182 30v92" stroke="var(--brand-deep)" stroke-width="6" stroke-linecap="round"/>
<path d="M182 30c26 8 26 76 0 92" fill="none" stroke="var(--brand-2)" stroke-width="2.5"/>
<rect x="226" y="42" rx="10" width="132" height="80" fill="#fff" stroke="var(--line)"/>
<rect x="242" y="58" rx="4" width="44" height="30" fill="var(--bg-alt)"/><path d="M298 62h44M298 76h44M298 90h28" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
<path d="M330 108l10 10 18-20" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
  'rfid-readers-hardware-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID readers and hardware illustration"><g>
<rect x="76" y="76" rx="10" width="120" height="50" fill="var(--bg-alt)" stroke="var(--brand-deep)" stroke-width="2"/>
<circle cx="106" cy="101" r="9" fill="none" stroke="var(--brand)" stroke-width="2.5"/><path d="M126 94h52M126 108h36" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
<path d="M136 76V54h24" stroke="var(--line)" stroke-width="3"/>
<rect x="252" y="30" rx="12" width="58" height="96" fill="#fff" stroke="var(--brand-deep)" stroke-width="2"/>
<rect x="262" y="44" rx="4" width="38" height="52" fill="var(--bg-alt)"/><circle cx="281" cy="112" r="6" fill="none" stroke="var(--line)" stroke-width="2"/>
<g stroke="var(--brand)" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M326 62c8 8 8 20 0 28"/><path d="M340 52c14 14 14 34 0 48"/></g></g></svg>`,
  'rfid-wristband-materials.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wristband materials illustration"><g>
<rect x="66" y="30" rx="14" width="288" height="28" fill="var(--brand-2)" opacity=".85"/><circle cx="210" cy="44" r="9" fill="#fff"/><rect x="205" y="39" width="10" height="10" rx="2" fill="var(--brand-deep)"/>
<rect x="66" y="66" rx="14" width="288" height="28" fill="#fff" stroke="var(--brand-deep)" stroke-width="2"/><path d="M80 80h260" stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/><circle cx="210" cy="80" r="8" fill="none" stroke="var(--brand)" stroke-width="2"/>
<rect x="66" y="102" rx="14" width="288" height="28" fill="var(--bg-alt)" stroke="var(--line)"/><path d="M96 102l-14 28M136 102l-14 28M176 102l-14 28M216 102l-14 28M256 102l-14 28M296 102l-14 28M336 102l-14 28" stroke="var(--line)" stroke-width="1.5"/></g></svg>`,
  'rfid-key-fob-guide.html': `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID key fob illustration"><g>
<circle cx="150" cy="46" r="20" fill="none" stroke="var(--brand-deep)" stroke-width="5"/>
<rect x="128" y="60" rx="18" width="86" height="66" fill="var(--bg-alt)" stroke="var(--brand-deep)" stroke-width="2" transform="rotate(8 171 93)"/>
<circle cx="172" cy="94" r="15" fill="none" stroke="var(--brand)" stroke-width="2.5" transform="rotate(8 171 93)"/><rect x="167" y="89" width="10" height="10" fill="var(--brand-deep)" transform="rotate(8 171 93)"/>
<g stroke="var(--brand)" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M242 78c8 8 8 20 0 28"/><path d="M258 68c14 14 14 34 0 48"/></g>
<rect x="292" y="58" rx="8" width="64" height="76" fill="#fff" stroke="var(--line)"/><circle cx="324" cy="86" r="10" fill="none" stroke="var(--brand-deep)" stroke-width="2.5"/><rect x="318" y="106" width="12" height="16" rx="2" fill="var(--bg-alt)" stroke="var(--line)"/></g></svg>`,
};
// 对比卡:术语药丸 + VS 徽章;工具/基准/术语表:专属图标
function compArt(crumb) {
  const parts = String(crumb).split(/\s+vs\s+/i).slice(0, 3);
  const colors = ['var(--brand-2)', 'var(--brand)', 'var(--brand-deep)'];
  const n = parts.length;
  if (n < 2) return `<svg viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(crumb)}"><rect x="110" y="30" rx="18" width="200" height="36" fill="var(--bg-alt)" stroke="var(--line)"/><text x="210" y="53" text-anchor="middle" font-size="15" font-weight="700" fill="var(--brand-deep)">${esc(crumb)}</text></svg>`;
  const w = 420, pw = Math.min(150, (w - 60 * (n - 1) - 20) / n), gap = 60;
  const total = n * pw + (n - 1) * gap;
  let x = (w - total) / 2, out = '';
  parts.forEach((t, i) => {
    out += `<rect x="${x}" y="28" rx="19" width="${pw}" height="40" fill="${i === 1 ? '#fff' : 'var(--bg-alt)'}" stroke="${colors[i]}" stroke-width="2.5"/><text x="${x + pw / 2}" y="53" text-anchor="middle" font-size="${t.length > 10 ? 11 : 14}" font-weight="700" fill="var(--ink)">${esc(t)}</text>`;
    if (i < n - 1) { const cx = x + pw + gap / 2; out += `<circle cx="${cx}" cy="48" r="17" fill="var(--brand-deep)"/><text x="${cx}" y="53" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">VS</text>`; }
    x += pw + gap;
  });
  return `<svg viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(crumb)} comparison">${out}</svg>`;
}
const ART_SELECTOR = `<svg viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID selector tool"><g><path d="M90 60h240" stroke="var(--line)" stroke-width="8" stroke-linecap="round"/><path d="M90 60h150" stroke="var(--brand)" stroke-width="8" stroke-linecap="round"/><circle cx="240" cy="60" r="15" fill="#fff" stroke="var(--brand-deep)" stroke-width="3"/><path d="M118 30l8 8 14-16M196 30l8 8 14-16M274 30l8 8 14-16" stroke="var(--accent)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
const ART_BENCH = `<svg viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Benchmark data"><g><path d="M96 80h240" stroke="var(--line)" stroke-width="2"/><rect x="120" y="52" width="34" height="28" rx="4" fill="var(--brand-2)"/><rect x="176" y="38" width="34" height="42" rx="4" fill="var(--brand)"/><rect x="232" y="24" width="34" height="56" rx="4" fill="var(--brand-deep)"/><rect x="288" y="44" width="34" height="36" rx="4" fill="var(--bg-alt)" stroke="var(--line)"/></g></svg>`;
const ART_GLOSSARY = `<svg viewBox="0 0 420 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Glossary A to Z"><g><rect x="118" y="24" rx="10" width="52" height="52" fill="var(--bg-alt)" stroke="var(--line)"/><text x="144" y="59" text-anchor="middle" font-size="26" font-weight="800" fill="var(--brand-deep)">A</text><path d="M192 50h36" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/><path d="M220 42l10 8-10 8" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="250" y="24" rx="10" width="52" height="52" fill="#fff" stroke="var(--brand-deep)" stroke-width="2"/><text x="276" y="59" text-anchor="middle" font-size="26" font-weight="800" fill="var(--brand-deep)">Z</text></g></svg>`;

function hubPage() {
  const slug = 'guides.html';
  const card = (href, title, desc, art) => `<a class="cat-item" href="${href}" style="text-decoration:none">${art ? `<div class="cat-item__art">${art}</div>` : ''}<div class="cat-item__body" style="padding:18px"><h3 style="margin:0 0 6px">${esc(title)}</h3><p style="margin:0;color:var(--muted)">${esc(desc)}</p></div></a>`;
  const guides = GUIDES.map((g) => card(g.slug, g.crumb.replace(' Guide', '') + ' guide', g.lead, GUIDE_ART[g.slug] || '')).join('\n      ');
  const comps = card('/tools/rfid-selector/', '★ RFID Selector tool', 'Answer 5 quick questions and get an instant frequency, chip and product recommendation.', ART_SELECTOR) + '\n      ' + card('rfid-benchmark-2026.html', '★ 2026 RFID Selection Benchmark', 'Original reference data: frequency, read range, chip memory and material temperature limits.', ART_BENCH) + '\n      ' + COMPARISONS.map((c) => card(c.slug, c.crumb, c.lead, compArt(c.crumb))).join('\n      ');
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
      ${card('rfid-glossary.html', 'RFID & NFC glossary', 'A–Z of RFID and NFC terms explained in plain language.', ART_GLOSSARY)}
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
