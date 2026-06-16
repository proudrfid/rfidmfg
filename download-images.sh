#!/bin/bash
# ============================================================
# 下载网站用到的真实图片到本地 images/ 文件夹(自托管,绕过 CDN 防盗链)
# 在你自己的 Mac 上运行:  bash download-images.sh
# 用 curl(Mac 自带),下载时带 Referer 以通过防盗链。
# ============================================================
set -e
mkdir -p images
BASE="https://cdnus.globalso.com/mindrfid"
REFERER="https://www.mindrfid.com/"

FILES=(
  # 产品 / 精选图
  "Hotel-Keycard-2-300x300.jpg"
  "NFC-metal-card-1-300x300.jpg"
  "EV-Charging-Card-1-300x300.jpg"
  "Transparent-plastic-card-6-300x300.jpg"
  "Leather-RFID-Wristbands-1-300x300.jpg"
  "rfid-laundry-tag1-300x300.jpg"
  "Paper-RFID-Wristbands-11-300x300.jpg"
  "Scratch-card-1-300x300.jpg"
  "Contact-IC-Chip-Card-1-300x300.jpg"
  "0201-300x300.jpg"
  "wooden-RFID-Wristbands-11-300x300.jpg"
  "2221-300x300.jpg"
  "87-300x300.jpg"
  "RFID-card-2-300x300.jpg"
  "4-300x300.jpg"
  "White-label-sticker-1-300x300.jpg"
  "1-300x300.jpg"
  # 合作伙伴 logo
  "par01.png" "par02.png" "par03.png" "par04.png" "par05.png" "par06.png"
  "par07.png" "par08.png" "par09.png" "par10.png" "par11.png" "par12.png"
  # 案例图
  "Warehouse-management.jpg"
  "Sucessful-case-of-MIND-rfid-ID-cards.jpg"
  "8c13613a.png"
  "RFID-Library-system.jpg"
  "b1da77ec.png"
  "50797d5d.png"
  "ac472d5d.png"
  "6f2eb52c.png"
  "8011afeb.png"
  "025f66e4.png"
  # 补充产品图
  "811-300x300.jpg"
  "Eco-Friendly-Card-21-300x300.jpg"
  "Animal-ear-tag-300x300.jpg"
  "NFC-anti-metal-tags-1-300x300.jpg"
  "RFID-keyfob-1-300x300.jpg"
  "RFID-blocking-card-7-300x300.jpg"
  "RFID-blocking-sleeves-9-300x300.jpg"
  "RFID-blocking-wallet-3-300x300.jpg"
  "13.56MHZ-ISO14443-Type-AB-USB-Smart-Card-Reader-1-300x300.jpg"
  "CA-T3-Cykeo-RFID-Smart-Tool-Cabinet-V2.0-1-300x300.png"
)

ok=0; fail=0
for f in "${FILES[@]}"; do
  if curl -fsSL -e "$REFERER" -A "Mozilla/5.0" -o "images/$f" "$BASE/$f"; then
    echo "✓ $f"; ok=$((ok+1))
  else
    echo "✗ 失败: $f"; fail=$((fail+1))
  fi
done

# 唯一带旧品牌名的图片:CDN 仍按原名下载,下载后在本地改成干净名字
if [ -f "images/Sucessful-case-of-MIND-rfid-ID-cards.jpg" ]; then
  mv -f "images/Sucessful-case-of-MIND-rfid-ID-cards.jpg" "images/rfid-id-cards-case.jpg"
  echo "↳ 已重命名为 rfid-id-cards-case.jpg"
fi

echo ""
echo "完成:成功 $ok 张,失败 $fail 张,保存在 ./images/"
echo "现在刷新打开 index.html / products.html,图片应正常显示。"
