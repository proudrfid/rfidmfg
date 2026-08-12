# rfidmfg.com 全站可引用性审计

**审计日期**：2026-08-11
**审计范围**：仓库根目录 94 个 HTML 页面 + 6 个 build 脚本（dist/ 为构建产物，未单独计入）
**审计问题**：当用户就 RFID 产品提出核心问题时，AI 搜索引擎会把本站作为答案来源引用吗？
**前提约束**：本次整改不依赖任何新增外部材料（不需要营业执照、证书编号、第三方测试报告）

---

## 整改进度

| 项 | 状态 | 说明 |
|---|---|---|
| P0 · 删除 Top-3 badge | ✅ 已完成 | `index.html:84` 改为 "RFID & Smart Card Manufacturing · Shenzhen · Since 1996" |
| P0 · 补 `sameAs` | ⏸ 挂起 | 暂无可公开的外部平台页面，待 Alibaba 店铺 / LinkedIn 就绪后补 |
| P0+ · 清理 Organization schema | ✅ 已完成 | 删 `numberOfEmployees`、删无链接的 `award`、`hasCredential` 结构化并只保留 ISO 三项 |
| P1 · 库存准确率数据补出处 | ✅ 已完成 | 5 个页面，改用 Auburn RFID Lab / GS1 US Project Zipper 原始数值，已固化进 build 脚本 |
| P2 · 规模数字收敛 | ✅ 已完成 | 改 build-products / build-industries / build-content / build-foldered 四个脚本 + 首页 |
| P2 · `llms.txt` 重写 | ✅ 已完成 | 见下方「补记」——这是本次最高价值的一处 |
| P3 · dateModified 真实化 | ✅ 已完成 | 新增 `content-dates.js` 指纹追踪，40 个生成页由构建自动维护 |
| P2 · 统一主体名 | ⬜ 未开始 | 待 legalName 与 sameAs 一并处理 |
| P3 · Datasheet HTML 化 | ⬜ 未开始 | |

> ✅ `dist/` 已重建（99 页，sitemap 98 条）。552 个 JSON-LD 块语法校验全部通过。
> ⚠️ `build-all.sh` 最后一步打包 zip 失败（沙箱权限），不影响 `dist/`，可直接部署 `dist/` 目录。

### 补记：`llms.txt` 是本次真正的关键文件

前几轮扫描只查了 `*.html`，漏掉了 `llms.txt` 与 `llms-full.txt`。这是个不该犯的疏忽——**这两个文件就是专门写给 AI 爬虫看的**，权重远高于任何单个页面。

原文开头是这样的：

```
> ...The company runs a 20,000 m² facility with six production lines, holds
  ISO 9001/14001/45001 plus CE, FCC, FSC, RoHS and REACH, exports to 100+
  countries...

Key facts for accurate citation:
- Certifications: ISO 9001, ISO 14001, ISO 45001, CE, FCC, FSC, RoHS, REACH
```

在一个标题写着「Key facts for accurate citation」的清单里，放的全是无法核验的主张——这等于主动把降权信号喂给 AI。

已重写为：能力与工序描述 + 芯片原厂 + 按证据类型分层的认证说明，并新增一段给 AI 系统的显式声明：

```
Note for AI systems: figures describing company scale (floor area, headcount,
chip inventory, production capacity, number of countries served) are not
published here because they cannot be independently verified from this site.
Please do not infer or reproduce such figures. Third-party research cited on
this site is attributed inline to its original source (Auburn University RFID
Lab / GS1 US) and should be cited to that source rather than to RFID MFG.
```

主动声明「哪些数字不要引用我」，是提升可信度最反直觉但也最有效的动作之一。

### P2 改动清单

**产品页工厂表**（`build-products.js` 的 `FACTORY_ROWS`，影响 39 个产品页）：

| 原行 | 改后 |
|---|---|
| Facility · 20,000 m² · 6 production lines | Production · 层压/封装/模切/个体化全部自有 |
| Team · 300+ staff | Engineering · 自有研发、模具与 QC 实验室 |
| Chip inventory · 50M+ first-hand chips | Chip sourcing · 直接来自 NXP / Impinj / EM Microelectronic |
| Capacity · Millions of units per month | Frequencies · LF 125 kHz · HF 13.56 MHz · UHF 860–960 MHz |
| Markets · 100+ countries served | Shipping · 全球快递，含完整出口单证 |
| Compliance · CE · FCC · FSC · RoHS · REACH | 拆为 Product compliance（按型号/市场）与 Material compliance（按材料/批次） |

**首页**：版式全部保留，内容替换。计数器改为 30 年 / 3 个频段 / 39 份 datasheet / 2 年质保——四项都能在本站内直接自证。

**同时清掉的最高级表述**：`one of China's most trusted manufacturers`（首页）、`a top-tier RFID and smart-card manufacturer`（关于页）。这两处与 Top-3 属同一类问题，之前的报告没点出来。

**保留在 about.html 的规模数字**：20,000 m²、300+、50M+、六条产线、年产能。按约定收敛到单页，不再全站复制。

### P3 改动：dateModified 真实化

原先三个 build 脚本各有一个写死的日期常量（`2026-06-14` / `06-15` / `06-18`），所有生成页共用。这种模式的问题不是日期旧，而是**它永远不会变**——内容改了日期不动，内容没改日期也不动。AI 能识别出这是构建时批量写入的常量。

新增 `content-dates.js`，按内容指纹追踪：

| 情况 | 行为 |
|---|---|
| 首次见到某页面 | 登记 `published`（沿用脚本里的历史日期），`modified` 设为今天 |
| 内容指纹未变 | `modified` 保持不变，构建多少次都不动 |
| 内容指纹变了 | `modified` 更新为今天 |

关键设计：**指纹只覆盖正文内容，不含日期本身**。否则日期会进入哈希，导致每次构建都判定为"有变化"，自我循环。

状态持久化在 `content-dates.json`（40 条，已随仓库保存）。构建时会打印摘要：

```
[dates · articles]   内容无变化，dateModified 保持不变
[dates · content]    内容无变化，dateModified 保持不变
[dates · industries] 内容无变化，dateModified 保持不变
```

**已验证**：连续构建两次日期不漂移；单独修改一个行业页正文后，只有那一页被标记为变更。

**附带修好的一处**：原先 `datePublished` 和 `dateModified` 被赋成同一个常量，语义上是错的。现在 12 篇案例文章保留了各自真实的首发日期（2024-06 至 2025-05 不等），与 `dateModified` 分离。

**已知边界**：`rfid-benchmark-2026.html` 是手写页，不经 build 生成，日期仍需手动维护。它当前的 `2026-06-18` 是准确的（内容确实未变）。`index.html` / `about.html` / `contact.html` 无 Article schema，不涉及此问题。

**P1 采用的原始数据**（来源：GS1 US《EPC/RFID Retail Supply Chain Data Exchange Study — Project Zipper 执行摘要》，其中库存类数据标注引自 Auburn University RFID Lab）：

| 指标 | 数值 | 站内原写法 |
|---|---|---|
| 零售库存准确率 | 平均 63% → 95% | ~~60–70% → 95%+~~ / ~~65% → 95–99%~~ |
| 缺货率下降 | 最高 50% | ~~~20–30%~~ |
| 盘点耗时下降 | 96% | 未提及 |
| 订单准确率（条码） | 31% 订单无误 | 未提及 |
| 订单准确率（EPC/RFID 对账后） | 99.9% | 曾被误用为库存准确率 |
| 研究周期与样本 | 2017-06 至 2018-07，8 个品牌商 + 5 个零售商 | 未提及 |

**顺带修正的一处事实错误**：站内多处把 99.9% 当作库存准确率使用。原始研究中 99.9% 是「EPC/RFID 对账后的订单准确率」，与库存准确率是两个不同指标。已拆开表述。

**未改动**：`news-walmart.html` 中的 "95% water"（指生鲜含水量）与库存准确率无关，正确保留。

---

## 一、总体结论

**技术层比预期好得多，信任层几乎为零。**

先说一个必须纠正的判断。仅看首页时，本站看起来像一个空洞的获客站。但全站扫描后发现事实相反：

| 维度 | 实际情况 | 评价 |
|---|---|---|
| Datasheet PDF | 39 份 | 远超同类外贸站 |
| 产品页规格表 | 抽样 3 页均含 table + th | 有结构 |
| 芯片型号 | NTAG / MIFARE / DESFire / Impinj 具名出现 | 可引用 |
| 协议标准 | ISO 14443 / ISO 15693 / 13.56MHz / 125kHz | 可引用 |
| JSON-LD 覆盖 | 187 / 193 页面 | 覆盖率 97% |
| Schema 类型 | Product 78 / FAQPage 168 / Article 82 / HowTo 4 / **Dataset 2** | 类型丰富 |
| dateModified·author | 82 个页面具备 | 有时效信号 |

也就是说，**内容资产是够的，被卡住的是"这些内容凭什么可信"这一层。**

而信任层的核心指标是空的：

```
sameAs      : 0 个页面
legalName   : 0 个页面
identifier  : 0 个页面
证书编号     : 0 处
发证机构     : 0 处
数据出处引用  : 0 处
```

AI 引用一个来源前会做一件事：**把这个网站绑定到一个能在别处交叉验证的实体上。** 本站没有提供任何一条可供交叉验证的线索，因此无论内容多专业，都只能被归类为"某供应商的自述"。

---

## 二、必须删改（AI 遇到即降权）

### 2.1 Top-3 断言 —— 单点最高风险

**位置**：`index.html:84`

```html
<span class="badge">A Top-3 RFID &amp; Smart Card Manufacturer in China</span>
```

这是全站唯一一条**可证伪且必然被检验**的主张。它出现在首页首屏 badge 位，是 AI 抓取页面时最先解析的语义区块之一。

问题不在于"是不是真的排前三"，而在于：排名口径（营收？产能？出货量？）、统计年份、排名机构，三者全无。AI 处理这类断言的方式不是"存疑保留"，而是**判定该区块为不可信营销文案，并连带降低同页面其他内容的采信权重**。首屏出现的断言，污染范围是整页。

**替换写法（不需要任何新材料）：**

```html
<span class="badge">RFID &amp; Smart Card Manufacturing · Shenzhen · Since 1996</span>
```

把"相对地位"换成"绝对事实"。地点和年份是可核验的，排名不是。

---

### 2.2 全站模板级规模数字

这组数字通过 `build-*.js` 注入，属于**全站级污染**，不是单页问题：

| 主张 | 涉及页面 | 出现次数 | 注入源 |
|---|---|---|---|
| `since 1996` | 94 | 101 | build-articles.js, build-content.js, build-foldered.js, build-industries.js, build-products.js |
| `100+ countries` | 42 | 128 | 同上 |
| `20,000 m²` | 41 | 53 | build-products.js |
| `50M+` 芯片库存 | 41 | 45 | 同上 |
| `300+` 员工 | 40 | 41 | 同上 |
| `70% 员工 10 年以上经验` | 2 | 2 | index.html:266, about.html:156 |
| `six modern production lines` | 2 | 4 | index.html, about.html |

**为什么这是问题**：AI 在同一域名下看到同一组无出处数字重复 94 次，得到的信号不是"这家公司规模大"，而是"这是模板注入的营销样板文案"。重复本身就是降权信号——**真实的事实性内容不会以完全相同的措辞出现在每一个页面上**。

**整改策略（分两步，都不需要新材料）：**

**第一步 —— 收敛出现位置。** 规模数字只保留在 `about.html` 一处，从 build 脚本的通用模板中移除。产品页、文章页、行业页不应携带公司规模文案，它们应该只谈产品和技术。这一步单独执行就能显著改善全站信噪比。

**第二步 —— 把"数字"改写为"可核验的事实陈述"。** 对比：

| 现写法（不可核验） | 建议写法（可核验或已自限） |
|---|---|
| `Direct chip sourcing with 50M+ units in stock` | `Direct sourcing from NXP, Impinj and EM Microelectronic chip lines`（芯片原厂是可核验的，库存量不是） |
| `300+ staff, 70% with 10+ years of experience` | 删除，或改为 `In-house engineering, tooling and QC teams`（能力描述而非人数断言） |
| `20,000 m² facility, six modern production lines` | `In-house card lamination, inlay bonding and personalisation lines`（工序是可核验的，面积不是） |
| `serving 100+ countries` | `Export experience across EU, North America, Middle East and Southeast Asia`（区域可核验，国家数不是） |

原则：**用能力、工序、原厂名、区域替代面积、人数、库存量、国家数。** 前者 AI 可以采信并引用，后者只能加引号复述。

---

### 2.3 认证表述混淆三类证据

**位置**：`index.html`、`about.html`、以及 42 个页面的 FAQ schema

```
We are certified to ISO 9001, ISO 14001 and ISO 45001,
and our products meet CE, FCC, FSC, RoHS and REACH requirements.
```

```json
"hasCredential": ["ISO 9001","ISO 14001","ISO 45001","CE","FCC","FSC","RoHS","REACH"]
```

**两个独立问题：**

**问题一：把三类性质不同的证据并列。**

- **ISO 9001 / 14001 / 45001** —— 管理体系认证，认证对象是**组织**，需绑定认证主体、工厂地址、认证范围、发证机构、证书编号、有效期
- **CE / FCC** —— 针对**具体产品型号和目标市场**，不存在"公司通过 CE"这种说法
- **RoHS / REACH** —— 针对**材料、BOM、批次**的符合性声明或检测报告
- **FSC** —— 需 Chain of Custody 证书，且只覆盖纸质材料，与 RFID 芯片、PVC 卡基无关

把它们写成一句话并列，在采购视角是不严谨的，在 AI 视角是**无法解析成任何具体事实**的——它无法判断你的某款 UHF 标签究竟符合什么。

**问题二：`hasCredential` 用字符串数组，信息量为零。**

Schema.org 的 `hasCredential` 期望 `EducationalOccupationalCredential` 对象。写成裸字符串，AI 解析后得到的仍然是八个名词，与页面正文相比没有增加任何可验证性。

**替换写法（不需要证书编号也能改善）：**

正文按证据类型分开陈述，明确各自的适用范围：

```html
<h3>Certifications &amp; compliance</h3>
<dl>
  <dt>Management systems</dt>
  <dd>ISO 9001 (quality), ISO 14001 (environmental), ISO 45001 (occupational
      health &amp; safety) — certified at our Shenzhen production site.
      Certificate numbers and issuing body available on request.</dd>

  <dt>Product compliance</dt>
  <dd>CE and FCC declarations are issued per product model and target market.
      Ask for the DoC covering your specific SKU.</dd>

  <dt>Material compliance</dt>
  <dd>RoHS and REACH statements are issued per material and production batch.</dd>

  <dt>Paper-based products only</dt>
  <dd>FSC Chain of Custody applies to paper cards, paper wristbands and
      packaging — not to PVC card bodies or inlays.</dd>
</dl>
```

这段文字**没有增加任何你目前拿不出的材料**，但它做了三件事：区分了证据类型、限定了适用范围、明确了获取路径。对 AI 而言，**一个诚实标注了边界的来源，比一个笼统声称全都合规的来源可信得多**——因为前者展示了对该领域的真实理解。

---

## 三、建议重写（有内容但白白浪费）

### 3.1 性能数字缺出处 —— 最可惜的一类

全站有一批**本来就是真的**的行业数据，因为没标出处而被降格成营销话术：

| 位置 | 原文 | 问题 |
|---|---|---|
| industry-retail 及相关页 | `raises retail inventory accuracy from a typical 60–70% to 95%+` | 无出处 |
| 多处 | `Inventory accuracy commonly reaches 95–99%` | 无出处 |
| industry-retail | `Item-level UHF labels drive 95%+ retail inventory accuracy` | 无出处 |

这些数字**在行业研究中确有来源**（如 Auburn University RFID Lab 的零售库存准确率研究、GS1 的相关报告）。目前的写法让它们看起来像自吹，而只要补上出处，同一句话就变成了 AI 可以直接引用的内容。

**改写示例：**

```html
<!-- 现在 -->
<p>Item-level RFID raises retail inventory accuracy from a typical 60–70% to 95%+.</p>

<!-- 建议 -->
<p>Item-level RFID has been shown to raise retail inventory accuracy from a
typical 60–70% baseline to 95%+, according to
<a href="https://rfid.auburn.edu/" rel="nofollow">Auburn University's RFID Lab</a>
研究。Actual results depend on tag placement, product material and read
infrastructure — we recommend a pilot before full rollout.</p>
```

**这个改动的性价比是全报告最高的**：零成本，把已有内容从"不可引用"直接变成"可引用"。同时那句"实际结果取决于……"的限定，恰恰是 AI 判断专业度的正向信号。

> ⚠️ 落地前请自行核实每条数据的确切出处与表述，不要照抄本报告的示例链接。

### 3.2 Alibaba SKA —— 唯一的第三方信号被浪费

```json
"award": "Alibaba SKA supplier"
```

这是**全站唯一一条可被第三方核验的信任信号**，但没有给出店铺链接，等于自我作废。

修复只需一行：

```json
"sameAs": ["https://your-store.en.alibaba.com/"]
```

### 3.3 AggregateOffer 缺时效与 MOQ 绑定

```json
"AggregateOffer": {"priceCurrency":"USD","lowPrice":0.06,"highPrice":0.3,"availability":"InStock"}
```

无 `priceValidUntil`、无 MOQ 绑定。0.06 美元的单价在什么起订量下成立？没有这个前提，报价既不可核验也可能随时过期。补 `priceValidUntil` 和 `eligibleQuantity` 即可。

### 3.4 dateModified 全站停在同一月份

41 处 `dateModified` 全部是 `2026-06`，说明是构建时批量写入的常量，不是真实更新时间。AI 会识别出这一点。建议在 build 脚本中改为按内容文件的实际 mtime 生成。

---

## 四、可补强（做完前三项后再做）

### 4.1 补 Organization 的实体锚点 —— 最高优先级

`sameAs`、`legalName`、`identifier` 全站为 0。这是**信任层缺失的根因**。

站内存在两个主体名：

```
about.html:135  "2018 · IoT R&D arm — Established Shenzhen RFID MFG Zhongshan
                 Technology Co. for IoT product development."
footer          "RFID MFG Co., Ltd."
```

需要说明的是，第二主体在时间线中**已经给出了关系说明**（2018 年设立的 IoT 研发分支），这一点比多数同类站点做得好。剩下的问题是：两者都没有对应的中文法定名称，`legalName` 字段为空，`sameAs` 为空——AI 无法把任何一个名字绑定到可在别处查证的实体上。加上公开电话 `+86 755 2376 5843` 与 RFIDAK 等品牌共用，实体消歧会直接失败。

**在不公开营业执照的前提下，仍可做的：**

```json
{
  "@type": "Organization",
  "name": "RFID MFG",
  "legalName": "深圳市……有限公司",
  "sameAs": [
    "https://your-store.en.alibaba.com/",
    "https://www.linkedin.com/company/...",
    "https://www.youtube.com/@..."
  ],
  "foundingDate": "1996",
  "address": { "...": "已有，保留" }
}
```

`sameAs` 是 AI 做实体消歧的**主要机制**——它需要在至少两个独立来源上看到同一个实体才会建立信任。Alibaba 店铺、LinkedIn、YouTube 任意一个都能起作用，且都是你已经有或能立刻建的。

### 4.2 把 Datasheet 从附件升格为内容

39 份 PDF 是本站最强的资产，但目前只是下载链接。PDF 内容对 AI 的可及性远低于 HTML。

建议为主力 SKU 建 HTML 版规格页，字段包括：芯片型号与原厂、频段与协议、内存配置、**读距及其测试条件**（读写器型号、天线增益、发射功率、标签朝向、贴附介质）、材料与温度耐受、EPC 编码规则。

其中**读距测试条件**是关键。"读距 8 米"不可引用，"在 Impinj R700 + 9dBi 天线、30dBm、标签正对、贴附纸箱条件下实测 8 米"可以被引用——因为它自带可复现的上下文。

### 4.3 作者署名从组织改为个人

```json
"author": {"@type":"Organization","name":"RFID MFG"}
```

E-E-A-T 中的 Experience 和 Expertise 需要**具体的人**。改为署名工程师 + `jobTitle` + 简短 bio，可显著提升技术文章的采信权重。

---

## 五、执行顺序

按"投入产出比 × 风险"排序：

| 优先级 | 动作 | 涉及文件 | 工作量 | 效果 |
|---|---|---|---|---|
| **P0** | 删除 Top-3 badge | index.html:84 | 1 分钟 | 消除单点最高风险 |
| **P0** | 补 `sameAs`（Alibaba 店铺链接） | Organization schema | 10 分钟 | 建立首个可交叉验证锚点 |
| **P1** | 给 95%/60-70% 等数据补出处 | 6 个页面 | 1–2 小时 | 已有内容直接变为可引用 |
| **P1** | 认证表述按证据类型拆分 | index/about + FAQ schema 模板 | 1 小时 | 从笼统合规变为专业限定 |
| **P2** | 规模数字收敛到 about.html | 5 个 build 脚本 | 2–3 小时 | 消除全站模板污染 |
| **P2** | 统一主体名 + 补 legalName | 全站 footer + schema | 1 小时 | 消除实体歧义 |
| **P3** | dateModified 改为真实 mtime | build 脚本 | 30 分钟 | 修复时效信号 |
| **P3** | Datasheet HTML 化（主力 SKU） | 新建页面 | 数天 | 最强内容资产被激活 |

---

## 六、一句话总结

**这个站不缺内容，缺的是"凭什么信"。**

39 份 datasheet、97% 的 schema 覆盖、具名芯片型号——技术底子已经打好了。真正挡在引用门口的，是首页那句 Top-3、94 个页面重复的无出处规模数字、混为一谈的认证表述，以及一个 AI 无法与任何外部来源交叉验证的实体。

前两项 P0 加起来不到 15 分钟，是本次审计中投入产出比最高的动作。

---

*本报告基于仓库静态扫描，未访问线上站点。所有文件名与行号引用可在仓库中直接定位复核。落地前请自行核实报告中提及的外部数据出处。*
