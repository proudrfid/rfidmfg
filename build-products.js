/*
 * build-products.js — 生成 25 个产品详情页 + 重建 products.html 目录页
 * 运行: node build-products.js   (在本文件夹内)
 * 所有页面共用 header/footer/导航与 SEO 模板;改产品内容只需改下面的 PRODUCTS 数组,重跑即可。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const DATES = require('./content-dates.js');
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

// 产品图(本地 images/ 目录)。补图只需在此加一行。
const IMGBASE = 'images/';
const IMG = {
  'contact-ic-chip-card': IMGBASE + 'contact-ic-chip-card.webp',
  'hotel-key-card': IMGBASE + 'hotel-rfid-key-card.webp',
  'pvc-cards': IMGBASE + 'transparent-pvc-card.webp',
  'rfid-nfc-card': IMGBASE + 'ev-charging-rfid-card.webp',
  'custom-card-program': IMGBASE + 'project-based-rfid-card.webp',
  'wooden-rfid-card': IMGBASE + 'wooden-rfid-card.webp',
  'metal-card': IMGBASE + 'metal-rfid-card.webp',
  'nfc-printed-label': IMGBASE + 'nfc-printed-label.webp',
  'rfid-dry-inlay': IMGBASE + 'rfid-dry-inlay.webp',
  'rfid-wet-inlay': IMGBASE + 'rfid-wet-inlay.webp',
  'rfid-white-label': IMGBASE + 'rfid-white-label-sticker.webp',
  'rfid-wristband': IMGBASE + 'leather-rfid-wristband.webp',
  'specialty-rfid-tags': IMGBASE + 'rfid-laundry-tag.webp',
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
// 每品类差异化的定制项(避免 39 页共用同一份列表被搜索引擎判重)
const CUSTOMIZATION_BY_CAT = {
  cards: [
    'Chip & antenna — LF, HF/NFC, UHF, dual-interface or contact IC modules',
    'Card body — PVC, PET, recycled or bio materials, metal and wood hybrids',
    'Print & finish — offset CMYK, Pantone, silkscreen, foil, embossing, frosted or matte lamination',
    'Data services — encoding with diversified keys, numbering, QR / barcode, magstripe, signature panel',
    'Carrier packaging — welcome sleeves, key-card wallets and retail blister packs',
  ],
  labels: [
    'Inlay design — antenna geometry, die-cut size and reel pitch matched to your applicator',
    'Face & adhesive — paper or PET face, permanent, removable or tamper-evident adhesive',
    'Supply format — roll direction, core diameter and printer compatibility (Zebra, SATO, Postek)',
    'Encoding & serialization — EPC schemes, NDEF records, locking and TID capture files',
    'Converting — lamination, perforation and variable-data print before shipment',
  ],
  tags: [
    'Housing — ABS, epoxy, silicone, PPS, ceramic or PCB builds for the target environment',
    'Mounting — adhesive, screw hole, cable tie, sew-in channel or heat-weld patch',
    'Environmental rating — IP67/IP68 sealing and temperature ranges to spec',
    'Chip & frequency — LF, HF/NFC or UHF matched to your readers and range',
    'Marking — laser logos, sequential numbering, color coding and custom shapes',
  ],
  blocking: [
    'Shielding construction — passive foil laminate or active 13.56 MHz jamming circuit',
    'Format — CR80 card, sleeve, passport size or full wallet builds',
    'Branding — full-color print both sides, deboss or foil for leather goods',
    'Packaging — retail hang-tab, polybag or promotional mailer formats',
    'Verification — shielding effectiveness reports available per batch',
  ],
  hardware: [
    'Interfaces — USB, TTL/UART, RS232, RS485, Wiegand, Wi-Fi or 4G options',
    'Firmware & SDK — demo tools, API documentation and protocol customization',
    'Read performance — antenna tuning and power settings for your tag population',
    'Enclosure — OEM housings, logo printing and mounting accessories',
    'Compliance — CE / FCC documentation and integration support',
  ],
};
// 简短的工厂说明(替代原 6 卡片重复块;按品类差异化)
const MFG_NOTE = {
  cards: 'Card orders run on our own lamination, punching, offset-print and encoding lines in Shenzhen, so chip sourcing, body construction, personalization and QC stay under one roof — with pre-production samples before every run and a 2-year warranty after it.',
  labels: 'Labels and inlays are converted reel-to-reel in-house — antenna bonding, adhesive lamination, die-cutting and 100% read/write testing on the same line — so every roll arrives printer-ready, with samples first and a 2-year warranty.',
  tags: 'Tag production combines in-house injection molding, potting and assembly with 100% read testing before packing — engineered samples come first, bulk follows on our own Shenzhen lines, and everything carries a 2-year warranty.',
  blocking: 'Shielding products are laminated and finished in-house with per-batch effectiveness checks, so blocking performance is verified before shipment — samples first, 2-year warranty included.',
  hardware: 'Readers and modules are assembled and QA-tested in-house with firmware, SDK and integration support from our own engineers — evaluation units first, volume terms after your tests, 2-year warranty throughout.',
};
// 批发段落按品类措辞差异化(数值仍来自 wholesale(p))
const WHOLESALE_COPY = {
  cards: (p, w, unit, units) => `Order custom ${p.name} in production volume straight off our card lines — minimum runs from <strong>${moqFmt(w.moq)} ${units === 'pcs' ? 'pieces' : 'units'}</strong>, bulk lead times of ${w.bulkLow}–${w.bulkHigh} days after artwork approval, and free pre-production samples so you can sign off material, print and chip before committing. Full OEM/ODM covers your logo, chip choice, encoding and carrier packaging. Indicative pricing runs <strong>${money(w.low)}–${money(w.high)} per ${unit}</strong>, stepping down at volume breaks.`,
  labels: (p, w, unit, units) => `Buy ${p.name} by the roll at factory pricing — from <strong>${moqFmt(w.moq)} ${units}</strong> per order, converted, tested and shipped in ${w.bulkLow}–${w.bulkHigh} days. Sample rolls ship free first so you can verify read performance on your own printer and surfaces. Indicative pricing is <strong>${money(w.low)}–${money(w.high)} per ${unit}</strong> and drops steeply at 10k+ volumes, with OEM die-cuts and pre-encoding available.`,
  tags: (p, w, unit, units) => `Source ${p.name} at manufacturer terms — MOQs start at <strong>${moqFmt(w.moq)} ${units}</strong> with engineered samples in ${w.sample} days and bulk production in ${w.bulkLow}–${w.bulkHigh} days. We match housing, chip and mounting to your environment before quoting, so the indicative <strong>${money(w.low)}–${money(w.high)} per ${unit}</strong> range narrows to a firm price once your spec is fixed.`,
  blocking: (p, w, unit, units) => `Stock ${p.name} for retail, promotions or corporate gifting — from <strong>${moqFmt(w.moq)} ${units}</strong> with your branding printed or debossed, produced in ${w.bulkLow}–${w.bulkHigh} days. Free samples let you verify shielding performance first. Indicative pricing of <strong>${money(w.low)}–${money(w.high)} per ${unit}</strong> scales down fast at giveaway quantities.`,
  hardware: (p, w, unit, units) => `Purchase ${p.name} on OEM terms — evaluation units from <strong>${moqFmt(w.moq)} ${units}</strong> with SDK and integration support included, and volume batches in ${w.bulkLow}–${w.bulkHigh} days. Indicative pricing of <strong>${money(w.low)}–${money(w.high)} per ${unit}</strong> depends on interface, antenna and firmware options — send your integration plan for a firm quote.`,
};
// 批发 FAQ 三套措辞轮换,避免 39 页同句式
const WHOLESALE_FAQ_VARIANTS = [
  (p, w, unit, units) => [
    [`What is the MOQ for ${p.name}?`, `Production runs start at ${moqFmt(w.moq)} ${units}, and we stay flexible on configuration — tell us your target quantity and we will match the best wholesale tier.`],
    [`What does ${p.name} cost in bulk?`, `Plan around ${money(w.low)}–${money(w.high)} per ${unit} FOB Shenzhen as an indicative range; the firm price depends on chip, size, artwork and volume, and drops as quantities rise.`],
  ],
  (p, w, unit, units) => [
    [`How many ${units} do I need to order ${p.name}?`, `The minimum is ${moqFmt(w.moq)} ${units} per run. Smaller trial batches are sometimes possible on standard specs — ask with your use case.`],
    [`What is the wholesale price range for ${p.name}?`, `Indicatively ${money(w.low)}–${money(w.high)} per ${unit} (FOB Shenzhen). Send chip, size, artwork and quantity for an exact quote within 24 hours.`],
  ],
  (p, w, unit, units) => [
    [`What minimum order does ${p.name} carry?`, `${moqFmt(w.moq)} ${units} is the standard starting volume; configuration changes can shift it, so share your numbers and we will confirm.`],
    [`How is ${p.name} priced at volume?`, `Expect roughly ${money(w.low)}–${money(w.high)} per ${unit} FOB Shenzhen before volume breaks — final pricing follows your exact spec and quantity.`],
  ],
];
const variantIndex = (slug, n) => { let s = 0; for (let i = 0; i < slug.length; i++) s += slug.charCodeAt(i); return s % n; };

// ── 交互式阶梯估价器:数量档位由 MOQ 推导,单价在已发布 low–high 区间内几何插值 ──
function tierLadder(moq) {
  if (moq <= 10) return { qtys: [10, 50, 200, 500], quoteAt: '1,000+' };
  if (moq <= 500) return { qtys: [500, 1000, 5000, 10000], quoteAt: '25,000+' };
  if (moq <= 1000) return { qtys: [1000, 2500, 10000, 25000], quoteAt: '50,000+' };
  return { qtys: [2000, 5000, 20000, 50000], quoteAt: '100,000+' };
}
function tierPrices(w) {
  const { qtys, quoteAt } = tierLadder(w.moq);
  const n = qtys.length;
  const prices = qtys.map((q, i) => {
    const p = w.high * Math.pow(w.low / w.high, i / (n - 1));
    return Math.round(p * (p < 1 ? 1000 : 100)) / (p < 1 ? 1000 : 100);
  });
  return { qtys, prices, quoteAt };
}

// ── 品类 SVG 示意图(原创矢量,继承站点 CSS 变量配色)──
const SVG_CAPTION = {
  cards: 'Inside a contactless card: the chip and etched antenna laminate invisibly between printed PVC layers.',
  labels: 'Smart label construction: printable face, RFID inlay and adhesive, converted reel-to-reel for your printer or applicator.',
  tags: 'Built for the environment: sealed housings with adhesive, screw or cable-tie mounting.',
  blocking: 'How blocking works: the shielding layer disrupts 13.56 MHz reads before they reach your cards.',
  hardware: 'From tag to system: readers capture tag data and hand it to your software over standard interfaces.',
};
const CAT_SVG = {
  cards: `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID card layer construction diagram">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<rect x="60" y="28" rx="10" width="240" height="34" fill="#fff" stroke="var(--line)"/><text x="315" y="49">Clear overlay</text>
<rect x="70" y="70" rx="10" width="240" height="34" fill="var(--bg-alt)" stroke="var(--line)"/><text x="325" y="91">Printed artwork</text>
<rect x="80" y="112" rx="10" width="240" height="34" fill="#fff" stroke="var(--brand-deep)"/>
<circle cx="130" cy="129" r="11" fill="none" stroke="var(--brand)" stroke-width="2"/><circle cx="130" cy="129" r="6" fill="none" stroke="var(--brand)" stroke-width="2"/><rect x="126" y="125" width="8" height="8" fill="var(--brand-deep)"/>
<path d="M150 129h140" stroke="var(--brand)" stroke-width="2" stroke-dasharray="4 4"/>
<text x="335" y="133" fill="var(--brand-deep)" font-weight="700">Chip + antenna</text>
<rect x="90" y="154" rx="10" width="240" height="34" fill="var(--bg-alt)" stroke="var(--line)"/><text x="345" y="175">PVC core</text>
<rect x="100" y="196" rx="10" width="240" height="34" fill="#fff" stroke="var(--line)"/><text x="355" y="217">Overlay</text>
</g></svg>`,
  labels: `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID label reel construction diagram">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<circle cx="88" cy="96" r="58" fill="var(--bg-alt)" stroke="var(--line)"/><circle cx="88" cy="96" r="16" fill="#fff" stroke="var(--line)"/>
<path d="M88 154 H392" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>
<g stroke="var(--brand-deep)" fill="#fff"><rect x="150" y="141" rx="6" width="64" height="26"/><rect x="236" y="141" rx="6" width="64" height="26"/><rect x="322" y="141" rx="6" width="64" height="26"/></g>
<g stroke="var(--brand)" fill="none"><path d="M160 154h20m6 0h12" stroke-width="2"/><path d="M246 154h20m6 0h12" stroke-width="2"/><path d="M332 154h20m6 0h12" stroke-width="2"/></g>
<text x="150" y="127" fill="var(--brand-deep)" font-weight="700">Die-cut labels with inlay</text>
<text x="40" y="30">Supply reel</text>
<text x="240" y="196">Printable face · adhesive · liner</text>
<text x="240" y="214">Matched to your printer pitch</text>
</g></svg>`,
  tags: `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rugged RFID tag mounting options diagram">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<rect x="150" y="78" rx="16" width="120" height="84" fill="var(--bg-alt)" stroke="var(--brand-deep)" stroke-width="2"/>
<circle cx="210" cy="120" r="17" fill="none" stroke="var(--brand)" stroke-width="2"/><rect x="205" y="115" width="10" height="10" fill="var(--brand-deep)"/>
<text x="164" y="60" fill="var(--brand-deep)" font-weight="700">Sealed housing</text>
<g text-anchor="middle">
<circle cx="70" cy="120" r="26" fill="#fff" stroke="var(--line)"/><path d="M70 108v24M62 116l8-8 8 8" stroke="var(--brand-deep)" stroke-width="2" fill="none"/><text x="70" y="168">Screw</text>
<circle cx="350" cy="120" r="26" fill="#fff" stroke="var(--line)"/><rect x="338" y="112" width="24" height="16" rx="3" fill="none" stroke="var(--brand-deep)" stroke-width="2"/><path d="M338 124h24" stroke="var(--brand)" stroke-width="2"/><text x="350" y="168">Adhesive</text>
<circle cx="210" cy="212" r="0"/><text x="210" y="216">Cable-tie · sew-in · weld options per model</text>
</g>
<path d="M104 120h36M314 120h-34" stroke="var(--line)" stroke-width="2"/>
</g></svg>`,
  blocking: `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID blocking shield diagram">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<rect x="20" y="86" rx="8" width="70" height="70" fill="var(--bg-alt)" stroke="var(--line)"/><text x="26" y="176">Reader / skimmer</text>
<g stroke="var(--brand)" fill="none" stroke-width="2"><path d="M104 121c10-14 10-28 0-42"/><path d="M122 131c16-22 16-42 0-62"/><path d="M140 141c22-30 22-56 0-84"/></g>
<path d="M196 58v126" stroke="var(--brand-deep)" stroke-width="5" stroke-linecap="round"/>
<text x="162" y="212" fill="var(--brand-deep)" font-weight="700">Shielding layer</text>
<rect x="238" y="84" rx="10" width="150" height="46" fill="#fff" stroke="var(--line)"/><text x="252" y="112">Your cards — safe</text>
<rect x="252" y="142" rx="10" width="150" height="46" fill="#fff" stroke="var(--line)"/><text x="266" y="170">13.56 MHz blocked</text>
</g></svg>`,
  hardware: `<svg viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID reader system integration diagram">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<g text-anchor="middle"><rect x="30" y="52" rx="6" width="44" height="28" fill="#fff" stroke="var(--line)"/><rect x="30" y="106" rx="6" width="44" height="28" fill="#fff" stroke="var(--line)"/><rect x="30" y="160" rx="6" width="44" height="28" fill="#fff" stroke="var(--line)"/><text x="52" y="70">Tag</text><text x="52" y="124">Tag</text><text x="52" y="178">Tag</text></g>
<g stroke="var(--brand)" fill="none" stroke-width="2"><path d="M92 66c14 18 14 90 0 108"/><path d="M104 80c10 12 10 68 0 80"/></g>
<rect x="150" y="88" rx="12" width="120" height="64" fill="var(--bg-alt)" stroke="var(--brand-deep)" stroke-width="2"/><text x="172" y="124" fill="var(--brand-deep)" font-weight="700">Reader</text>
<path d="M270 120h60" stroke="var(--line)" stroke-width="3"/><path d="M322 112l12 8-12 8" fill="none" stroke="var(--line)" stroke-width="3"/>
<rect x="338" y="88" rx="12" width="66" height="64" fill="#fff" stroke="var(--line)"/><text x="344" y="124">System</text>
<text x="150" y="188">USB · RS232/485 · Wiegand · Wi-Fi</text>
</g></svg>`,
};
// 频段-读距对比图:当产品规格同时涉及多个频段时展示
const FREQ_SVG = `<figure class="figure">
<svg viewBox="0 0 460 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RFID frequency bands and typical read range comparison">
<g font-family="inherit" font-size="12" fill="var(--muted)">
<text x="10" y="20" fill="var(--ink)" font-weight="700">Typical read range by frequency</text>
<text x="10" y="52">LF 125 kHz</text><rect x="120" y="40" rx="7" width="42" height="16" fill="var(--brand-2)"/><text x="170" y="52">≈ up to 10 cm</text>
<text x="10" y="86">HF / NFC 13.56 MHz</text><rect x="120" y="74" rx="7" width="70" height="16" fill="var(--brand)"/><text x="198" y="86">tap ≈ 10 cm (ISO 14443) · up to ~1 m (ISO 15693)</text>
<text x="10" y="120">UHF 860–960 MHz</text><rect x="120" y="108" rx="7" width="290" height="16" fill="var(--brand-deep)"/><text x="120" y="142">1 m —————— 10 m+</text>
</g></svg>
<figcaption>Typical ranges — actual performance varies with reader, antenna, tag size and environment.</figcaption>
</figure>`;

// ── 工厂实数表(全部来自站内已发布数字)与下单时间线 ──
const FACTORY_ROWS = [
  ['Production', 'Card lamination, inlay bonding, die-cutting and personalisation in house'],
  ['Chip sourcing', 'Direct from NXP, Impinj and EM Microelectronic product lines'],
  ['Engineering', 'In-house R&D, tooling and QC lab'],
  ['Frequencies', 'LF 125 kHz · HF 13.56 MHz · UHF 860–960 MHz'],
  ['Shipping', 'Worldwide express, with full export documentation'],
  ['Quality system', 'ISO 9001 · ISO 14001 · ISO 45001 — certificate number, issuing body and certified scope on request'],
  ['Product compliance', 'CE / FCC declarations issued per product model and target market'],
  ['Material compliance', 'RoHS / REACH statements issued per material and batch'],
  ['Warranty', '2 years, with free pre-production samples'],
];
// 交期与页面顶部 fastfacts 同源(WHOLESALE per-category) — 单页内数字永远一致
const timelineSteps = (w) => [
  ['1 · Send your spec', 'Chip, size, artwork, quantity — or just the goal. We reply with an exact quote within 24 hours.'],
  ['2 · Samples & proof', `Free pre-production samples in ${w.sample} days plus an artwork proof, so you verify material, print and chip.`],
  ['3 · Your approval', `Bulk production starts only after you approve the sample and proof — ${w.bulkLow}–${w.bulkHigh} days in house.`],
  ['4 · Tracked delivery', 'Express door-to-door shipping worldwide, with a 2-year warranty and ongoing support.'],
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
const fmtP = (n) => (n < 0.1 ? '$' + n.toFixed(3) : n < 1 ? '$' + n.toFixed(2) : money(n));
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
  { slug: 'hotel-key-card', name: 'Hotel Keycard', cat: 'cards', tag: 'Hospitality', tagline: 'RFID & magstripe keycards matched to your door-lock system.', overview: 'Hotel keycards in RFID or magnetic-stripe formats, matched and encoded per door-lock system, with custom artwork for a branded guest touchpoint.', specs: [['Chip options', 'MIFARE Classic® 1K / EV1 (13.56 MHz, 4-byte NUID), NTAG213 (NFC Forum Type 2), T5577 (125 kHz, programmable EM/HID formats)'], ['Magstripe options', 'LoCo 300 Oe / HiCo 2750–4000 Oe, ISO/IEC 7811 tracks 1–3'], ['Lock platforms (commonly matched)', 'ADEL, Salto, Hune, Beteck, Be-Tech, Ving and other MIFARE / T5577 / magstripe-based systems. Brand names are third-party trademarks listed for identification only — final compatibility is confirmed per project by sample testing, not by this list'], ['Encoding & keys', 'Per-system encoding under NDA — keys and card data are used only for your order and deleted on request. Platforms that issue keycards through the lock vendor’s own software are supplied as compatible blank stock for on-site issuance'], ['Material', 'PVC; FSC wood veneer, bamboo or recycled-PVC bodies optional'], ['Size', 'CR80'], ['Printing', 'Full-color CMYK, gloss/matte finish']], apps: ['Hotels', 'Resorts', 'Serviced apartments', 'Access control'], faqs: [['Which lock systems are supported?', 'Most RFID (MIFARE Classic, NTAG, T5577) and magstripe hotel locks, including ADEL, Salto, Hune, Beteck and Be-Tech deployments. A brand listing is not a certification — we confirm compatibility per project by encoding a free pre-production sample that you test in a real door before bulk production.']] },
  { slug: 'pvc-cards', name: 'PVC Cards', cat: 'cards', tag: 'PVC', tagline: 'Durable printed PVC cards for ID, membership and gifting.', overview: 'Full-color PVC cards built for everyday durability — ideal for ID, membership, loyalty, gift and scratch cards with a wide range of finishes and options.', specs: [['Material', 'PVC / PET / ABS'], ['Size', 'CR80 or custom'], ['Thickness', '0.76 mm standard'], ['Printing', 'Offset 4C, Pantone'], ['Options', 'Magstripe, barcode, signature & scratch panel, embossing, foil']], apps: ['Membership', 'Gift cards', 'ID', 'Loyalty', 'Scratch cards'], faqs: [['What are the standard card dimensions and thickness?', 'CR80 (ISO/IEC 7810 ID-1): 85.5 × 54 mm, 0.76 mm thick — the same size as a bank card. Custom sizes and thicknesses are available on request.'], ['Can you print transparent or frosted cards?', 'Yes — frosted, transparent and metallic finishes are available.'], ['Do you offer numbering and barcodes?', 'Yes, sequential numbers, barcodes and QR codes.']] },
  { slug: 'rfid-nfc-card', name: 'RFID / NFC Card', cat: 'cards', tag: 'RFID / NFC', tagline: '13.56 MHz & UHF cards for access, transit and tap-to-share.', overview: 'Contactless RFID/NFC cards for access control, transit, loyalty and tap-to-share digital experiences. One frequency band per card — LF, HF/NFC and UHF are not interchangeable; we help you match the band and chip to your readers.', specs: [['Frequency bands', 'LF 125 kHz · HF/NFC 13.56 MHz · UHF 860–960 MHz — one band per card; bands are not interchangeable'], ['HF / NFC chips (ISO/IEC 14443 Type A)', 'MIFARE Classic® EV1, MIFARE DESFire® EV2/EV3, NTAG213/215/216 (NFC Forum Type 2)'], ['HF vicinity chips (ISO/IEC 15693)', 'ICODE® SLIX'], ['LF chips (125 kHz)', 'EM4200; T5577 (programmable, EM/HID-compatible formats)'], ['UHF chips (EPC Class 1 Gen 2 / ISO/IEC 18000-63)', 'NXP UCODE®, Impinj Monza series'], ['Material', 'PVC'], ['Size', 'CR80'], ['Read range', 'Tap ≈ up to 10 cm (HF); up to several metres (UHF) — reader- and environment-dependent']], apps: ['Access control', 'Public transit', 'NFC marketing', 'Events', 'Closed-loop payment'], faqs: [['HF or UHF — which should I choose?', 'HF/NFC (13.56 MHz) for tap-distance interactions: phones, access readers, transit gates. UHF for multi-metre reads: parking, asset and inventory scans. Note that phones cannot read LF or UHF cards — only correctly encoded NFC (HF) cards work with iPhone / Android tap.'], ['Can an NFC card open a URL on tap?', 'Yes — NTAG cards encoded with an NDEF URL or vCard open on both iPhone and Android without an app. LF and UHF cards cannot do this.']] },
  { slug: 'rfid-epoxy-card', name: 'RFID Epoxy Card', cat: 'cards', tag: 'Epoxy', tagline: 'Compact, rugged crystal-epoxy tags and key cards.', overview: 'Epoxy (crystal) tags encase the chip and antenna in tough resin — compact, water-resistant and ideal as keychain access tokens.', specs: [['Frequency', 'LF / HF / UHF'], ['Material', 'Epoxy + PVC or anti-metal backing'], ['Shape', 'Round, square or custom'], ['Size', '25–40 mm typical'], ['Features', 'Sealed resin body — water-resistant; keyring hole']], apps: ['Access control', 'Membership', 'Asset tagging', 'Loyalty'], faqs: [['Are epoxy tags waterproof?', 'Yes, the resin makes them water- and wear-resistant.'], ['Can you make custom shapes?', 'Round, square and custom logo shapes are available.']] },
  { slug: 'custom-card-program', name: 'Custom Card Program', cat: 'cards', tag: 'Project', tagline: 'Made-to-spec cards engineered around your system.', overview: 'For system integrators and large rollouts, we engineer cards to your exact chip, encoding, security keys and artwork — with full QC and traceability.', specs: [['Chip', 'Any LF/HF/UHF or contact IC'], ['Encoding', 'Custom keys / sectors'], ['Material', 'PVC or eco materials'], ['Personalization', 'Numbering, database encoding'], ['QC', 'Full-process traceability']], apps: ['Government', 'Transit systems', 'Campus', 'Enterprise access'], faqs: [['Can you encode our security keys?', 'Yes — custom key/sector encoding under NDA.'], ['Do you provide samples for system testing?', 'Yes, pre-production samples are available.']] },
  { slug: 'wooden-rfid-card', name: 'Wooden RFID Card', cat: 'cards', tag: 'Wooden', tagline: 'Sustainable wood-finish cards for premium branding.', overview: 'Wood-finish RFID cards bring a warm, premium and eco-conscious feel to membership and hotel keys, using FSC-certified wood veneer.', specs: [['Material', 'Bamboo / wood veneer (FSC)'], ['Frequency', 'HF/NFC, UHF, LF'], ['Printing', 'Laser engraving / UV print'], ['Size', 'CR80'], ['Finish', 'Natural wood']], apps: ['Premium membership', 'Boutique hotels', 'Gift cards', 'Eco branding'], faqs: [['Is the wood sustainably sourced?', 'Yes, FSC Chain-of-Custody certified veneer.'], ['Can you laser-engrave logos?', 'Yes, laser engraving and UV printing are available.']] },
  { slug: 'metal-card', name: 'Metal Card', cat: 'cards', tag: 'Metal', tagline: 'Stainless & brushed-metal cards for VIP programs.', overview: 'Premium metal cards in stainless steel or brushed finishes that make a statement for VIP, black-card and luxury membership tiers — with optional NFC.', specs: [['Material', 'Stainless steel / brass / hybrid metal-PVC'], ['Process', 'Etching, laser, PVD color'], ['NFC', 'Optional hybrid construction'], ['Thickness', '0.5–0.8 mm'], ['Finish', 'Brushed / mirror / matte black']], apps: ['VIP membership', 'Black cards', 'Luxury brands', 'Business cards'], faqs: [['Can metal cards contain NFC?', 'Yes, via a hybrid metal + NFC construction.'], ['What finishes are available?', 'Brushed, mirror, matte black and gold / rose-gold PVD.']] },
  { slug: 'eco-friendly-card', name: 'Eco-Friendly Card', cat: 'cards', tag: 'Eco', tagline: 'Recycled, biodegradable and paper card options.', overview: 'Lower-impact cards in recycled PVC, biodegradable BIO materials, FSC paper, wood and PLA — matching standard performance with a smaller footprint.', specs: [['Material', 'Recycled PVC, BIO Card-S/P, ECO Card, FSC paper, PLA, bamboo'], ['Frequency', 'LF / HF / UHF'], ['Printing', 'CMYK'], ['Certification', 'FSC']], apps: ['Hotels', 'Retail loyalty', 'Events', 'Green branding'], faqs: [['Are these fully biodegradable?', 'BIO Card-S/P biodegrade naturally; recycled PVC cuts virgin plastic.'], ['Do they perform like PVC?', 'Yes, comparable durability and print quality.']] },
  { slug: 'nfc-business-card', name: 'NFC Business Card', cat: 'cards', tag: 'NFC', tagline: 'Tap-to-share digital business cards in PVC, metal or wood.', overview: 'An NFC business card shares your contact details, links or website with a tap — no third-party app needed. Built on NTAG chips in PVC, metal or wood finishes, it turns a premium card into a reusable digital touchpoint.', specs: [['Chip (usable NDEF memory)', 'NTAG213 (~144 bytes) / NTAG215 (~504 bytes) / NTAG216 (~888 bytes) — NFC Forum Type 2, ISO/IEC 14443 A'], ['Frequency', 'HF 13.56 MHz'], ['Material', 'PVC / metal / wood / hybrid. Metal bodies use a ferrite isolation layer or non-metal antenna window — reads are shorter and more position-sensitive than PVC, so we mark the tap zone and verify on samples'], ['Size', 'CR80 (85.5 × 54 mm)'], ['Encoding', 'URL, vCard, social profile — a short HTTPS URL fits NTAG213; full offline vCards need 215/216'], ['Printing', 'Full-color, laser engraving (metal/wood)']], apps: ['Networking', 'Sales teams', 'Executives', 'Real estate', 'Influencers'], faqs: [['Does the recipient need an app?', 'No third-party app on either platform. iPhone XS/XR and newer read NFC in the background from a plain tap; iPhone 7–X read via the built-in Control Center NFC scanner (iOS 14+). NFC-enabled Androids read on tap once NFC is on. We recommend printing a QR code on the card as the fallback for the remaining cases.'], ['Can I update the linked profile later?', 'Yes — encode a redirect URL and change the destination anytime. Use a redirect domain you own: if links run through a third-party profile service, continuity and visitor data stay under that service’s control, not yours.']] },
  { slug: 'dual-frequency-card', name: 'Dual-Frequency RFID Card', cat: 'cards', tag: 'Dual-Frequency', tagline: 'Two chips, one card — bridge HF and UHF systems.', overview: 'A dual-frequency card embeds two RFID chips in one card — for example HF 13.56 MHz for access plus UHF 860–960 MHz for long-range identification — so a single credential works across different systems during migrations or multi-application deployments.', specs: [['Frequency', 'LF 125 kHz + HF, or HF + UHF'], ['Chip', 'T5577 + MIFARE, or MIFARE + Impinj'], ['Material', 'PVC'], ['Size', 'CR80'], ['Printing', 'Offset 4C, Pantone']], apps: ['Access + asset tracking', 'System migration', 'Campus ID', 'Multi-application'], faqs: [['Why use two frequencies?', 'To bridge systems — e.g. tap access at 13.56 MHz plus long-range gate or inventory reads at 860–960 MHz on one card, or keep a legacy 125 kHz system alive during a MIFARE migration.'], ['Which chip combinations are possible?', 'LF+HF (e.g. T5577 + MIFARE Classic) or HF+UHF (e.g. MIFARE + Impinj Monza); tell us both systems and we will match the chips.']] },
  { slug: 'magnetic-stripe-card', name: 'Magnetic Stripe Card', cat: 'cards', tag: 'Magstripe', tagline: 'HiCo / LoCo magnetic-stripe cards, with optional RFID.', overview: 'Magnetic stripe cards store data on a HiCo or LoCo magnetic band for swipe readers — widely used for membership, gift, loyalty and hotel keys. Combine with an RFID/NFC chip for hybrid swipe-and-tap cards.', specs: [['Stripe', 'HiCo 2750 Oe / LoCo 300 Oe'], ['Tracks', '1 / 2 / 3'], ['Material', 'PVC'], ['Size', 'CR80'], ['Options', 'Signature panel, barcode, numbering, RFID chip']], apps: ['Membership', 'Gift & loyalty', 'Hotel keys', 'Access control'], faqs: [['HiCo or LoCo — which do I need?', 'HiCo (2,750–4,000 Oe) resists accidental erasure and suits cards swiped daily — access, membership, hotel keys. LoCo (300 Oe) costs less and suits short-life cards like gift and promo. Both encode ISO/IEC 7811 tracks 1–3.'], ['Can a card have both magstripe and RFID?', 'Yes — hybrid swipe-and-tap cards combine a HiCo/LoCo stripe with a 13.56 MHz or 125 kHz chip in one CR80 body.']] },
  { slug: 'scratch-card', name: 'PVC Scratch Card', cat: 'cards', tag: 'Scratch', tagline: 'Prepaid & PIN scratch cards with secure panels.', overview: 'Scratch cards hide a PIN or code under a removable scratch-off panel — for prepaid top-ups, promotions, gaming and loyalty. Printed in full color with secure variable-data numbering.', specs: [['Material', 'PVC / paper'], ['Panel', 'Silver / gold scratch-off'], ['Data', 'Variable PIN / barcode / QR'], ['Size', 'CR80 or custom'], ['Printing', 'Offset 4C']], apps: ['Prepaid top-up', 'Promotions', 'Gaming', 'Loyalty'], faqs: [['Can you print unique codes under the panel?', 'Yes — secure variable-data PINs, barcodes or QR codes.'], ['Is the scratch panel tamper-evident?', 'Yes, the panel shows if a card has been scratched.']] },

  { slug: 'nfc-printed-label', name: 'NFC Printed Label / Sticker', cat: 'labels', tag: 'NFC', tagline: 'Custom-printed NFC labels for authentication and tap.', overview: 'Printed NFC labels combine your artwork with an NFC chip for product authentication, tap-to-engage marketing and smart packaging.', specs: [['Chip', 'NTAG213/215/216, ICODE SLIX'], ['Frequency', '13.56 MHz'], ['Material', 'Paper / PET, adhesive backing'], ['Size', 'Custom (Ø25–40 mm common)'], ['Features', 'Tamper-evident option, CMYK print']], apps: ['Anti-counterfeit', 'Smart packaging', 'Marketing', 'Asset ID'], faqs: [['Can labels be tamper-evident?', 'Yes, fragile / tamper-evident materials are available.'], ['Can you encode and lock the URL?', 'Yes — we NDEF-encode and can permanently lock the data. NTAG213 (~144 bytes) fits any short HTTPS URL; NTAG215 (~504 bytes) and NTAG216 (~888 bytes) hold full offline vCards or multiple records.']] },
  { slug: 'rfid-dry-inlay', name: 'RFID Dry Inlay', cat: 'labels', tag: 'Dry Inlay', tagline: 'Antenna + chip inlays ready for your converting.', overview: 'Dry inlays are the antenna-and-chip core without adhesive — ideal for customers who laminate or convert them into their own products.', specs: [['Frequency', 'HF 13.56 MHz / UHF 860–960 MHz'], ['Chip', 'NXP, Impinj, EM'], ['Antenna', 'Aluminum / copper etched'], ['Format', 'Reel, custom size'], ['Backing', 'None (dry)']], apps: ['Label converting', 'Ticketing', 'Inlay integration'], faqs: [['Dry vs wet inlay?', 'Dry has no adhesive (for lamination); wet is adhesive-backed.'], ['Supplied on rolls?', 'Yes, reel-to-reel with custom pitch.']] },
  { slug: 'rfid-wet-inlay', name: 'RFID Wet Inlay / Sticker', cat: 'labels', tag: 'Wet Inlay', tagline: 'Adhesive-backed inlays for fast item tagging.', overview: 'Wet inlays add a pressure-sensitive adhesive so you can peel and stick for fast, item-level tagging in retail, logistics and asset tracking.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'Impinj Monza/M7xx, NXP UCODE'], ['Antenna', 'Aluminum etched'], ['Adhesive', 'Permanent acrylic'], ['Format', 'Reel; PET / paper face']], apps: ['Retail inventory', 'Logistics', 'Asset tracking', 'Library'], faqs: [['What read range?', 'UHF wet inlays read ~1–8 m depending on chip, antenna and reader.'], ['Custom sizes?', 'Yes, antenna and die-cut size to spec.']] },
  { slug: 'rfid-white-label', name: 'RFID White Label / Sticker', cat: 'labels', tag: 'White Label', tagline: 'Blank coated labels ready to print and encode.', overview: 'White, printable RFID labels with a coated face for thermal-transfer printing and on-demand encoding at your facility.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'UCODE, Monza, NTAG'], ['Face', 'Coated paper / PET (printable)'], ['Adhesive', 'Permanent'], ['Format', 'Reel for printers']], apps: ['Retail', 'Warehouse', 'On-demand printing'], faqs: [['Are they printer compatible?', 'Yes, works with RFID-capable thermal printers (Zebra, etc.).'], ['Can you pre-encode?', 'Yes, or leave blank for your own encoding.']] },
  { slug: 'uhf-rfid-label', name: 'UHF RFID Label', cat: 'labels', tag: 'UHF Label', tagline: 'Roll-fed UHF smart labels for retail and supply chain.', overview: 'UHF RFID labels are printable adhesive smart labels with an 860–960 MHz inlay for item-level retail tagging, warehouse and supply-chain visibility — readable in bulk at several metres and printed on demand with RFID-capable printers.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj M730 / M750, NXP UCODE 9'], ['Read range', '1–10 m'], ['Face', 'Coated paper / PET'], ['Format', 'Reel'], ['Encoding', 'Pre-encoded or blank']], apps: ['Retail apparel', 'Warehouse', 'Supply chain', 'Inventory'], faqs: [['What read range do UHF labels achieve?', 'Around 1–10 m depending on inlay, printer and reader.'], ['Can you pre-encode EPC data?', 'Yes, pre-encoded and serialized, or supplied blank.']] },

  { slug: 'rfid-animal-tag', name: 'RFID Animal Tag', cat: 'tags', tag: 'Animal', tagline: 'Ear tags and racing tags for animal ID.', overview: 'Durable LF animal tags — ear tags and racing tags — for livestock identification, traceability and event timing.', specs: [['Frequency', 'LF 134.2 kHz (ISO 11784/85) / 125 kHz'], ['Chip', 'EM4305, Hitag-S'], ['Material', 'TPU / PP'], ['Form', 'Ear tag, leg band, glass tag'], ['Rating', 'IP68 waterproof']], apps: ['Livestock', 'Pets', 'Racing (pigeon/horse)', 'Traceability'], faqs: [['Are they ISO compliant?', 'Yes — ISO 11784/11785 FDX-B at 134.2 kHz, the standard national livestock databases and vet scanners read; 125 kHz EM formats are available for closed systems.'], ['Suitable for harsh outdoor use?', 'Yes — IP68-rated TPU/PP bodies with UV- and water-resistant materials.']] },
  { slug: 'rfid-anti-metal-tag', name: 'RFID Anti-Metal Tag', cat: 'tags', tag: 'Anti-Metal', tagline: 'Reliable reads on metal assets and tools.', overview: 'Anti-metal tags use a ferrite/absorber layer so RFID works reliably when mounted on metal surfaces — for IT assets, tools and equipment.', specs: [['Frequency', 'HF / UHF'], ['Chip', 'UCODE, Monza, NTAG'], ['Material', 'PCB / FR4 / ceramic + absorber'], ['Mounting', '3M adhesive / screw'], ['Rating', 'IP67, -40~85 °C']], apps: ['IT asset management', 'Tool tracking', 'Equipment', 'Maintenance'], faqs: [['Read range on metal?', 'UHF versions typically read 1–6 m mounted on a metal plate at least the size of the tag — larger tags sit at the top of that range. HF versions read at tap distance (a few centimetres).'], ['What conditions do the range figures assume?', 'A fixed UHF reader at regulatory full power (2 W ERP in EU bands / 4 W EIRP in US bands), gate-style antenna, tag facing the antenna, mounted on metal. These are typical values consolidated from chip datasheets and field experience — not certified lab measurements. Handheld readers, lower power settings and off-angle mounting read shorter; validate with free samples on your own readers.'], ['Mounting options?', 'Adhesive, screw-hole or cable-tie versions.']] },
  { slug: 'rfid-keyfob', name: 'RFID Keyfob', cat: 'tags', tag: 'Keyfob', tagline: 'Compact, durable fobs for access & membership.', overview: 'Rugged ABS keyfobs for access control, time-and-attendance and membership — easy to carry and built to last.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'EM4200, T5577, MIFARE, NTAG'], ['Material', 'ABS / epoxy'], ['Color', 'Custom'], ['Features', 'Keyring; ultrasonically welded sealed shell — water-resistant in daily use']], apps: ['Access control', 'Time & attendance', 'Membership', 'Loyalty'], faqs: [['Can fobs be printed or numbered?', 'Yes, laser numbering and color options.'], ['Are rewritable chips available?', 'Yes — T5577 (125 kHz, programmable to EM/HID-compatible formats) and MIFARE Classic 1K (13.56 MHz, 1 KB in 16 sectors) are both rewritable; EM4200 is read-only.']] },
  { slug: 'rfid-wristband', name: 'RFID Wristband', cat: 'tags', tag: 'Wristband', tagline: 'Silicone, fabric & paper bands for events and access.', overview: 'RFID wristbands for events, water parks, festivals and access — in silicone, woven fabric, Tyvek paper and more, for cashless and ticketing use.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'MIFARE, NTAG, ICODE'], ['Material', 'Silicone / fabric / Tyvek / PVC'], ['Closure', 'Snap / one-time lock / adjustable'], ['Rating', 'Water-resistant (Tyvek) — survives pools and showers for its wear period']], apps: ['Events & festivals', 'Water parks', 'Cashless payment', 'Access'], faqs: [['Disposable or reusable?', 'Both — Tyvek for single-use, silicone/fabric for reuse.'], ['Cashless-payment ready?', 'Yes — closed-loop cashless systems typically run on MIFARE Classic 1K/EV1 or, for AES-secured wallets, MIFARE DESFire EV2/EV3 (all 13.56 MHz); we encode balance/ID per your system spec.']] },
  { slug: 'specialty-rfid-tags', name: 'Specialty RFID Tags', cat: 'tags', tag: 'Special', tagline: 'Purpose-built tags — tree, mini, PCB & more.', overview: 'Specialty RFID tags engineered for niche needs: tree/plant nursery tags, tiny mini tags, PCB tags and other custom formats beyond our standard ranges.', specs: [['Types', 'Tree/nursery, mini, PCB tag, custom'], ['Frequency', 'HF / UHF'], ['Durability', 'Heat / chemical / water resistant'], ['Size', 'From a few millimetres']], apps: ['Horticulture', 'Electronics', 'Specialty assets', 'Custom projects'], faqs: [['Can you build a fully custom tag?', 'Yes — share your size, environment and read-range needs and we will engineer it.'], ['Smallest size?', 'Mini tags from a few millimetres.']] },
  { slug: 'rfid-laundry-tag', name: 'RFID Laundry Tag', cat: 'tags', tag: 'Laundry', tagline: 'Heat- and water-resistant tags that survive wash cycles.', overview: 'RFID laundry tags are sealed in silicone or PPS to withstand repeated industrial washing, drying and pressing — automating linen and uniform tracking in hotels, hospitals and laundries. Most use UHF or HF chips for fast contactless counting.', specs: [['Frequency', 'UHF 860–960 MHz / HF 13.56 MHz'], ['Chip', 'Impinj M-series / NXP'], ['Material', 'Silicone / PPS'], ['Wash cycles', '200+'], ['Temperature', 'Up to 200 °C'], ['Rating', 'IP68']], apps: ['Hotel linen', 'Hospital textiles', 'Industrial laundry', 'Uniform rental'], faqs: [['How many wash cycles do they survive?', 'Typically 200+ industrial wash-and-press cycles depending on the model.'], ['UHF or HF for laundry?', 'UHF for fast bulk counting; HF for close-range item checks. We advise per workflow.']] },
  { slug: 'nfc-dog-tag', name: 'NFC Pet ID / Dog Tag', cat: 'tags', tag: 'Pet ID', tagline: 'Tap-to-scan pet tags that link to an owner profile.', overview: 'An NFC pet ID tag links to the owner contact and medical details — anyone who finds the animal can tap it with a phone to help reunite them. Built in durable epoxy or metal with an NTAG chip and a collar keyring.', specs: [['Chip', 'NTAG213 / 215 / 216'], ['Frequency', 'HF 13.56 MHz'], ['Material', 'Epoxy / metal'], ['Shape', 'Bone / round / custom'], ['Encoding', 'URL to pet profile'], ['Feature', 'Water-resistant sealed build; keyring']], apps: ['Pet identification', 'Lost-pet recovery', 'Vet clinics', 'Pet brands'], faqs: [['How does a finder access the info?', 'They tap the tag with any NFC phone to open the linked owner profile — no app needed.'], ['Is it waterproof?', 'Yes, epoxy and metal builds are water-resistant for daily collar wear.']] },
  { slug: 'rfid-jewelry-tag', name: 'RFID Jewelry Tag', cat: 'tags', tag: 'Jewelry', tagline: 'Tiny UHF tags for fast jewelry inventory.', overview: 'RFID jewelry tags are miniature UHF labels — often a barbell shape that loops around rings and chains — letting jewelry stores inventory thousands of small high-value items in seconds and deter theft.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj / NXP UCODE'], ['Size', 'From ~45 × 10 mm (barbell)'], ['Material', 'Coated paper / PET'], ['Printing', 'Price / barcode printable']], apps: ['Jewelry retail', 'Watch stores', 'Inventory audit', 'Loss prevention'], faqs: [['How fast is a jewelry stocktake with RFID?', 'Thousands of items can be counted in minutes versus hours by barcode.'], ['Can the tag show price and barcode?', 'Yes, the printable face carries price, barcode and branding.']] },
  { slug: 'rfid-library-tag', name: 'RFID Library Tag & Label', cat: 'tags', tag: 'Library', tagline: 'HF labels for self-checkout and shelf management.', overview: 'RFID library tags are HF 13.56 MHz labels (ISO 15693) applied inside books and media for self-checkout, fast shelf inventory and anti-theft — letting patrons borrow and return without staff scanning each item.', specs: [['Frequency', 'HF 13.56 MHz (ISO 15693)'], ['Chip', 'ICODE SLIX / SLIX2'], ['Size', '~50 × 50 mm'], ['Feature', 'AFI / EAS anti-theft'], ['Material', 'Paper, adhesive']], apps: ['Public libraries', 'University libraries', 'Media archives', 'Document tracking'], faqs: [['Do they support anti-theft?', 'Yes, ICODE AFI/EAS enables security-gate detection.'], ['Compatible with library RFID systems?', 'ISO 15693 is the standard library platforms read, but real interoperability is set by the data model (ISO 28560 or your national profile) and the AFI/EAS values your LMS expects. Name your LMS or tag vendor and we encode samples you verify on your gates and pads before the run.']] },
  { slug: 'uhf-windshield-tag', name: 'UHF Windshield Tag', cat: 'tags', tag: 'Windshield', tagline: 'Long-range tags for vehicle access and parking.', overview: 'UHF windshield tags mount inside a vehicle windscreen for long-range identification at parking barriers, gated communities and toll lanes — reading vehicles at speed from several metres. Tamper-evident versions void on removal.', specs: [['Frequency', 'UHF 860–960 MHz'], ['Chip', 'Impinj Monza / NXP UCODE'], ['Read range', 'Up to 6–10 m at full reader power (reference conditions in FAQ)'], ['Material', 'PET'], ['Feature', 'Tamper-evident, on-glass tuned'], ['Mounting', 'Inside windscreen']], apps: ['Parking access', 'Gated communities', 'Toll / ETC', 'Fleet'], faqs: [['What read range on a windscreen?', 'Typically 6–10 m with a lane-mounted reader at regulatory full power (2 W ERP in EU bands / 4 W EIRP in US bands), antenna facing the windscreen and the tag on the inside of the glass. These are typical values, not certified lab measurements — validate with free samples in your actual lane before rollout.'], ['Do metallised or heated windscreens affect reading?', 'Yes — metallised solar coatings and embedded heating grids block UHF. Mount the tag in the marked antenna window (usually near the rear-view mirror) or use a headlamp/external variant.'], ['Are they tamper-evident?', 'Yes, fragile versions break on removal to prevent reuse.']] },
  { slug: 'high-temperature-rfid-tag', name: 'High-Temperature RFID Tag', cat: 'tags', tag: 'High-Temp', tagline: 'Tags that survive autoclaves, ovens and paint lines.', overview: 'High-temperature RFID tags use PPS, ceramic or PCB housings to keep working through heat-intensive processes — autoclaves, paint-curing ovens and industrial washing — where standard tags would fail. Available up to 260 °C continuous.', specs: [['Frequency', 'HF / UHF'], ['Material', 'PPS / ceramic / FR4'], ['Temperature', 'Up to 230–260 °C'], ['Rating', 'IP68'], ['Mounting', 'Screw / adhesive / embed']], apps: ['Automotive paint lines', 'Sterilization / autoclave', 'Metalworking', 'Industrial laundry'], faqs: [['What temperature can they withstand?', 'Models rated up to 230–260 °C continuous, with short peaks higher.'], ['Do they work on metal?', 'Yes, on-metal high-temp versions are available.'], ['What conditions do read-range figures assume?', 'UHF figures assume a fixed reader at regulatory full power (2 W ERP in EU bands / 4 W EIRP in US bands), gate-style antenna, tag facing the antenna on its intended mounting surface; HF versions read at a few centimetres. These are typical values from chip datasheets and production experience, not certified lab measurements — racks, fixtures and oven walls shorten reads, so validate with free samples in your actual process.']] },
  { slug: 'rfid-seal-tag', name: 'RFID Seal / Cable-Tie Tag', cat: 'tags', tag: 'Seal', tagline: 'Tamper-evident cable-tie tags for security sealing.', overview: 'RFID seal tags combine a one-time-lock cable tie with an RFID/NFC chip — sealing containers, cages, fire extinguishers and utility meters so any tampering is visible and each seal is uniquely identifiable for audit.', specs: [['Frequency', 'HF 13.56 MHz / UHF'], ['Chip', 'NTAG / MIFARE / UCODE'], ['Material', 'Nylon tie + ABS head'], ['Lock', 'One-time self-lock'], ['Length', '200–360 mm']], apps: ['Logistics sealing', 'Fire-extinguisher inspection', 'Utility meters', 'Cage security'], faqs: [['Are they reusable?', 'No — the one-time lock makes them tamper-evident; cut to remove.'], ['What data can the chip hold?', 'A unique ID plus inspection or asset data via NFC/UHF.']] },
  { slug: 'rfid-silicone-wristband', name: 'RFID Silicone Wristband', cat: 'tags', tag: 'Silicone', tagline: 'Reusable waterproof bands for events and access.', overview: 'RFID silicone wristbands are soft, waterproof and reusable — ideal for water parks, gyms, festivals and access control. Encode them for cashless payment, ticketing or membership, with custom colors and embossed logos.', specs: [['Frequency', 'LF / HF / UHF'], ['Chip', 'MIFARE / NTAG / ICODE'], ['Material', 'Silicone'], ['Closure', 'Adjustable / fixed'], ['Rating', 'Waterproof IP68'], ['Branding', 'Embossed / printed']], apps: ['Water parks', 'Gyms & spas', 'Festivals', 'Cashless payment'], faqs: [['Are they waterproof and reusable?', 'Yes — silicone bands are fully waterproof (IP68) and reusable for years.'], ['Can we encode cashless balances?', 'Yes, encode ID or balance for tap-to-pay and access.']] },
  { slug: 'disposable-paper-wristband', name: 'Disposable Paper Wristband', cat: 'tags', tag: 'Disposable', tagline: 'Single-use Tyvek RFID bands for events.', overview: 'Disposable RFID wristbands in Tyvek paper give each guest a low-cost single-use credential for festivals, concerts and one-day events — with a secure adhesive lock and full-color print for branding, cashless or access use.', specs: [['Frequency', 'HF 13.56 MHz / UHF'], ['Chip', 'NTAG / MIFARE / UCODE'], ['Material', 'Tyvek paper'], ['Closure', 'Adhesive one-time lock'], ['Printing', 'Full-color'], ['Use', 'Single-use']], apps: ['Festivals', 'Concerts', 'One-day events', 'Theme parks'], faqs: [['Are they secure for one-time use?', 'Yes, the adhesive lock tears if removed, preventing transfer.'], ['Can they be printed and numbered?', 'Yes, full-color print with sequential numbers or barcodes.']] },

  { slug: 'rfid-blocking-card', name: 'RFID Blocking Card', cat: 'blocking', tag: 'Card', tagline: 'One card that shields a whole wallet from skimming.', overview: 'A single shielding card that disrupts unauthorized 13.56 MHz reads, protecting the cards around it from skimming.', specs: [['Protection', '13.56 MHz (NFC / contactless)'], ['Type', 'Passive shielding or active LED-jamming'], ['Material', 'PVC'], ['Size', 'CR80'], ['Printing', 'Custom CMYK']], apps: ['Banks', 'Promotions', 'Corporate gifts', 'Retail'], faqs: [['Active or passive?', 'We offer both passive shielding and active LED-jamming cards.'], ['Does it block all my cards?', 'One card protects the others in the same wallet or sleeve.']] },
  { slug: 'rfid-blocking-sleeves', name: 'RFID Blocking Sleeves', cat: 'blocking', tag: 'Sleeves', tagline: 'Protective sleeves for cards and passports.', overview: 'RFID-blocking sleeves for credit cards and passports — lightweight, printable and an effective low-cost privacy giveaway.', specs: [['Material', 'Aluminum-laminate paper / Tyvek'], ['Sizes', 'Credit-card & passport'], ['Printing', 'CMYK both sides'], ['Protection', '13.56 MHz']], apps: ['Banks', 'Travel', 'Promotions', 'Events'], faqs: [['Can they be custom printed?', 'Yes, full-color both sides for branding.'], ['Card and passport sizes?', 'Both standard sizes are available.']] },
  { slug: 'rfid-blocking-wallet', name: 'RFID Blocking Wallet', cat: 'blocking', tag: 'Wallet', tagline: 'Everyday wallets with built-in shielding.', overview: 'Wallets and card holders with integrated RFID-shielding lining — combining everyday utility with contactless privacy protection.', specs: [['Material', 'PU / genuine leather / aluminum'], ['Lining', 'RFID-shield'], ['Styles', 'Bifold, card holder, money clip'], ['Branding', 'Deboss / print']], apps: ['Corporate gifts', 'Retail', 'Travel', 'Promotions'], faqs: [['What materials?', 'PU, genuine leather and aluminum card cases.'], ['Can you add our logo?', 'Yes, debossing or printing is available.']] },

  { slug: 'barcode-scan-module', name: 'Barcode Scan Module / Engine', cat: 'hardware', tag: 'Scan', tagline: 'Embeddable 1D/2D scan engines for devices.', overview: 'Compact barcode scan engines to embed into kiosks, gates, vending and handheld devices — fast 1D/2D capture, including codes on phone screens.', specs: [['Type', 'CCD / CMOS 1D & 2D'], ['Interface', 'USB / TTL / RS232'], ['Reads', 'Paper & screen codes'], ['Integration', 'OEM module'], ['Trigger', 'Auto / sensor']], apps: ['Kiosks', 'Access gates', 'Vending', 'Handhelds', 'POS'], faqs: [['Can it read phone-screen codes?', 'Yes, 2D imagers read screen QR and barcodes.'], ['Which interfaces?', 'USB, TTL/UART and RS232.']] },
  { slug: 'industrial-iot-dtu-rtu', name: 'Industrial IoT DTU / RTU', cat: 'hardware', tag: 'DTU / RTU', tagline: 'Cellular data terminals for remote monitoring.', overview: 'Industrial DTU/RTU units transmit field data over 4G/NB-IoT for remote monitoring and control of equipment, meters and sensors.', specs: [['Network', '4G / NB-IoT / Cat-1'], ['Interface', 'RS232 / RS485 / DI / DO'], ['Protocol', 'Modbus / MQTT / TCP'], ['Power', '9–36 V'], ['Housing', 'Industrial / DIN-rail']], apps: ['Smart utilities', 'Industrial monitoring', 'Agriculture', 'Energy'], faqs: [['Which protocols are supported?', 'Modbus RTU/TCP, MQTT and transparent TCP/UDP.'], ['Which networks?', '4G Cat-1/Cat-4 and NB-IoT.']] },
  { slug: 'rfid-reader-writer', name: 'RFID LF/HF/UHF Reader / Writer', cat: 'hardware', tag: 'Reader', tagline: 'Desktop & integrated readers across LF, HF and UHF.', overview: 'A full range of RFID readers/writers — from desktop USB encoders to fixed and handheld UHF readers — across LF, HF and UHF.', specs: [['Frequency', 'LF 125 kHz / HF 13.56 MHz / UHF 860–960 MHz'], ['Form', 'Desktop, module, fixed, handheld'], ['Interface', 'USB / RS232 / RS485 / Wi-Fi / PoE'], ['SDK', 'Provided with demo software']], apps: ['Access', 'Encoding / personalization', 'Inventory', 'Asset tracking'], faqs: [['Do you provide an SDK?', 'Yes, an SDK and demo software are included.'], ['Are handheld UHF readers available?', 'Yes, Android UHF handhelds and fixed readers.']] },
  { slug: 'rfid-smart-cabinet', name: 'RFID Smart Cabinet / Terminal', cat: 'hardware', tag: 'Cabinet', tagline: 'Intelligent cabinets for automated asset control.', overview: 'RFID smart cabinets and terminals automatically track what is taken and returned — for tools, documents, medical and high-value asset control.', specs: [['Type', 'UHF smart cabinet / locker'], ['Antenna', 'Multi-zone'], ['Access', 'Card / PIN / biometric'], ['Software', 'Asset management'], ['Audit', 'Real-time logs']], apps: ['Tool cribs', 'Asset control', 'Medical supplies', 'Documents'], faqs: [['Real-time inventory?', 'Yes, the cabinet logs every take and return automatically.'], ['Access control?', 'Card, PIN and biometric options with audit trails.']] },
];

// ── 每产品独有深度内容(差异化核心:介绍/场景/追加FAQ/meta,均为该产品专属文案)──
const DETAILS = {
  'contact-ic-chip-card': {
    metaDesc: 'Contact IC cards on SLE4428/FM4428 memory chips or CPU/Java platforms, ISO 7816 modules milled and bonded in-house. Pre-encoding, numbering and magstripe combos.',
    intro: [
      'A contact IC card is built around an ISO 7816 chip module: the gold-plated contact plate is milled into the laminated card body, and the chip is wire-bonded and encapsulated beneath it. Because data moves only through physical contact with a terminal, these cards suit applications where a deliberate insert-to-read step is a feature — payment terminals, signature devices and government ID readers.',
      'Choosing the right chip matters more here than in most card families. Simple memory chips like SLE4428 or FM4428 cover prepaid and membership schemes at low cost, while CPU and Java cards add cryptographic co-processors for PKI, digital signature and EMV-style security. Send us your terminal model or applet requirements and we will confirm chip compatibility before sampling.',
    ],
    useCases: [
      ['Prepaid utility & canteen cards', 'Memory-chip cards hold stored value for campus canteens, utility prepayment meters and vending — cheap to issue and easy to re-load at kiosks.'],
      ['Corporate PKI badges', 'CPU/Java cards carry employee certificates for VPN login and document signing, combined with printed photo-ID on the same card.'],
      ['Health & insurance ID', 'Contact chips store policy or patient data that clinics read through desktop terminals, with the card doubling as printed ID.'],
    ],
    extraFaqs: [
      ['Are your contact cards ISO 7816 compliant?', 'Yes — module milling, bonding and electrical behavior follow ISO 7816-1/2/3, so the cards work in standard-compliant terminals and card readers.'],
      ['Can a contact chip be combined with magstripe or RFID?', 'Yes. Dual-interface and hybrid builds put a contact module, magstripe and/or a contactless antenna on one CR80 card for transition systems.'],
    ],
  },
  'hotel-key-card': {
    metaDesc: 'Hotel keycards matched to ADEL, Salto, Hune, Be-Tech and Ving locks — MIFARE, NTAG or T5577 encoded per system, magstripe versions included. Artwork-ready CR80 PVC.',
    intro: [
      'A hotel keycard only works if it matches the lock, so every order starts there: tell us the lock brand and model — or courier one working card — and we identify the chip family and encoding the system expects. MIFARE Classic dominates modern RFID locks, T5577 covers 125 kHz systems, and LoCo/HiCo magstripe remains common in older properties; we manufacture and encode all three.',
      'Beyond function, the keycard is the one branded object every guest handles daily. Full-bleed CMYK artwork turns it into an in-room marketing surface — properties co-brand with restaurants, spas and local attractions, or print QR codes linking to guest services. For eco-positioned hotels we produce the same encodings in wood veneer or recycled-PVC bodies.',
    ],
    useCases: [
      ['New-build hotel fit-out', 'A property opening with Salto or ADEL locks orders encoded cards in room-ready batches, with artwork proofs and a working sample approved before the full run.'],
      ['Chain re-branding', 'Hotel groups refresh thousands of cards across properties with unified artwork while we keep each hotel’s lock encoding separate and labeled.'],
      ['Resort upsell printing', 'Resorts print seasonal offers or spa promotions on the reverse side, replacing cards cheaply each season at bulk pricing.'],
    ],
    extraFaqs: [
      ['How do I confirm the card will open our locks?', 'Send your lock brand/model or one working card. We match chip and encoding, then ship free pre-production samples for you to test in a real door before bulk production. If a tested batch turns out incompatible with the agreed lock spec, we re-encode or replace it under the 2-year warranty.'],
      ['Are you certified or endorsed by ADEL, Salto or other lock brands?', 'No — RFID MFG is an independent card manufacturer with no affiliation to lock vendors. Brand names identify the platforms our chips are commonly encoded for. Where a platform issues keycards only through the lock vendor’s own encoder or software, we supply compatible blank cards and your property encodes them on site. Every order is proven the same way: free encoded samples tested in your actual locks before bulk production.'],
      ['How do you handle our keys and encoding data?', 'Under NDA. Keys, card numbers and encoding files are used only to produce your order, stored no longer than production requires, and deleted on request after delivery.'],
      ['Do you offer eco alternatives for hotel keys?', 'Yes — the same lock-compatible chips laminated into FSC wood veneer, bamboo or recycled-PVC bodies, popular with sustainability-certified properties.'],
    ],
  },
  'pvc-cards': {
    metaDesc: 'Offset-printed PVC cards from 0.3 to 1.0 mm — ID, membership, gift and loyalty formats with magstripe, signature panel, embossing, foil and variable data.',
    intro: [
      'Our PVC cards are laminated from a printed core sheet sealed between clear overlays, then die-cut to CR80 — the construction that gives bank-card durability to everyday membership and ID cards. Offset printing handles photographic artwork and tight Pantone matches; thickness runs from 0.3 mm light cards up to 1.0 mm premium weight, with 0.76 mm as the standard.',
      'Most projects add variable data, and that is where in-house personalization pays off: sequential numbering, Code 128 or QR barcodes, embossed numbers, foil accents, scratch panels and magstripes are applied on the same line as printing, so data integrity is checked before packing. Supply print-ready art with 3 mm bleed at 300 dpi CMYK, or send a brief and our studio lays it out.',
    ],
    useCases: [
      ['Retail gift & loyalty programs', 'Numbered and barcoded cards tie into POS systems; frosted and foil finishes lift perceived value at the till.'],
      ['Staff & student ID', 'Photo-panel layouts with barcodes and optional magstripe, shipped in batch order for easy distribution.'],
      ['Promotional card decks', 'Short-run printed cards for campaigns and events, produced at bulk pricing with fast turnarounds.'],
    ],
    extraFaqs: [
      ['What artwork files do you need?', 'Print-ready PDF/AI at 300 dpi CMYK with 3 mm bleed is ideal. If you only have a logo, our design team prepares proofs for approval at no extra charge.'],
      ['Which thicknesses are available?', '0.3–1.0 mm. 0.76 mm is the bank-card standard; 0.5 mm suits mailer inserts and 1.0 mm gives a heavyweight premium feel.'],
    ],
  },
  'rfid-nfc-card': {
    metaDesc: 'Contactless cards across MIFARE Classic/DESFire, NTAG and UHF chips — access, transit and tap-to-share. Security-tiered chip advice and free encoded samples.',
    intro: [
      'A contactless card is a chip and etched antenna laminated invisibly inside a printed CR80 body. The chip decision drives everything: MIFARE Classic is the workhorse for door access, DESFire EV-series adds AES security for transit and payment-adjacent schemes, NTAG makes the card phone-readable for tap-to-share, and UHF chips extend range to metres for gate and vehicle scenarios.',
      'Buyers migrating between systems should note that security expectations have shifted — legacy CRYPTO1-based deployments are increasingly replaced by AES-based DESFire or app-level encoding. We encode diversified keys under NDA, print any artwork on the body, and ship encoded samples so your readers verify the cards before a full run.',
    ],
    useCases: [
      ['Office & residential access', 'MIFARE cards encoded to your access controller, printed with company branding and issued per employee or unit.'],
      ['Transit & closed-loop payment', 'DESFire cards with AES keys for city cards, campus wallets and fare systems that demand real cryptographic security.'],
      ['NFC marketing cards', 'NTAG cards that open a URL on an NFC phone tap — for product registration, review collection or membership sign-up.'],
    ],
    extraFaqs: [
      ['Which chip should I specify for security?', 'MIFARE Classic EV1 still serves low-risk legacy access, but its CRYPTO1 cipher is publicly broken — for anything protecting valuable assets specify MIFARE DESFire EV2/EV3 (AES) with diversified keys. Chip choice alone does not make a system secure: key generation, issuance, reader authentication and revocation matter as much, and regulated payment schemes have compliance requirements beyond any chip. We encode to your security spec, not the other way round.'],
      ['Can you match cards to our existing reader fleet?', 'Yes — tell us the reader model or send one sample card; we confirm chip, protocol and encoding, then ship free encoded samples you verify on your own readers before bulk production.'],
      ['How do you handle our keys and encoding data?', 'Under NDA. Keys, card numbers and encoding files are used only to produce your order, stored no longer than production requires, and deleted on request after delivery.'],
    ],
  },
  'rfid-epoxy-card': {
    metaDesc: 'Crystal epoxy RFID tags — printed cores potted in water-resistant resin with keyring holes. Custom shapes from 25 mm, LF/HF/UHF chips, doming logos.',
    intro: [
      'Epoxy tags start as a printed, chip-embedded core that we pot in clear resin and cure into a glossy, water-resistant token — smaller and tougher than a card, sized for a keyring. The doming process magnifies the printed artwork, which is why gyms and residential compounds like them: the logo looks embedded in glass.',
      'They take the same chip menu as full-size cards (EM4200 and T5577 at 125 kHz, MIFARE and NTAG at 13.56 MHz, UHF on request) so they slot into existing access systems as a carry-friendly alternative. Custom die shapes — hearts, mascots, house outlines — need a one-time mold that pays for itself quickly at volume.',
    ],
    useCases: [
      ['Gym & pool membership fobs', 'Sealed epoxy tokens survive lockers, pockets and poolside use where printed PVC cards delaminate.'],
      ['Residential access keyrings', 'Compounds issue epoxy tags on keyrings so residents stop forgetting full-size cards.'],
      ['Branded event tokens', 'Custom-shaped epoxy tags double as collectible keepsakes with live NFC functions.'],
    ],
    extraFaqs: [
      ['How durable is epoxy versus a PVC card?', 'The sealed resin body is water-resistant for daily keyring wear and shrugs off abrasion; print stays protected under the dome rather than on the surface.'],
      ['Is there a tooling charge for custom shapes?', 'Standard rounds and squares ship from stock molds. A custom outline carries a one-time mold fee, quoted with your artwork.'],
    ],
  },
  'custom-card-program': {
    metaDesc: 'Engineered card programs for integrators — custom keys and sector maps under NDA, phased rollouts, TID capture files and full batch traceability from Shenzhen.',
    intro: [
      'System integrators and government programs rarely need "a card" — they need a credential engineered to a written spec: exact chip and memory map, diversified keys, personalization data merged from a database, and proof that every unit left the line correct. Our project workflow runs spec review, prototype, pilot batch and mass production as separate approval gates.',
      'Deliverables go beyond the cards themselves: TID/UID capture files for enrollment, per-batch QC reports, sealed key ceremonies under NDA, and phased shipments aligned to your rollout schedule. If your project mixes technologies — contact plus contactless, or LF plus HF during migration — we engineer hybrid constructions to bridge them.',
    ],
    useCases: [
      ['City & campus one-card programs', 'A single credential spans access, library, canteen and transit sub-systems with sector-level key separation per department.'],
      ['System migration bridges', 'Hybrid cards carry the legacy chip and the target chip during phased reader replacement, avoiding a big-bang cutover.'],
      ['Government ID rollouts', 'Controlled personalization with database merges, serialized delivery and documented chain of custody.'],
    ],
    extraFaqs: [
      ['What documentation comes with a project batch?', 'UID/TID lists in your requested format, encoding verification reports, and QC records per batch — plus pre-shipment samples from the actual production run.'],
      ['Can shipments follow our rollout schedule?', 'Yes — we hold produced stock and release phased shipments to sites on your calendar, common for multi-building or multi-city deployments.'],
    ],
  },
  'wooden-rfid-card': {
    metaDesc: 'FSC bamboo and wood-veneer RFID cards, laser-engraved or UV-printed, with MIFARE/NTAG chips inside. Natural-grain premium keys for hotels and eco brands.',
    intro: [
      'Wooden cards laminate a real bamboo, cherry or sapele veneer over an embedded chip and antenna, so each card carries genuine grain — no two are identical, which brands turn into a feature rather than a flaw. Laser engraving burns crisp permanent logos into the surface; UV print adds color where artwork demands it.',
      'The veneer is FSC Chain-of-Custody certified, which matters to hotels and retailers reporting on sustainability: the card is a visible, guest-facing proof point rather than a line in a report. Chips are the same MIFARE, NTAG and T5577 options as PVC cards, so wooden keys drop into existing lock and access systems without reader changes.',
    ],
    useCases: [
      ['Eco-certified hotel keys', 'Boutique and green-certified properties replace plastic keys with engraved bamboo cards matched to their existing locks.'],
      ['Premium membership tiers', 'Clubs issue wood cards for top tiers — the tactile difference from PVC signals status the moment it is handed over.'],
      ['Sustainable gift cards', 'Retailers run wooden gift cards as limited editions, pairing NFC tap experiences with plantable or recyclable packaging.'],
    ],
    extraFaqs: [
      ['How durable is a wooden card day to day?', 'Sealed veneer handles months of wallet and pocket use. For high-frequency swipe environments we recommend the thicker bamboo build or a protective matte seal.'],
      ['Will grain variation affect my printed artwork?', 'Engraving works with the grain and always looks intentional; for exact color logos we UV-print a solid panel area. We send photo proofs of real material before production.'],
    ],
  },
  'metal-card': {
    metaDesc: 'Stainless and brass cards etched, PVD-colored and laser-finished — with hybrid NFC builds that read reliably through metal. VIP, black-card and executive programs.',
    intro: [
      'Metal cards are precision-etched from stainless or brass blanks, then finished with PVD coloring — matte black, gold, rose gold — and laser-engraved detail. The weight is the point: at 30–60 g versus a 5 g PVC card, the hand feels the difference before the eye does, which is why black-card programs and luxury brands specify them.',
      'Adding NFC to metal is a real engineering problem, because a solid metal body shields the antenna. Our hybrid builds solve it with a chip cavity and ferrite isolation layer, or a metal-face/PVC-back sandwich, tuned so phones read the card reliably. Tell us whether your program needs tap function or pure prestige, and we will spec accordingly.',
    ],
    useCases: [
      ['VIP & black-card tiers', 'Banks and clubs issue weighted metal cards for top members — etched numbering, PVD black, delivered in gift boxes.'],
      ['Executive NFC business cards', 'Hybrid metal cards tap-share contact details, merging the premium object with a digital action.'],
      ['Luxury brand membership', 'Fashion and hospitality brands use mirror or brushed finishes with engraved personalization per member.'],
    ],
    extraFaqs: [
      ['Why does NFC need a special build in a metal card?', 'Solid metal blocks the 13.56 MHz field. We isolate the antenna with a ferrite layer or hybrid metal/PVC construction so phones and readers still get a clean read.'],
      ['What weight and thickness should I expect?', 'Typical builds run 0.5–0.8 mm and 30–60 g depending on alloy and cutouts — we send physical samples so stakeholders can feel options before choosing.'],
    ],
  },
  'eco-friendly-card': {
    metaDesc: 'Recycled PVC, PLA, BIO and FSC-paper RFID cards with the same chips and print quality as standard PVC — material guidance plus certification documents for ESG reporting.',
    intro: [
      'Eco cards are a materials decision, and each option trades differently: recycled PVC (rPVC) cuts virgin plastic while keeping full durability; PLA and BIO formulations biodegrade under the right conditions; FSC paper and bamboo suit short-life cards where compostability beats longevity. All take the same chips and print processes as standard PVC, so system compatibility never changes.',
      'What buyers usually need beyond the card is the paper trail — FSC Chain-of-Custody certificates, material declarations and RoHS/REACH documentation that plug into ESG reports and retail-chain supplier audits. We supply those per order, and can print recycled-content or FSC marks on the card itself where certification terms allow.',
    ],
    useCases: [
      ['Retail loyalty going plastic-free', 'Chains switch loyalty and gift cards to FSC paper or rPVC and print the sustainability story on the card back.'],
      ['Green-certified hotels', 'Key cards in bamboo or BIO material support LEED and Green Key certification narratives guests can literally hold.'],
      ['Event credentials with an end-of-life plan', 'Short-use badges and cards in compostable materials avoid the post-event plastic bin.'],
    ],
    extraFaqs: [
      ['Which eco material should my program pick?', 'Match lifetime to material: multi-year credentials → rPVC; 1-year memberships → BIO/PLA; days-to-weeks uses → FSC paper. We send a swatch pack with all of them.'],
      ['Can you provide certificates for our sustainability audit?', 'Yes — FSC CoC numbers, material data sheets and RoHS/REACH declarations ship with the order, ready for retailer or ESG audit files.'],
    ],
  },
  'nfc-business-card': {
    metaDesc: 'NFC business cards on NTAG213/215/216 (144–888 B) in PVC, metal or wood — a tap opens your profile on NFC phones, no app. Team rollouts with per-person encoding and redirect URLs.',
    intro: [
      'An NFC business card encodes an NDEF record — usually a URL to your profile, booking page or vCard — on an NTAG chip that NFC-enabled phones read with a tap, no third-party app installed. NTAG213 (~144 bytes usable) covers a short link; NTAG215 (~504 B) and 216 (~888 B) add room for richer offline vCards. The smart move is encoding a redirect URL on a domain you control, so destinations update without re-issuing cards — and links can be revoked or re-assigned when someone leaves the team.',
      'For teams we handle per-person encoding from a spreadsheet: each card gets its member’s link plus printed name, in one production run. Bodies range from printed PVC through laser-engraved wood to hybrid metal — the material choice is a positioning decision, since the card is often the first physical object a prospect receives from you.',
    ],
    useCases: [
      ['Sales team enablement', 'Every rep taps to share a tracked profile link; marketing updates destinations centrally as campaigns change.'],
      ['Executive metal cards', 'Leadership carries engraved hybrid-metal NFC cards that pair prestige with a live digital action.'],
      ['Real-estate & field services', 'Agents tap to open listing pages or booking calendars at the door, converting conversations on the spot.'],
    ],
    extraFaqs: [
      ['Which phones can read the card?', 'iPhone XS/XR and newer read NTAG tags in the background — tap the top of the phone and a banner opens, no app. iPhone 7 through X can read via the built-in Control Center NFC scanner on iOS 14+, which the user must open first. NFC-enabled Androids (the large majority of models sold in recent years) read on tap with NFC switched on. Phones with NFC off, thick cases or no NFC hardware fall back to the printed QR code, which we recommend including in the artwork.'],
      ['Do metal NFC cards read as well as PVC ones?', 'No — metal shortens read range and makes positioning matter more. Our metal and hybrid bodies use a ferrite isolation layer or a non-metal antenna window so the chip reads reliably, and we mark the tap zone on the artwork. Confirm the experience on your own phones with free pre-production samples before the full run.'],
      ['How do team orders with individual data work?', 'Send a sheet of names and URLs; we encode and print each card to its person, QC-scan every unit, and label the batch for easy distribution.'],
    ],
  },
  'dual-frequency-card': {
    metaDesc: 'Dual-frequency cards embedding two chips — LF+HF or HF+UHF — with antennas tuned to avoid detuning. One credential across access, gates and legacy systems.',
    intro: [
      'A dual-frequency card laminates two complete chip-and-antenna systems into one CR80 body — for example T5577 at 125 kHz beside MIFARE at 13.56 MHz, or MIFARE beside a UHF chip for long-range gates. The engineering is in the antenna layout: the two circuits must be positioned and tuned so neither detunes the other, which we verify with read-range testing on every design.',
      'Programs choose dual cards for two reasons. Migrations: staff carry one card while old LF readers are phased out for HF. Or multi-system estates: tap access at doors (HF) plus drive-through identification at car parks (UHF) without carrying two credentials. Tell us both reader systems and we will pair the right chips.',
    ],
    useCases: [
      ['Phased reader migration', 'One card works legacy 125 kHz doors and new MIFARE readers simultaneously, so replacement proceeds building by building.'],
      ['Campus + parking estates', 'HF handles doors and payments while the UHF side opens vehicle barriers from several metres.'],
      ['Multi-tenant facilities', 'A single credential spans different landlords’ systems that were never designed to interoperate.'],
    ],
    extraFaqs: [
      ['Do the two chips interfere with each other?', 'Not in a properly engineered card — antenna geometry and tuning are designed together and verified by range testing. We ship samples for testing on both your systems.'],
      ['Can each chip be encoded separately?', 'Yes — each side is encoded independently (e.g. site codes on LF, diversified keys on HF/UHF), exactly as if they were two cards.'],
    ],
  },
  'magnetic-stripe-card': {
    metaDesc: 'HiCo 2750/4000 Oe and LoCo magstripe cards encoded to ISO 7811 — tracks 1/2/3, hybrid swipe-plus-tap builds and full personalization from one Shenzhen line.',
    intro: [
      'Magstripe remains the cheapest machine-readable card technology, and for swipe-reader estates it is still the right answer. We laminate the stripe into the card (not stick it on), encode tracks 1/2/3 to ISO 7811, and verify every card on the line. HiCo (2750 or 4000 Oe) resists accidental erasure for daily-use cards; LoCo suits short-life hotel keys and promotions.',
      'Many buyers are mid-transition, which is where hybrid builds earn their keep: one card carrying an encoded magstripe plus a contactless chip lets old swipe readers and new tap readers coexist during upgrades. Signature panels, sequential numbering, barcodes and embossing complete the classic bank-card feature set.',
    ],
    useCases: [
      ['Membership & gift programs on legacy POS', 'Track-2 encoded cards run on existing swipe hardware without any system change.'],
      ['Hotels on magstripe locks', 'LoCo keys at low unit cost, encoded and boxed per property standard.'],
      ['Swipe-to-tap transitions', 'Hybrid stripe+RFID cards bridge the years where both reader generations coexist.'],
    ],
    extraFaqs: [
      ['What data format do you encode on the stripe?', 'Any ISO 7811 track layout — send your track specification or a sample card and we replicate it exactly, verified card by card.'],
      ['How long does an encoded stripe last?', 'HiCo stripes withstand thousands of swipes and casual magnet exposure; LoCo is rated for lighter duty. We advise per daily swipe count.'],
    ],
  },
  'scratch-card': {
    metaDesc: 'Secure PVC and paper scratch cards — variable PINs under silver/gold panels, encrypted code files, tamper-evident panels for top-up, gaming and promotions.',
    intro: [
      'A scratch card program is a data-security exercise wrapped in print. We generate or import unique PINs, print them as variable data, then apply the scratch panel over the top — with the code file exchanged encrypted, purged after production, and never reused across batches. The panel itself is tamper-evident: once scratched, there is no hiding it.',
      'Construction choices follow the use: PVC bodies for retail rack durability and premium promotions, coated paper for high-volume top-up cards where unit cost rules. Silver or gold panels, serial numbers, barcodes for activation scans and full CMYK branding are standard options on both.',
    ],
    useCases: [
      ['Telecom top-up', 'High-volume paper scratch cards with encrypted PIN files delivered straight to the operator’s activation system.'],
      ['Retail promotions & instant-win', 'Branded PVC cards with prize codes under the panel drive footfall and social campaigns.'],
      ['Gaming & gift codes', 'Serialized cards with activation barcodes tie physical retail sales to digital redemption.'],
    ],
    extraFaqs: [
      ['How are the secret codes handled securely?', 'Codes are exchanged as encrypted files, live only in the production system during printing, are verified against duplicates, and are purged after delivery confirmation.'],
      ['PVC or paper — which should we order?', 'Paper wins on cost for single-use top-ups; PVC survives retail display racks and suits premium campaigns. We quote both from the same artwork on request.'],
    ],
  },

  'nfc-printed-label': {
    metaDesc: 'CMYK-printed NFC labels encoded and locked on the converting line — NTAG and ICODE chips, tamper-void faces, Ø25–40 mm die-cuts for packaging and campaigns.',
    intro: [
      'Printed NFC labels come off our line as a finished product: face artwork printed, chip encoded with your URL or NDEF record, data locked if required, and every label read-verified before winding. That single-pass process matters at campaign scale — ten thousand stickers that each open the right link, without your team touching an encoder.',
      'Anti-counterfeit programs add tamper features: fragile paper faces that shred on peeling, or tamper-loop inlays that flip a status flag when opened, so a scan can tell an intact seal from a resealed one. Size drives read behavior — Ø25 mm reads at a phone-touch, Ø38–40 mm gives more forgiveness on curved packaging.',
    ],
    useCases: [
      ['Product authentication', 'Brands seal cartons with tamper NFC labels; customers verify authenticity with a tap that also registers the product.'],
      ['Smart packaging campaigns', 'A tap on-pack opens recipes, refill orders or loyalty sign-up — measurable engagement from shelf to phone.'],
      ['Fixed asset ID', 'Printed asset labels carry both a visible barcode and a tap-readable NFC record for audits.'],
    ],
    extraFaqs: [
      ['Do you have on-metal NFC label versions?', 'Yes — ferrite-backed constructions read reliably on metal housings and equipment, at slightly larger sizes.'],
      ['What size should we choose for curved bottles?', 'Ø38 mm or larger keeps the antenna flat enough to read consistently on tight curves; we send size samples to test on your actual packaging.'],
    ],
  },
  'rfid-dry-inlay': {
    metaDesc: 'HF and UHF dry inlays — etched aluminum antennas with NXP, Impinj and EM chips on reel, custom pitch and web width for converters and laminators.',
    intro: [
      'A dry inlay is the naked RFID engine: chip flip-bonded onto an etched aluminum antenna on PET, wound on reels with no adhesive layer. Converters laminate them into tickets, cards, baggage tags and their own label constructions — which is why the specs that matter here are converting specs: web width, pitch, core diameter, wind direction and liner behavior in your machine.',
      'We match antenna designs to the chip and the end application — ICODE and NTAG for HF ticketing, UCODE and Monza families for UHF logistics — and supply TID lists where your process needs pre-association. Trial reels ship first so your line proves out lamination temperature and registration before volume.',
    ],
    useCases: [
      ['Ticket converting', 'HF inlays laminated into transit and event tickets on the converter’s own paper stock.'],
      ['Card lamination', 'Inlays sized for CR80 sheets feed card makers producing contactless cards in their own facility.'],
      ['Composite label construction', 'Label houses sandwich dry inlays into branded multi-layer constructions with their choice of face and adhesive.'],
    ],
    extraFaqs: [
      ['What reel specifications can you supply?', 'Custom pitch, web width, core size and wind direction to match your applicator or laminator — send your machine spec and we cut reels to it.'],
      ['Can you deliver TID data with the reels?', 'Yes — TID capture files per reel in CSV or your format, so pre-association and serialization start before the reels arrive.'],
    ],
  },
  'rfid-wet-inlay': {
    metaDesc: 'Adhesive-backed wet inlays with Monza/M7xx and UCODE chips — peel-and-stick item tagging, tested adhesion on cartons, plastics and glass, 1–8 m UHF reads.',
    intro: [
      'Wet inlays add a pressure-sensitive acrylic adhesive and liner to the inlay core, turning it into a peel-and-stick tag ready for item-level work. They are the fastest route from box-of-tags to tagged-inventory: no printing step required, applied by hand or automatic applicator straight onto products, cartons or fixtures.',
      'Adhesion is the spec buyers overlook — the same inlay behaves differently on corrugate, HDPE and glass, so we test our adhesive builds across surface types and supply application guidance (surface energy, minimum application temperature). Chips run the Impinj Monza/M700 and NXP UCODE ranges, pre-encoded and serialized on request.',
    ],
    useCases: [
      ['Retail item tagging', 'Stores tag existing stock directly with clear wet inlays, enabling RFID stocktakes without relabeling.'],
      ['Returnable asset tracking', 'Crates and totes get durable wet inlays that survive wash-down logistics loops.'],
      ['Library & media', 'Clear HF wet inlays apply invisibly inside covers for circulation and security.'],
    ],
    extraFaqs: [
      ['Will the adhesive hold on our specific surface?', 'Send us the surface (or a sample) — we match permanent, high-tack or low-surface-energy adhesive builds and confirm with test pieces before you order volume.'],
      ['Can wet inlays arrive pre-encoded?', 'Yes — EPC schemes with serialization, verified on-line, plus a data file mapping EPC to reel position for your receiving system.'],
    ],
  },
  'rfid-white-label': {
    metaDesc: 'Printable white RFID labels for Zebra, SATO and Postek RFID printers — coated faces, calibrated inlay placement, blank or pre-encoded rolls, HF and UHF.',
    intro: [
      'White labels are the print-your-own workflow: a coated, thermal-transfer-printable face over an RFID inlay, wound for desktop and industrial RFID printers. The engineering detail that decides success is inlay placement — the chip position must match your printer’s encode antenna, so we manufacture placement to the printer model you name and test rolls on matching hardware.',
      'Operations choose between two workflows: blank rolls encoded at print time by your printer, or pre-encoded rolls where the printer only prints — the second removes encode-failure stops on busy lines. Either way, faces take barcodes, text and logos crisply at 203–300 dpi with standard resin or wax-resin ribbons.',
    ],
    useCases: [
      ['Warehouse label stations', 'Teams print location and case labels on demand, with RFID encoded in the same pass.'],
      ['Retail back-room tagging', 'Stores print price/SKU labels that are simultaneously RFID stock tags.'],
      ['Work-in-progress tracking', 'Factories print travel labels per order; readers track jobs between stations automatically.'],
    ],
    extraFaqs: [
      ['Which printers are your rolls matched to?', 'Zebra ZD/ZT RFID series, SATO CL4/6NX and Postek models among others — name yours and we set inlay pitch and placement for it, with a test roll first.'],
      ['What printer settings should we start with?', 'We ship a settings sheet per order — ribbon type, darkness, print speed and RFID calibration steps — so the first roll runs clean rather than by trial and error.'],
    ],
  },
  'uhf-rfid-label': {
    metaDesc: 'UHF smart labels on M730/M750 and UCODE 9 inlays, band-tuned for EU/US, SGTIN serialization for retail programs — bulk reads at metres, printed on demand.',
    intro: [
      'UHF labels are the workhorse of item-level retail and supply-chain visibility: an 860–960 MHz inlay under a printable face, read in bulk at dock doors and by handheld sweeps metres away. Chip generation matters — Impinj M730/M750 and NXP UCODE 9 read faster and further at smaller antenna sizes than older silicon, which shrinks label footprints on packaging.',
      'Two program-level details we handle up front: band tuning (ETSI 866 MHz vs FCC 915 MHz antennas behave differently — global programs need broadband designs) and serialization (SGTIN-96 EPC schemes generated from your GS1 prefix, managed duplicate-free across orders). Both are locked before the first production roll.',
    ],
    useCases: [
      ['Retail apparel compliance', 'Suppliers tag garments to retailer RFID mandates with serialized EPCs and audit documentation.'],
      ['Carton & pallet logistics', 'Dock-door portals read whole pallets without line-of-sight, closing the gap between shipped and received.'],
      ['High-volume inventory', 'Weekly full-store or full-warehouse counts become an hours-long handheld sweep.'],
    ],
    extraFaqs: [
      ['Do we need different labels for Europe and the US?', 'Single-region programs get band-optimized antennas; global supply chains get broadband inlays that perform acceptably across 860–960 MHz. Tell us the read geography and we spec accordingly.'],
      ['Can you manage EPC serialization for us?', 'Yes — send your GS1 company prefix and SKU list; we generate SGTIN-96 EPCs, encode and verify them, and deliver the allocation file for your systems.'],
    ],
  },

  'rfid-animal-tag': {
    metaDesc: 'ISO 11784/85 FDX-B ear tags in flexible TPU — EM4305/Hitag chips, applicator-compatible, laser-numbered, IP68 for livestock traceability programs.',
    intro: [
      'Animal ear tags live outdoors on a moving animal for years, so the engineering targets are bite resistance, UV stability and retention — soft TPU that flexes instead of tearing, a stainless tip that pierces cleanly, and a locking cup that stays closed. Chips are LF 134.2 kHz FDX-B (ISO 11784/11785), the standard national traceability schemes read.',
      'Programs usually pair the electronic ID with management data printed on the flag: laser-etched visual numbers, farm codes and barcodes that survive sun and mud. Tags fit common ear-tag applicators — tell us your applicator brand or order ours together with the tags — and we supply the EID number files for your herd software.',
    ],
    useCases: [
      ['National livestock traceability', 'FDX-B tags enroll cattle and sheep in government ID schemes, readable by any ISO-compliant stick reader.'],
      ['Dairy herd management', 'EID tags tie each animal to milking, feeding and health records automatically at the parlor.'],
      ['Racing & breeding ID', 'Pigeon rings and small-animal tags carry chip ID for event timing and pedigree records.'],
    ],
    extraFaqs: [
      ['Do the tags work with our existing applicator?', 'Our tags fit common ear-tag applicators; name your model and we confirm, or include matched applicators with the order.'],
      ['Can you supply the EID numbers as a file?', 'Yes — every shipment includes a CSV of chip numbers matched to printed visual numbers, ready to import into herd-management software.'],
    ],
  },
  'rfid-anti-metal-tag': {
    metaDesc: 'On-metal RFID tags with ferrite isolation — FR4, ceramic and flexible builds reading 1–6 m on steel, IP67, -40 to 85 °C, adhesive or screw mount.',
    intro: [
      'Ordinary RFID tags fail on metal because the surface reflects the field and detunes the antenna. Anti-metal tags fix the physics with an isolation layer — ferrite or engineered foam — between antenna and surface, turning the metal from an enemy into a reflector that can actually extend range. On-metal UHF reads of 1–6 m are routine with the right size.',
      'Housing choice follows the environment: FR4 (PCB) tags for general assets, ceramic for small tools and high heat, flexible on-metal labels where thickness matters, and heavy ABS blocks with screw mounts for outdoor plant. All are IP67-rated and temperature-stable from -40 to 85 °C in standard builds.',
    ],
    useCases: [
      ['IT asset management', 'Servers and laptops carry slim on-metal labels; audits become a doorway scan instead of a serial-number hunt.'],
      ['Tool crib control', 'Ceramic tags on hand tools survive impact and oil while enabling automated check-in/out.'],
      ['Heavy equipment & fleet', 'Screw-mounted tags identify machines, skips and vehicles across yards and sites.'],
    ],
    extraFaqs: [
      ['Why do standard labels stop working on metal?', 'Metal reflects the RF field and detunes a normal antenna to near-zero range. Anti-metal builds insert a ferrite/absorber layer engineered for the surface, restoring reliable reads.'],
      ['How do I trade size against read range?', 'Bigger tag, longer range — roughly: 25 mm ceramic ≈ 1–2 m, 50–80 mm FR4 ≈ 3–6 m on metal. Tell us the required range and mounting space; we pick the smallest tag that meets it.'],
    ],
  },
  'rfid-keyfob': {
    metaDesc: 'ABS RFID keyfobs, ultrasonically welded and water-resistant — EM4200, T5577, MIFARE and NTAG chips, laser numbering, custom colors and molded logos.',
    intro: [
      'The keyfob is access control’s most-carried form factor: an ABS shell around a chip and coil, ultrasonically welded shut so daily keyring life — drops, rain, pockets — cannot get in. Chip choice mirrors card systems exactly (EM4200 read-only LF, T5577 rewritable LF, MIFARE and NTAG at 13.56 MHz), so fobs and cards mix freely in one system.',
      'Fleet management is where options matter: laser-engraved sequential numbers tie each fob to a unit or member without a printed label to wear off; color-coded shells separate buildings or membership tiers at a glance; molded custom shapes carry brands. For gyms and pools the sealed build outlasts laminated cards several times over.',
    ],
    useCases: [
      ['Apartment & compound access', 'Color-coded, numbered fobs issued per unit make lost-fob replacement and auditing painless.'],
      ['Gyms & leisure clubs', 'Waterproof fobs on members’ keyrings survive lockers and poolside where cards fail.'],
      ['Time & attendance', 'Staff badge in with fobs on existing readers, numbered against the HR roster.'],
    ],
    extraFaqs: [
      ['Can fobs be cloned — should we worry?', 'Basic EM4200/T5577 fobs are copyable; if that is a risk, specify MIFARE with diversified keys or DESFire and we encode securely under NDA.'],
      ['What identification options exist per fob?', 'Laser sequential numbering, printed logos, color-coded shells, and a CSV mapping chip UID to engraved number for your access software.'],
    ],
  },
  'rfid-wristband': {
    metaDesc: 'RFID wristbands across silicone, woven fabric and Tyvek — event access, cashless and waterparks, one encoding line from single-use to premium reusable.',
    intro: [
      'This is the umbrella range: one encoding and QC line behind three material families. Tyvek paper bands are the single-use economy option with adhesive locks; woven fabric with sliding closures is the festival standard — comfortable for days, hard to transfer; molded silicone is the reusable, waterproof workhorse for venues and waterparks. Chips (MIFARE, NTAG, ICODE, UHF) drop into any of them.',
      'Choosing between them is a cost-per-wear calculation we help run: a season pass belongs in silicone, a three-day festival in fabric, a one-night show in Tyvek. Mixed orders are common — VIP fabric plus GA Tyvek under one artwork system — and all bands ship encoded, numbered and match-listed for your access platform.',
    ],
    useCases: [
      ['Festival access tiers', 'Fabric bands for multi-day passes, Tyvek for day tickets — one visual identity, one data format.'],
      ['Waterpark & resort', 'Silicone bands open lockers and rooms and carry cashless credit through water and sun.'],
      ['Conference & expo', 'Branded bands double as credentials and session-tracking tags at entrances.'],
    ],
    extraFaqs: [
      ['Can one event order mix band materials?', 'Yes — shared artwork across Tyvek, fabric and silicone with tier-specific colors, all encoded into the same access system and delivered sorted by tier.'],
      ['How do bands arrive for gate-day logistics?', 'Encoded, sequentially numbered, and boxed in labeled batches with a UID manifest — so distribution points hand out bands without any on-site pairing step.'],
    ],
  },
  'specialty-rfid-tags': {
    metaDesc: 'Custom-engineered RFID tags — nursery tree nails, 6 mm micro tags, PCB builds and one-off formats. Feasibility check, tooling quote and pilot runs from Shenzhen.',
    intro: [
      'When the standard catalog does not fit the object or the environment, we engineer the tag: nail tags hammered into tree trunks for nursery stock, micro tags a few millimetres across for instruments, PCB tags shaped around a housing, chemical-resistant builds for process industries. The constraint set — size, surface, temperature, range, attachment — defines the design.',
      'The path is fixed and low-risk: feasibility review of your constraints, a tooling/sample quote, engineered prototypes tested against your readers, then a pilot batch before volume. One-time tooling typically amortizes within the first production run at four-figure quantities; below that we adapt the closest standard format instead.',
    ],
    useCases: [
      ['Horticulture & forestry', 'Nail and stake tags identify trees and nursery stock through years of weather.'],
      ['Instrument & electronics ID', 'Micro tags embed into tools and devices where label space does not exist.'],
      ['Process-industry assets', 'Chemical- and heat-resistant builds track items through hostile production steps.'],
    ],
    extraFaqs: [
      ['What does the custom engineering process look like?', 'Constraints review → feasibility answer within days → sample/tooling quote → prototypes for your testing → pilot batch → volume. You approve at every gate.'],
      ['When is custom tooling worth it?', 'Roughly from 5,000+ units, tooling cost per unit becomes negligible. Below that we usually modify a standard tag — same function, no tooling fee.'],
    ],
  },
  'rfid-laundry-tag': {
    metaDesc: 'PPS and silicone laundry tags rated 200+ industrial wash cycles and 200 °C pressing — UHF bulk counting for hotel linen, hospital textiles and uniform rental.',
    intro: [
      'Industrial laundry is one of RFID’s harshest duty cycles: 60–90 °C washes with aggressive chemistry, tumble drying, and pressing that spikes past 180 °C — repeated hundreds of times. Laundry tags survive it by sealing the chip in PPS resin or medical-grade silicone, builds we rate conservatively at 200+ full cycles and verify with accelerated wash testing.',
      'Attachment decides workflow fit: sewn into a hem pouch for linen, heat-sealed patches for garments that cannot show a tag, or hang-stitched for speed. UHF chips let a laundry count a full trolley in one pass — the operational win that pays for the program — while HF versions suit item-check stations. We advise per your sorting layout.',
    ],
    useCases: [
      ['Hotel linen circulation', 'Every sheet and towel is counted in and out by trolley pass, ending count disputes with the laundry.'],
      ['Hospital textile control', 'Tags survive thermal disinfection while tracking scrubs and bedding through sterile workflows.'],
      ['Uniform rental billing', 'Rental firms bill per verified wash cycle, with wear history per garment.'],
    ],
    extraFaqs: [
      ['How are the tags attached to textiles?', 'Sewn hem pouches (linen), heat-seal patches (garments) or hang stitching (speed). We send attachment samples so your seamstress line tests all three.'],
      ['Do the tags withstand our wash chemistry?', 'PPS builds resist standard industrial detergents, bleach dosing and 200 °C pressing. Share your chemical process for confirmation against the material data sheet.'],
    ],
  },
  'nfc-dog-tag': {
    metaDesc: 'NFC pet ID tags in epoxy or engraved metal — a finder’s phone tap opens the owner profile, no app or reader. Bone and round shapes, waterproof, pet-brand OEM.',
    intro: [
      'An NFC pet tag closes the loop that a phone-number engraving cannot: whoever finds the animal taps the tag with an NFC phone and lands on a live profile — owner contacts, medical notes, reward message — which the owner updates anytime without re-engraving anything. The chip is a standard NTAG encoded with the profile URL, potted in epoxy or set into a metal tag.',
      'For pet brands we run OEM programs: custom shapes and colors, engraved branding, and per-tag unique URLs pointing at the brand’s own profile platform — each tag pre-linked and QC-tapped before packing. Builds are water-resistant for daily collar wear and sized from cat-small to large-breed.',
    ],
    useCases: [
      ['Lost-pet recovery', 'A finder taps and calls within a minute — no vet-office chip scanner needed, unlike implanted microchips.'],
      ['Vet & clinic programs', 'Clinics issue tags linking to vaccination and medical records kept current online.'],
      ['Pet-brand product lines', 'Brands sell NFC tags tied to their own app or profile service, manufactured and pre-encoded by us.'],
    ],
    extraFaqs: [
      ['How is this different from an implanted microchip?', 'Implants need a vet’s scanner; this tag is read by NFC-enabled smartphones. They complement each other — the visible tag gets fast street-level recovery, the implant proves ownership.'],
      ['Can we brand the tags for our pet business?', 'Yes — custom shapes, engraved logos and per-tag URLs to your platform, delivered pre-encoded with a manifest mapping tag to URL.'],
    ],
  },
  'rfid-jewelry-tag': {
    metaDesc: 'Barbell UHF jewelry tags from 45×10 mm — thousand-item stocktakes in minutes, printable price/barcode face, dense-stock read tuning for jewelers.',
    intro: [
      'Jewelry inventory is high value, tiny items, and hundreds of near-identical SKUs in a metre of tray — the exact scenario barcodes handle worst. A barbell tag loops its slim antenna tail around a ring shank or chain, keeps the printable face out where staff read prices, and lets a handheld UHF sweep count an entire showcase in seconds.',
      'Dense-tag environments have real RF physics to manage: hundreds of tags in near-contact shadow each other. Our jewelry inlays and read guidance (tray materials, antenna sweep pattern, reader power) come from deployments where full-store counts dropped from a closed-doors day to a before-opening routine.',
    ],
    useCases: [
      ['Daily showcase reconciliation', 'Morning and evening sweeps verify every piece against the register in minutes, shrinking loss windows to hours.'],
      ['Full-store audits', 'Quarterly counts of tens of thousands of pieces finish before opening instead of closing the store.'],
      ['Consignment tracking', 'Pieces moving between branches and consignors carry their identity and paper trail on the tag.'],
    ],
    extraFaqs: [
      ['Does the tag damage or mark the jewelry?', 'No — the tail loops without adhesive on the piece and tears off cleanly at sale. Residue-free removal is part of the tag design.'],
      ['Reads are unreliable in packed trays — can that be fixed?', 'Yes, mostly by technique: tray spacing inserts, correct sweep angles and tuned reader power. We supply a read-optimization sheet with every first order.'],
    ],
  },
  'rfid-library-tag': {
    metaDesc: 'ISO 15693 ICODE SLIX library labels with AFI/EAS security — self-checkout, shelf inventory and gate alarm in one 50×50 mm tag, retro-tagging support.',
    intro: [
      'Library tags standardize on HF ISO 15693 with ICODE SLIX chips because the ecosystem does: self-checkout kiosks, staff pads, inventory wands and security gates from the major library platforms all speak it. One 50×50 mm label inside the cover carries the item ID for circulation, the AFI/EAS flags for gate security, and enough memory for the data model your LMS uses.',
      'Most orders are conversion projects — an existing collection of tens of thousands of items being retro-tagged. We support them with pre-encoded tags matched to your barcode file (tag maps to existing accession number), tagging-station workflow advice, and special formats for problem items: hub labels for DVDs/CDs and slim tags for thin periodicals.',
    ],
    useCases: [
      ['Self-service circulation', 'Patrons stack books on a kiosk pad; all check out in one read, with security flags cleared in the same transaction.'],
      ['Shelf inventory & misplaced-item hunts', 'A wand sweep along shelves finds miss-shelved and missing items that a barcode audit would never catch.'],
      ['Gate security', 'EAS flags set on checkout trip the gates only for items that never passed the kiosk.'],
    ],
    extraFaqs: [
      ['Can tags arrive matched to our existing barcodes?', 'Yes — send the accession/barcode file and we pre-encode each tag to its number, so retro-tagging is stick-and-scan-verify rather than encode-at-the-shelf.'],
      ['What about DVDs, CDs and thin magazines?', 'Hub labels sit in the disc center without unbalancing it; slim narrow tags handle periodicals. Both run the same ISO 15693 standard as the book tags.'],
    ],
  },
  'uhf-windshield-tag': {
    metaDesc: 'On-glass tuned UHF windshield tags reading 6–10 m at lane speed — tamper-void on removal, for parking, gated estates, tolling and fleet yards.',
    intro: [
      'A windshield tag is tuned for one specific situation: antenna against glass, read from a lane-side or gantry reader while the vehicle moves. On-glass tuning matters — glass shifts antenna resonance, so a generic label stuck to a windscreen loses most of its range. Ours are designed against glass and deliver 6–10 m reliably at barrier speeds.',
      'Because the tag is a credential, anti-transfer is built in: fragile substrates delaminate on any peeling attempt, killing the antenna, so a tag cannot migrate to an unauthorized vehicle. One caveat we flag honestly: metallized/athermic windscreens block UHF — those vehicles need the headlamp-mount variant instead, which we supply in the same program.',
    ],
    useCases: [
      ['Residential & office parking', 'Barriers open hands-free for registered vehicles; guest and resident tags carry different access classes.'],
      ['Fleet yard automation', 'Gates log every entry/exit by vehicle automatically, replacing gatehouse clipboards.'],
      ['Campus & airport permits', 'Annual permits become electronically verifiable at speed, with expired tags flagged at the lane.'],
    ],
    extraFaqs: [
      ['Our vehicles have athermic (metallized) windscreens — will tags work?', 'Standard tags will not read through metallized glass. Check for the dotted mounting window near the mirror, or use our headlamp-mounted variant, which reads off the lamp housing instead.'],
      ['How do we enroll hundreds of vehicles efficiently?', 'Tags ship with printed IDs and a UID manifest; fleet admins match tag to plate in a spreadsheet and bulk-import to the barrier system — no per-vehicle encoding step.'],
    ],
  },
  'high-temperature-rfid-tag': {
    metaDesc: 'High-temp RFID in PPS, ceramic and FR4 — rated to 230–260 °C for paint lines, autoclaves and industrial laundry, with mounting and cycle-life guidance.',
    intro: [
      'Standard RFID dies quietly somewhere above 85 °C; these tags are engineered for processes that live far beyond it. PPS handles 200–230 °C with chemical resistance (laundry, sterilization), ceramic packages push to 260 °C peaks and shrug off paint-oven cycles, and high-Tg FR4 covers the economical middle. The rating that matters is cyclic, not single-shot — we spec against your repeated profile.',
      'Placement engineering is half the solution: mounting distance from hottest surfaces, screw versus high-temp adhesive versus embedding, and read-window planning where racks shield tags in ovens. Send your process profile — peak temperature, dwell time, cycles per part — and we return a tag choice with expected service life rather than a bare datasheet number.',
    ],
    useCases: [
      ['Automotive paint shops', 'Skid and body tags ride through e-coat and paint ovens, keeping body-to-order identity across the hottest zone of the plant.'],
      ['Autoclave sterilization', 'Instrument trays and textile packs are tracked through 134 °C steam cycles with full audit history.'],
      ['Bakery & food process racks', 'Rack tags survive oven cycles to automate throughput counting and rotation.'],
    ],
    extraFaqs: [
      ['How many heat cycles will a tag actually survive?', 'PPS builds run thousands of 200 °C-class cycles; ceramic extends both temperature and cycle life. Give us peak temp, dwell and cycle count and we quote expected service life for the recommended model.'],
      ['How should tags be attached in hot processes?', 'Above adhesive limits (~150–200 °C with specialty tapes), specify screw/rivet mounts or embedding. We supply mounting hardware and placement guidance per process.'],
      ['What is the highest temperature an RFID tag can survive?', 'Ceramic-packaged tags are the top of the range — 230–260 °C class ratings with short peaks higher, model-dependent. Beyond that, the answer is process engineering: thermal barriers, standoff mounting or reading before/after the hottest zone. Tell us your peak and dwell and we will say plainly whether a tag can live there.'],
      ['Are high-temperature RFID tags passive?', 'Yes — the practical high-temp designs are passive HF or UHF: no battery to fail in the heat, powered entirely by the reader field. That is why they survive repeated oven and autoclave cycles that would destroy battery-assisted tags.'],
      ['Is there a high-temperature RFID label, or only rigid tags?', 'Flexible label formats handle moderate heat only (roughly the 120–150 °C short-exposure class, construction-dependent). For repeated 200 °C+ processes you need a rigid PPS, ceramic or FR4 housing — that is the trade: label thinness versus survivable temperature.'],
    ],
  },
  'rfid-seal-tag': {
    metaDesc: 'One-time-lock RFID cable seals — nylon tie with NTAG/UCODE chip head, unique IDs for container, meter and extinguisher audit trails, 200–360 mm.',
    intro: [
      'A seal tag welds two functions into one disposable part: a self-locking nylon tie that shows physical tampering, and an RFID chip carrying a unique, unclonable serial — so every sealing event becomes a database record. Cut it off and the removal is obvious; scan it and you know exactly which seal, applied when, by whom.',
      'The chip choice follows the audit workflow: NFC heads let field inspectors log checks with a phone tap (extinguishers, meters, first-aid cabinets), while UHF heads let a gate reader verify container and cage seals in bulk without stopping the trolley. Pull strengths and tie lengths are speced to the asset — from cabinet handles to shipping-container hasps.',
    ],
    useCases: [
      ['Fire-extinguisher inspection rounds', 'Each inspection re-seals with a new tag; a phone tap logs date, inspector and unit into the compliance record.'],
      ['Logistics cage & container sealing', 'Dock readers verify intact, expected seals in seconds and alarm on mismatches.'],
      ['Utility meter integrity', 'Sealed meters carry tamper history; any break is evident physically and by missing scan continuity.'],
    ],
    extraFaqs: [
      ['What pull strength do the ties provide?', 'Standard nylon builds hold 20–50 kg depending on width; they are tamper-evident seals, not security locks — the evidence trail, not brute resistance, is the control.'],
      ['How do inspectors use the NFC head in practice?', 'A phone tap reads the seal’s unique ID into your inspection app or ours; the app logs GPS, time and inspector, building the audit trail with zero extra hardware.'],
    ],
  },
  'rfid-silicone-wristband': {
    metaDesc: 'Molded silicone RFID wristbands — IP68 waterproof, reusable for years, embossed or printed branding, sized adult/child, cashless and access encoding.',
    intro: [
      'Silicone bands are the durability end of the wristband family: one molded piece with the chip pod sealed inside, no seams, no closure to break, fully waterproof. They survive daily chlorine, sun cream and dishwasher-style cleaning for years — which flips the economics for venues: a band that costs more per unit but issues hundreds of times beats disposables within a season.',
      'Branding is molded in, not stuck on: embossed or debossed logos survive where prints eventually wear, and dual-color molding adds contrast. Sizing matters more than buyers expect — we supply adult and child circumferences plus adjustable-stud versions, and encode the chip your system needs (MIFARE, NTAG, ICODE, UHF) to your access or payment platform.',
    ],
    useCases: [
      ['Waterparks & pools', 'Bands open lockers, gates and cashless wallets through a full season of water exposure.'],
      ['Gyms & spas', 'Members keep one band for the year — access, locker and payment in one wearable.'],
      ['Cruise & resort wearables', 'Cabin key, boarding identity and onboard spending ride one branded band.'],
    ],
    extraFaqs: [
      ['Embossed or printed logos — which lasts?', 'Embossed/debossed molding is permanent; printing offers finer detail but wears over heavy use. Many brands combine both — molded logo, printed accent.'],
      ['How do we handle band hygiene between users?', 'Silicone tolerates disinfectant dips and machine washing; we provide cleaning-compatibility notes so rental/reissue workflows keep bands in service for years.'],
    ],
  },
  'disposable-paper-wristband': {
    metaDesc: 'Tyvek RFID wristbands with one-time adhesive locks — full-color printed, sequentially numbered, the lowest cost-per-guest credential for events and day passes.',
    intro: [
      'Tyvek bands are event logistics distilled: tear-resistant paper, full-color branding, an adhesive tab that locks once and shreds on removal, and an RFID chip that turns the cheapest credential in the building into a gate-speed access token. At high volumes the unit cost sits close to plain printed bands while adding electronic validation.',
      'The operational details are what we optimize: sequential numbering and UID manifests so boxes map to ticket tiers, perforated stub options for manual backup, and gate-throughput advice (NFC vs UHF chip choice changes reader layout). For one-day and weekend events this is almost always the right band; longer wear favors fabric or silicone.',
    ],
    useCases: [
      ['Concerts & day festivals', 'Gate staff validate by tap instead of eyeballing colors; counterfeit bands die instantly.'],
      ['Theme-park day passes', 'Bands carry entitlements (rides, meal deals) checked at each point without paper tickets.'],
      ['Charity runs & fairs', 'Numbered bands double as entry credential and finish-line/attendance record.'],
    ],
    extraFaqs: [
      ['How fast can you deliver for a fixed event date?', 'Standard art-to-door runs 7–12 days plus shipping; express production for deadline events is available — tell us the event date and we plan backwards from it.'],
      ['NFC or UHF chips for our gates?', 'NFC (tap) suits controlled entry lanes and payments; UHF enables walk-through and crowd-flow reads with portal antennas. Gate layout decides — send yours and we advise.'],
    ],
  },

  'rfid-blocking-card': {
    metaDesc: 'RFID blocking cards — passive shield or active E-field jamming versions that protect a whole wallet at 13.56 MHz, custom printed for bank and brand giveaways.',
    intro: [
      'A blocking card defends the cards around it. The passive version is a laminated shielding layer that absorbs and detunes the 13.56 MHz field; the active version harvests the reader’s own energy to power a jamming circuit that disrupts communication across the wallet — no battery, activated only when a reader tries to read. One card, slipped anywhere in the wallet, covers the rest.',
      'These are giveaway products with a security story, which is why banks and insurers order them printed: your branding rides in the customer’s wallet, seen at every payment, for years. We verify shielding effectiveness per batch and print full CMYK on both faces, standard CR80 so it fits every card slot.',
    ],
    useCases: [
      ['Bank & fintech onboarding gifts', 'New cardholders receive a branded protector with their card — a security message that lives in the wallet.'],
      ['Insurance & security-brand promos', 'The product literally is the value proposition: protection your logo delivers daily.'],
      ['Travel retail', 'Sold at airports alongside passports and travel wallets to skimming-conscious travelers.'],
    ],
    extraFaqs: [
      ['Does one blocking card protect my whole wallet?', 'The active version disrupts reads across a normal bifold; the passive version protects adjacent slots. For maximum coverage put one card in each fold, which is how promo pairs are often gifted.'],
      ['Does the active card need a battery?', 'No — it harvests power from the attacking reader’s own field, so it works for years with no maintenance and activates only when a read is attempted.'],
    ],
  },
  'rfid-blocking-sleeves': {
    metaDesc: 'Aluminum-laminate blocking sleeves for cards and passports — CMYK printed both sides, the lowest-cost RFID privacy giveaway for banks, travel and events.',
    intro: [
      'Sleeves are the simplest, cheapest RFID protection: an aluminum-laminate paper or Tyvek envelope that encloses the card or passport in a Faraday shield. Nothing to activate, nothing to wear out — the card inside is unreadable until it is pulled out to pay. Passport sleeves additionally cover the e-passport chip page against doorway skimming.',
      'As print products they take edge-to-edge CMYK on both faces, which is why they work as direct-mail inserts and conference handouts: flat, light, letter-mailable and used daily. Card and passport sizes run as standard; custom die-cuts (thumb notches, closure flaps) are available at modest tooling cost.',
    ],
    useCases: [
      ['Direct-mail campaigns', 'Banks mail branded sleeves with new cards — a physical security message inside the envelope.'],
      ['Travel & border-crossing retail', 'Passport sleeves sell alongside luggage tags; frequent travelers buy sets.'],
      ['Conference swag with a function', 'Sponsors hand out printed sleeves that attendees actually keep and use.'],
    ],
    extraFaqs: [
      ['How effective is a sleeve compared to a blocking card?', 'A closed sleeve is a full Faraday enclosure — the strongest protection of the product family. Blocking cards trade a little coverage for wallet convenience.'],
      ['What is the durability of a paper sleeve?', 'Aluminum-laminate paper handles months of daily wallet use; Tyvek versions extend that considerably. Both are cheap enough to reissue in campaigns.'],
    ],
  },
  'rfid-blocking-wallet': {
    metaDesc: 'RFID blocking wallets and card holders — PU, leather and aluminum builds with shielding lining, deboss or print branding for corporate gifts and retail lines.',
    intro: [
      'A blocking wallet integrates the shield where users already carry cards: a woven metallic lining laminated invisibly into the card compartments, so every slot is protected without the user thinking about it. Builds range from slim aluminum pop-up cases through PU bifolds to full-grain leather — the shielding layer is the same engineering underneath.',
      'For corporate gifting this is the premium tier of the blocking family: a daily-use object with your brand debossed into leather, delivered in gift boxes. We manage the full build — leather selection, stitching, lining verification per batch, deboss/foil branding and packaging — as one order.',
    ],
    useCases: [
      ['Executive & client gifts', 'Debossed leather wallets carry the brand into daily use for years — with a security story attached.'],
      ['Retail accessory lines', 'Brands add verified-blocking wallets to travel and accessory ranges, manufactured to their spec.'],
      ['Employee milestone gifts', 'Companies gift branded card holders at anniversaries — practical, premium, protective.'],
    ],
    extraFaqs: [
      ['Are all pockets in the wallet shielded?', 'Card compartments and the main fold are lined; we can leave a designated “fast pocket” unshielded on request, so one transit card taps without opening the wallet.'],
      ['What branding methods work on which materials?', 'Deboss and foil on leather/PU, laser engraving on aluminum, print on linings. We proof your logo on a physical sample before the run.'],
    ],
  },

  'barcode-scan-module': {
    metaDesc: '1D/2D CMOS scan engines for kiosks, gates and vending — screen-code reading, USB/TTL/RS232, auto-sense triggering and firmware customization at OEM volume.',
    intro: [
      'A scan module is the reading engine your product wraps around: a compact CMOS imager with decode board that you mount behind a window in a kiosk, turnstile or vending machine. Modern 2D engines decode paper and phone-screen codes — including cracked, dimmed screens — which is the capability that separates ticketing-grade modules from budget CCDs.',
      'Integration is where we spend the support effort: mounting depth and window glass specs to kill internal reflections, trigger modes (auto-sense presentation, hardware trigger or host command), interface choice between USB-HID keyboard emulation for fastest software integration and TTL/RS232 for embedded boards. OEM volumes unlock firmware tweaks — beeper behavior, code-type locks, prefix/suffix formats.',
    ],
    useCases: [
      ['Ticketing turnstiles', 'Gates read paper and phone QR at presentation speed with auto-sense triggering.'],
      ['Self-service kiosks', 'Payment and loyalty flows scan on-screen codes reliably across typical brightness levels.'],
      ['Vending & lockers', 'Pickup codes scanned at the machine release goods without staff.'],
    ],
    extraFaqs: [
      ['How should the module be mounted behind glass?', 'Angle the engine 10–15° off the window normal and use anti-reflective glass — we supply a mounting drawing per model that eliminates ghost reflections.'],
      ['Can firmware be customized for our product?', 'At OEM volume, yes — enabled symbologies, data prefixes/suffixes, beeper/LED behavior and trigger logic tailored and flashed before shipment.'],
    ],
  },
  'rfid-reader-writer': {
    metaDesc: 'RFID readers across LF/HF/UHF — desktop encoders, embedded modules, fixed portals and Android handhelds, with SDK, demo tools and fleet-matching advice.',
    intro: [
      'Reader selection maps to job type. Desktop USB units are issuance and enrollment stations — encoding cards at a service counter. Embedded modules drop into your own devices via TTL/USB. Fixed readers with external antennas build portals and conveyor read points for logistics. Android UHF handhelds put inventory sweeps and item hunts in a worker’s hand. We supply all four, matched to the tags you run.',
      'The SDK is the real product for integrators: ours ships with demo apps, API documentation for Windows/Android/Linux, and working sample code for common flows (inventory rounds, encode-verify, trigger-read). Before you commit, we bench-test your actual tags against the candidate reader and report ranges — no spec-sheet guessing.',
    ],
    useCases: [
      ['Card issuance desks', 'Desktop encoders personalize and verify credentials at HR, hotels and clubs.'],
      ['Warehouse portals', 'Fixed readers with tuned antennas log everything crossing a dock door.'],
      ['Handheld stocktakes', 'Android UHF terminals sweep shelves and hunt individual items with Geiger-style search.'],
    ],
    extraFaqs: [
      ['How do we pick between fixed and handheld UHF?', 'Fixed readers automate known choke points (doors, conveyors); handhelds cover wide areas and searches. Most operations start handheld and add portals where volume justifies them.'],
      ['Will your readers work with our existing tags?', 'Send a tag sample (or its chip spec); we bench-test against the recommended reader and send you measured read ranges before you order.'],
    ],
  },
  'rfid-smart-cabinet': {
    metaDesc: 'UHF smart cabinets with multi-zone antennas — automatic take/return logging, card/PIN/biometric access, API integration for tools, medical and documents.',
    intro: [
      'A smart cabinet closes the loop that manual sign-out sheets never do: the user badges in, the door opens, and multi-zone UHF antennas inside inventory every tagged item the moment the door closes — so the system knows exactly what left, with whom, at what time, without anyone scanning anything. Discrepancies alarm immediately, not at month-end audit.',
      'Deployments succeed on two details we engineer up front: antenna zoning against the cabinet’s metal interior (dense metal tools are the hard case — solved with zone design and tag choice), and integration, where our API pushes take/return events into your asset, ERP or maintenance system rather than trapping data in another silo.',
    ],
    useCases: [
      ['Tool cribs & maintenance', 'Calibrated tools auto-log per technician; missing-at-shift-end alarms name the last holder.'],
      ['Controlled medical supplies', 'Wards track high-value consumables and instruments with per-access accountability.'],
      ['Document & evidence control', 'Files and evidence bags carry chain-of-custody automatically, access by authorized badge only.'],
    ],
    extraFaqs: [
      ['Can the cabinet integrate with our asset-management system?', 'Yes — REST API and webhook events for every take/return, plus CSV export. We map events to your fields during commissioning.'],
      ['Does it read reliably with dense metal tools inside?', 'That is the engineered case: multi-zone antennas plus on-metal tags per tool type. We validate with your actual item mix during acceptance testing.'],
    ],
  },
  'industrial-iot-dtu-rtu': {
    metaDesc: 'Industrial DTU/RTU terminals — RS485/Modbus to 4G/NB-IoT with MQTT, edge alarms, offline caching and DIN-rail builds for meters, sensors and remote plant.',
    intro: [
      'A DTU is a transparent serial-to-cellular pipe: whatever your meter or PLC speaks on RS232/485 arrives at your server over 4G. An RTU adds intelligence at the edge — local I/O, Modbus polling, threshold alarms and logic that acts even when the network does not. Choosing between them is a workflow question: pure transport, or edge decisions too.',
      'Field reliability is the whole product: watchdog reconnection, store-and-forward caching that backfills data after outages, wide 9–36 V power tolerance and DIN-rail industrial housings. Units ship pre-configured to your APN and platform (MQTT topics or Modbus TCP mapping) so field electricians wire power and serial, and data appears.',
    ],
    useCases: [
      ['Utility metering', 'Water and power meters report over NB-IoT with outage-proof cached readings.'],
      ['Remote pump & tank control', 'RTUs alarm on thresholds and drive relays locally, reporting state to SCADA.'],
      ['Agricultural monitoring', 'Field sensors reach the cloud over cellular where no network infrastructure exists.'],
    ],
    extraFaqs: [
      ['How are SIMs and data plans handled?', 'Use your local operator SIMs — we pre-configure APN per your details, or supply units SIM-ready for your team to insert. Data usage guidance per polling rate is in the manual.'],
      ['What happens to data during network outages?', 'Store-and-forward caching holds readings in local memory and backfills the server on reconnect, timestamped — no gaps in the historical record.'],
    ],
  },
};

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

const FOOTER = `<footer class="footer"><div class="container footer__grid"><div class="footer__brand"><a href="index.html" class="brand brand--light"><span class="brand__mark">R</span><span class="brand__text">RFID<span class="brand__sub">&nbsp;MFG</span></span></a><p>RFID MFG Co., Ltd. — RFID &amp; smart-card manufacturing, direct from our Shenzhen plant.</p></div><div class="footer__col"><h4>Company</h4><a href="about.html">About</a><a href="industries.html">Industries</a><a href="cases.html">Cases</a><a href="sustainability.html">Sustainability</a><a href="news.html">Blog</a></div><div class="footer__col"><h4>Products</h4><a href="products.html#cards">Cards</a><a href="products.html#labels">Labels &amp; Stickers</a><a href="products.html#tags">RFID Tags</a><a href="products.html#blocking">RFID Blocking</a><a href="products.html#hardware">Hardware</a><a href="datasheets.html">Datasheets</a></div><div class="footer__col"><h4>Contact</h4><a href="mailto:peter@rfidmfg.com">peter@rfidmfg.com</a><a href="tel:+8615815501857">+86 158 1550 1857</a><span>Shenzhen, China</span></div></div><div class="footer__bar"><div class="container footer__bar-inner"><span>© <span id="year"></span> RFID MFG Co., Ltd. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;

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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZFYMHHLN3Q"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZFYMHHLN3Q');</script>
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

// ── sticky 左侧产品导航(汇总页与产品单页共用)──
function sideNav(currentSlug, currentCat, forHub) {
  const groups = CAT_ORDER.map((c) => {
    const items = PRODUCTS.filter((x) => x.cat === c);
    const expanded = forHub || c === currentCat;
    const list = expanded ? `<ul>${items.map((x) => `<li${x.slug === currentSlug ? ' class="on"' : ''}><a href="/products/${c}/${x.slug}/">${esc(x.name)}</a></li>`).join('')}</ul>` : '';
    return `<div class="snav__group"><a class="snav__cat" href="${forHub ? '#' + c : '/products/' + c + '/'}">${esc(CATS[c].name)}<span class="snav__count">${items.length}</span></a>${list}</div>`;
  }).join('');
  return `<aside class="snav" aria-label="Product navigation"><div class="snav__inner"><div class="snav__title">All products</div>${groups}<a class="snav__all" href="/products/">Product overview →</a><a class="snav__all" href="/contact/">Get a quote →</a></div></aside>`;
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
  prodLd.offers = { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: w.low, highPrice: w.high, offerCount: tierPrices(w).prices.length, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.' } };
  const ld = `<script type="application/ld+json">
${JSON.stringify(prodLd)}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Products","item":"${SITE}/products.html"},{"@type":"ListItem","position":3,"name":${JSON.stringify(p.name)},"item":"${SITE}/${p.slug}.html"}]}
</script>`;
  const specs = p.specs.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
  const apps = p.apps.map((a) => `<li>${esc(a)}</li>`).join('');
  const d = DETAILS[p.slug] || {};
  const wholesaleFaq = WHOLESALE_FAQ_VARIANTS[variantIndex(p.slug, WHOLESALE_FAQ_VARIANTS.length)](p, w, wUnit, wUnitPl);
  // 凡涉及编码的产品自动附密钥/数据处理 FAQ(已手写过的页面跳过)
  const _pageText = JSON.stringify(p) + JSON.stringify(d);
  const keysFaq = (/encod/i.test(_pageText) && !/keys and encoding data/i.test(_pageText))
    ? [['How do you handle our encoding data and keys?', 'Under NDA. Keys, card numbers and encoding files are used only to produce your order, stored no longer than production requires, and deleted on request after delivery.']]
    : [];
  const faqPairs = p.faqs.concat(d.extraFaqs || [], keysFaq, wholesaleFaq);
  const faqs = faqPairs.map((f) => `<details class="faq-item"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
  const faqLd = `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqPairs.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) })}
</script>`;
  const rel = related.map((r) => `<a href="${r.slug}.html">${esc(r.name)}</a>`).join('');
  const featureList = (FEATURES[p.cat] || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const customList = (CUSTOMIZATION_BY_CAT[p.cat] || []).map((c) => `<li>${esc(c)}</li>`).join('');
  // 技术徽章与频段检测(仅由该产品真实规格派生)
  const specText = JSON.stringify(p.specs) + ' ' + p.overview + ' ' + p.tagline;
  const freqChips = [];
  if (/\bLF\b|125\s?kHz|134\.2|T5577|EM4[23]00|EM4305|Hitag/i.test(specText)) freqChips.push('LF 125 kHz');
  if (/\bHF\b|13\.56|NFC|NTAG|MIFARE|ICODE|ISO ?1444|ISO ?15693/i.test(specText)) freqChips.push('HF / NFC 13.56 MHz');
  if (/\bUHF\b|860|915|UCODE|Impinj|Monza|EPC/i.test(specText)) freqChips.push('UHF 860–960 MHz');
  const chipBrands = [];
  if (/MIFARE/i.test(specText)) chipBrands.push('NXP MIFARE®');
  if (/NTAG/i.test(specText)) chipBrands.push('NXP NTAG®');
  if (/ICODE/i.test(specText)) chipBrands.push('NXP ICODE®');
  if (/UCODE/i.test(specText)) chipBrands.push('NXP UCODE®');
  if (/Impinj|Monza|M7[0-9]0|M830|M750/i.test(specText)) chipBrands.push('Impinj');
  if (/EM4[0-9]{3}|EM Micro/i.test(specText)) chipBrands.push('EM Microelectronic');
  if (/T5577|Hitag/i.test(specText)) chipBrands.push('T5577 / Hitag');
  // 多频段页面必须限定"手机可读"只适用于 NFC(HF)版本 — LF/UHF 卡手机读不了
  const hasNfcChip = /NTAG|NFC/i.test(specText);
  const multiBand = /UHF|125\s?kHz/i.test(specText);
  const phoneTap = hasNfcChip ? [multiBand ? 'NFC versions (13.56 MHz): iPhone &amp; Android tap' : 'Works with iPhone &amp; Android tap'] : [];
  const heroChips = freqChips.concat(chipBrands.slice(0, 3), phoneTap).map((c) => `<li>${c}</li>`).join('');
  const showFreqSvg = freqChips.length >= 2;
  const tiers = tierPrices(w);
  const introSection = d.intro && d.intro.length ? `<section class="section">
  <div class="container">
    <div class="about intro2" style="align-items:center">
      <div>
        <span class="eyebrow">In depth</span>
        <h2 class="section__title" style="margin-bottom:14px">About ${esc(p.name)}</h2>
        ${d.intro.map((t) => `<p style="margin-bottom:14px">${esc(t)}</p>`).join('')}
      </div>
      <figure class="figure">${CAT_SVG[p.cat] || ''}<figcaption>${esc(SVG_CAPTION[p.cat] || '')}</figcaption></figure>
    </div>
  </div>
</section>` : '';
  const useCaseSection = d.useCases && d.useCases.length ? `<section class="section section--alt">
  <div class="container">
    <div class="section__head" style="margin-bottom:24px"><span class="eyebrow">In practice</span><h2 class="section__title">How buyers use ${esc(p.name)}</h2><p class="section__sub" style="font-size:14px">Composite scenarios drawn from typical order patterns — client names withheld.</p></div>
    <div class="feature-grid">${d.useCases.map((u) => `<div class="feature"><h3>${esc(u[0])}</h3><p>${esc(u[1])}</p></div>`).join('')}</div>
  </div>
</section>` : '';
  const factoryTable = FACTORY_ROWS.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
  const timeline = timelineSteps(w).map((s) => `<div><b>${esc(s[0])}</b><p>${esc(s[1])}</p></div>`).join('');
  const mfgNote = `<section class="section">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">From our factory</span>
        <h2 class="section__title" style="margin-bottom:14px">Our factory, in numbers</h2>
        <table class="spec-table">${factoryTable}</table>
        <p style="margin-top:12px;color:var(--muted);font-size:14px">${esc(MFG_NOTE[p.cat] || MFG_NOTE.cards)}</p>
      </div>
      <div>
        <span class="eyebrow">How ordering works</span>
        <h2 class="section__title" style="margin-bottom:14px">From inquiry to delivery</h2>
        <div class="otimeline">${timeline}</div>
      </div>
    </div>
  </div>
</section>`;
  const badges = [`MOQ from ${moqFmt(w.moq)} ${wUnitPl}`, 'Custom OEM / ODM', 'Free samples', '24-hour quote', '2-year warranty'].map((b) => `<li>${esc(b)}</li>`).join('');
  const wholesaleBadges = [`MOQ ${moqFmt(w.moq)} ${wUnitPl}`, `From ${money(w.low)}/${wUnit}`, 'Free samples', 'OEM / ODM'].map((b) => `<li>${esc(b)}</li>`).join('');
  const wholesaleSection = `<section class="section" id="wholesale">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">Wholesale &amp; bulk orders</span>
        <h2 class="section__title" style="margin-bottom:14px">${esc(({ cards: `Buy ${p.name} wholesale — straight from the card line`, labels: `Order ${p.name} by the roll — factory direct`, tags: `Source ${p.name} in volume — factory direct`, blocking: `Stock ${p.name} — factory-direct pricing`, hardware: `Buy ${p.name} on OEM terms` })[p.cat] || `Buy ${p.name} wholesale — direct from the factory`)}</h2>
        <p>${(WHOLESALE_COPY[p.cat] || WHOLESALE_COPY.cards)({ name: esc(p.name) }, w, wUnit, wUnitPl)}</p>
        <ul class="prod-badges">${wholesaleBadges}</ul>
        <div class="prod__cta" style="margin-top:16px">
          <a href="${quoteHref}" class="btn btn--primary btn--lg">Request Wholesale Quote</a>
          <a href="${quoteHref}" class="btn btn--lg" style="border-color:var(--brand-deep);color:var(--brand-deep)">Get Free Sample</a>
        </div>
      </div>
      <div>
        <div class="est" id="est">
          <div class="est__head">Volume price guide <span>Indicative · FOB Shenzhen</span></div>
          <div class="est__tiers">${tiers.qtys.map((q, i) => {
            const tp = tiers.prices[i];
            const sv = i === 0 ? 'MOQ' : 'Save ' + Math.round((1 - tp / tiers.prices[0]) * 100) + '%';
            return `<button type="button" class="est__tier${i === 0 ? ' on' : ''}" data-q="${q}" data-p="${tp}"><b>${q.toLocaleString('en-US')} ${wUnitPl}</b><small>&asymp; ${fmtP(tp)} / ${wUnit}</small><span class="sv">${sv}</span></button>`;
          }).join('')}<button type="button" class="est__tier" data-quote="1" data-q="${tiers.quoteAt}"><b>${tiers.quoteAt} ${wUnitPl}</b><small>volume pricing</small><span class="sv">Best rate</span></button></div>
          <div class="est__sum">
            <div><span>Per ${wUnit}</span><b id="estUnit">&asymp; ${fmtP(tiers.prices[0])} / ${wUnit}</b></div>
            <div><span>Order total</span><b id="estTotal">&asymp; $${Math.round(tiers.qtys[0] * tiers.prices[0]).toLocaleString('en-US')}</b></div>
          </div>
          <p class="est__note">Guide pricing from our published range — the exact quote depends on chip, size and artwork, and lands in your inbox within 24 hours. T/T · worldwide shipping. Full range: <a href="rfid-pricing-guide.html">RFID price guide</a>.</p>
          <a class="btn btn--primary btn--lg" id="estCta" href="/contact/?product=${encodeURIComponent(p.name)}&amp;cat=${encodeURIComponent(SELECT_LABEL[p.cat] || '')}&amp;qty=${tiers.qtys[0]}#quoteForm">Get Exact Quote for ${tiers.qtys[0].toLocaleString('en-US')} ${wUnitPl} &rarr;</a>
        </div>
        <script>(function(){
var est=document.getElementById('est');if(!est)return;
var base='/contact/?product='+encodeURIComponent(${JSON.stringify(p.name)})+'&cat='+encodeURIComponent(${JSON.stringify(SELECT_LABEL[p.cat] || '')});
var unitEl=document.getElementById('estUnit'),totEl=document.getElementById('estTotal'),cta=document.getElementById('estCta');
var UNIT=${JSON.stringify(wUnit)},UNITS=${JSON.stringify(wUnitPl)};
function fp(n){return n<0.1?'$'+n.toFixed(3):n<1?'$'+n.toFixed(2):'$'+(n%1?n.toFixed(2):n)}
function sel(b){var all=est.querySelectorAll('.est__tier'),i;for(i=0;i<all.length;i++)all[i].className=all[i].className.replace(' on','');b.className+=' on';
if(b.getAttribute('data-quote')){unitEl.textContent='volume rate';totEl.textContent='custom quote';cta.textContent='Get Volume Quote ('+b.getAttribute('data-q')+' '+UNITS+') →';cta.href=base+'&qty='+encodeURIComponent(b.getAttribute('data-q'))+'#quoteForm';}
else{var q=parseInt(b.getAttribute('data-q'),10),pv=parseFloat(b.getAttribute('data-p'));unitEl.textContent='≈ '+fp(pv)+' / '+UNIT;totEl.textContent='≈ $'+Math.round(q*pv).toLocaleString('en-US');cta.textContent='Get Exact Quote for '+q.toLocaleString('en-US')+' '+UNITS+' →';cta.href=base+'&qty='+q+'#quoteForm';}
try{if(typeof gtag==='function')gtag('event','estimator_select',{product:${JSON.stringify(p.name)},qty:b.getAttribute('data-q')});}catch(e){}}
var all=est.querySelectorAll('.est__tier'),i;for(i=0;i<all.length;i++)(function(b){b.addEventListener('click',function(){sel(b)})})(all[i]);
})();</script>
      </div>
    </div>
  </div>
</section>`;
  const inner = `<section class="section">
  <div class="container">
    <nav class="breadcrumb" style="justify-content:flex-start;color:var(--muted)"><a href="index.html">Home</a><span>/</span><a href="products.html">Products</a><span>/</span>${esc(p.name)}</nav>
    <div class="prod" style="margin-top:18px">
      <div class="prod__media">${img ? `<img src="${img}" alt="${esc(p.name)}" loading="lazy" width="300" height="300" />` : `${esc(p.tag)}<small>Product image — add your photo</small>`}</div>
      <div class="prod__text">
        <span class="eyebrow">${esc(cat.name)}</span>
        <h1 class="section__title">${esc(p.name)}</h1>
        <p class="lead-line">${esc(p.tagline)}</p>
        ${heroChips ? `<ul class="trust__list chips-hero">${heroChips}</ul>` : ''}
        <p>${esc(p.overview)}</p>
        <p style="margin-top:-4px;font-size:14px"><a class="link-arrow" href="${CAT_GUIDE[p.cat][0]}">New to this? Read ${esc(CAT_GUIDE[p.cat][1])} <span>→</span></a></p>
        <ul class="prod-badges">${badges}</ul>
        <p class="fastfacts">Samples in ${w.sample} days · Bulk production ${w.bulkLow}–${w.bulkHigh} days · Door-to-door express worldwide</p>
        <div class="prod__cta">
          <a href="${quoteHref}" class="btn btn--primary btn--lg">Get Exact Quote — 24h Reply</a>
          <a href="${quoteHref.replace('#quoteForm', '&sample=1#quoteForm')}" class="btn btn--lg" style="border-color:var(--brand-deep);color:var(--brand-deep)">Request Free Sample</a>
          <a href="https://api.whatsapp.com/send?phone=8615815501857" target="_blank" rel="noopener" class="btn btn--lg" style="border-color:var(--line)">WhatsApp</a>
          <a href="datasheet-${p.slug}.html" class="btn btn--lg" style="border-color:var(--line)">View Datasheet</a>
        </div>
        <p class="cta-micro">✓ We reply within 24 hours &nbsp;·&nbsp; ✓ Free proof &amp; samples before production &nbsp;·&nbsp; ✓ 2-year warranty</p>
      </div>
    </div>
  </div>
</section>
${introSection}
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
        <p style="margin-top:12px;color:var(--muted);font-size:14px">All specifications are customizable — tell us your requirements. Full datasheet: <a href="datasheet-${p.slug}.html">HTML</a> · <a href="/datasheets/${p.slug}.pdf" download>PDF</a>.</p>
        <p class="cta-micro">Third-party product and brand names are trademarks of their respective owners, shown for compatibility identification only; no affiliation or endorsement is implied.</p>
        ${showFreqSvg ? `<div style="margin-top:18px">${FREQ_SVG}</div>` : ''}
      </div>
      <div>
        <span class="eyebrow">Applications</span>
        <h2 class="section__title" style="margin-bottom:14px">Where it's used</h2>
        <ul class="app-chips">${apps}</ul>
      </div>
    </div>
  </div>
</section>
${useCaseSection}
${mfgNote}
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
  const body = `<div class="side-layout"><div class="side-layout__grid">${sideNav(p.slug, p.cat, false)}<div class="side-main">${inner}</div></div></div>`;
  const title = `${p.name} Manufacturer & Wholesale Supplier | RFID MFG`;
  const metaDesc = d.metaDesc || `${p.name} — custom OEM/ODM manufacturer & wholesale supplier. MOQ from ${moqFmt(w.moq)} ${wUnitPl}, free samples, 24-hour quote. Worldwide shipping.`;
  return page(title, metaDesc, `${p.slug}.html`, ld + '\n' + faqLd, body);
}

function catalogPage() {
  const catLd = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Products","item":"${SITE}/products.html"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ItemList","name":"RFID MFG Product Categories","itemListElement":[${CAT_ORDER.map((c, i) => `{"@type":"ListItem","position":${i + 1},"name":${JSON.stringify(CATS[c].name)},"url":"${SITE}/products.html#${c}"}`).join(',')}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"How do I buy RFID tags or cards in bulk?","acceptedAnswer":{"@type":"Answer","text":"Pick a product (or describe your application), send your chip or reader model, quantity and artwork, and you get a written factory quote within 24 hours. Free samples ship in 3–7 days; bulk production runs 7–30 days after you approve sample and proof."}},{"@type":"Question","name":"Do you sell wholesale to resellers and integrators?","acceptedAnswer":{"@type":"Answer","text":"Yes — we manufacture for resellers, system integrators and brands worldwide on FOB Shenzhen terms, with OEM/ODM branding, volume price tiers and blanket orders with scheduled releases for recurring demand."}},{"@type":"Question","name":"Can cards and labels be custom printed?","acceptedAnswer":{"@type":"Answer","text":"Yes. Cards print offset CMYK with foil, emboss or laser options; labels print full colour on the face material. Blank printable RFID cards and white labels are also available for standard card and label printers."}},{"@type":"Question","name":"What do RFID tags and cards cost?","acceptedAnswer":{"@type":"Answer","text":"Indicative wholesale ranges for every product are published in the RFID price guide — the exact price depends on chip, size, material, printing and volume, and is fixed in a written 24-hour quotation."}}]}
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
    <p>Five core categories, hundreds of configurations — every item customizable to your chip, frequency, size, encoding and artwork. All 39 products ship factory-direct from our Shenzhen plant: cards, tags and wristbands from 500 pcs, labels from 1,000 pcs, hardware from 10 units, with free pre-production samples and a written quote in 24 hours.</p>
  </div>
</section>
<div class="side-layout"><div class="side-layout__grid">${sideNav('', '', true)}<div class="side-main"><section class="section">
  <div class="container">
    <nav class="cat-nav">${catNav}</nav>
    ${sections}
    <div class="catalog-cat" id="ordering">
      <h2>Buying wholesale &amp; bulk, direct from the factory</h2>
      <p>Every product above is manufactured and sold factory-direct — no trading-company margin. Bulk and wholesale orders run on published volume tiers (see the <a href="rfid-pricing-guide.html">price guide</a> and <a href="rfid-moq-sample-policy.html">MOQ &amp; sample policy</a>): cards, tags and wristbands from 500 pieces, labels and inlays from 1,000–2,000 pieces, readers and other hardware from 10 units. Custom printing (offset CMYK, silkscreen, variable data) and chip encoding are done in house, and every order starts with free pre-production samples in 3–7 days.</p>
      <div class="faq" style="margin-top:14px">
        <details class="faq-item"><summary>How do I buy RFID tags or cards in bulk?</summary><p>Pick a product above (or just describe your application), send your chip or reader model, quantity and artwork, and you get a written factory quote within 24 hours. Free samples ship in 3–7 days; bulk production runs 7–30 days after you approve sample and proof.</p></details>
        <details class="faq-item"><summary>Do you sell wholesale to resellers and integrators?</summary><p>Yes — we manufacture for resellers, system integrators and brands worldwide on FOB Shenzhen terms, with OEM/ODM branding, volume price tiers and blanket orders with scheduled releases for recurring demand.</p></details>
        <details class="faq-item"><summary>Can cards and labels be custom printed?</summary><p>Yes. Cards print offset CMYK with foil, emboss or laser options; labels print full colour on the face material. If you prefer to print in house, blank printable RFID cards and white labels are available for standard card and label printers — see the <a href="rfid-card-printing-guide.html">card printing guide</a>.</p></details>
        <details class="faq-item"><summary>What do RFID tags and cards cost?</summary><p>Indicative wholesale ranges for every product are published in the <a href="rfid-pricing-guide.html">RFID price guide</a> — the exact price depends on chip, size, material, printing and volume, and is fixed in a written 24-hour quotation.</p></details>
      </div>
    </div>
  </div>
</section></div></div></div>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Can't find the exact spec you need?</h2><p>Send us your chip, frequency, size and artwork — we'll quote within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Start a Custom Project</a>
  </div>
</section>`;
  return page('RFID Products Wholesale — Cards, Key Fobs, Wristbands, Labels & Tags | RFID MFG', "RFID MFG's full catalog: RFID cards, key fobs, wristbands, labels, tags, blocking products & readers. Custom OEM/ODM & wholesale — low MOQ, free samples, 24h quote.", 'products.html', catLd, body);
}


// ── HTML datasheets(datasheet-<slug>.html → /datasheets/<slug>/)+ 索引页 ──
function dsFreq(p) {
  const t = JSON.stringify(p.specs) + ' ' + p.overview + ' ' + p.tagline;
  const f = [];
  if (/\bLF\b|125\s?kHz|134\.2|T5577|EM4[23]00|EM4305|Hitag/i.test(t)) f.push('LF 125 kHz');
  if (/\bHF\b|13\.56|NFC|NTAG|MIFARE|ICODE|ISO ?1444|ISO ?15693/i.test(t)) f.push('HF / NFC 13.56 MHz');
  if (/\bUHF\b|860|915|UCODE|Impinj|Monza|EPC/i.test(t)) f.push('UHF 860–960 MHz');
  return f;
}
function datasheetPage(p) {
  const cat = CATS[p.cat];
  const img = IMG[p.slug] || '';
  const w = wholesale(p);
  const wUnit = w.unit || 'pc';
  const wUnitPl = wUnit === 'unit' ? 'units' : 'pcs';
  const dates = DATES.track('datasheet-' + p.slug + '.html', JSON.stringify([p.name, p.tagline, p.overview, p.specs, p.apps]), DATES.TODAY);
  const quoteHref = `contact.html?product=${encodeURIComponent(p.name)}&cat=${encodeURIComponent(SELECT_LABEL[p.cat] || '')}#quoteForm`;
  const prodLd = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.slug, category: cat.name, brand: { '@type': 'Brand', name: 'RFID MFG' }, manufacturer: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.' }, description: p.overview, url: `${SITE}/${p.slug}.html`, additionalProperty: p.specs.map((r) => ({ '@type': 'PropertyValue', name: r[0], value: r[1] })), offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: w.low, highPrice: w.high, offerCount: tierPrices(w).prices.length, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'RFID MFG Co., Ltd.' } } };
  if (img) prodLd.image = SITE + '/' + img;
  const ld = `<script type="application/ld+json">
${JSON.stringify(prodLd)}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebPage","name":${JSON.stringify(p.name + ' — Datasheet')},"identifier":"RFMFG-DS-${p.slug.toUpperCase()}","url":"${SITE}/datasheet-${p.slug}.html","datePublished":"${dates.published}","dateModified":"${dates.modified}","isPartOf":{"@type":"WebSite","name":"RFID MFG","url":"${SITE}/"}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Datasheets","item":"${SITE}/datasheets.html"},{"@type":"ListItem","position":3,"name":${JSON.stringify(p.name)},"item":"${SITE}/datasheet-${p.slug}.html"}]}
</script>`;
  const specRows = p.specs.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
  const freq = dsFreq(p);
  const ordRows = [
    ['MOQ', `${moqFmt(w.moq)} ${wUnitPl}`],
    ['Samples', `Free pre-production samples, ${w.sample} days`],
    ['Bulk lead time', `${w.bulkLow}–${w.bulkHigh} days after artwork/encoding approval`],
    ['Indicative price', `${money(w.low)}–${money(w.high)} per ${wUnit} (FOB Shenzhen; confirmed on written quotation)`],
    ['Quality system', 'ISO 9001 · ISO 14001 · ISO 45001 (Shenzhen site; certificate details on request)'],
    ['Product compliance', 'CE / FCC declarations issued per product model and target market'],
    ['Material compliance', 'RoHS / REACH statements issued per material and batch'],
    ['Warranty', '2 years'],
  ].map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('');
  const body = `<section class="section">
  <div class="container">
    <nav class="breadcrumb" style="justify-content:flex-start;color:var(--muted)"><a href="index.html">Home</a><span>/</span><a href="datasheets.html">Datasheets</a><span>/</span>${esc(p.name)}</nav>
    <div class="prod" style="margin-top:18px">
      <div class="prod__media">${img ? `<img src="${img}" alt="${esc(p.name)}" loading="lazy" width="300" height="300" />` : `${esc(p.tag)}`}</div>
      <div class="prod__text">
        <span class="eyebrow">${esc(cat.name)} · Datasheet</span>
        <h1 class="section__title">${esc(p.name)} — Datasheet</h1>
        <p class="lead-line">${esc(p.tagline)}</p>
        <p>${esc(p.overview)}</p>
        <p class="fastfacts">Document RFMFG-DS-${p.slug.toUpperCase()} · Rev. ${dates.modified} · Published ${esc(dates.publishedHuman)} · Specifications last updated ${esc(dates.modifiedHuman)}</p>
        <div class="prod__cta">
          <a href="/datasheets/${p.slug}.pdf" download class="btn btn--primary btn--lg">↓ Download PDF</a>
          <a href="${p.slug}.html" class="btn btn--lg" style="border-color:var(--brand-deep);color:var(--brand-deep)">Product page &amp; pricing</a>
          <a href="${quoteHref}" class="btn btn--lg" style="border-color:var(--line)">Get a Quote</a>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="section section--alt">
  <div class="container">
    <div class="section__head" style="margin-bottom:18px"><span class="eyebrow">Specifications</span><h2 class="section__title">Technical details</h2></div>
    <table class="spec-table">${specRows}</table>
    ${freq.length ? `<p style="margin-top:14px;color:var(--muted);font-size:14px">Operating frequency for this product family: ${freq.join(' · ')}.</p>` : ''}
    <p style="margin-top:10px;color:var(--muted);font-size:14px">All specifications are customizable. RF read performance depends on reader, antenna, tag size and mounting environment — values above are typical for standard builds; confirmed specifications are stated on the written quotation and approved sample.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="about" style="align-items:start">
      <div>
        <span class="eyebrow">Applications</span>
        <h2 class="section__title" style="margin-bottom:14px">Where it's used</h2>
        <ul class="prod-badges">${p.apps.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        <p style="margin-top:14px;font-size:14px"><a class="link-arrow" href="${CAT_GUIDE[p.cat][0]}">Background reading: ${esc(CAT_GUIDE[p.cat][1])} <span>→</span></a></p>
      </div>
      <div>
        <span class="eyebrow">Ordering &amp; compliance</span>
        <h2 class="section__title" style="margin-bottom:14px">Commercial summary</h2>
        <table class="spec-table">${ordRows}</table>
      </div>
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Need the exact spec confirmed?</h2><p>Send chip, size, artwork and quantity — engineering review and a firm quote within 24 hours.</p></div>
    <a href="${quoteHref}" class="btn btn--ghost btn--lg">Request a Quote</a>
  </div>
</section>`;
  const title = `${p.name} Datasheet — Full Specifications | RFID MFG`;
  const desc = `${p.name} datasheet: ${p.specs.slice(0, 3).map((r) => r[1]).join('; ').slice(0, 110)} — full specifications, applications and ordering details. PDF available.`;
  return page(title, desc, `datasheet-${p.slug}.html`, ld, body);
}
function datasheetsIndexPage() {
  const ld = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Datasheets","item":"${SITE}/datasheets.html"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"RFID MFG Product Datasheets","url":"${SITE}/datasheets.html","description":"Full technical specifications for every RFID MFG product — HTML datasheets with PDF downloads."}
</script>`;
  const sections = CAT_ORDER.map((c) => {
    const rows = PRODUCTS.filter((p) => p.cat === c).map((p) => `<tr><th><a href="datasheet-${p.slug}.html">${esc(p.name)}</a></th><td>${esc(p.tagline)}</td><td style="white-space:nowrap"><a href="/datasheets/${p.slug}.pdf" download>PDF</a></td></tr>`).join('');
    return `<div class="catalog-cat" id="${c}">
      <div class="catalog-cat__head"><div class="product-card__icon">${CATS[c].icon}</div><div><h2>${esc(CATS[c].name)}</h2><span>${esc(CATS[c].sub)}</span></div></div>
      <table class="spec-table">${rows}</table>
    </div>`;
  }).join('\n');
  const body = `<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <nav class="breadcrumb"><a href="index.html">Home</a><span>/</span>Datasheets</nav>
    <h1>Product datasheets</h1>
    <p>Full technical specifications for every product — readable HTML datasheets, each with a downloadable PDF. Specifications are customizable; confirmed values are stated on the written quotation.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    ${sections}
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Can't find the spec you need?</h2><p>Send us your chip, frequency, size and artwork — we'll quote within 24 hours.</p></div>
    <a href="contact.html" class="btn btn--ghost btn--lg">Get a Quote</a>
  </div>
</section>`;
  return page('RFID Product Datasheets — Specifications Library | RFID MFG', 'Datasheets for all RFID MFG products: cards, labels & inlays, tags, blocking products and hardware — full specifications in HTML with PDF downloads.', 'datasheets.html', ld, body);
}

// ---- generate ----
let n = 0;
for (const p of PRODUCTS) { fs.writeFileSync(path.join(OUT, `${p.slug}.html`), productPage(p)); n++; }
fs.writeFileSync(path.join(OUT, 'products.html'), catalogPage());
let nds = 0;
for (const p of PRODUCTS) { fs.writeFileSync(path.join(OUT, `datasheet-${p.slug}.html`), datasheetPage(p)); nds++; }
fs.writeFileSync(path.join(OUT, 'datasheets.html'), datasheetsIndexPage());
DATES.save('datasheets');
fs.writeFileSync(path.join(OUT, 'wholesale-data.json'), JSON.stringify(PRODUCTS.map((p) => { const w = wholesale(p); return { slug: p.slug, name: p.name, cat: p.cat, moq: w.moq, low: w.low, high: w.high, unit: w.unit || 'pc', sample: w.sample, bulkLow: w.bulkLow, bulkHigh: w.bulkHigh }; })));
console.log(`Generated ${n} product pages + products.html + ${nds} HTML datasheets + datasheets.html`);
