/*
 * build-industries.js — 生成"行业解决方案"深度页 + /industries/ 中心页。
 * 每页:答案前置 + 痛点 + RFID 方案 + 推荐产品(内链)+ 典型成效表 + 相关案例/指南 + FAQ。
 * Schema: Article + Service + FAQPage + BreadcrumbList。这类"行业应用页"既吃商业意图长尾,也利于 AI 引用。
 * 运行: node build-industries.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const SITE = 'https://www.rfidmfg.com';
const UPDATED = 'June 18, 2026';
const UPDATED_ISO = '2026-06-18';
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
const TOPBAR = `<div class="topbar"><div class="container topbar__inner"><span class="topbar__item">Established 1996 · Shenzhen, China</span><div class="topbar__contact"><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a></div></div></div>`;
const HEADER = `<header class="header" id="header"><div class="container header__inner"><a href="index.html" class="brand" aria-label="RFID MFG home"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><nav class="nav" id="nav">
${NAV}
    </nav><a href="contact.html" class="btn btn--primary header__cta">Get a Quote</a><button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>`;
const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing since 1996.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="industries.html">Industries</a><a href="cases.html">Cases</a><a href="guides.html">Guides</a><a href="news.html">Blog</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;
const ICONS = `<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />`;
const GA4 = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFYMHHLN3Q"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZFYMHHLN3Q');</script>`;

const card = (href, title, desc) => `<a class="cat-item" href="${href}" style="text-decoration:none"><div class="cat-item__body" style="padding:18px"><h3 style="margin:0 0 6px">${esc(title)}</h3><p style="margin:0;color:var(--muted)">${esc(desc)}</p></div></a>`;
const POINTS = (arr) => `<ul class="check-list">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const P = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('\n      ');
function TABLE(head, rows) {
  const th = head.map((h) => `<th>${esc(h)}</th>`).join('');
  const tr = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

// ===================== DATA =====================
const INDUSTRIES = [
  {
    slug: 'retail', crumb: 'Retail & Apparel',
    title: 'RFID for Retail & Apparel — Inventory Accuracy & Loss Prevention',
    desc: 'How item-level RFID lifts retail inventory accuracy to 95%+, cuts out-of-stocks and shrink, and powers accurate omnichannel fulfilment — with the tags and labels to deploy it.',
    h1: 'RFID for Retail & Apparel',
    lead: 'Item-level RFID raises retail inventory accuracy from a typical 60–70% to 95%+, cutting out-of-stocks and shrink and enabling fast, accurate omnichannel fulfilment.',
    challenges: ['Inventory records that drift from reality, causing missed sales', 'Out-of-stocks and overstocks from inaccurate counts', 'Shrinkage and theft at the shelf and exit', 'Slow, labour-heavy manual stock takes', 'Errors in buy-online / ship-from-store fulfilment'],
    solution: ['Each item is tagged at source with a low-cost UHF RFID label or hang-tag carrying a unique EPC. Staff cycle-count a whole rail or shelf in seconds with a handheld reader, and overhead or exit readers flag stock movement and theft in real time.', 'Because every unit is individually identified, the same data drives store replenishment, online availability and ship-from-store — so the customer sees accurate stock wherever they shop.', 'Rollout is straightforward when the tags are right. Apparel and general merchandise use UHF paper labels or hang-tags; small, high-value items such as jewelry and cosmetics use miniature or on-metal tags; and many retailers specify a combined RFID-plus-barcode label so existing POS keeps working through the transition. As a manufacturer we supply these pre-encoded to your EPC/SGTIN scheme and printed with your artwork, so tags arrive ready to apply at source or in the DC.'],
    benefits: ['Inventory accuracy commonly reaches 95–99%', 'Stock takes run 10–20× faster than barcode', 'Out-of-stocks fall, lifting sales of in-demand lines', 'Shrink is reduced with EAS at the exit', 'Reliable omnichannel (BOPIS / ship-from-store) fulfilment'],
    products: [['uhf-rfid-label.html', 'UHF RFID Label', 'Roll-fed smart labels for item-level apparel and retail tagging.'], ['rfid-wet-inlay.html', 'RFID Wet Inlay', 'Adhesive UHF inlays for fast peel-and-stick tagging.'], ['rfid-jewelry-tag.html', 'RFID Jewelry Tag', 'Tiny UHF tags for high-value jewelry and accessories.'], ['rfid-reader-writer.html', 'RFID Readers / Writers', 'Handheld and fixed UHF readers for counts and exits.']],
    metricsHead: ['KPI', 'Typical before', 'With item-level RFID'],
    metricsRows: [['Inventory accuracy', '60–70%', '95–99%'], ['Full stock count', 'Hours / days', 'Minutes'], ['Out-of-stock rate', 'Baseline', 'Down ~20–30%'], ['Shrink visibility', 'Periodic', 'Continuous (EAS)']],
    caseLink: ['cases.html', 'See related deployments in our case studies'],
    guides: [['rfid-vs-barcode.html', 'RFID vs barcode: when to switch'], ['rfid-frequencies-lf-hf-uhf.html', 'Why UHF suits retail (frequency guide)'], ['rfid-dry-vs-wet-inlay.html', 'Dry vs wet inlay for labels']],
    faqs: [['Which RFID frequency does retail use?', 'Retail item-level tagging uses passive UHF (860–960 MHz, EPC Gen2) for fast bulk reads at 1–8 metres.'], ['How much does an RFID apparel tag cost?', 'High-volume UHF labels and hang-tags are low-cost per unit; share your volume and format for a quote.'], ['Will RFID replace our barcodes?', 'Most retailers run both during transition — many tags carry a printed barcode and a UHF chip so existing POS keeps working.']],
  },
  {
    slug: 'warehouse', crumb: 'Warehouse & Logistics',
    title: 'RFID for Warehouse & Logistics — Receiving, Inventory & Shipping',
    desc: 'Automate receiving, putaway, cycle counts and dispatch with UHF RFID — read whole pallets at once for real-time inventory and error-free shipping.',
    h1: 'RFID for Warehouse & Logistics',
    lead: 'UHF RFID reads entire pallets and cartons at once through dock-door portals, automating receiving, cycle counts and dispatch for real-time inventory and near-zero shipping errors.',
    challenges: ['Slow, manual barcode scanning at receiving and dispatch', 'Miscounts and lost or misplaced stock', 'No real-time view of what is on hand or in transit', 'Returnable assets (totes, cages, pallets) going missing', 'Labour-intensive cycle counts'],
    solution: ['Cartons and pallets carry UHF labels; fixed readers in dock-door portals capture everything that passes without line of sight, while handhelds speed cycle counts and putaway. Rugged anti-metal tags identify returnable totes, racking and equipment.', 'The result is a live inventory record and an automatic, verified count at every receiving and shipping event.', 'The key to reliability is matching the tag to the load. Plain cartons take economical paper labels; metal racking, steel totes and drums need on-metal tags with a spacer or ferrite; and pallets of liquid need inlays tuned for high water content. We manufacture the full range — labels, inlays and hard tags — and pre-encode them to your SSCC or internal numbering, then help specify the dock-door and handheld readers so the whole system is sourced and tuned together.'],
    benefits: ['Receiving and dispatch verified automatically at the door', 'Inventory accuracy typically 95%+', 'Shipping and picking errors sharply reduced', 'Returnable assets tracked and recovered', 'Cycle counts in a fraction of the time'],
    products: [['uhf-rfid-label.html', 'UHF RFID Label', 'Carton and pallet labels for supply-chain visibility.'], ['rfid-anti-metal-tag.html', 'Anti-Metal Tag', 'Rugged tags for totes, racking and equipment.'], ['rfid-reader-writer.html', 'RFID Readers / Gateways', 'Fixed dock-door portals and handheld readers.'], ['rfid-smart-cabinet.html', 'RFID Smart Cabinet', 'Automated control for tools and high-value assets.']],
    metricsHead: ['Process', 'Manual / barcode', 'With UHF RFID'],
    metricsRows: [['Pallet receiving', 'Scan each carton', 'Read whole pallet at the door'], ['Inventory accuracy', '~80%', '95%+'], ['Cycle count', 'Hours', 'Minutes'], ['Shipping errors', 'Baseline', 'Greatly reduced']],
    caseLink: ['case-warehouse.html', 'Case study: warehouse management'],
    guides: [['rfid-frequencies-lf-hf-uhf.html', 'LF vs HF vs UHF for logistics'], ['rfid-vs-barcode.html', 'RFID vs barcode'], ['rfid-readers-hardware-guide.html', 'Choosing RFID readers & hardware']],
    faqs: [['How far can warehouse RFID read?', 'Passive UHF reads cartons and pallets at roughly 1–10 metres, enough for dock-door portals and forklift-mounted readers.'], ['Does RFID work on metal shelving and liquids?', 'Standard labels are detuned by metal and liquids; on-metal (anti-metal) tags restore reliable reads on those surfaces.'], ['Can RFID integrate with our WMS?', 'Yes — readers output standard data (EPC, MQTT/HTTP) that integrates with common WMS/ERP platforms.']],
  },
  {
    slug: 'healthcare', crumb: 'Healthcare & Hospitals',
    title: 'RFID for Healthcare & Hospitals — Asset, Instrument & Linen Tracking',
    desc: 'RFID tracks mobile equipment, surgical instruments through sterilisation, linen and patients — improving utilisation, compliance and patient safety.',
    h1: 'RFID for Healthcare & Hospitals',
    lead: 'RFID tracks mobile equipment, surgical instrument sets through high-temperature sterilisation, linen and patient wristbands — raising asset utilisation and supporting patient safety and compliance.',
    challenges: ['Nurses losing time searching for mobile equipment', 'Low utilisation of expensive shared assets', 'Tracking instrument sets through autoclave sterilisation', 'Specimen and sample chain-of-custody', 'Linen and uniform loss in hospital laundries'],
    solution: ['Anti-metal and asset tags identify pumps, beds and devices so staff locate them instantly and utilisation rises. High-temperature tags survive autoclave cycles to track surgical trays, while laundry tags follow linen through industrial washing. Patient wristbands carry an HF/NFC ID for safe identification.', 'Each scan builds an auditable record — supporting par-level management, recalls and regulatory compliance.', 'Healthcare is unusually demanding on the tag, which is why the material matters as much as the chip. Surgical instrument tags are PPS or ceramic rated for repeated autoclave cycles; equipment tags are on-metal designs that read on stainless steel; linen tags are sealed silicone that survives hundreds of industrial washes; and patient bands are soft, single-use HF/NFC. We manufacture each of these so a hospital can standardise on one supplier and encode every tag to its own system before delivery.'],
    benefits: ['Less time spent searching for equipment', 'Higher utilisation of shared, high-value assets', 'Sterilisation-safe instrument tracking', 'Linen loss reduced with washable tags', 'Auditable records for compliance and recalls'],
    products: [['high-temperature-rfid-tag.html', 'High-Temperature RFID Tag', 'Survives autoclave and sterilisation up to 260 °C.'], ['rfid-anti-metal-tag.html', 'Anti-Metal Tag', 'For equipment and devices with metal surfaces.'], ['rfid-laundry-tag.html', 'RFID Laundry Tag', 'Washable tags for linen and uniform tracking.'], ['rfid-silicone-wristband.html', 'RFID Wristband', 'Comfortable HF/NFC bands for patient ID.']],
    metricsHead: ['Goal', 'Without RFID', 'With RFID'],
    metricsRows: [['Find mobile equipment', 'Manual search', 'Locate by last read'], ['Asset utilisation', 'Low', 'Improved'], ['Instrument tracking', 'Paper / manual', 'Sterilisation-safe tags'], ['Linen management', 'High loss', 'Tracked per item']],
    caseLink: ['cases.html', 'Explore related case studies'],
    guides: [['rfid-frequencies-lf-hf-uhf.html', 'Choosing the right frequency'], ['rfid-chips-mifare-ntag-desfire.html', 'Secure chips for healthcare ID']],
    faqs: [['Can RFID tags survive autoclave sterilisation?', 'Yes — high-temperature tags in PPS or ceramic withstand autoclave and sterilisation cycles up to about 250–260 °C.'], ['Is RFID safe around medical equipment?', 'Passive RFID transmits at low power on licensed bands; deployments should still be validated against facility EMC policies.'], ['Which frequency for hospital asset tracking?', 'UHF for room/zone-level location and inventory; HF/NFC for close-range patient and item identification.']],
  },
  {
    slug: 'hospitality', crumb: 'Hotels & Hospitality',
    title: 'RFID for Hotels & Hospitality — Keycards, Access & Linen',
    desc: 'From RFID keycards and access to linen and cashless resort wristbands, RFID streamlines the guest journey and back-of-house operations for hotels and resorts.',
    h1: 'RFID for Hotels & Hospitality',
    lead: 'RFID keycards, NFC guest services, washable linen tags and cashless resort wristbands streamline both the guest experience and back-of-house operations for hotels and resorts.',
    challenges: ['Managing and securing room keys at scale', 'Branded, reliable guest access across many locks', 'Linen and towel loss in laundry operations', 'Slow cashless payment at resorts and pools', 'Creating a premium, tappable guest experience'],
    solution: ['RFID keycards work with leading lock systems and carry full-colour branding for a premium first touch. NFC cards and labels enable tap-to-access guest services, while washable laundry tags cut linen loss. At resorts and water parks, waterproof wristbands handle access and cashless spend.', 'Everything ties back to the guest profile for a smooth, secure stay.', 'Compatibility is the practical starting point: keycards must match the property’s locks, so we produce cards for ADEL, Salto, Hune, Be-Tech, Ving and most RFID and magstripe systems, encoded and printed with the hotel’s brand. Linen and towels take sealed silicone laundry tags rated for 200+ wash cycles, and resort wristbands are waterproof silicone for pools and beaches. Producing keycards, tags and wristbands in-house lets a group standardise branding and sourcing across every property.'],
    benefits: ['Branded keycards compatible with major locks', 'Tap-to-access NFC guest services', 'Linen loss reduced with washable tags', 'Fast, waterproof cashless payment at resorts', 'A premium, modern guest experience'],
    products: [['hotel-key-card.html', 'Hotel Keycard', 'RFID & magstripe keycards for every major lock brand.'], ['rfid-nfc-card.html', 'RFID / NFC Card', 'Contactless cards for access and guest services.'], ['rfid-laundry-tag.html', 'RFID Laundry Tag', 'Washable tags for hotel linen and towels.'], ['rfid-silicone-wristband.html', 'RFID Silicone Wristband', 'Waterproof bands for resort access and cashless.']],
    metricsHead: ['Touchpoint', 'Traditional', 'With RFID / NFC'],
    metricsRows: [['Room access', 'Mechanical / magstripe', 'Contactless keycard'], ['Guest services', 'Manual', 'Tap-to-access NFC'], ['Linen control', 'High loss', 'Tracked per item'], ['Resort payment', 'Cash / card', 'Waterproof wristband']],
    caseLink: ['cases.html', 'Explore related case studies'],
    guides: [['rfid-cards-guide.html', 'The complete RFID cards guide'], ['nfc-guide.html', 'NFC cards, tags & labels guide']],
    faqs: [['Which lock systems do your hotel keycards support?', 'Our keycards work with ADEL, Salto, Hune, Be-Tech, Ving and most RFID and magstripe locks — tell us your lock brand.'], ['Can guests use their phone instead of a card?', 'Yes — NFC cards and tags support tap interactions, and NFC-enabled programmes can extend to phones.'], ['Do washable laundry tags really survive hotel laundry?', 'Yes — silicone/PPS laundry tags withstand 200+ industrial wash-and-press cycles.']],
  },
  {
    slug: 'events', crumb: 'Events & Festivals',
    title: 'RFID for Events & Festivals — Cashless, Access & Analytics',
    desc: 'RFID wristbands power cashless payment, fast access and crowd analytics at festivals, concerts and stadiums — cutting queues and lifting on-site spend.',
    h1: 'RFID for Events & Festivals',
    lead: 'RFID wristbands turn each attendee into a secure, tappable credential for cashless payment, fast gated access and real-time crowd analytics — shortening queues and lifting on-site spend.',
    challenges: ['Long entry queues and ticket fraud', 'Slow cash handling at bars and stalls', 'No real-time view of crowd flow and capacity', 'Ticket transfer and counterfeiting', 'Linking attendees to engagement and analytics'],
    solution: ['Each guest wears a silicone or single-use paper wristband encoded for access and cashless spend. Readers at gates and bars validate and charge in a tap, while the data stream shows live entry counts and zone occupancy.', 'NFC interactions add social, voting and brand-activation moments that deepen engagement.', 'The band is chosen for the event: Tyvek paper for one-day concerts, woven fabric for multi-day festivals, and waterproof silicone for water parks and VIP. The chip follows the interaction — NTAG or MIFARE HF/NFC for tap-to-pay and social moments, or UHF where organisers want longer-range gate reads. We manufacture all three band types with full edge-to-edge print and pre-encoding, so tens of thousands of credentials arrive branded and ready for gates and bars.'],
    benefits: ['Faster entry and shorter queues', 'Cashless spend that typically lifts on-site revenue', 'Reduced fraud and ticket transfer', 'Live crowd-flow and capacity analytics', 'Interactive NFC brand activations'],
    products: [['rfid-silicone-wristband.html', 'RFID Silicone Wristband', 'Reusable waterproof bands for access and cashless.'], ['disposable-paper-wristband.html', 'Disposable Paper Wristband', 'Low-cost single-use Tyvek bands for one-day events.'], ['nfc-printed-label.html', 'NFC Printed Label', 'Tap-to-engage NFC for activations and posters.'], ['rfid-reader-writer.html', 'RFID Readers / Writers', 'Gate and bar readers for access and payment.']],
    metricsHead: ['Area', 'Without RFID', 'With RFID wristbands'],
    metricsRows: [['Entry', 'Manual ticket check', 'Tap-through access'], ['Payment', 'Cash queues', 'Cashless tap'], ['Fraud', 'Hard to control', 'Encoded & verifiable'], ['Analytics', 'Estimates', 'Live counts by zone']],
    caseLink: ['case-events.html', 'Case study: events & festivals'],
    guides: [['nfc-guide.html', 'NFC cards, tags & labels guide'], ['rfid-frequencies-lf-hf-uhf.html', 'Frequencies for events']],
    faqs: [['Are event wristbands reusable or single-use?', 'Both — silicone bands are waterproof and reusable, while Tyvek paper bands are a low-cost single-use option.'], ['How does cashless RFID payment work at events?', 'A balance or token is encoded to the wristband; bar readers debit it in a tap, with top-ups online or at kiosks.'], ['Can wristbands stop ticket fraud?', 'Yes — each band is uniquely encoded and validated at the gate, making transfer and counterfeiting far harder.']],
  },
  {
    slug: 'livestock', crumb: 'Livestock & Agriculture',
    title: 'RFID for Livestock & Agriculture — Animal ID & Traceability',
    desc: 'RFID ear tags and readers give each animal a unique, ISO-standard ID for herd management, disease control and farm-to-fork traceability.',
    h1: 'RFID for Livestock & Agriculture',
    lead: 'LF RFID ear tags give each animal a unique, ISO 11784/85 identity — supporting herd management, disease control and farm-to-fork traceability with a quick handheld scan.',
    challenges: ['Manual, error-prone animal records', 'Regulatory traceability and movement reporting', 'Tracking disease, treatment and vaccination history', 'Capturing individual weight, breeding and yield data', 'Harsh outdoor and on-animal conditions'],
    solution: ['Each animal wears a rugged LF ear tag to ISO 11784/85 (FDX-B). A handheld or race-side panel reader captures the ID and links it to herd-management software, so treatments, weights and movements are recorded against the right animal in seconds.', 'The unique ID underpins traceability all the way from farm to processor.', 'Because tags live outdoors on the animal for years, material and standard matter most. Ear tags are moulded in UV- and water-resistant TPU/PP, sealed to IP68, and encoded to ISO 11784/85 (FDX-B) at 134.2 kHz so they read on any compliant panel or handheld reader worldwide. We can pre-print visual ID numbers to match the electronic ID and supply the LF readers alongside, so a farm or co-op gets a matched, standards-compliant system from one source.'],
    benefits: ['A unique, standards-based identity per animal', 'Accurate, fast record-keeping in the field', 'Supports traceability and movement compliance', 'Better disease, breeding and yield management', 'Durable tags for harsh outdoor use'],
    products: [['rfid-animal-tag.html', 'RFID Animal Tag', 'ISO 11784/85 ear tags for livestock identification.'], ['rfid-reader-writer.html', 'RFID Readers / Writers', 'Handheld and panel LF readers for animal ID.'], ['specialty-rfid-tags.html', 'Specialty RFID Tags', 'Custom durable tags for niche agricultural needs.']],
    metricsHead: ['Task', 'Manual', 'With RFID'],
    metricsRows: [['Animal identification', 'Visual / paper', 'Unique electronic ID'], ['Record accuracy', 'Error-prone', 'Linked to the animal'], ['Traceability', 'Difficult', 'Farm-to-fork'], ['Field data capture', 'Slow', 'One quick scan']],
    caseLink: ['cases.html', 'Explore related case studies'],
    guides: [['rfid-frequencies-lf-hf-uhf.html', 'Why livestock uses LF (frequency guide)'], ['rfid-cards-guide.html', 'RFID basics']],
    faqs: [['Which RFID standard is used for animal ID?', 'Livestock ear tags follow ISO 11784/11785 (FDX-B) at LF 134.2 kHz, the global standard for animal identification.'], ['Are the ear tags durable enough for outdoor use?', 'Yes — they use UV- and water-resistant TPU/PP rated to IP68 for years of on-animal use.'], ['Can the tags link to herd-management software?', 'Yes — readers pass the unique ID to common herd and farm-management platforms.']],
  },
];

// ===================== PAGE TEMPLATE =====================
function page(slug, headExtra, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${headExtra}
${FONTS}
${ICONS}
<link rel="stylesheet" href="styles.css" />
${GA4}
</head>
<body>
${TOPBAR}
${HEADER}
<main>
${body}
</main>
${FOOTER}
<a href="#" class="to-top" id="toTop" aria-label="Back to top">↑</a>
<script src="script.js"></script>
</body>
</html>
`;
}

const INDUSTRY_IMG = {
  retail: ['images/rfid-white-label-sticker.webp', 'UHF RFID apparel label for item-level retail inventory', 'Item-level UHF labels drive 95%+ retail inventory accuracy.'],
  warehouse: ['images/rfid-warehouse-management.webp', 'RFID warehouse management with dock-door portal reads', 'Dock-door portals read whole pallets without line of sight.'],
  healthcare: ['images/rfid-anti-metal-tag.webp', 'Anti-metal RFID tag for tracking medical equipment', 'Anti-metal and high-temperature tags track equipment and sterilised instruments.'],
  hospitality: ['images/hotel-rfid-key-card.webp', 'Branded RFID hotel keycard for contactless room access', 'RFID keycards work across major lock brands with full-colour branding.'],
  events: ['images/rfid-event-wristbands.webp', 'RFID event wristbands for access control and cashless payment', 'One wristband handles entry, cashless payment and access.'],
  livestock: ['images/rfid-animal-ear-tag.webp', 'RFID livestock ear tag for ISO 11784/85 animal identification', 'LF ear tags follow the ISO 11784/85 animal-ID standard.'],
};

function industryPage(ind) {
  const slug = 'industry-' + ind.slug + '.html';
  const iimg = INDUSTRY_IMG[ind.slug];
  const iFigure = iimg ? `<figure style="margin:6px auto 22px;max-width:560px"><img src="${iimg[0]}" alt="${esc(iimg[1])}" loading="lazy" width="300" height="300" style="width:100%;height:auto;border-radius:12px;border:1px solid var(--line,#e5e9f0)" /><figcaption style="font-size:13px;color:var(--muted,#6b7a90);margin-top:8px;text-align:center">${esc(iimg[2])}</figcaption></figure>` : '';
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: ind.h1, description: ind.desc, image: iimg ? SITE + '/' + iimg[0] : SITE + '/og-image.jpg', datePublished: UPDATED_ISO, dateModified: UPDATED_ISO, author: { '@type': 'Organization', name: 'RFID MFG', url: SITE + '/about.html' }, publisher: { '@type': 'Organization', name: 'RFID MFG', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } }, mainEntityOfPage: SITE + '/' + slug },
    { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'RFID solutions for ' + ind.crumb, provider: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.', url: SITE + '/' }, areaServed: 'Worldwide', description: ind.desc, url: SITE + '/' + slug },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Industries', item: SITE + '/industries.html' }, { '@type': 'ListItem', position: 3, name: ind.crumb, item: SITE + '/' + slug }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: ind.faqs.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) },
  ];
  const ldHtml = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x)}\n</script>`).join('\n');
  const head = `<title>${esc(ind.title)} | RFID MFG</title>
<meta name="description" content="${esc(ind.desc)}" />
<link rel="canonical" href="${SITE}/${slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="${esc(ind.title)}" />
<meta property="og:description" content="${esc(ind.desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
${ldHtml}`;
  const prods = ind.products.map((p) => card(p[0], p[1], p[2])).join('\n        ');
  const guides = ind.guides.map((g) => `<li><a href="${g[0]}">${esc(g[1])}</a></li>`).join('');
  const body = `<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner" style="padding:54px 24px 48px">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="industries.html">Industries</a><span>/</span>${esc(ind.crumb)}</nav>
    <h1>${esc(ind.h1)}</h1>
    <p>${esc(ind.desc)}</p>
  </div>
</section>
<section class="section">
  <div class="container article">
    <div class="article-body">
      <p style="font-size:13px;color:var(--muted,#6b7a90);margin:0 0 18px">By ${esc(AUTHOR)} · Updated ${esc(UPDATED)}</p>
      <div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px;margin-bottom:22px"><strong>In short:</strong> ${esc(ind.lead)}</div>
      ${iFigure}
      <h2>The challenges</h2>
      ${POINTS(ind.challenges)}
      <h2>How RFID helps</h2>
      ${P(ind.solution)}
      <h2>Benefits</h2>
      ${POINTS(ind.benefits)}
      <h2>Typical impact</h2>
      ${TABLE(ind.metricsHead, ind.metricsRows)}
      <p style="font-size:13px;color:var(--muted)">Figures are typical ranges commonly reported across industry deployments; actual results vary by environment, process and integration.</p>
      <h2>Recommended products</h2>
      <div class="catalog-grid" style="margin-top:8px">
        ${prods}
      </div>
      <h2>Related reading</h2>
      <ul class="check-list">${guides}<li><a href="${ind.caseLink[0]}">${esc(ind.caseLink[1])}</a></li></ul>
    </div>
    <div class="article-back"><a href="industries.html" class="link-arrow"><span>←</span> All industries</a></div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Deploying RFID in ${esc(ind.crumb.toLowerCase())}?</h2><p>Tell us your use case and we will recommend the chip, frequency and format and quote within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Get Expert Advice</a>
  </div>
</section>`;
  return page(slug, head, body);
}

function hubPage() {
  const slug = 'industries.html';
  const items = INDUSTRIES.map((i) => card('industry-' + i.slug + '.html', i.crumb, i.lead)).join('\n        ');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'RFID Solutions by Industry', url: SITE + '/' + slug, description: 'RFID and NFC solutions by industry — retail, warehouse & logistics, healthcare, hospitality, events and livestock.' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Industries', item: SITE + '/' + slug }] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'RFID Industries', itemListElement: INDUSTRIES.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.crumb, url: SITE + '/industry-' + i.slug + '.html' })) },
  ];
  const ldHtml = ld.map((x) => `<script type="application/ld+json">\n${JSON.stringify(x)}\n</script>`).join('\n');
  const desc = 'RFID and NFC solutions by industry from RFID MFG — retail, warehouse & logistics, healthcare, hospitality, events and livestock, each with recommended products and typical results.';
  const head = `<title>RFID Solutions by Industry — Retail, Logistics, Healthcare & More | RFID MFG</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${slug}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta name="theme-color" content="#0a1b34" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="RFID Solutions by Industry | RFID MFG" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
${ldHtml}`;
  const body = `<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span>Industries</nav>
    <h1>RFID solutions by industry</h1>
    <p>How RFID and NFC solve real problems across sectors — with the products and typical results for each. Nearly three decades of manufacturing behind every deployment.</p>
  </div>
</section>
<section class="section">
  <div class="container" style="max-width:820px">
    <div class="lead-line" style="border-left:4px solid var(--brand,#0aa2e8);background:#f4f8fc;padding:14px 18px;border-radius:8px"><strong>In short:</strong> the right RFID solution is driven by your environment, not just your sector — read range, surface (metal or liquid), temperature and whether a phone must read the tag all shape the choice. Below, each industry page pairs the common challenges with the recommended chip, frequency and format, plus typical, measurable results.</div>
    <p style="color:var(--muted);margin-top:16px">Most deployments run on UHF (860–960 MHz) for long-range bulk reads in <a href="industry-retail.html">retail</a> and <a href="industry-warehouse.html">warehousing</a>, or HF/NFC (13.56 MHz) for tap-based <a href="industry-hospitality.html">hospitality</a> and <a href="industry-events.html">event</a> credentials, while <a href="industry-livestock.html">livestock</a> uses LF ear tags. Not sure which fits? Compare bands in the <a href="rfid-frequencies-lf-hf-uhf.html">LF vs HF vs UHF guide</a>, weigh <a href="rfid-vs-barcode.html">RFID vs barcode</a>, or browse the full <a href="products.html">product catalog</a>.</p>
  </div>
</section>
<section class="section section--alt">
  <div class="container">
    <div class="catalog-grid">
        ${items}
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Don't see your industry?</h2><p>We supply RFID for many more sectors. Tell us your application and we'll recommend a solution.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Talk to an Expert</a>
  </div>
</section>`;
  return page(slug, head, body);
}

// ===================== GENERATE =====================
let n = 0;
for (const ind of INDUSTRIES) { fs.writeFileSync(path.join(OUT, 'industry-' + ind.slug + '.html'), industryPage(ind)); n++; }
fs.writeFileSync(path.join(OUT, 'industries.html'), hubPage()); n++;
console.log(`Generated ${n} pages (${INDUSTRIES.length} industries + hub).`);
