#!/bin/bash
# build-dist.sh — 组装"只含上线文件"的 dist/ 目录 + 打包 zip。
# 用法: bash build-dist.sh   (会先重新生成全站页面)
set -e
cd "$(dirname "$0")"

# 1) 重新生成所有页面,确保 dist 是最新的
node build-products.js >/dev/null
node build-articles.js >/dev/null
node build-content.js >/dev/null

# 2) 清空并重建 dist
rm -rf dist 2>/dev/null || true
mkdir -p dist/fonts dist/images

# 3) 拷贝生产文件
cp *.html dist/
for f in styles.css script.js favicon.svg favicon.ico favicon-32.png apple-touch-icon.png \
         icon-192.png icon-512.png og-image.jpg site.webmanifest \
         sitemap.xml image-sitemap.xml robots.txt llms.txt llms-full.txt _headers _redirects; do
  [ -f "$f" ] && cp "$f" dist/
done
cp fonts/*.woff2 dist/fonts/
cp images/*.webp dist/images/
cp images/par*.png dist/images/

echo "dist assembled: $(find dist -type f | wc -l) files"
