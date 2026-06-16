/*
 * build-foldered.js — 把扁平的 .html 站点转换成"目录式干净 URL"的部署版,输出到 dist/。
 * 结构: /about/  /products/  /products/<分类>/  /products/<分类>/<产品>/  /guides/<slug>/
 *       /cases/<slug>/  /news/<slug>/  并生成 5 个产品分类落地页 + 干净 sitemap。
 * 资源(css/js/images/fonts/icons)统一用根绝对路径 /xxx,确保任意目录深度都能加载。
 * 运行: 先 node build-products.js && node build-articles.js && node build-content.js,再 node build-foldered.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://www.rfidmfg.com';

// 产品 slug -> 分类
const CAT = {
  'contact-ic-chip-card': 'cards', 'hotel-key-card': 'cards', 'pvc-cards': 'cards', 'rfid-nfc-card': 'cards',
  'rfid-epoxy-card': 'cards', 'project-based-card': 'cards', 'wooden-rfid-card': 'cards', 'metal-card': 'cards', 'eco-friendly-card': 'cards',
  'nfc-printed-label': 'labels', 'rfid-dry-inlay': 'labels', 'rfid-wet-inlay': 'labels', 'rfid-white-label': 'labels',
  'rfid-animal-tag': 'tags', 'rfid-anti-metal-tag': 'tags', 'rfid-keyfob': 'tags', 'rfid-wristband': 'tags', 'special-rfid-tags': 'tags',
  'rfid-blocking-card': 'blocking', 'rfid-blocking-sleeves': 'blocking', 'rfid-blocking-wallet': 'blocking',
  'barcode-scan-module': 'hardware', 'industrial-iot-dtu-rtu': 'hardware', 'rfid-reader-writer': 'hardware', 'rfid-smart-cabinet': 'hardware',
};
const CAT_ORDER = ['cards', 'labels', 'tags', 'blocking', 'hardware'];
const CAT_NAME = { cards: 'Cards', labels: 'Labels & Stickers', tags: 'RFID Tags', blocking: 'RFID Blocking', hardware: 'Hardware' };
const CAT_FULL = { cards: 'RFID & Smart Cards', labels: 'RFID Labels & Inlays', tags: 'RFID Tags', blocking: 'RFID Blocking', hardware: 'RFID Readers & Hardware' };
const CAT_SUB = {
  cards: 'Contact, contactless and specialty card constructions — PVC, eco, metal, wood and more.',
  labels: 'Inlays and printable smart labels for tagging at scale, in HF and UHF.',
  tags: 'Rugged RFID tags built for animals, metal assets, events and specialty uses.',
  blocking: 'RFID-blocking cards, sleeves and wallets that protect contactless cards from skimming.',
  hardware: 'RFID readers/writers, scan modules, IoT terminals and smart cabinets.',
};
const GUIDES = ['rfid-cards-guide', 'nfc-guide', 'rfid-labels-inlays-guide', 'rfid-blocking-guide', 'rfid-readers-hardware-guide',
  'rfid-frequencies-lf-hf-uhf', 'rfid-vs-nfc', 'rfid-vs-barcode', 'rfid-chips-mifare-ntag-desfire', 'rfid-dry-vs-wet-inlay', 'rfid-card-materials', 'rfid-glossary'];
const STATIC = ['about', 'products', 'guides', 'cases', 'news', 'sustainability', 'contact', 'privacy', 'terms'];
const TOOLS = ['rfid-selector'];

// old file (no .html) -> clean path (no leading/trailing slash; '' = home)
function cleanPath(base) {
  if (base === 'index') return '';
  if (base === '404') return '404'; // special, stays as 404.html at root
  if (STATIC.includes(base)) return base;
  if (base in CAT) return `products/${CAT[base]}/${base}`;
  if (GUIDES.includes(base)) return `guides/${base}`;
  if (TOOLS.includes(base)) return `tools/${base}`;
  if (base.startsWith('case-')) return `cases/${base.slice(5)}`;
  if (base.startsWith('news-')) return `news/${base.slice(5)}`;
  return base;
}
function urlFor(base) { const p = cleanPath(base); return p === '' ? '/' : '/' + p + '/'; }

const ASSET_RE = /^(styles\.css|script\.js|favicon\.svg|favicon\.ico|favicon-32\.png|apple-touch-icon\.png|icon-192\.png|icon-512\.png|site\.webmanifest|og-image\.jpg)$/;

function rewrite(html, base) {
  // 1) absolute canonical/og/json-ld URLs:  https://www.rfidmfg.com/X.html(#cat)? -> clean
  html = html.replace(/https:\/\/www\.rfidmfg\.com\/([A-Za-z0-9_-]+)\.html(#[a-z]+)?/g, (m, f, frag) => {
    if (f === 'products' && frag) { const c = frag.slice(1); if (CAT_ORDER.includes(c)) return SITE + '/products/' + c + '/'; }
    return SITE + (urlFor(f) === '/' ? '/' : urlFor(f));
  });
  // 2) relative href/src
  html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
    if (/^(https?:|mailto:|tel:|#|\/)/.test(val)) return m;        // external / in-page / already-absolute
    if (ASSET_RE.test(val) || /^images\//.test(val) || /^fonts\//.test(val)) return `${attr}="/${val}"`;
    const mm = val.match(/^([A-Za-z0-9_-]+)\.html(#([a-z]+))?$/);
    if (mm) {
      if (mm[1] === 'products' && mm[3] && CAT_ORDER.includes(mm[3])) return `${attr}="/products/${mm[3]}/"`;
      if (mm[1] === '404') return `${attr}="/404.html"`;
      return `${attr}="${urlFor(mm[1])}"`;
    }
    return m;
  });
  // 3) product pages: insert category crumb into the visible breadcrumb
  if (base in CAT) {
    const c = CAT[base];
    html = html.replace('<a href="/products/">Products</a><span>/</span>',
      `<a href="/products/">Products</a><span>/</span><a href="/products/${c}/">${CAT_NAME[c]}</a><span>/</span>`);
  }
  return html;
}

function writeOut(relPath, html) {
  const full = relPath === '404.html' ? path.join(OUT, '404.html')
    : path.join(OUT, relPath, 'index.html');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
}

// ---- product meta (name/tagline/image) parsed from each flat product page ----
function productMeta(slug) {
  const h = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  const name = (h.match(/<title>(.*?) — RFID MFG<\/title>/) || [])[1] || slug;
  const tag = (h.match(/<p class="lead-line">(.*?)<\/p>/) || [])[1] || '';
  const img = (h.match(/class="prod__media">.*?<img src="(images\/[^"]+)"/s) || [])[1] || '';
  return { name, tag, img };
}

// ---- category landing page (clone chrome from products.html, swap main + head) ----
function categoryPage(cat) {
  let h = fs.readFileSync(path.join(ROOT, 'products.html'), 'utf8');
  const url = `${SITE}/products/${cat}/`;
  const title = `${CAT_FULL[cat]} — Manufacturer | RFID MFG`;
  const desc = `${CAT_FULL[cat]} from RFID MFG — ${CAT_SUB[cat]} OEM/ODM, low MOQ, ISO-certified, since 1996.`;
  // head swaps
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${CAT_FULL[cat]} | RFID MFG$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${CAT_SUB[cat]}$2`);
  // replace the two head JSON-LD blocks with category breadcrumb + collection
  const ld = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Products","item":"${SITE}/products/"},{"@type":"ListItem","position":3,"name":"${CAT_NAME[cat]}","item":"${url}"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"${CAT_FULL[cat]}","url":"${url}"}
</script>`;
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld);
  // build product grid for this category
  const items = CAT_ORDER.includes(cat) ? Object.keys(CAT).filter((s) => CAT[s] === cat) : [];
  const cards = items.map((s) => {
    const m = productMeta(s);
    const media = m.img ? `<img src="/${m.img}" alt="${m.name}" loading="lazy" width="300" height="300" />` : `<span>${m.name}</span>`;
    return `<a class="cat-item" href="/products/${cat}/${s}/"><div class="cat-item__media">${media}</div><div class="cat-item__body"><h3>${m.name}</h3><p>${m.tag}</p></div></a>`;
  }).join('\n      ');
  const main = `<main>
<section class="page-hero">
  <div class="page-hero__bg" aria-hidden="true"></div>
  <div class="container page-hero__inner">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/products/">Products</a><span>/</span>${CAT_NAME[cat]}</nav>
    <h1>${CAT_FULL[cat]}</h1>
    <p>${CAT_SUB[cat]}</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <nav class="cat-nav">${CAT_ORDER.map((c) => `<a href="/products/${c}/"${c === cat ? ' style="background:var(--brand-deep);color:#fff"' : ''}>${CAT_NAME[c]}</a>`).join('')}</nav>
    <div class="catalog-grid" style="margin-top:8px">
      ${cards}
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="container cta-band__inner">
    <div><h2>Need a custom ${CAT_NAME[cat].toLowerCase()} spec?</h2><p>Send us your chip, size and artwork — we quote within 24 hours.</p></div>
    <a href="/contact/" class="btn btn--ghost btn--lg">Get a Quote</a>
  </div>
</section>
</main>`;
  h = h.replace(/<main>[\s\S]*<\/main>/, main);
  // run standard rewrite to clean any remaining links/assets in the cloned chrome
  h = rewrite(h, '__cat_' + cat);
  return h;
}

// ---- run ----
try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (e) {}
fs.mkdirSync(OUT, { recursive: true });

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let n = 0;
for (const f of htmlFiles) {
  const base = f.replace(/\.html$/, '');
  const html = rewrite(fs.readFileSync(path.join(ROOT, f), 'utf8'), base);
  if (base === '404') writeOut('404.html', html);
  else { const p = cleanPath(base); writeOut(p === '' ? '' : p, html); }
  n++;
}
// category pages
for (const c of CAT_ORDER) { writeOut('products/' + c, categoryPage(c)); n++; }

// ---- copy assets ----
const rootAssets = ['styles.css', 'script.js', 'favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png',
  'icon-192.png', 'icon-512.png', 'og-image.jpg', 'site.webmanifest', 'robots.txt', 'llms.txt', 'llms-full.txt', '_headers', '_redirects'];
for (const a of rootAssets) { if (fs.existsSync(path.join(ROOT, a))) fs.copyFileSync(path.join(ROOT, a), path.join(OUT, a)); }
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
for (const a of fs.readdirSync(path.join(ROOT, 'fonts')).filter((x) => x.endsWith('.woff2'))) fs.copyFileSync(path.join(ROOT, 'fonts', a), path.join(OUT, 'fonts', a));
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
for (const a of fs.readdirSync(path.join(ROOT, 'images')).filter((x) => x.endsWith('.webp') || /^par.*\.png$/.test(x))) fs.copyFileSync(path.join(ROOT, 'images', a), path.join(OUT, 'images', a));
// datasheets (pre-built PDFs — static assets)
if (fs.existsSync(path.join(ROOT, 'datasheets'))) {
  fs.mkdirSync(path.join(OUT, 'datasheets'), { recursive: true });
  for (const a of fs.readdirSync(path.join(ROOT, 'datasheets')).filter((x) => x.endsWith('.pdf'))) fs.copyFileSync(path.join(ROOT, 'datasheets', a), path.join(OUT, 'datasheets', a));
}

// ---- sitemaps ----
function pri(u) {
  if (u === '/') return ['1.0', 'weekly'];
  if (u === '/products/') return ['0.9', 'weekly'];
  if (/^\/products\/[a-z]+\/$/.test(u)) return ['0.8', 'weekly'];      // category
  if (u === '/guides/') return ['0.8', 'weekly'];
  if (u === '/about/' || u === '/contact/') return ['0.8', 'monthly'];
  if (u === '/cases/' || u === '/news/') return ['0.7', 'weekly'];
  if (/^\/products\/[a-z]+\/[a-z0-9-]+\/$/.test(u)) return ['0.7', 'monthly']; // product
  if (/^\/guides\/[a-z0-9-]+\/$/.test(u)) return ['0.7', 'monthly'];
  if (/^\/tools\/[a-z0-9-]+\/$/.test(u)) return ['0.8', 'monthly'];
  if (/^\/(cases|news)\/[a-z0-9-]+\/$/.test(u)) return ['0.6', 'monthly'];
  if (u === '/privacy/' || u === '/terms/') return ['0.3', 'yearly'];
  return ['0.6', 'monthly'];
}
const urls = new Set(['/']);
for (const f of htmlFiles) { const b = f.replace(/\.html$/, ''); if (b !== '404') urls.add(urlFor(b)); }
for (const c of CAT_ORDER) urls.add('/products/' + c + '/');
const TODAY = '2026-06-15';
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
[...urls].sort().forEach((u) => { const [p, fr] = pri(u); sm += `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${fr}</changefreq>\n    <priority>${p}</priority>\n  </url>\n`; });
sm += '</urlset>\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm);

// image sitemap (clean page URLs)
let ism = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const fp = path.join(dir, e.name); if (e.isDirectory()) walk(fp); else if (e.name === 'index.html' || e.name === '404.html') { const h = fs.readFileSync(fp, 'utf8'); const imgs = [...new Set([...h.matchAll(/src="(\/images\/[^"]+\.webp)"/g)].map((m) => m[1]))]; if (imgs.length) { let loc = SITE + '/' + path.relative(OUT, fp).replace(/index\.html$/, '').replace(/\\/g, '/'); ism += `  <url>\n    <loc>${loc}</loc>` + imgs.map((i) => `\n    <image:image><image:loc>${SITE}${i}</image:loc></image:image>`).join('') + `\n  </url>\n`; } } } }
walk(OUT);
ism += '</urlset>\n';
fs.writeFileSync(path.join(OUT, 'image-sitemap.xml'), ism);

console.log(`Foldered build: ${n} pages -> dist/ ; sitemap urls: ${urls.size}`);
