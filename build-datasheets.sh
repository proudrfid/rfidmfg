#!/bin/bash
# build-datasheets.sh — 抽取产品数据 + 生成每个产品的规格书 PDF(datasheets/<slug>.pdf)。
# 依赖(一次性):pip install reportlab --break-system-packages
# 用法:bash build-datasheets.sh   (改了 build-products.js 的产品数据后重跑)
set -e
cd "$(dirname "$0")"
node -e 'const fs=require("fs");const s=fs.readFileSync("build-products.js","utf8");const m=s.match(/const PRODUCTS = (\[[\s\S]*?\]);/);fs.writeFileSync("products.json",JSON.stringify(eval(m[1])));'
python3 build-datasheets.py
