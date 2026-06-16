# RFID MFG — Website

Static marketing website for **RFID MFG Co., Ltd.** (rfidmfg.com). Foldered clean‑URL build, **zero npm dependencies** — the build is plain Node scripts using only `fs`/`path`.

## How it works

Content lives as data in the build scripts; running them produces flat HTML, which is then transformed into a foldered clean‑URL site in `dist/`.

| Script | Produces |
|---|---|
| `build-products.js` | 25 product pages + products catalog |
| `build-articles.js` | 12 case pages + 6 news pages |
| `build-content.js` | 5 guides + 6 comparisons + glossary + guides hub |
| `build-foldered.js` | Transforms everything into `dist/` with clean URLs (`/products/<category>/<product>/`, `/guides/<slug>/`, `/cases/<slug>/`, `/news/<slug>/`), 5 product **category** pages, and `sitemap.xml` / `image-sitemap.xml` |

Hand‑maintained pages: `index.html`, `about.html`, `sustainability.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html`.

## Build locally

```bash
npm run build      # → dist/  (deployable static site)
```

No dependencies are installed for the build itself (`bash build-all.sh` does the same and also zips `dist/`).

## Deploy

- **Vercel** (configured in `vercel.json`): Build Command `npm run build`, Output Directory `dist`. Connect this repo → deploy.
- **Cloudflare Pages / Netlify**: upload `dist/`, or set the same build command + output dir. `_headers` / `_redirects` are included for those hosts.

## Edit content

- Products → `build-products.js` (`PRODUCTS` array)
- Guides / comparisons → `build-content.js`
- Cases / news → `build-articles.js`
- Home / About / etc. → edit the corresponding `.html` directly

Then `npm run build` (or `bash build-all.sh`) and redeploy.

## Notes

- Self‑hosted fonts (`/fonts`), WebP images (`/images`).
- GA4 snippet is present but commented out — add your `G-XXXXXXXXXX` to activate.
- Inquiry form falls back to mailto; wire `feishu-lead-worker.js` (Cloudflare Worker) and set `FORM_ENDPOINT` in `script.js` for structured capture.
- Project docs (Chinese): `部署说明-DEPLOY.md`, `上线操作手册.md`, `链外与实体建设清单.md`, `SEO-GEO-增长方案.md`.
