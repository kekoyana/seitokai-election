"""
画像後処理ユーティリティ

ComfyUIで生成したRaw画像をゲームアセット向けに変換する。
- 背景除去（rembg）
- 自動クロップ
- 縮小・減色（ピクセルアート化）
- スプライトシート作成
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image


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
