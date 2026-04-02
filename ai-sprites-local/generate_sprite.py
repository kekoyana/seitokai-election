"""
ローカルComfyUIでゲームスプライトを生成するスクリプト

使い方:
  python generate_sprite.py \
    --name "knight" \
    --description "a medieval knight in silver armor with blue cape" \
    --style "pixel art game sprite" \
    --output ../workspace/src/assets/sprites \
    --size 64
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from comfyui_client import ComfyUIClient
from workflows import (
    AUTO_SPRITE_MODEL,
    build_sprite_workflow,
    build_sprite_workflow_sdxl,
    build_sprite_workflow_flux,
)
from postprocess import pixelize_sprite

MODEL_CHOICES = ("auto", "sd15", "sdxl", "flux", "flux-lite")


def generate_sprite(
    name: str,
    description: str,
    output_dir: str,
    style: str = "pixel art game sprite",
    size: int = 64,
    seed: int = 42,
    colors: int = 24,
    remove_bg: bool = True,
    server: str = "http://127.0.0.1:8188",
    model: str = "auto",
) -> dict:
    """スプライト画像を生成する

    Returns:
        {"name": str, "raw": str, "sprite": str}
    """
    client = ComfyUIClient(server)
    if not client.is_running():
        print(f"ERROR: ComfyUI not running at {server}", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(output_dir)
    raw_dir = out_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    prompt = (
        f"{style}, {description}, "
        f"single character, full body, facing forward, standing pose, "
        f"solid white background, crisp pixel art, game asset"
    )
    if model == "auto":
        model = AUTO_SPRITE_MODEL
        print(f"[Sprite] Auto-detected model: {model}")

    if model == "sd15":
        prompt += ", PixelArtRedmond"

    print(f"[Sprite] Generating: {name} (model={model})...")
    if model == "sdxl":
        workflow = build_sprite_workflow_sdxl(prompt=prompt, seed=seed)
    elif model in ("flux", "flux-lite"):
        preset = "lite" if model == "flux-lite" else "full"
        workflow = build_sprite_workflow_flux(prompt=prompt, seed=seed, preset=preset)
    else:
        workflow = build_sprite_workflow(prompt=prompt, seed=seed)

    raw_path = raw_dir / f"{name}.png"
    paths = client.generate(workflow, output_path=raw_path)
    print(f"[Sprite] Raw: {paths[0]}")

    sprite_path = out_dir / f"{name}.png"
    pixelize_sprite(
        str(paths[0]), str(sprite_path),
        pixel_size=size, colors=colors, remove_bg=remove_bg,
    )
    print(f"[Sprite] Done: {sprite_path} ({size}x{size})")

    return {
        "name": name,
        "raw": str(paths[0]),
        "sprite": str(sprite_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ローカルComfyUIでスプライト生成")
    parser.add_argument("--name", required=False, default=None, help="スプライト名（--batch使用時は不要）")
    parser.add_argument("--description", default="", help="外見説明（英語）")
    parser.add_argument("--style", default="pixel art game sprite", help="アートスタイル")
    parser.add_argument("--output", default="./output_sprites", help="出力ディレクトリ")
    parser.add_argument("--size", type=int, default=64, help="出力サイズ(px)")
    parser.add_argument("--seed", type=int, default=42, help="シード値")
    parser.add_argument("--colors", type=int, default=24, help="減色数")
    parser.add_argument("--no-rembg", action="store_true", help="背景除去をスキップ")
    parser.add_argument(
        "--model", choices=MODEL_CHOICES, default="auto",
        help="使用モデル: auto(メモリ自動判定)/sd15/sdxl/flux/flux-lite(CUDA専用)",
    )
    parser.add_argument("--server", default="http://127.0.0.1:8188", help="ComfyUI URL")
    parser.add_argument(
        "--batch", help="JSON定義ファイル（一括生成用）"
    )

    args = parser.parse_args()

    if args.batch:
        with open(args.batch) as f:
            sprites = json.load(f)
        results = []
        for s in sprites:
            r = generate_sprite(
                name=s["name"],
                description=s.get("description", ""),
                output_dir=args.output,
                style=s.get("style", args.style),
                size=s.get("size", args.size),
                seed=s.get("seed", args.seed),
                colors=s.get("colors", args.colors),
                remove_bg=not args.no_rembg,
                server=args.server,
                model=s.get("model", args.model),
            )
            results.append(r)
        meta_path = Path(args.output) / "metadata.json"
        with open(meta_path, "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[Done] {len(results)} sprites generated. Metadata: {meta_path}")
    else:
        generate_sprite(
            name=args.name,
            description=args.description,
            output_dir=args.output,
            style=args.style,
            size=args.size,
            seed=args.seed,
            colors=args.colors,
            remove_bg=not args.no_rembg,
            server=args.server,
            model=args.model,
        )


if __name__ == "__main__":
    main()
