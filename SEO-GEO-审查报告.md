# RFID MFG 网站 SEO / GEO 审查报告

审查日期:2026-06-14 · 范围:全站 51 个页面(`mindrfid-website/`)

---

## 总评

技术地基扎实,但有 **4 个会直接拖累收录和分享的硬伤**,以及一批 **GEO(面向 AI 搜索引擎)提升空间**。修掉关键项后,这个站能达到行业靠前水平。

| 维度 | 评分 | 一句话 |
|---|---|---|
| 技术 SEO 基础 | 8 / 10 | 每页都有 title/description/canonical/单 H1/alt,很规范 |
| 站点可收录性 | 4 / 10 | sitemap 缺 44 页、域名写错、og 图缺失 |
| 结构化数据 | 6 / 10 | Product/Organization 齐全,但 FAQ/日期/作者缺失 |
| GEO(AI 可引用性) | 4 / 10 | 缺 FAQ schema、llms.txt、答案前置、对比表 |
| 性能 / 可访问性 | 8 / 10 | 页面轻、懒加载到位,缺图片宽高 |

---

## 做得好的地方(保持)

- 51 页**全部**有唯一 title、meta description、canonical、且仅 1 个 H1。
- **所有 `<img>` 都有 alt**,且 79 处 `loading="lazy"`。
- 结构化数据基础好:Organization 44、Product 25、Brand 25、BreadcrumbList 30、Article/NewsArticle 18。
- 标题层级干净(H1→H2→H3,无跳级)。
- 页面很轻(16–24KB),只有 2 个外部 CSS + 2 个 preconnect,无内联脚本阻塞。
- 站内相对链接 **0 死链**。

---

## 🔴 关键问题(优先修,影响收录与分享)

### 1. og 分享图不存在 —— 39 个页面引用了一张不存在的图
39 个页面写 `og:image = https://www.rfidmfg.com/og-image.jpg`,但该文件**不存在**。后果:发到微信/WhatsApp/LinkedIn/X 时**没有预览缩略图**,AI 抓取也拿不到主图。
**修复:** 生成一张 1200×630 的 `og-image.jpg`(品牌色 + Logo + 标语)放到根目录。

### 2. 一张图片引用名带空格 + 拼写错,永远加载不出来
重命名品牌时把文件名里的 `MIND` 也替换了,导致引用变成
`images/Sucessful-case-of-RFID MFG-rfid-ID-cards.jpg`(**带空格**),但下载脚本里的真实名是 `Sucessful-case-of-MIND-rfid-ID-cards.jpg`。这张图在 `cases.html` 和 `case-id-cards.html` 上**永远是裂图**。
**修复:** 把这两处 HTML 引用改回真实文件名(去掉空格)。

### 3. robots.txt 和 sitemap.xml 还写着旧域名 mindrfid.com
- `robots.txt` → `Sitemap: https://www.mindrfid.com/sitemap.xml`
- `sitemap.xml` 里 7 条全是 `https://www.mindrfid.com/...`

与 canonical 用的 `rfidmfg.com` **不一致**,Google Search Console 会因主机名不符拒收 sitemap。
**修复:** 全部改成 `www.rfidmfg.com`。

### 4. sitemap.xml 只收录了 7 页,漏了 44 页
所有 25 个产品详情页、12 个案例页、6 个新闻页、404 都**不在 sitemap 里**,搜索引擎更难发现这些"长尾流量页"。
**修复:** 重新生成完整 sitemap(含全部 50 个可索引页,带 `lastmod`)。

### 附:19 张产品/案例图还没下载
49 张引用图里有 19 张本地不存在(裂图)。这些**都在 `download-images.sh` 里**,在你本机跑一次脚本即可补齐,然后 `python3 remove-logo.py` 去水印。(第 2 条那张除外,需先改引用名。)

---

## 🟠 GEO 重点提升(让 AI 搜索引擎愿意引用你)

GEO = Generative Engine Optimization,目标是被 ChatGPT / Perplexity / Google AI Overviews / 文心一言等**直接引用**。当前最大的几块空白:

### 5. 26 个产品页有可见 FAQ,却没有 FAQPage 结构化数据
产品页底部都有"Frequently asked questions"折叠块,但**只有 contact.html 打了 FAQPage schema**。FAQ 标记是 AI 答案抽取和 Google 富结果的**头号抓手**,白白浪费了。
**修复:** 在 `build-products.js` 里把 `GENERIC_FAQ` 同步输出成 FAQPage JSON-LD。一次改,26 页全覆盖。

### 6. 文章缺 datePublished / dateModified / author
18 个案例+新闻页的 Article/NewsArticle schema **没有日期和作者**。AI 引擎和 Google 都偏好"有明确时间、有署名"的内容(E-E-A-T)。
**修复:** schema 补 `datePublished`、`dateModified`、`author`(可署 "RFID MFG Editorial Team"),页面上也显示"Last updated"。

### 7. 没有 llms.txt
越来越多 AI 爬虫读根目录的 `llms.txt`(类似给大模型看的站点地图)。
**修复:** 加一个 `/llms.txt`,列出公司一句话简介 + 主要产品线 + 关键页面链接。

### 8. 18 个案例/新闻页内容太薄(158–212 词)
AI 引用和 Google 都偏好有信息密度的页面,这些页普遍 <220 词。
**修复:** 每页扩到 400+ 词,加入**答案前置段**(开头一句话直接回答"X 是什么/有什么用")、**对比表**(如 LF/HF/UHF、PVC/PET/环保材料)、**带数字的要点**——这三类内容最容易被 AI 整段引用。

---

## 🟡 中等优先级

| # | 问题 | 修复 |
|---|---|---|
| 9 | 18 个页面 meta description >160 字符(news-blocking-card 215、case-warehouse 228),SERP 会被截断 | 压到 150–160 字符内 |
| 10 | Organization schema 缺 `contactPoint` 和 `sameAs` | 加 contactPoint(电话/邮箱/语言)和 sameAs(领英/阿里国际站等真实主页) |
| 11 | 所有 `<img>` 无 width/height 属性 | 补宽高,降低 CLS(Core Web Vitals 指标) |
| 12 | 无 WebSite SearchAction | 可选,加了能拿 Google sitelinks 搜索框 |

---

## 🟢 低优先级 / 打磨

- 3 个标题略超 60 字符(products 71、sustainability 73、index 65),会轻微截断——可精简。
- 文件名/alt 里的拼写错 "Sucessful" → "Successful"(配合第 2 条一起改)。

---

## 建议执行顺序

1. **先修 4 个关键项**(og 图、空格图名、域名、完整 sitemap)—— 30 分钟内可全部搞定,立刻不再裂图、sitemap 能提交。
2. **再补 GEO 四件套**(FAQ schema、文章日期/作者、llms.txt、薄页扩写)—— 决定能否被 AI 引用。
3. 最后处理中低优先级打磨项。
4. 上线后:提交 sitemap 到 Google Search Console + Bing,接入 GA4。

> 第 1、2 步里大部分是脚本可批量完成的(改 `build-products.js` / `build-articles.js` 后重跑即可)。
