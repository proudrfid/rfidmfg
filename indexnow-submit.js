#!/usr/bin/env node
/**
 * IndexNow 批量推送 — 读取 dist/sitemap.xml,把全部 URL 提交给 api.indexnow.org
 * (Bing / Yandex / Seznam / Naver 即时收录通道;Bing 索引同时供给 ChatGPT Search 与 Copilot)
 *
 * 用法: node indexnow-submit.js          # 推送 sitemap 里全部 URL
 *      node indexnow-submit.js URL...   # 只推送指定 URL(新增/改版页时用)
 *
 * 前提: 部署后 https://www.rfidmfg.com/<KEY>.txt 可访问(build 已自动复制)。
 */
const fs = require('fs');
const https = require('https');

const HOST = 'www.rfidmfg.com';
const KEY = 'ddb6f87001124c9ca06a2ea8021c931a';

function urlsFromSitemap() {
  const xml = fs.readFileSync('dist/sitemap.xml', 'utf-8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const urlList = process.argv.slice(2).length ? process.argv.slice(2) : urlsFromSitemap();
const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
});

const req = https.request(
  { hostname: 'api.indexnow.org', path: '/indexnow', method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) } },
  (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log(`IndexNow: HTTP ${res.statusCode} — ${urlList.length} URLs submitted${body ? ' — ' + body : ''}`);
      process.exit(res.statusCode === 200 || res.statusCode === 202 ? 0 : 1);
    });
  }
);
req.on('error', (e) => { console.error('IndexNow error:', e.message); process.exit(1); });
req.write(payload);
req.end();
