"""
24名の新キャラクターポートレートを一括生成するスクリプト
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# ai-sprites-local ディレクトリをパスに追加
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from comfyui_client import ComfyUIClient
from workflows import build_sdxl_workflow
from PIL import Image

BATCH_JSON = script_dir / "batch_new_portraits.json"
PORTRAITS_DIR = script_dir.parent / "portraits"
RAW_DIR = PORTRAITS_DIR / "raw"
CHECKPOINT = "illustrious-xl-v0.1.safetensors"
NEGATIVE = (
    "text, title, logo, banner, watermark, signature, username, artist name, "
    "realistic photo, blurry, deformed face, extra fingers, bad anatomy, "
    "full body, landscape, multiple characters, multiple views, split screen, "
    "lowres, jpeg artifacts, cropped"
)


def main() -> None:
    # 出力ディレクトリ作成
    PORTRAITS_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # バッチJSONを読み込む
    with open(BATCH_JSON, encoding="utf-8") as f:
        characters = json.load(f)

    print(f"合計 {len(characters)} 名のポートレートを生成します")

    client = ComfyUIClient("http://127.0.0.1:8188")
    if not client.is_running():
        print("ERROR: ComfyUIが起動していません")
        sys.exit(1)

    success_count = 0
    fail_list: list[str] = []

    for idx, char in enumerate(characters, start=1):
        name = char["name"]
        seed = char["seed"]
        prompt = char["prompt"]

        out_256 = PORTRAITS_DIR / f"{name}.png"
        out_raw = RAW_DIR / f"{name}.png"

        # すでに存在する場合はスキップ
        if out_256.exists():
            print(f"[{idx:02d}/{len(characters)}] SKIP {name} (already exists)")
            success_count += 1
            continue

        print(f"[{idx:02d}/{len(characters)}] Generating: {name} (seed={seed})")

        attempts = 0
        generated = False
        current_seed = seed

        while attempts < 3 and not generated:
            try:
                workflow = build_sdxl_workflow(
                    prompt=prompt,
                    negative=NEGATIVE,
                    seed=current_seed,
                    steps=28,
                    cfg=8.0,
                    width=1024,
                    height=1024,
                    checkpoint=CHECKPOINT,
                )
                paths = client.generate(workflow, output_path=out_raw, timeout=600)

                if not paths:
                    raise RuntimeError("生成結果が空でした")

                # raw画像を256x256にリサイズして保存
                img = Image.open(str(paths[0])).convert("RGBA").resize(
                    (256, 256), Image.LANCZOS
                )
                img.save(str(out_256))

                print(f"  -> 保存完了: {out_256.name} (raw: {out_raw.name})")
                generated = True
                success_count += 1

            except Exception as e:
                attempts += 1
                print(f"  -> 試行 {attempts}/3 失敗: {e}")
                if attempts < 3:
                    current_seed += 1000
                    print(f"  -> seed を {current_seed} に変更して再試行")

        if not generated:
            print(f"  -> {name} の生成に失敗しました（3回試行）")
            fail_list.append(name)

    print(f"\n生成完了: {success_count}/{len(characters)} 名成功")
    if fail_list:
        print(f"失敗したキャラクター: {', '.join(fail_list)}")


if __name__ == "__main__":
    main()
