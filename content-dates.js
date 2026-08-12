/**
 * content-dates.js — 真实的 datePublished / dateModified 追踪
 *
 * 背景：各 build 脚本原先把 UPDATED_ISO 写死成一个常量，导致全站 dateModified
 * 停在同一天。AI 系统能识别这一点，并会因此降低对页面时效性的信任。
 *
 * 做法：为每个页面计算内容指纹并持久化到 content-dates.json。
 *   · 首次见到某页面 → 记录 published（沿用脚本里的历史日期）与 modified（今天）
 *   · 内容指纹未变   → modified 保持不变，无论构建多少次
 *   · 内容指纹变了   → modified 更新为今天
 *
 * 关键点：指纹只覆盖正文内容，不含日期本身，否则会自我循环、每次构建都变。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE = path.join(__dirname, 'content-dates.json');
const TODAY = new Date().toISOString().slice(0, 10);

let db = {};
try {
  if (fs.existsSync(STORE)) db = JSON.parse(fs.readFileSync(STORE, 'utf8'));
} catch (e) {
  console.warn('  content-dates.json 读取失败，将重新生成:', e.message);
  db = {};
}

let dirty = false;
let created = 0;
let bumped = 0;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** 把 2026-08-11 转成 August 11, 2026 */
function human(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * @param {string} slug        页面文件名，如 'rfid-vs-barcode.html'
 * @param {string} content     用于计算指纹的正文内容（不要包含日期）
 * @param {string} seedDate    该页面首次发布日期，仅在首次登记时使用
 * @returns {{published:string, modified:string, publishedHuman:string, modifiedHuman:string}}
 */
function track(slug, content, seedDate) {
  const hash = crypto.createHash('sha1').update(String(content)).digest('hex').slice(0, 16);
  const cur = db[slug];

  if (!cur) {
    db[slug] = { published: seedDate || TODAY, modified: TODAY, hash };
    dirty = true;
    created++;
  } else if (cur.hash !== hash) {
    cur.hash = hash;
    cur.modified = TODAY;
    dirty = true;
    bumped++;
  }

  const rec = db[slug];
  return {
    published: rec.published,
    modified: rec.modified,
    publishedHuman: human(rec.published),
    modifiedHuman: human(rec.modified),
  };
}

/** 构建结束时调用，把变更写回磁盘并打印摘要 */
function save(label) {
  if (dirty) {
    const sorted = {};
    Object.keys(db).sort().forEach((k) => { sorted[k] = db[k]; });
    fs.writeFileSync(STORE, JSON.stringify(sorted, null, 2) + '\n');
  }
  const parts = [];
  if (created) parts.push(`${created} 个页面首次登记`);
  if (bumped) parts.push(`${bumped} 个页面内容有变、更新 dateModified`);
  if (!parts.length) parts.push('内容无变化，dateModified 保持不变');
  console.log(`  [dates${label ? ' · ' + label : ''}] ${parts.join('；')}`);
  created = 0; bumped = 0; dirty = false;
}

module.exports = { track, save, human, TODAY };
