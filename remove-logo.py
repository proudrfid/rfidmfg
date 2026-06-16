#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
remove-logo.py — 去掉产品图左上角的旧 MIND/MND 红色 logo 水印。
做法:对每张产品图的左上角固定区域做 content-aware 修复(inpaint),
白底→填白,带纹理背景→按周围纹理修补。颜色无关,稳定可复跑。

用法(在本机,images/ 已有下载好的图后):
    python3 remove-logo.py
原图会自动备份到 images_orig_logo/(已存在则不覆盖)。
依赖: pip install opencv-python-headless numpy --break-system-packages
"""
import os, shutil
import numpy as np
import cv2

IMG_DIR = "images"
BAK_DIR = "images_orig_logo"
SKIP_PREFIX = ("par", "CHK-", "og-image")   # 合作伙伴 logo / 临时 / og 图不处理
# logo 固定在左上角:覆盖高度 18%、宽度 42%(已覆盖观察到的最大 logo)
BOX_H, BOX_W = 0.18, 0.42
# 个别图片除左上角外,卡面上还印有白色 MND® 注册商标,需额外修补(坐标按 300×300 原图)
# 格式: 文件名 -> [(y0, y1, x0, x1), ...]
SPECIAL = {
    "EV-Charging-Card-1-300x300.jpg": [(84, 115, 46, 104)],
}

def main():
    os.makedirs(BAK_DIR, exist_ok=True)
    n_done = 0
    for name in sorted(os.listdir(IMG_DIR)):
        if not name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        if name.startswith(SKIP_PREFIX):
            continue
        p = os.path.join(IMG_DIR, name)
        img = cv2.imread(p)
        if img is None:
            continue
        # 备份原图(仅首次)
        bak = os.path.join(BAK_DIR, name)
        if not os.path.exists(bak):
            shutil.copy2(p, bak)
        H, W = img.shape[:2]
        mask = np.zeros((H, W), np.uint8)
        mask[0:int(H * BOX_H), 0:int(W * BOX_W)] = 255
        for (y0, y1, x0, x1) in SPECIAL.get(name, []):
            mask[y0:y1, x0:x1] = 255
        out = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
        ext = name.lower().rsplit(".", 1)[-1]
        if ext in ("jpg", "jpeg"):
            cv2.imwrite(p, out, [cv2.IMWRITE_JPEG_QUALITY, 92])
        else:
            cv2.imwrite(p, out)
        n_done += 1
        print(f"  ✓ {name}")
    print(f"\n完成 {n_done} 张。原图备份在 {BAK_DIR}/(如需还原,把里面的文件拷回 {IMG_DIR}/)。")

if __name__ == "__main__":
    main()
