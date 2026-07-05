/*
 * build-products.js — 生成 25 个产品详情页 + 重建 products.html 目录页
 * 运行: node build-products.js   (在本文件夹内)
 * 所有页面共用 header/footer/导航与 SEO 模板;改产品内容只需改下面的 PRODUCTS 数组,重跑即可。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const SITE = 'https://www.rfidmfg.com';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATS = {
  cards: { name: 'Cards', sub: 'Contact, contactless & specialty card constructions', icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" stroke-width="1.6"/><rect x="5" y="9" width="5" height="4" rx="1" fill="currentColor"/><path d="M14 10h5M14 13h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
  labels: { name: 'RFID Labels & Stickers', sub: 'Inlays & printable smart labels for tagging at scale', icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="12" r="2.2" stroke="currentColor" stroke-width="1.6"/><path d="M14 10c1.2.8 1.2 3.2 0 4M16.5 8.5c2.2 1.6 2.2 5.4 0 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
  tags: { name: 'RFID Tags', sub: 'Rugged tags built for demanding environments', icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9.5 11 4l9 5.5-9 5.5-7-4.3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 15v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="11" cy="9.3" r="1.4" fill="currentColor"/></svg>' },
  blocking: { name: 'RFID Blocking', sub: 'Privacy protection against unauthorized scans', icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  hardware: { name: 'Hardware', sub: 'Readers, modules and IoT terminals', icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 20h8M12 17v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7 8h4M7 11h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
};
const CAT_ORDER = ['cards', 'labels', 'tags', 'blocking', 'hardware'];
// 与 contact.html 表单 <select> 选项文案对应,用于产品页 CTA 预填
const SELECT_LABEL = { cards: 'Cards', labels: 'Labels & Stickers', tags: 'RFID Tags', blocking: 'RFID Blocking', hardware: 'Hardware' };

// 真实产品图(来自 mindrfid.com 的 CDN)。没有的子类暂用渐变占位;补图只需在此加一行。
const IMGBASE = 'images/';
const IMG = {
  'contact-ic-chip-card': IMGBASE + 'contact-ic-chip-card.webp',
  'hotel-key-card': IMGBASE + 'hotel-rfid-key-card.webp',
  'pvc-cards': IMGBASE + 'transparent-pvc-card.webp',
  'rfid-nfc-card': IMGBASE + 'ev-charging-rfid-card.webp',
  'project-based-card': IMGBASE + 'project-based-rfid-card.webp',
  'wooden-rfid-card': IMGBASE + 'wooden-rfid-card.webp',
  'metal-card': IMGBASE + 'metal-rfid-card.webp',
  'nfc-printed-label': IMGBASE + 'nfc-printed-label.webp',
  'rfid-dry-inlay': IMGBASE + 'rfid-dry-inlay.webp',
  'rfid-wet-inlay': IMGBASE + 'rfid-wet-inlay.webp',
  'rfid-white-label': IMGBASE + 'rfid-white-label-sticker.webp',
  'rfid-wristband': IMGBASE + 'leather-rfid-wristband.webp',
  'special-rfid-tags': IMGBASE + 'rfid-laundry-tag.webp',
  'barcode-scan-module': IMGBASE + 'barcode-scan-module.webp',
  'rfid-epoxy-card': IMGBASE + 'rfid-epoxy-card.webp',
  'eco-friendly-card': IMGBASE + 'eco-friendly-rfid-card.webp',
  'rfid-animal-tag': IMGBASE + 'rfid-animal-ear-tag.webp',
  'rfid-anti-metal-tag': IMGBASE + 'rfid-anti-metal-tag.webp',
  'rfid-keyfob': IMGBASE + 'rfid-keyfob.webp',
  'rfid-blocking-card': IMGBASE + 'rfid-blocking-card.webp',
  'rfid-blocking-sleeves': IMGBASE + 'rfid-blocking-sleeves.webp',
  'rfid-blocking-wallet': IMGBASE + 'rfid-blocking-wallet.webp',
  'rfid-reader-writer': IMGBASE + 'hf-usb-rfid-card-reader.webp',
  'rfid-smart-cabinet': IMGBASE + 'rfid-smart-tool-cabinet.webp',
  // 新增长尾产品(已有真实图的)
  'nfc-business-card': IMGBASE + 'nfc-metal-card.webp',
  'dual-frequency-card': IMGBASE + 'smart-ic-bank-card.webp',
  'magnetic-stripe-card': IMGBASE + 'magnetic-member-card.webp',
  'scratch-card': IMGBASE + 'pvc-scratch-card.webp',
  'rfid-laundry-tag': IMGBASE + 'rfid-laundry-tag.webp',
  'rfid-silicone-wristband': IMGBASE + 'rfid-event-wristbands.webp',
  'disposable-paper-wristband': IMGBASE + 'paper-rfid-wristband.webp',
  // 之前缺图的 8 个产品 —— 先用现有的干净 webp 就近匹配(无占位符、无水印)。
  // 若要换成 mindrfid 的精确产品照,见 download-images.sh 里新增的 URL:跑脚本+去水印后我再把下面几行指到真实图。
  'uhf-rfid-label': IMGBASE + 'rfid-white-label-sticker.webp',
  'rfid-library-tag': IMGBASE + 'rfid-library-system.webp',
  'high-temperature-rfid-tag': IMGBASE + 'rfid-laundry-tag.webp',
  'industrial-iot-dtu-rtu': IMGBASE + 'barcode-scan-module.webp',
  'rfid-jewelry-tag': IMGBASE + 'rfid-jewelry-tag.webp',
  'uhf-windshield-tag': IMGBASE + 'uhf-windshield-tag.webp',
  'nfc-dog-tag': IMGBASE + 'rfid-keyfob.webp',
  'rfid-seal-tag': IMGBASE + 'rfid-white-label-sticker.webp',
};

// 行业标准内容模块(每个产品页共用)
const FEATURES = {
  cards: ['Custom chip, size, artwork and finish', 'Full-color offset / silkscreen printing', 'Encoding, numbering and personalization', 'Durable construction with long service life', 'Low MOQ with fast, reliable lead times'],
  labels: ['Roll-to-roll supply for high-speed application', 'Custom antenna and die-cut sizes', 'Pre-encoded or blank for your own workflow', 'Strong adhesives for varied surfaces', 'Consistent read performance across HF / UHF'],
  tags: ['Rugged builds for demanding environments', 'Waterproof and temperature-resistant options', 'Custom shape, color and mounting', 'Wide chip and frequency selection', 'On-metal and specialty variants available'],
  blocking: ['Effective 13.56 MHz scan protection', 'Passive shielding or active-jamming versions', 'Fully printable for your branding', 'Lightweight, everyday formats', 'Ideal as promotional giveaways'],
  hardware: ['Multiple interfaces (USB / RS232 / RS485 / Wi-Fi)', 'SDK and demo software included', 'Industrial-grade reliability', 'LF / HF / UHF coverage', 'OEM / ODM and integration support'],
};
const CUSTOMIZATION = [
  'Chip & frequency — LF, HF/NFC (13.56 MHz) or UHF',
  'Size, shape and material to your specification',
  'Printing & artwork — full-color, Pantone, special finishes',
  'Encoding, numbering, barcode / QR and database personalization',
  'Packaging and branding to match your requirements',
];
const WHYUS = [
  { t: 'Since 1996', d: 'Nearly three decades specializing in RFID and smart-card manufacturing.' },
  { t: '20,000 m² facility', d: 'Six modern production lines for high capacity and reliable lead times.' },
  { t: 'First-hand chips', d: 'Direct sourcing with 50M+ in stock for stable supply and sharp pricing.' },
  { t: '100+ countries', d: 'Export-ready support with full OEM and ODM services.' },
  { t: 'Fully certified', d: 'ISO 9001 / 14001 / 45001, plus CE, FCC, FSC, RoHS and REACH.' },
  { t: '2-year warranty', d: 'Samples available, on-time delivery and a 2-year guarantee.' },
];
const GENERIC_FAQ = [
  ['What is the minimum order quantity?', 'MOQ is flexible and depends on the product and configuration — share your target quantity and we will advise.'],
  ['Can I get a sample first?', 'Yes. Samples are available so you can verify material, print and chip performance before a production run.'],
  ['Do you support OEM / ODM and custom encoding?', 'Yes — full OEM / ODM with in-house R&D, plus custom keys and encoding under NDA.'],
  ['What are your payment and delivery terms?', 'Typically T/T in advance; we ship worldwide with on-time delivery and a 2-year warranty.'],
];

// ── 批发/大宗订货经济性(指示性 FOB 深圳,USD)──────────────────────────
// ⚠️ 用真实数字替换下面的默认值/覆盖值即可(改这一处 → 全站 39 个产品页同步)。
//    价格为"起批/指示性"区间,页面已注明"最终以报价为准",符合 B2B 惯例。
const WHOLESALE_DEFAULTS = {
  cards:    { moq: 500,  low: 0.10, high: 0.80, unit: 'pc',   sample: '3–5', bulkLow: 7,  bulkHigh: 15 },
  labels:   { moq: 1000, low: 0.03, high: 0.25, unit: 'pc',   sample: '3–5', bulkLow: 7,  bulkHigh: 12 },
  tags:     { moq: 500,  low: 0.15, high: 1.20, unit: 'pc',   sample: '3–7', bulkLow: 10, bulkHigh: 18 },
  blocking: { moq: 500,  low: 0.10, high: 0.90, unit: 'pc',   sample: '3–5', bulkLow: 7,  bulkHigh: 15 },
  hardware: { moq: 10,   low: 5,    high: 90,   unit: 'unit', sample: '5–7', bulkLow: 10, bulkHigh: 20 },
};
// 重点批发品类及其变体的逐品覆盖(rfid card / key fob / wristband / label)
const WHOLESALE_OVERRIDE = {
  'rfid-wristband':             { moq: 500,  low: 0.20, high: 1.20 },
  'rfid-silicone-wristband':    { moq: 500,  low: 0.25, high: 1.20 },
  'disposable-paper-wristband': { moq: 1000, low: 0.08, high: 0.30 },
  'rfid-keyfob':                { moq: 500,  low: 0.15, high: 0.70 },
  'uhf-rfid-label':             { moq: 1000, low: 0.05, high: 0.28 },
  'rfid-white-label':           { moq: 1000, low: 0.04, high: 0.22 },
  'nfc-printed-label':          { moq: 1000, low: 0.06, high: 0.30 },
  'rfid-dry-inlay':             { moq: 2000, low: 0.03, high: 0.15 },
  'rfid-wet-inlay':             { moq: 2000, low: 0.04, high: 0.18 },
  'pvc-cards':                  { moq: 500,  low: 0.10, high: 0.60 },
  'rfid-nfc-card':              { moq: 500,  low: 0.12, high: 0.70 },
};
function wholesale(p) {
  return Object.assign({}, WHOLESALE_DEFAULTS[p.cat] || WHOLESALE_DEFAULTS.cards, WHOLESALE_OVERRIDE[p.slug] || {});
}
const money = (n) => (n < 1 ? '$' + n.toFixed(2) : '$' + (Number.isInteger(n) ? n : n.toFixed(2)));
const moqFmt = (n) => n.toLocaleString('en-US');

// 每个品类对应的支柱指南(产品页 → 指南的上下文内链,强化话题集群)
const CAT_GUIDE = {
  cards: ['rfid-cards-guide.html', 'the complete RFID cards guide'],
  labels: ['rfid-labels-inlays-guide.html', 'the RFID labels & inlays guide'],
  tags: ['rfid-frequencies-lf-hf-uhf.html', 'the RFID frequency guide (LF/HF/UHF)'],
  blocking: ['rfid-blocking-guide.html', 'how RFID blocking works'],
  hardware: ['rfid-readers-hardware-guide.html', 'the RFID hardware buyer’s guide'],
};

const PRODUCTS = [
  { slug: 'contact-ic-chip-card', name: 'Contact IC Chip Card', cat: 'cards', tag: 'Contact IC', tagline: 'Secure contact-chip cards for payment, ID and membership.', overview: 'Contact IC chip cards carry a gold-plated chip module read through physical contact with a reader — strong on-card security for payment, access and loyalty.', specs: [['Chip', 'SLE4428/5528, FM4428, AT24Cxx, CPU/Java cards'], ['Material', 'PVC / PET / ABS'], ['Size', 'CR80 (85.5 × 54 mm) or custom'], ['Printing', 'Offset 4C, Pantone, silkscreen'], ['Personalization', 'Numbering, barcode, magstripe, signature panel']], apps: ['Payment', 'Access control', 'Membership', 'Telecom', 'Healthcare'], faqs: [['Which contact chips do you support?', 'SLE/FM memory chips and CPU/Java cards — tell us your reader and we will match it.'], ['Can you pre-encode the chips?', 'Yes, encoding, numbering and personalization are available.']] },
  { slug: 'hotel-key-card', name: 'Hotel Keycard', cat: 'cards', tag: 'Hospitality', tagline: 'RFID & magstripe keycards for every major lock system.', overview: 'Hotel keycards in RFID or magnetic-stripe formats, compatible with leading door-lock brands, with custom artwork for a branded guest touchpoint.', specs: [['Chip', 'MIFARE Classic 1K/EV1, NTAG, T5577, magstripe LoCo/HiCo'], ['Lock compatibility', 'ADEL, Salto, Hune, Beteck, Be-Tech, Ving and more'], ['Material', 'PVC'], ['Size', 'CR80'], ['Printing', 'Full-color CMYK, gloss/matte finish']], apps: ['Hotels', 'Resorts', 'Serviced apartments', 'Access control'], faqs: [['Which lock systems are supported?', 'ADEL, Salto, Hune, Beteck, Be-Tech and most RFID / magstripe locks — share your lock brand.'], ['What is the minimum order?', 'Flexible MOQ; contact us with your quantity.']] },
  { slug: 'pvc-cards', name: 'PVC Cards', cat: 'cards', tag: 'PVC', tagline: 'Durable printed PVC cards for ID, membership and gifting.', overview: 'Full-color PVC cards built for everyday durability — ideal for ID, membership, loyalty, gift and scratch cards with a wide range of finishes and options.', specs: [['Material', 'PVC / PET / ABS'], ['Size', 'CR80 or custom'], ['Thickness', '0.76 mm standard'], ['Printing', 'Offset 4C, Pantone'], ['Options', 'Magstripe, barcode, signature & scratch panel, embossing, foil']], apps: ['Membership', 'Gift cards', 'ID', 'Loyalty', 'Scratch cards'], faqs: [['Can you print transparent or frosted cards?', 'Yes — frosted, transparent and metallic finishes are available.'], ['Do you offer numbering and barcodes?', 'Yes, sequential numbers, barcodes and QR codes.']] },
  { slug: 'rfid-nfc-card', name: 'RFID / NFC Card', cat: 'cards', tag: 'RFID / NFC', tagline: '13.56 MHz & UHF cards for access, transit and tap-to-share.', overview: 'Contactless RFID/NFC cards for access control, transit, loyalty and tap-to-share digital experiences, available across HF/NFC and UHF chips.', specs: [['Frequency', 'LF 125 kHz / HF 13.56 MHz / UHF 860–960 MHz'], ['Chip', 'MIFARE Classic/DESFire, NTAG213/215/216, ICODE, EM4200, T5577, Impinj'], ['Material', 'PVC'], ['Size', 'CR80'], ['Read range', 'Tap (HF) up to several metres (UHF)']], apps: ['Access control', 'Public transit', 'NFC marketing', 'Events', 'Payment'], faqs: [['HF or UHF — which should I choose?', 'HF/NFC for tap (phones, access); UHF for longer-range reads. We will advise per use case.'], ['Can an NFC card open a URL on tap?', 'Yes, NTAG cards can be encoded with a URL or vCard.']] },
  { slug: 'rfid-epoxy-card', name: 'RFID Epoxy Card', cat: 'cards', tag: 'Epoxy', tagline: 'Compact, rugged crystal-epoxy tags and key cards.', overview: 'Epoxy (crystal) tags encase the chip and antenna in tough resin — compact, water-resistant and ideal as keychain access tokens.', specs: [['Frequency', 'LF / HF / UHF'], ['Material', 'Epoxy + PVC or anti-metal backing'], ['Shape', 'Round, square or custom'], ['Size', '25–40 mm typical'], ['Features', 'Waterproof, keyring hole']], apps: ['Access control', 'Membership', 'Asset tagging', 'Loyalty'], faqs: [['Are epoxy tags waterproof?', 'Yes, the resin makes them water- and wear-resistant.'], ['Can you make custom shapes?', 'Round, square and custom logo shapes are available.']] },
  { slug: 'project-based-card', name: 'Project-based Card', cat: 'cards', tag: 'Project', tagline: 'Made-to-spec cards engineered around your system.', overview: 'For system integrators and large rollouts, we engineer cards to your exact chip, encoding, security keys and artwork — with full QC and traceability.', specs: [['Chip', 'Any LF/HF/UHF or contact IC'], ['Encoding', 'Custom keys / sectors'], ['Material', 'PVC or eco materials'], ['Personalization', 'Numbering, database encoding'], ['QC', 'Full-process traceability']], apps: ['Government', 'Transit systems', 'Campus', 'Enterprise access'], faqs: [['Can you encode our security keys?', 'Yes — custom key/sector encoding under NDA.'], ['Do you provide samples for system testing?', 'Yes, pre-production samples are available.']] },
  { slug: 'wooden-rfid-card', name: 'Wooden RFID Card', cat: 'cards', tag: 'Wooden', tagline: 'Sustainable wood-finish cards for premium branding.', overview: 'Wood-finish RFID cards bring a warm, premium and eco-conscious feel to membership and hotel keys, using FSC-certified wood veneer.', specs: [['Material', 'Bamboo / wood veneer (FSC)'], ['Frequency', 'HF/NFC, UHF, LF'], ['Printing', 'Laser engraving / UV print'], ['Size', 'CR80'], ['Finish', 'Natural wood']], apps: ['Premium membership', 'Boutique hotels', 'Gift cards', 'Eco branding'], faqs: [['Is the wood sustainably sourced?', 'Yes, FSC Chain-of-Custody certified veneer.'], ['Can you laser-engrave logos?', 'Yes, laser engraving and UV printing are available.']] },
  { slug: 'metal-card', name: 'Metal Card', cat: 'cards', tag: 'Metal', tagline: 'Stainless & brushed-metal cards for VIP programs.', overview: 'Premium metal cards in stainless steel or brushed finishes that make a statement for VIP, black-card and luxury membership tiers — with optional NFC.', specs: [['Material', 'Stainless steel / brass / hybrid metal-PVC'], ['Process', 'Etching, laser, PVD color'], ['NFC', 'Optional hybrid construction'], ['Thickness', '0.5–0.8 mm'], ['Finish', 'Brushed / mirror / matte black']], apps: ['VIP membership', 'Black cards', 'Luxury brands', 'Business cards'], faqs: [['Can metal cards contain NFC?', 'Yes, via a hybrid metal + NFC construction.'], ['What finishes are available?', 'Brushed, mirror, matte black and gold / rose-gold PVD.']] },
  { slug: 'eco-friendly-card', name: 'Eco-Friendly Card', cat: 'cards', tag: 'Eco', tagline: 'Recycled, biodegradable and paper card options.', overview: 'Lower-impact cards in recycled PVC, biodegradable BIO materials, FSC paper, wood and PLA — matching standard performance with a smaller footprint.', specs: [['Material', 'Recycled PVC, BIO Card-S/P, ECO Card, FSC paper, PLA, bamboo'], ['Frequency', 'LF / HF / UHF'], ['Printing', 'CMYK'], ['Certification', 'FSC']], apps: ['Hotels', 'Retail loyalty', 'Events', 'Green branding'], faqs: [['Are these fully biodegradable?', 'BIO Card-S/P biodegrade naturally; recycled PVC cuts virgin plastic.'], ['Do they perform like PVC?', 'Yes, comparable durability and print quality.']] },
  { slug: 'nfc-business-card', name: 'NFC Business Card', cat: 'cards', tag: 'NFC', tagline: 'Tap-to-share digital business cards in PVC, metal or wood.', overview: 'An NFC business card shares your contact details, links or website with a single tap — no app needed. Built on NTAG chips in PVC, metal or wood finishes, it turns a premium card into a reusable digital touchpoint.', specs: [['Chip', 'NTAG213 / 215 / 216'], ['Frequency', 'HF 13.56 MHz'], ['Material', 'PVC / metal / wood / hybrid'], ['Size', 'CR80 (85.5 × 54 mm)'], ['Encoding', 'URL, vCard, social profile'], ['Printing', 'Full-color, laser engraving (metal/wood)']], apps: ['Networking', 'Sales teams', 'Executives', 'Real estate', 'Influencers'], faqs: [['Does the recipient need an app?', 'No — NTAG cards open a URL or contact card on any NFC phone without an app.'], ['Can I update the linked profile later?', 'Yes — encode a redirect URL and change the destination anytime.']] },
  { slug: 'dual-frequency-card', name: 'Dual-Frequency RFID Card', cat: 'cards', tag: 'Dual-Frequency', tagline: 'Two chips, one card — bridge HF and UHF systems.', overview: 'A dual-frequency card embeds two RFID chips in one card — for example HF 13.56 MHz for access plus UHF 860–960 MHz for long-range identification — so a single credential works across different systems during migrations or multi-application deployments.', specs: [['Frequency', 'LF 125 kHz + HF, or HF + UHF'], ['Chip', 'T5577 + MIFARE, or MIFARE + Impinj'], ['Material', 'PVC'], ['Size', 'CR80'], ['Printing', 'Offset 4C, Pantone']], apps: ['Access + asset tracking', 'System migration', 'Campus ID', 'Multi-application'], faqs: [['Why use two frequencies?', 'To bridge systems — e.g. tap access (HF) and long-range gate reads (UHF) on one card.'], ['Which chip combinations are possible?', 'LF+HF or HF+UHF; tell us both systems and we will match the chips.']] },
  { slug: 'magnetic-stripe-card', name: 'Magnetic Stripe Card', cat: 'cards', tag: 'Magstripe', tagline: 'HiCo / LoCo magnetic-stripe cards, with optional RFID.', overview: 'Magnetic stripe cards store data on a HiCo or LoCo magnetic band for swipe readers — widely used for membership, gift, loyalty and hotel keys. Combine with an RFID/NFC chip for hybrid swipe-and-tap cards.', specs: [['Stripe', 'HiCo 2750 Oe / LoCo 300 Oe'], ['Tracks', '1 / 2 / 3'], ['Material', 'PVC'], ['Size', 'CR80'], ['Options', 'Signature panel, barcode, numbering, RFID chip']], apps: ['Membership', 'Gift & loyalty', 'Hotel keys', 'Access control'], faqs: [['HiCo or LoCo — which do I need?', 'HiCo resists erasure for frequent use; LoCo suits short-term cards. We advise per use case.'], ['Can a card have both magstripe and RFID?', 'Yes — hybrid swipe-and-tap cards are available.']] },
  { slug: 'scratch-card', name: 'PVC Scratch Card', cat: 'cards', tag: 'Scratch', tagline: 'Prepaid & PIN scratch cards with secure panels.', overview: 'Scratch cards hide a PIN or code under a removable scratch-off panel — for prepaid top-ups, promotions, gaming and loyalty. Printed in full color with secure variable-data numbering.', specs: [['Material', 'PVC / paper'], ['Panel', 'Silver / gold scratch-off'], ['Data', 'Variable PIN / barcode / QR'], ['Size', 'CR80 or custom'], ['Printing', 'Offset 4C']], apps: ['Prepaid top-up', 'Promotions', 'Gaming', 'Loyalty'], faqs: [['Can you print unique codes under the panel?', 'Yes — secure variable-data PINs, barcodes or QR codes.'], ['Is the scratch panel tamper-evident?', 'Yes, the panel shows if a card has been scratched.']] },

  { slug: 'nfc-printed-label', name: 'NFC Printed Label / Sticker', cat: 'labels', tag: 'NFC', tagline: 'Custom-printed NFC labels for authentication and tap.', overview: 'Printed NFC labels combine your artwork with an NFC chip for product authentication, tap-to-engage marketing and smart packaging.', specs: [['Chip', 'NTAG213/215/216, ICODE SLIX'], ['Frequency', '13.56 MHz'], ['Material', 'Paper / PET, adhesive backing'], ['Size', 'Custom (Ø25–40 mm common)'], ['Features', 'Tamper-evident option, CMYK print']], apps: ['Anti-counterfeit', 'Smart packaging', 'Marketing', 'Asset ID'], faqs: [['Can labels be tamper-evident?', 'Yes, fragile / tamper-evident materials are available.'], ['Can you encode and lock the URL?', 'Yes, we encode and can lock the NDEF data.']] },
  { slug: 'rfid-dry-inlay', name: 'RFID Dry Inlay', cat: 'labels', tag: 'Dry Inlay', tagline: 'Antenna + chip inlays ready for your converting.', overview: 'Dry inlays are the antenna-and-chip core without adhesive — ideal for customers who laminate or convert them into their own products.', specs: [['Frequency', 'HF 13.56 MHz / UHF 860–960 MHz'], ['Chip', 'NXP, Impinj, EM'], ['Antenna', 'Aluminum / copper etched'], ['Format', 'Reel, custom size'], ['Backing', 'None (dry)']], apps: ['Label converting', 'Ticketing', 'Inlay integration'], faqs: [['Dry vs wet inlay?', 'Dry has no adhesive (for lamination); wet is adhesive-backed.'], ['Supplied on rolls?', 'Yes, reel-to-reel with custom pitch.']] },
  { slug: 'rfid-wet-inlay', name: 'RFID Wet Inlay / Sticker', cat: 'labels', tag: 'Wet Inlay', tagline: 'Adhesive-backed inlays for fast item tagging.', overview: 'Wet inlays add a pressure-sensitive adhesive so you can peel and stick for fast, item-level tagging in retail, logistics and asset tracking.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'Impinj Monza/M7xx, NXP UCODE'], ['Antenna', 'Aluminum etched'], ['Adhesive', 'Permanent acrylic'], ['Format', 'Reel; PET / paper face']], apps: ['Retail inventory', 'Logistics', 'Asset tracking', 'Library'], faqs: [['What read range?', 'UHF wet inlays read ~1–8 m depending on chip, antenna and reader.'], ['Custom sizes?', 'Yes, antenna and die-cut size to spec.']] },
  { slug: 'rfid-white-label', name: 'RFID White Label / Sticker', cat: 'labels', tag: 'White Label', tagline: 'Blank coated labels ready to print and encode.', overview: 'White, printable RFID labels with a coated face for thermal-transfer printing and on-demand encoding at your facility.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'UCODE, Monza, NTAG'], ['Face', 'Coated paper / PET (printable)'], ['Adhesive', 'Permanent'], ['Format', 'Reel for printers']], apps: ['Retail', 'Warehouse', 'On-demand printing'], faqs: [['Are they printer compatible?', 'Yes, works with RFID-capable thermal printers (Zebra, etc.).'], ['Can you pre-encode?', 'Yes, or leave blank for your own encoding.']] },
  { slug: 'uhf-rfid-label', name: 'UHF RFID Label', cat: 'labels', tag: 'UHF Label', tagline: 'Roll-fed UHF smart labels for retail and supply chain.', overview: 'UHF RFID labels are printable adhesive smart labels with an 860–960 MHz inlay for item-level retail tagging, warehouse and supply-chain visibility — readable in bulk at several metres and printed on demand with RFID-capable printers.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj M730 / M750, NXP UCODE 9'], ['Read range', '1–10 m'], ['Face', 'Coated paper / PET'], ['Format', 'Reel'], ['Encoding', 'Pre-encoded or blank']], apps: ['Retail apparel', 'Warehouse', 'Supply chain', 'Inventory'], faqs: [['What read range do UHF labels achieve?', 'Around 1–10 m depending on inlay, printer and reader.'], ['Can you pre-encode EPC data?', 'Yes, pre-encoded and serialized, or supplied blank.']] },

  { slug: 'rfid-animal-tag', name: 'RFID Animal Tag', cat: 'tags', tag: 'Animal', tagline: 'Ear tags and racing tags for animal ID.', overview: 'Durable LF animal tags — ear tags and racing tags — for livestock identification, traceability and event timing.', specs: [['Frequency', 'LF 134.2 kHz (ISO 11784/85) / 125 kHz'], ['Chip', 'EM4305, Hitag-S'], ['Material', 'TPU / PP'], ['Form', 'Ear tag, leg band, glass tag'], ['Rating', 'IP68 waterproof']], apps: ['Livestock', 'Pets', 'Racing (pigeon/horse)', 'Traceability'], faqs: [['Are they ISO compliant?', 'Yes, ISO 11784/11785 FDX-B available.'], ['Suitable for harsh outdoor use?', 'Yes, UV- and water-resistant materials.']] },
  { slug: 'rfid-anti-metal-tag', name: 'RFID Anti-Metal Tag', cat: 'tags', tag: 'Anti-Metal', tagline: 'Reliable reads on metal assets and tools.', overview: 'Anti-metal tags use a ferrite/absorber layer so RFID works reliably when mounted on metal surfaces — for IT assets, tools and equipment.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'UCODE, Monza, NTAG'], ['Material', 'PCB / FR4 / ceramic + absorber'], ['Mounting', '3M adhesive / screw'], ['Rating', 'IP67, -40~85 °C']], apps: ['IT asset management', 'Tool tracking', 'Equipment', 'Maintenance'], faqs: [['Read range on metal?', 'UHF anti-metal tags read ~1–6 m on metal depending on size.'], ['Mounting options?', 'Adhesive, screw-hole or cable-tie versions.']] },
  { slug: 'rfid-keyfob', name: 'RFID Keyfob', cat: 'tags', tag: 'Keyfob', tagline: 'Compact, durable fobs for access & membership.', overview: 'Rugged ABS keyfobs for access control, time-and-attendance and membership — easy to carry and built to last.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'EM4200, T5577, MIFARE, NTAG'], ['Material', 'ABS / epoxy'], ['Color', 'Custom'], ['Features', 'Keyring, waterproof']], apps: ['Access control', 'Time & attendance', 'Membership', 'Loyalty'], faqs: [['Can fobs be printed or numbered?', 'Yes, laser numbering and color options.'], ['Are rewritable chips available?', 'Yes, T5577 / MIFARE rewritable options.']] },
  { slug: 'rfid-wristband', name: 'RFID Wristband', cat: 'tags', tag: 'Wristband', tagline: 'Silicone, fabric & paper bands for events and access.', overview: 'RFID wristbands for events, water parks, festivals and access — in silicone, woven fabric, Tyvek paper and more, for cashless and ticketing use.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'MIFARE, NTAG, ICODE'], ['Material', 'Silicone / fabric / Tyvek / PVC'], ['Closure', 'Snap / one-time lock / adjustable'], ['Rating', 'Waterproof']], apps: ['Events & festivals', 'Water parks', 'Cashless payment', 'Access'], faqs: [['Disposable or reusable?', 'Both — Tyvek for single-use, silicone/fabric for reuse.'], ['Cashless-payment ready?', 'Yes, encode balance/ID for tap-to-pay systems.']] },
  { slug: 'special-rfid-tags', name: 'Special RFID Tags', cat: 'tags', tag: 'Special', tagline: 'Purpose-built tags — tree, mini, PCB & more.', overview: 'Specialty RFID tags engineered for niche needs: tree/plant nursery tags, tiny mini tags, PCB tags and other custom formats beyond our standard ranges.', specs: [['Types', 'Tree/nursery, mini, PCB tag, custom'], ['Frequency', 'HF / UHF'], ['Durability', 'Heat / chemical / water resistant'], ['Size', 'From a few millimetres']], apps: ['Horticulture', 'Electronics', 'Specialty assets', 'Custom projects'], faqs: [['Can you build a fully custom tag?', 'Yes — share your size, environment and read-range needs and we will engineer it.'], ['Smallest size?', 'Mini tags from a few millimetres.']] },
  { slug: 'rfid-laundry-tag', name: 'RFID Laundry Tag', cat: 'tags', tag: 'Laundry', tagline: 'Heat- and water-resistant tags that survive wash cycles.', overview: 'RFID laundry tags are sealed in silicone or PPS to withstand repeated industrial washing, drying and pressing — automating linen and uniform tracking in hotels, hospitals and laundries. Most use UHF or HF chips for fast contactless counting.', specs: [['Frequency', 'UHF 860–960 MHz / HF 13.56 MHz'], ['Chip', 'Impinj M-series / NXP'], ['Material', 'Silicone / PPS'], ['Wash cycles', '200+'], ['Temperature', 'Up to 200 °C'], ['Rating', 'IP68']], apps: ['Hotel linen', 'Hospital textiles', 'Industrial laundry', 'Uniform rental'], faqs: [['How many wash cycles do they survive?', 'Typically 200+ industrial wash-and-press cycles depending on the model.'], ['UHF or HF for laundry?', 'UHF for fast bulk counting; HF for close-range item checks. We advise per workflow.']] },
  { slug: 'nfc-dog-tag', name: 'NFC Pet ID / Dog Tag', cat: 'tags', tag: 'Pet ID', tagline: 'Tap-to-scan pet tags that link to an owner profile.', overview: 'An NFC pet ID tag links to the owner contact and medical details — anyone who finds the animal can tap it with a phone to help reunite them. Built in durable epoxy or metal with an NTAG chip and a collar keyring.', specs: [['Chip', 'NTAG213 / 215 / 216'], ['Frequency', 'HF 13.56 MHz'], ['Material', 'Epoxy / metal'], ['Shape', 'Bone / round / custom'], ['Encoding', 'URL to pet profile'], ['Feature', 'Waterproof, keyring']], apps: ['Pet identification', 'Lost-pet recovery', 'Vet clinics', 'Pet brands'], faqs: [['How does a finder access the info?', 'They tap the tag with any NFC phone to open the linked owner profile — no app needed.'], ['Is it waterproof?', 'Yes, epoxy and metal builds are water-resistant for daily collar wear.']] },
  { slug: 'rfid-jewelry-tag', name: 'RFID Jewelry Tag', cat: 'tags', tag: 'Jewelry', tagline: 'Tiny UHF tags for fast jewelry inventory.', overview: 'RFID jewelry tags are miniature UHF labels — often a barbell shape that loops around rings and chains — letting jewelry stores inventory thousands of small high-value items in seconds and deter theft.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj / NXP UCODE'], ['Size', 'From ~45 × 10 mm (barbell)'], ['Material', 'Coated paper / PET'], ['Printing', 'Price / barcode printable']], apps: ['Jewelry retail', 'Watch stores', 'Inventory audit', 'Loss prevention'], faqs: [['How fast is a jewelry stocktake with RFID?', 'Thousands of items can be counted in minutes versus hours by barcode.'], ['Can the tag show price and barcode?', 'Yes, the printable face carries price, barcode and branding.']] },
  { slug: 'rfid-library-tag', name: 'RFID Library Tag & Label', cat: 'tags', tag: 'Library', tagline: 'HF labels for self-checkout and shelf management.', overview: 'RFID library tags are HF 13.56 MHz labels (ISO 15693) applied inside books and media for self-checkout, fast shelf inventory and anti-theft — letting patrons borrow and return without staff scanning each item.', specs: [['Frequency', 'HF 13.56 MHz (ISO 15693)'], ['Chip', 'ICODE SLIX / SLIX2'], ['Size', '~50 × 50 mm'], ['Feature', 'AFI / EAS anti-theft'], ['Material', 'Paper, adhesive']], apps: ['Public libraries', 'University libraries', 'Media archives', 'Document tracking'], faqs: [['Do they support anti-theft?', 'Yes, ICODE AFI/EAS enables security-gate detection.'], ['Compatible with library RFID systems?', 'Yes, ISO 15693 works with standard library platforms.']] },
  { slug: 'uhf-windshield-tag', name: 'UHF Windshield Tag', cat: 'tags', tag: 'Windshield', tagline: 'Long-range tags for vehicle access and parking.', overview: 'UHF windshield tags mount inside a vehicle windscreen for long-range identification at parking barriers, gated communities and toll lanes — reading vehicles at speed from several metres. Tamper-evident versions void on removal.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj Monza / NXP UCODE'], ['Read range', 'Up to 6–10 m'], ['Material', 'PET'], ['Feature', 'Tamper-evident, on-glass tuned'], ['Mounting', 'Inside windscreen']], apps: ['Parking access', 'Gated communities', 'Toll / ETC', 'Fleet'], faqs: [['What read range on a windscreen?', 'Typically 6–10 m depending on reader and antenna.'], ['Are they tamper-evident?', 'Yes, fragile versions break on removal to prevent reuse.']] },
  { slug: 'high-temperature-rfid-tag', name: 'High-Temperature RFID Tag', cat: 'tags', tag: 'High-Temp', tagline: 'Tags that survive autoclaves, ovens and paint lines.', overview: 'High-temperature RFID tags use PPS, ceramic or PCB housings to keep working through heat-intensive processes — autoclaves, paint-curing ovens and industrial washing — where standard tags would fail. Available up to 260 °C continuous.', specs: [['Frequency', 'HF / UHF'], ['Material', 'PPS / ceramic / FR4'], ['Temperature', 'Up to 230–260 °C'], ['Rating', 'IP68'], ['Mounting', 'Screw / adhesive / embed']], apps: ['Automotive paint lines', 'Sterilization / autoclave', 'Metalworking', 'Industrial laundry'], faqs: [['What temperature can they withstand?', 'Models rated up to 230–260 °C continuous, with short peaks higher.'], ['Do they work on metal?', 'Yes, on-metal high-temp versions are available.']] },
  { slug: 'rfid-seal-tag', name: 'RFID Seal / Cable-Tie Tag', cat: 'tags', tag: 'Seal', tagline: 'Tamper-evident cable-tie tags for security sealing.', overview: 'RFID seal tags combine a one-time-lock cable tie with an RFID/NFC chip — sealing containers, cages, fire extinguishers and utility meters so any tampering is visible and each seal is uniquely identifiable for audit.', specs: [['Frequency', 'HF 13.56 MHz / UHF'], ['Chip', 'NTAG / MIFARE / UCODE'], ['Material', 'Nylon tie + ABS head'], ['Lock', 'One-time self-lock'], ['Length', '200–360 mm']], apps: ['Logistics sealing', 'Fire-extinguisher inspection', 'Utility meters', 'Cage security'], faqs: [['Are they reusable?', 'No — the one-time lock makes them tamper-evident; cut to remove.'], ['What data can the chip hold?', 'A unique ID plus inspection or asset data via NFC/UHF.']] },
  { slug: 'rfid-silicone-wristband', name: 'RFID Silicone Wristband', cat: 'tags', tag: 'Silicone', tagline: 'Reusable waterproof bands for events and access.', overview: 'RFID silicone wristbands are soft, waterproof and reusable — ideal for water parks, gyms, festivals and access control. Encode them for cashless payment, ticketing or membership, with custom colors and embossed logos.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'MIFARE / NTAG / ICODE'], ['Material', 'Silicone'], ['Closure', 'Adjustable / fixed'], ['Rating', 'Waterproof IP68'], ['Branding', 'Embossed / printed']], apps: ['Water parks', 'Gyms & spas', 'Festivals', 'Cashless payment'], faqs: [['Are they waterproof and reusable?', 'Yes — silicone bands are fully waterproof and reusable for years.'], ['Can we encode cashless balances?', 'Yes, encode ID or balance for tap-to-pay and access.']] },
  { slug: 'disposable-paper-wristband', name: 'Disposable Paper Wristband', cat: 'tags', tag: 'Disposable', tagline: 'Single-use Tyvek RFID bands for events.', overview: 'Disposable RFID wristbands in Tyvek paper give each guest a low-cost single-use credential for festivals, concerts and one-day events — with a secure adhesive lock and full-color print for branding, cashless or access use.', specs: [['Frequency', 'HF 13.56 MHz / UHF'], ['Chip', 'NTAG / MIFARE / UCODE'], ['Material', 'Tyvek paper'], ['Closure', 'Adhesive one-time lock'], ['Printing', 'Full-color'], ['Use', 'Single-use']], apps: ['Festivals', 'Concerts', 'One-day events', 'Theme parks'], faqs: [['Are they secure for one-time use?', 'Yes, the adhesive lock tears if removed, preventing transfer.'], ['Can they be printed and numbered?', 'Yes, full-color print with sequential numbers or barcodes.']] },

  { slug: 'rfid-blocking-card', name: 'RFID Blocking Card', cat: 'blocking', tag: 'Card', tagline: 'One card that shields a whole wallet from skimming.', overview: 'A single shielding card that disrupts unauthorized 13.56 MHz reads, protecting the cards around it from skimming.', specs: [['Protection', '13.56 MHz (NFC / contactless)'], ['Type', 'Passive shielding or active LED-jamming'], ['Material', 'PVC'], ['Size', 'CR80'], ['Printing', 'Custom CMYK']], apps: ['Banks', 'Promotions', 'Corporate gifts', 'Retail'], faqs: [['Active or passive?', 'We offer both passive shielding and active LED-jamming cards.'], ['Does it block all my cards?', 'One card protects the others in the same wallet or sleeve.']] },
  { slug: 'rfid-blocking-sleeves', name: 'RFID Blocking Sleeves', cat: 'blocking', tag: 'Sleeves', tagline: 'Protective sleeves for cards and passports.', overview: 'RFID-blocking sleeves for credit cards and passports — lightweight, printable and an effective low-cost privacy giveaway.', specs: [['Material', 'Aluminum-laminate paper / Tyvek'], ['Sizes', 'Credit-card & passport'], ['Printing', 'CMYK both sides'], ['Protection', '13.56 MHz']], apps: ['Banks', 'Travel', 'Promotions', 'Events'], faqs: [['Can they be custom printed?', 'Yes, full-color both sides for branding.'], ['Card and passport sizes?', 'Both standard sizes are available.']] },
  { slug: 'rfid-blocking-wallet', name: 'RFID Blocking Wallet', cat: 'blocking', tag: 'Wallet', tagline: 'Everyday wallets with built-in shielding.', overview: 'Wallets and card holders with integrated RFID-shielding lining — combining everyday utility with contactless privacy protection.', specs: [['Material', 'PU / genuine leather / aluminum'], ['Lining', 'RFID-shield'], ['Styles', 'Bifold, card holder, money clip'], ['Branding', 'Deboss / print']], apps: ['Corporate gifts', 'Retail', 'Travel', 'Promotions'], faqs: [['What materials?', 'PU, genuine leather and aluminum card cases.'], ['Can you add our logo?', 'Yes, debossing or printing is available.']] },

  { slug: 'barcode-scan-module', name: 'Barcode Scan Module / Engine', cat: 'hardware', tag: 'Scan', tagline: 'Embeddable 1D/2D scan engines for devices.', overview: 'Compact barcode scan engines to embed into kiosks, gates, vending and handheld devices — fast 1D/2D capture, including codes on phone screens.', specs: [['Type', 'CCD / CMOS 1D & 2D'], ['Interface', 'USB / TTL / RS232'], ['Reads', 'Paper & screen codes'], ['Integration', 'OEM module'], ['Trigger', 'Auto / sensor']], apps: ['Kiosks', 'Access gates', 'Vending', 'Handhelds', 'POS'], faqs: [['Can it read phone-screen codes?', 'Yes, 2D imagers read screen QR and barcodes.'], ['Which interfaces?', 'USB, TTL/UART and RS232.']] },
  { slug: 'industrial-iot-dtu-rtu', name: 'Industrial IoT DTU / RTU', cat: 'hardware', tag: 'DTU / RTU', tagline: 'Cellular data terminals for remote monitoring.', overview: 'Industrial DTU/RTU units transmit field data over 4G/NB-IoT for remote monitoring and control of equipment, meters and sensors.', specs: [['Network', '4G / NB-IoT / Cat-1'], ['Interface', 'RS232 / RS485 / DI / DO'], ['Protocol', 'Modbus / MQTT / TCP'], ['Power', '9–36 V'], ['Housing', 'Industrial / DIN-rail']], apps: ['Smart utilities', 'Industrial monitoring', 'Agriculture', 'Energy'], faqs: [['Which protocols are supported?', 'Modbus RTU/TCP, MQTT and transparent TCP/UDP.'], ['Which networks?', '4G Cat-1/Cat-4 and NB-IoT.']] },
  { slug: 'rfid-reader-writer', name: 'RFID LF/HF/UHF Reader / Writer', cat: 'hardware', tag: 'Reader', tagline: 'Desktop & integrated readers across all frequencies.', overview: 'A full range of RFID readers/writers — from desktop USB encoders to fixed and handheld UHF readers — across LF, HF and UHF.', specs: [['Frequency', 'LF 125 kHz / HF 13.56 MHz / UHF 860–960 MHz'], ['Form', 'Desktop, module, fixed, handheld'], ['Interface', 'USB / RS232 / RS485 / Wi-Fi / PoE'], ['SDK', 'Provided with demo software']], apps: ['Access', 'Encoding / personalization', 'Inventory', 'Asset tracking'], faqs: [['Do you provide an SDK?', 'Yes, an SDK and demo software are included.'], ['Are handheld UHF readers available?', 'Yes, Android UHF handhelds and fixed readers.']] },
  { slug: 'rfid-smart-cabinet', name: 'RFID Smart Cabinet / Terminal', cat: 'hardware', tag: 'Cabinet', tagline: 'Intelligent cabinets for automated asset control.', overview: 'RFID smart cabinets and terminals automatically track what is taken and returned — for tools, documents, medical and high-value asset control.', specs: [['Type', 'UHF smart cabinet / locker'], ['Antenna', 'Multi-zone'], ['Access', 'Card / PIN / biometric'], ['Software', 'Asset management'], ['Audit', 'Real-time logs']], apps: ['Tool cribs', 'Asset control', 'Medical supplies', 'Documents'], faqs: [['Real-time inventory?', 'Yes, the cabinet logs every take and return automatically.'], ['Access control?', 'Card, PIN and biometric options with audit trails.']] },
];

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

const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing since 1996.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="industries.html">Industries</a><a href="cases.html">Cases</a><a href="sustainability.html">Sustainability</a><a href="news.html">News</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8675523765843">+86 755 2376 5843</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;

const FONTS = `<link rel="preload" as="font" type="font/woff2" href="fonts/space-grotesk-latin-700-normal.woff2" crossorigin /><link rel="preload" as="font" type="font/woff2" href="fonts/inter-latin-400-normal.woff2" crossorigin />`;

function page(title, desc, slug, headExtra, body) {
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
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RFID MFG" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${slug}" />
<meta property="og:image" content="${SITE}/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
${headExtra}
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
${body}
</main>
${FOOTER}
<a href="#" class="to-top" id="toTop" aria-label="Back to top">↑</a>
<script src="script.js"></script>
</body>
</html>
`;
}

function productPage(p) {
  const cat = CATS[p.cat];
  const img = IMG[p.slug] || '';
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.slug !== p.slug).slice(0, 4);
  const w = wholesale(p);
  const wUnit = w.unit || 'pc';
  const wUnitPl = wUnit === 'unit' ? 'units' : 'pcs';
  const quoteHref = `contact.html?product=${encodeURIComponent(p.name)}&cat=${encodeURIComponent(SELECT_LABEL[p.cat] || '')}#quoteForm`;
  const prodLd = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, category: cat.name, brand: { '@type': 'Brand', name: 'RFID MFG' }, manufacturer: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.' }, description: p.overview };
  if (img) prodLd.image = SITE + '/' + img;
  prodLd.offers = { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: w.low, highPrice: w.high, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.' } };
  const ld = `<script type="application/ld+json">
${JSON.stringify(prodLd)}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Products","item":"${SITE}/products.html"},{"@type":"ListItem","position":3,"name":${JSON.stringify(p.name)},"item":"${SITE}/${p.slug}.html"}]}
</script>`;
  const specs = p.specs.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
  const apps = p.apps.map((a) => `<li>${esc(a)}</li>`).join('');
  const wholesaleFaq = [
    [`What is the minimum order quantity (MOQ) for ${p.name}?`, `MOQ for ${p.name} starts at ${moqFmt(w.moq)} ${wUnitPl} and is flexible by configuration — share your target quantity and we will advise the best wholesale price.`],
    [`How much does ${p.name} cost wholesale?`, `Indicative wholesale pricing is ${money(w.low)}–${money(w.high)} per ${wUnit} (FOB Shenzhen), scaling down with volume. Final pricing depends on chip, size, artwork and quantity — request a quote for exact figures.`],
  ];
  const faqPairs = p.faqs.concat(wholesaleFaq, GENERIC_FAQ.slice(1));
  const faqs = faqPairs.map((f) => `<details class="faq-item"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
  const faqLd = `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqPairs.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) })}
</script>`;
  const rel = related.map((r) => `<a href="${r.slug}.html">${esc(r.name)}</a>`).join('');
  const featureList = (FEATURES[p.cat] || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const customList = CUSTOMIZATION.map((c) => `<li>${esc(c)}</li>`).join('');
  const whyCards = WHYUS.map((w) => `<div class="feature"><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></div>`).join('');
  const badges = [`MOQ from ${moqFmt(w.moq)} ${wUnitPl}`, 'Custom OEM / ODM', 'Free samples', '24-hour quote', '2-year warranty'].map((b) => `<li>${esc(b)}</li>`).join('');
  const wholesaleBadges = [`MOQ ${moqFmt(w.moq)} ${wUnitPl}`, `From ${money(w.low)}/${wUnit}`, 'Free samples', 'OEM / ODM'].map((b) => `<li>${esc(b)}</li>`).join('');
  const wholesaleSection = `<section class="section" id="wholesale">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">Wholesale &amp; bulk orders</span>
        <h2 class="section__title" style="margin-bottom:14px">Buy ${esc(p.name)} wholesale — direct from the factory</h2>
        <p>Order custom ${esc(p.name)} at wholesale prices directly from our Shenzhen factory (RFID manufacturer since 1996). Minimum order from <strong>${moqFmt(w.moq)} ${wUnitPl === 'pcs' ? 'pieces' : 'units'}</strong>, ${w.bulkLow}–${w.bulkHigh}-day bulk production, free pre-production samples, and full OEM / ODM — your logo, chip, encoding and packaging. Indicative pricing runs <strong>${money(w.low)}–${money(w.high)} per ${wUnit}</strong> and scales down with volume.</p>
        <ul class="prod-badges">${wholesaleBadges}</ul>
        <div class="prod__cta" style="margin-top:16px">
          <a href="${quoteHref}" class="btn btn--primary btn--lg">Request Wholesale Quote</a>
          <a href="${quoteHref}" class="btn btn--lg" style="border-color:var(--brand-deep);color:var(--brand-deep)">Get Free Sample</a>
        </div>
      </div>
      <div>
        <table class="spec-table">
          <tr><th>Minimum order (MOQ)</th><td>${moqFmt(w.moq)} ${wUnitPl}</td></tr>
          <tr><th>Indicative unit price</th><td>${money(w.low)}–${money(w.high)} / ${wUnit}*</td></tr>
          <tr><th>Sample lead time</th><td>${w.sample} days</td></tr>
          <tr><th>Bulk production</th><td>${w.bulkLow}–${w.bulkHigh} days</td></tr>
          <tr><th>Customization</th><td>Logo, chip, size, encoding, packaging</td></tr>
          <tr><th>Payment &amp; shipping</th><td>T/T · ships to 100+ countries</td></tr>
        </table>
        <p style="margin-top:10px;color:var(--muted);font-size:13px">*Indicative FOB Shenzhen, USD — final quote depends on chip, artwork and quantity.</p>
      </div>
    </div>
  </div>
</section>`;
  const body = `<section class="section">
  <div class="container">
    <nav class="breadcrumb" style="justify-content:flex-start;color:var(--muted)"><a href="index.html">Home</a><span>/</span><a href="products.html">Products</a><span>/</span>${esc(p.name)}</nav>
    <div class="prod" style="margin-top:18px">
      <div class="prod__media">${img ? `<img src="${img}" alt="${esc(p.name)}" loading="lazy" width="300" height="300" />` : `${esc(p.tag)}<small>Product image — add your photo</small>`}</div>
      <div class="prod__text">
        <span class="eyebrow">${esc(cat.name)}</span>
        <h1 class="section__title">${esc(p.name)}</h1>
        <p class="lead-line">${esc(p.tagline)}</p>
        <p>${esc(p.overview)}</p>
        <p style="margin-top:-4px;font-size:14px"><a class="link-arrow" href="${CAT_GUIDE[p.cat][0]}">New to this? Read ${esc(CAT_GUIDE[p.cat][1])} <span>→</span></a></p>
        <ul class="prod-badges">${badges}</ul>
        <div class="prod__cta">
          <a href="${quoteHref}" class="btn btn--primary btn--lg">Request Wholesale Quote</a>
          <a href="https://api.whatsapp.com/send?phone=8615815501857" target="_blank" rel="noopener" class="btn btn--lg" style="border-color:var(--brand-deep);color:var(--brand-deep)">WhatsApp</a>
          <a href="/datasheets/${p.slug}.pdf" download class="btn btn--lg" style="border-color:var(--line)">↓ Datasheet (PDF)</a>
        </div>
      </div>
    </div>
  </div>
</section>
${wholesaleSection}
<section class="section section--alt">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">Key features</span>
        <h2 class="section__title" style="margin-bottom:14px">Why this product</h2>
        <ul class="check-list">${featureList}</ul>
      </div>
      <div>
        <span class="eyebrow">Customization</span>
        <h2 class="section__title" style="margin-bottom:14px">Built to your spec</h2>
        <ul class="check-list">${customList}</ul>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">Specifications</span>
        <h2 class="section__title" style="margin-bottom:14px">Technical details</h2>
        <table class="spec-table">${specs}</table>
        <p style="margin-top:12px;color:var(--muted);font-size:14px">All specifications are customizable — tell us your requirements.</p>
      </div>
      <div>
        <span class="eyebrow">Applications</span>
        <h2 class="section__title" style="margin-bottom:14px">Where it's used</h2>
        <ul class="app-chips">${apps}</ul>
      </div>
    </div>
  </div>
</section>
<section class="section section--alt">
  <div class="container">
    <div class="section__head"><span class="eyebrow">Why RFID MFG</span><h2 class="section__title">A manufacturer you can rely on</h2></div>
    <div class="feature-grid">${whyCards}</div>
  </div>
</section>
<section class="section">
  <div class="container" style="max-width:880px">
    <div class="section__head" style="margin-bottom:24px"><span class="eyebrow">FAQ</span><h2 class="section__title">Frequently asked questions</h2></div>
    <div class="faq">${faqs}</div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section__head" style="margin-bottom:28px"><span class="eyebrow">More in ${esc(cat.name)}</span><h2 class="section__title">Related products</h2></div>
    <div class="related-grid">${rel}</div>
  </div>
</section>
<section class="trust">
  <div class="container trust__inner">
    <span>Certified to international standards:</span>
    <ul class="trust__list"><li>ISO 9001</li><li>ISO 14001</li><li>ISO 45001</li><li>CE</li><li>FCC</li><li>FSC</li><li>RoHS</li><li>REACH</li></ul>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Get a wholesale quote for ${esc(p.name)}</h2><p>Tell us your chip, size, artwork and quantity — we reply within 24 hours.</p></div>
    <a href="${quoteHref}" class="btn btn--ghost btn--lg">Request Wholesale Quote</a>
  </div>
</section>`;
  const title = `${p.name} Manufacturer & Wholesale Supplier | RFID MFG`;
  const metaDesc = `${p.name} — custom OEM/ODM manufacturer & wholesale supplier since 1996. MOQ from ${moqFmt(w.moq)} ${wUnitPl}, free samples, 24-hour quote. Ships to 100+ countries.`;
  return page(title, metaDesc, `${p.slug}.html`, ld + '\n' + faqLd, body);
}

function catalogPage() {
  const catLd = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Products","item":"${SITE}/products.html"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ItemList","name":"RFID MFG Product Categories","itemListElement":[${CAT_ORDER.map((c, i) => `{"@type":"ListItem","position":${i + 1},"name":${JSON.stringify(CATS[c].name)},"url":"${SITE}/products.html#${c}"}`).join(',')}]}
</script>`;
  const catNav = CAT_ORDER.map((c) => `<a href="#${c}">${esc(CATS[c].name)}</a>`).join('');
  const sections = CAT_ORDER.map((c) => {
    const items = PRODUCTS.filter((p) => p.cat === c).map((p) => `<a class="cat-item" href="${p.slug}.html"><div class="cat-item__media">${IMG[p.slug] ? `<img src="${IMG[p.slug]}" alt="${esc(p.name)}" loading="lazy" width="300" height="300" />` : `<span>${esc(p.tag)}</span>`}</div><div class="cat-item__body"><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p></div></a>`).join('');
    return `<div class="catalog-cat" id="${c}">
      <div class="catalog-cat__head"><div class="product-card__icon">${CATS[c].icon}</div><div><h2>${esc(CATS[c].name)}</h2><span>${esc(CATS[c].sub)}</span></div></div>
      <div class="catalog-grid">${items}</div>
    </div>`;
  }).join('\n');
  const body = `<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span>Products</nav>
    <h1>The complete RFID &amp; smart product line</h1>
    <p>Five core categories, hundreds of configurations — every item customizable to your chip, frequency, size, encoding and artwork.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <nav class="cat-nav">${catNav}</nav>
    ${sections}
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Can't find the exact spec you need?</h2><p>Send us your chip, frequency, size and artwork — we'll quote within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Start a Custom Project</a>
  </div>
</section>`;
  return page('RFID Products Wholesale — Cards, Key Fobs, Wristbands, Labels & Tags | RFID MFG', "RFID MFG's full catalog: RFID cards, key fobs, wristbands, labels, tags, blocking products & readers. Custom OEM/ODM & wholesale — low MOQ, free samples, 24h quote.", 'products.html', catLd, body);
}

// ---- generate ----
let n = 0;
for (const p of PRODUCTS) { fs.writeFileSync(path.join(OUT, `${p.slug}.html`), productPage(p)); n++; }
fs.writeFileSync(path.join(OUT, 'products.html'), catalogPage());
console.log(`Generated ${n} product pages + products.html`);
