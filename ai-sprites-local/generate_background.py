"""
ローカルComfyUIでゲーム背景画像を生成するスクリプト

使い方:
  python generate_background.py \
    --name "forest_battle" \
    --description "a dark enchanted forest with mist" \
    --style "fantasy game background" \
    --output ../workspace/src/assets/backgrounds
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from comfyui_client import ComfyUIClient
from workflows import (
    AUTO_MODEL,
    build_background_workflow,
    build_background_workflow_sdxl,
    build_background_workflow_flux,
)
from postprocess import resize_background

MODEL_CHOICES = ("auto", "sd15", "sdxl", "flux", "flux-lite")


def generate_background(
    name: str,
    description: str,
    output_dir: str,
    style: str = "game background art",
    width: int = 960,
    height: int = 640,
    seed: int = 42,
    server: str = "http://127.0.0.1:8188",
    model: str = "auto",
) -> dict:
    """背景画像を生成する

    Returns:
        {"name": str, "raw": str, "background": str}
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
        f"wide landscape composition, no characters, no UI elements, no text, "
        f"clean and uncluttered, suitable as a game background layer"
    )

    if model == "auto":
        model = AUTO_MODEL
        print(f"[Background] Auto-detected model: {model}")

    print(f"[Background] Generating: {name} (model={model})...")
    if model == "sdxl":
        workflow = build_background_workflow_sdxl(prompt=prompt, seed=seed)
    elif model in ("flux", "flux-lite"):
        preset = "lite" if model == "flux-lite" else "full"
        workflow = build_background_workflow_flux(
            prompt=prompt, seed=seed, preset=preset,
        )
    else:
        workflow = build_background_workflow(
            prompt=prompt, seed=seed, width=768, height=512,
        )

    raw_path = raw_dir / f"{name}.png"
    paths = client.generate(workflow, output_path=raw_path)
    print(f"[Background] Raw: {paths[0]}")

    bg_path = out_dir / f"{name}.png"
    resize_background(str(paths[0]), str(bg_path), width=width, height=height)
    print(f"[Background] Done: {bg_path} ({width}x{height})")

    return {
        "name": name,
        "raw": str(paths[0]),
        "background": str(bg_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ローカルComfyUIで背景画像生成")
    parser.add_argument("--name", required=True, help="背景名")
    parser.add_argument("--description", default="", help="背景説明（英語）")
    parser.add_argument("--style", default="game background art", help="アートスタイル")
    parser.add_argument("--output", default="./output_backgrounds", help="出力ディレクトリ")
    parser.add_argument("--width", type=int, default=960, help="出力幅(px)")
    parser.add_argument("--height", type=int, default=640, help="出力高さ(px)")
    parser.add_argument("--seed", type=int, default=42, help="シード値")
    parser.add_argument(
        "--model", choices=MODEL_CHOICES, default="auto",
        help="使用モデル: auto(メモリ自動判定)/sd15/sdxl/flux/flux-lite(CUDA専用)",
    )
    parser.add_argument("--server", default="http://127.0.0.1:8188", help="ComfyUI URL")
    parser.add_argument("--batch", help="JSON定義ファイル（一括生成用）")

    args = parser.parse_args()

    if args.batch:
        with open(args.batch) as f:
            bgs = json.load(f)
        results = []
        for bg in bgs:
            r = generate_background(
                name=bg["name"],
                description=bg.get("description", ""),
                output_dir=args.output,
                style=bg.get("style", args.style),
                width=bg.get("width", args.width),
                height=bg.get("height", args.height),
                seed=bg.get("seed", args.seed),
                server=args.server,
                model=bg.get("model", args.model),
            )
            results.append(r)
        meta_path = Path(args.output) / "metadata.json"
        with open(meta_path, "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[Done] {len(results)} backgrounds generated. Metadata: {meta_path}")
    else:
        generate_background(
            name=args.name,
            description=args.description,
            output_dir=args.output,
            style=args.style,
            width=args.width,
            height=args.height,
            seed=args.seed,
            server=args.server,
            model=args.model,
        )


if __name__ == "__main__":
    main()
