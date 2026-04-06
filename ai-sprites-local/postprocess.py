"""
画像後処理ユーティリティ

ComfyUIで生成したRaw画像をゲームアセット向けに変換する。
- 背景除去（rembg）
- 自動クロップ
- 顔切り抜き（バストショットから顔画像を生成）
- 縮小・減色（ピクセルアート化）
- スプライトシート作成
"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


# アニメ顔検出用カスケードファイルのパス
_CASCADE_PATH = Path(__file__).parent / "cascades" / "lbpcascade_animeface.xml"

# 手動オーバーライド用JSONのパス
_FACE_OVERRIDES_PATH = Path(__file__).parent / "face_crop_overrides.json"


def _load_face_overrides() -> dict[str, dict[str, int]]:
    """手動切り抜き座標のオーバーライドを読み込む"""
    if _FACE_OVERRIDES_PATH.exists():
        with open(_FACE_OVERRIDES_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def crop_face_from_bust(
    input_path: str,
    output_path: str,
    face_size: int = 256,
    name: str | None = None,
) -> Image.Image:
    """バストショット画像から顔部分を切り抜く

    検出方法:
    1. 手動オーバーライドJSON（name指定時）
    2. lbpcascade_animeface によるアニメ顔検出
    3. フォールバック: 上部中央50%を切り抜き

    Args:
        input_path: 入力画像パス（バストショット）
        output_path: 出力画像パス（顔画像）
        face_size: 出力サイズ（正方形）
        name: キャラクター名（オーバーライド用）

    Returns:
        切り抜き後のPIL Image
    """
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    crop_box = None

    # 1. 手動オーバーライドを確認
    if name:
        overrides = _load_face_overrides()
        if name in overrides:
            o = overrides[name]
            crop_box = (o["x"], o["y"], o["x"] + o["size"], o["y"] + o["size"])
            print(f"  [FaceCrop] Using manual override for {name}")

    # 2. アニメ顔検出
    if crop_box is None and _CASCADE_PATH.exists():
        gray = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
        cascade = cv2.CascadeClassifier(str(_CASCADE_PATH))
        faces = cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(w // 8, h // 8)
        )
        if len(faces) > 0:
            # 最大の顔を選択
            fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])
            # 30%拡張して髪・耳・首を含める
            expand = int(max(fw, fh) * 0.3)
            cx, cy = fx + fw // 2, fy + fh // 2
            half = max(fw, fh) // 2 + expand
            x1 = max(0, cx - half)
            y1 = max(0, cy - half)
            x2 = min(w, cx + half)
            y2 = min(h, cy + half)
            # 正方形に調整
            size = max(x2 - x1, y2 - y1)
            x1 = max(0, cx - size // 2)
            y1 = max(0, cy - size // 2)
            if x1 + size > w:
                x1 = w - size
            if y1 + size > h:
                y1 = h - size
            crop_box = (x1, y1, x1 + size, y1 + size)
            print(f"  [FaceCrop] Detected anime face at ({fx},{fy},{fw},{fh})")

    # 3. フォールバック: 上部中央50%
    if crop_box is None:
        size = w // 2
        x1 = (w - size) // 2
        y1 = 0
        crop_box = (x1, y1, x1 + size, y1 + size)
        print(f"  [FaceCrop] Fallback: top-center 50% crop")

    cropped = img.crop(crop_box).resize((face_size, face_size), Image.LANCZOS)
    cropped.save(output_path)
    return cropped


def remove_background(img: Image.Image) -> Image.Image:
    """rembgで背景を除去して透過PNGにする"""
    from rembg import remove
    return remove(img)


def auto_crop(img: Image.Image, padding: int = 4) -> Image.Image:
    """不透明ピクセルのバウンディングボックスでクロップし、正方形にする"""
    bbox = img.getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)

    w = right - left
    h = bottom - top
    if w > h:
        diff = w - h
        top = max(0, top - diff)
        h = w
        if top + h > img.height:
            top = img.height - h
    elif h > w:
        diff = h - w
        left = max(0, left - diff // 2)
        w = h
        if left + w > img.width:
            left = img.width - w

    cropped = img.crop((left, top, left + max(w, h), top + max(w, h)))
    return cropped


def pixelize_sprite(
    input_path: str,
    output_path: str,
    pixel_size: int = 64,
    colors: int = 24,
    remove_bg: bool = True,
) -> Image.Image:
    """スプライト用ピクセルアート化

    背景除去 → 自動クロップ → 縮小 → アルファ二値化 → 減色
    """
    img = Image.open(input_path).convert("RGBA")

    if remove_bg:
        img = remove_background(img)

    img = auto_crop(img, padding=8)

    small = img.resize((pixel_size, pixel_size), Image.LANCZOS)

    # アルファ二値化
    pixels = small.load()
    for y in range(pixel_size):
        for x in range(pixel_size):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (r, g, b, 255 if a > 128 else 0)

    # 減色
    alpha = small.split()[3]
    rgb = small.convert("RGB")
    quantized = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    rgb_result = quantized.convert("RGB")
    result = Image.merge("RGBA", (*rgb_result.split(), alpha))

    result.save(output_path)
    return result


def pixelize_portrait(
    input_path: str,
    output_path: str,
    final_size: int = 256,
    pixel_density: int = 64,
    colors: int = 32,
) -> Image.Image:
    """ポートレート用ピクセルアート化

    縮小 → 減色 → ニアレストネイバー拡大（ドット感）
    """
    img = Image.open(input_path).convert("RGBA")

    small = img.resize((pixel_density, pixel_density), Image.LANCZOS)

    rgb = small.convert("RGB")
    quantized = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    rgb_result = quantized.convert("RGB")
    result = Image.merge("RGBA", (*rgb_result.split(), small.split()[3]))

    result = result.resize((final_size, final_size), Image.NEAREST)

    result.save(output_path)
    return result


def resize_background(
    input_path: str,
    output_path: str,
    width: int = 960,
    height: int = 640,
) -> Image.Image:
    """背景画像のリサイズ"""
    img = Image.open(input_path).convert("RGBA")
    result = img.resize((width, height), Image.LANCZOS)
    result.save(output_path)
    return result


def create_spritesheet(
    frame_paths: list[str],
    output_path: str,
    layout: str = "horizontal",
) -> str:
    """個別フレームを1枚のスプライトシートに結合する"""
    frames = [Image.open(p).convert("RGBA") for p in frame_paths]
    if not frames:
        raise ValueError("No frames provided")

    fw, fh = frames[0].size

    if layout == "horizontal":
        sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            sheet.paste(f, (i * fw, 0))
    elif layout == "grid":
        cols = 2
        rows = (len(frames) + cols - 1) // cols
        sheet = Image.new("RGBA", (fw * cols, fh * rows), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            col = i % cols
            row = i // cols
            sheet.paste(f, (col * fw, row * fh))
    else:
        raise ValueError(f"Unknown layout: {layout}")

    sheet.save(output_path)
    return output_path
