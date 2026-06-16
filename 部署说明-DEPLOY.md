# 部署上线说明（RFID MFG 网站 · 目录式干净 URL 版）

上线文件都在 **`dist/`** 目录(也打成了 **`rfidmfg-site.zip`**)。现在用的是**目录式干净 URL**结构,没有 `.html` 后缀,层级清晰。

## 新的 URL 结构(已落地、已验证 0 死链)

```
/                                   首页
/about/  /contact/  /sustainability/  /privacy/  /terms/
/products/                          产品总览
/products/cards/                    分类落地页(cards/labels/tags/blocking/hardware 共 5 个)
/products/cards/hotel-key-card/     产品详情(25 个,按分类归位)
/guides/                            指南/对比/术语 总览
/guides/rfid-frequencies-lf-hf-uhf/ 指南/对比(12 个)
/cases/   /cases/warehouse/         案例(12 个)
/news/    /news/walmart/            新闻(6 个)
```

- 每个页面是 `<目录>/index.html`,主机访问 `/about/` 会自动给出 `/about/index.html`(Cloudflare Pages、Netlify 都原生支持)。
- 所有内部链接、CSS/JS/图片/字体都用**根绝对路径**(`/styles.css`、`/images/...`),任意目录深度都能正确加载。
- 面包屑已带分类层级(Home / Products / RFID Blocking / RFID Blocking Card)。

---

## 方案 A:Cloudflare Pages(推荐,免费 + CDN/HTTPS)⏱️15 分钟

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**。
2. 项目名填 `rfidmfg` → 把 **`dist` 文件夹**整个拖进去(或上传 `rfidmfg-site.zip`)→ **Deploy**。
3. 部署完得到 `rfidmfg.pages.dev` 预览网址,先自查:导航、分类页、产品页、图片、表单、手机端。
4. **绑定域名**:项目 → **Custom domains** → 加 `www.rfidmfg.com` 和 `rfidmfg.com`(自动 DNS + 免费 HTTPS)。
5. 已内置 `_redirects`(`rfidmfg.com` → `www.rfidmfg.com`)和 `_headers`(缓存 + 安全头)。

## 方案 B:Netlify

- Netlify → **Add new site → Deploy manually** → 拖 `rfidmfg-site.zip` 即可。`_headers` / `_redirects` 同样识别。

---

## 改内容后如何重新生成(日常维护)

一条命令搞定(在本机网站文件夹里):

```bash
bash build-all.sh
```

它会:① 由 `build-*.js` 的数据生成页面 → ② `build-foldered.js` 转成目录式结构 + 5 个分类页 + sitemap → ③ 打包 `rfidmfg-site.zip`。然后重新拖 `dist/` 上传即可。

> 内容在哪儿改:产品 = `build-products.js` 的 `PRODUCTS` 数组;指南/对比 = `build-content.js`;案例/新闻 = `build-articles.js`;首页/关于等手写页直接改对应 `.html`。

---

## 上线后必做

1. **提交收录**:Google Search Console + Bing Webmaster,提交 `https://www.rfidmfg.com/sitemap.xml`(已是干净 URL)。
2. **激活统计**:GA4 的 `G-XXXXXXXXXX` 发我一键全站替换。
3. **接询盘表单**:部署 `feishu-lead-worker.js` 到 Cloudflare Workers,把网址填进 `script.js` 的 `FORM_ENDPOINT`(⚠️先重置飞书 App Secret)。
4. **体检**:PageSpeed Insights + 真机看移动端。

## 仍需你本人完成
- 注册域名 `rfidmfg.com` + 开 `peter@`/`hr@` 邮箱(详见《上线操作手册.md》)。
- 链外/实体建设(详见《链外与实体建设清单.md》)。

---

## 包内结构(dist/)
- 70 个 `<目录>/index.html` 页面 + `404.html`(首页 + 5 静态页 + 产品总览 + 5 分类 + 25 产品 + 指南总览 + 12 指南 + 案例总览 + 12 案例 + 新闻总览 + 6 新闻)
- `/styles.css`、`/script.js`、`/fonts/`(8 woff2)、`/images/`(37 WebP + 12 伙伴 logo)
- 图标全套、`/og-image.jpg`、`/site.webmanifest`
- `/sitemap.xml`、`/image-sitemap.xml`、`/robots.txt`、`/llms.txt`、`/llms-full.txt`
- `/_headers`、`/_redirects`
