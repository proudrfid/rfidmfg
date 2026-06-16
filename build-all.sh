#!/bin/bash
# build-all.sh — 一键完整构建:生成所有页面 → 转成目录式干净 URL 的 dist/ → 打包 zip。
# 用法(在本机):bash build-all.sh
set -e
cd "$(dirname "$0")"

# 1) 由数据生成扁平 HTML(内容源)
node build-products.js
node build-articles.js
node build-content.js

# 2) 转成目录式干净 URL 结构(/products/<分类>/<产品>/ 等)+ 分类页 + sitemap → dist/
node build-foldered.js

# 3) 打包 zip(用于拖拽上传;也可直接拖 dist/ 文件夹)
rm -f rfidmfg-site.zip 2>/dev/null || true
( cd dist && zip -rq ../rfidmfg-site.zip . )

echo "✅ 完成:dist/(可直接部署) + rfidmfg-site.zip($(find dist -type f | wc -l | tr -d ' ') 个文件)"
echo "   日常改内容:改 build-*.js 里的数据数组 / 手写页,再跑一次本脚本即可。"
