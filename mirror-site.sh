#!/bin/bash
# ============================================================
# 一键把 mindrfid.com 整站镜像成本地静态副本
# (包含每一页、所有图片、样式 —— 排版与原站一致)
#
# 为什么在你电脑上跑:你的 Mac 能访问你的网站和 CDN;
# 我(Claude)的运行环境网络受限,无法下载这些图片。
#
# 用法:
#   1) 装 wget(若没有):先装 Homebrew(https://brew.sh),再 `brew install wget`
#   2) 终端进入本文件夹,执行:  bash mirror-site.sh
#   3) 完成后打开 mindrfid-mirror/www.mindrfid.com/index.html 离线浏览
# ============================================================
set -e

SITE="https://www.mindrfid.com/"
OUT="mindrfid-mirror"

echo "开始镜像 $SITE → ./$OUT  (首次可能需要几分钟)..."

wget \
  --mirror \
  --page-requisites \
  --convert-links \
  --adjust-extension \
  --no-parent \
  --span-hosts \
  --domains=www.mindrfid.com,cdnus.globalso.com \
  --reject-regex='mindrfid\.com/[a-z]{2,3}/' \
  --directory-prefix="$OUT" \
  --wait=0.3 --random-wait \
  -e robots=off \
  --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "$SITE" || true

echo ""
echo "✅ 完成。本地副本在: $OUT/www.mindrfid.com/"
echo "   双击 $OUT/www.mindrfid.com/index.html 即可离线浏览(图片与排版与原站一致)。"
echo ""
echo "说明:"
echo " - 已用 --reject-regex 跳过 100+ 语言镜像,只抓英文主站(想要全部语言就删掉那一行)。"
echo " - CDN 图片(cdnus.globalso.com)已通过 --span-hosts 一并下载并改为本地链接。"
