"""
ローカルComfyUIでキャラクターポートレートを生成するスクリプト

使い方:
  python generate_portrait.py \
    --name "hero" \
    --description "a young warrior with spiky brown hair and determined eyes" \
    --output ../workspace/src/assets/portraits
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from comfyui_client import ComfyUIClient
from workflows import (
    AUTO_MODEL,
    build_portrait_workflow,
    build_portrait_workflow_sdxl,
    build_portrait_workflow_flux,
)
from postprocess import pixelize_portrait

MODEL_CHOICES = ("auto", "sd15", "sdxl", "flux", "flux-lite")


def generate_portrait(
    name: str,
    description: str,
    output_dir: str,
    style: str = "anime game art",
    size: int = 256,
    pixel_density: int = 64,
    seed: int = 42,
    colors: int = 32,
    pixelize: bool = True,
    server: str = "http://127.0.0.1:8188",
    model: str = "auto",
) -> dict:
    """ポートレート画像を生成する

    Returns:
        {"name": str, "raw": str, "portrait": str}
    """
    client = ComfyUIClient(server)
    if not client.is_running():
        print(f"ERROR: ComfyUI not running at {server}", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(output_dir)
    # raw画像はsrc/raw/portraits/に保存（assets/に入れるとビルドに含まれるため）
    project_root = Path(__file__).resolve().parent.parent
    raw_dir = project_root / "src" / "raw" / "portraits"
    raw_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    prompt = (
        f"{style}, {description}, "
        f"face close-up portrait, upper chest visible, "
        f"sharp clean lines, vivid colors, solid color background, "
        f"game dialogue portrait, detailed expressive face"
    )

    if model == "auto":
        model = AUTO_MODEL
        print(f"[Portrait] Auto-detected model: {model}")

    print(f"[Portrait] Generating: {name} (model={model})...")
    if model == "sdxl":
        workflow = build_portrait_workflow_sdxl(prompt=prompt, seed=seed)
    elif model in ("flux", "flux-lite"):
        preset = "lite" if model == "flux-lite" else "full"
        workflow = build_portrait_workflow_flux(prompt=prompt, seed=seed, preset=preset)
    else:
        workflow = build_portrait_workflow(prompt=prompt, seed=seed)

    raw_path = raw_dir / f"{name}.png"
    paths = client.generate(workflow, output_path=raw_path)
    print(f"[Portrait] Raw: {paths[0]}")

    portrait_path = out_dir / f"{name}.png"
    if pixelize:
        pixelize_portrait(
            str(paths[0]), str(portrait_path),
            final_size=size, pixel_density=pixel_density, colors=colors,
        )
    else:
        from PIL import Image
        img = Image.open(str(paths[0])).convert("RGBA")
        img.resize((size, size), Image.LANCZOS).save(str(portrait_path))

    print(f"[Portrait] Done: {portrait_path} ({size}x{size})")
    return {
        "name": name,
        "raw": str(paths[0]),
        "portrait": str(portrait_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ローカルComfyUIでポートレート生成")
    parser.add_argument("--name", required=True, help="キャラクター名")
    parser.add_argument("--description", default="", help="外見説明（英語）")
    parser.add_argument("--style", default="anime game art", help="アートスタイル")
    parser.add_argument("--output", default="./output_portraits", help="出力ディレクトリ")
    parser.add_argument("--size", type=int, default=256, help="出力サイズ(px)")
    parser.add_argument("--pixel-density", type=int, default=64, help="ドット密度")
    parser.add_argument("--seed", type=int, default=42, help="シード値")
    parser.add_argument("--colors", type=int, default=32, help="減色数")
    parser.add_argument("--no-pixelize", action="store_true", help="ピクセルアート化をスキップ")
    parser.add_argument(
        "--model", choices=MODEL_CHOICES, default="auto",
        help="使用モデル: auto(メモリ自動判定)/sd15/sdxl/flux/flux-lite(CUDA専用)",
    )
    parser.add_argument("--server", default="http://127.0.0.1:8188", help="ComfyUI URL")
    parser.add_argument("--batch", help="JSON定義ファイル（一括生成用）")

    args = parser.parse_args()

    if args.batch:
        with open(args.batch) as f:
            chars = json.load(f)
        results = []
        for c in chars:
            r = generate_portrait(
                name=c["name"],
                description=c.get("description", ""),
                output_dir=args.output,
                style=c.get("style", args.style),
                size=c.get("size", args.size),
                pixel_density=c.get("pixel_density", args.pixel_density),
                seed=c.get("seed", args.seed),
                colors=c.get("colors", args.colors),
                pixelize=not args.no_pixelize,
                server=args.server,
                model=c.get("model", args.model),
            )
            results.append(r)
        meta_path = Path(args.output) / "metadata.json"
        with open(meta_path, "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[Done] {len(results)} portraits generated. Metadata: {meta_path}")
    else:
        generate_portrait(
            name=args.name,
            description=args.description,
            output_dir=args.output,
            style=args.style,
            size=args.size,
            pixel_density=args.pixel_density,
            seed=args.seed,
            colors=args.colors,
            pixelize=not args.no_pixelize,
            server=args.server,
            model=args.model,
        )


if __name__ == "__main__":
    main()
