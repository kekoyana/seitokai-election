# ポートレート生成設定

## モデル
- チェックポイント: `Illustrious-XL-v2.0.safetensors`
- 生成解像度: 1024x1024
- 出力サイズ: バストショット 384x384 + 顔切り抜き 256x256
- Steps: 28
- CFG: 8.0
- Sampler: euler_ancestral
- Scheduler: normal

## アーティストタグ

### 男子
```
(kizoku:1.0), (anmi:0.5), (kishida_mel:0.5)
```

### 女子
```
(miyase_mahiro:0.8), (kizoku:1.0), (anmi:1.0), (kishida_mel:0.5)
```

## プロンプト構造

### 男子テンプレート
```
1boy, (kizoku:1.0), (anmi:0.5), (kishida_mel:0.5),
{目の色と特徴}, 8k, RAW photo, realistic,
Japanese high school student, {髪型・髪色},
(dark navy blue school blazer:1.3), white dress shirt, red striped necktie,
upper body portrait, portrait from chest up, head and shoulders visible, looking at viewer, {表情},
simple grey background, masterpiece, best quality
```

### 女子テンプレート
```
1girl, (miyase_mahiro:0.8), (kizoku:1.0), (anmi:1.0), (kishida_mel:0.5),
{目の色と特徴}, 8k, RAW photo, realistic,
Japanese high school student, {髪型・髪色},
(dark navy blue school blazer:1.3), white dress shirt, red ribbon bow at collar,
upper body portrait, portrait from chest up, head and shoulders visible, looking at viewer, {表情},
simple grey background, masterpiece, best quality
```

## ネガティブプロンプト（男女共通）
```
text, title, logo, banner, watermark, signature, username, artist name,
blurry, deformed face, extra fingers, bad anatomy,
full body, landscape, multiple characters, multiple views, split screen,
lowres, jpeg artifacts, cropped, hat, beret, headwear
```

## 制服デザイン（統一）
- ブレザー: ダークネイビーブルー
- シャツ: 白
- 男子ネクタイ: 赤ストライプ
- 女子リボン: 赤リボン（襟元）

## 構図に関する知見

### 画角が切れる問題の対策
- `face close-up` だけだとカメラが寄りすぎて胸下が切れることがある
- 女子テンプレートでは `portrait from chest up, head and shoulders visible` を併用して安定化
- ネガティブに `cropped` を追加
- ブレザーが描画されない場合は `(dark navy blue school blazer:1.3)` とウェイト強調

### 2人構図になる問題
- 「元気な笑顔」「日焼け肌」など強い属性が複数あると2人並びで出力されることがある
- ネガティブに `multiple characters, multiple views, split screen` を入れて対策
- seed変更でも回避可能

### アーティストタグに関する知見
- Illustrious-XLではアーティストタグが非常に強く効く
- ウェイト0.0でもトークンがプロンプトに存在するだけで画風に影響する
- ウェイト0.1〜0.3の低帯域では差が小さく微調整は困難
- ウェイト1.0で明確に画風が変わる
- タグの有無は「入れるか入れないか」+「1.0か0.5か」程度の粗い制御が現実的

## 生成コマンド例

```bash
cd ai-sprites-local

./venv/bin/python -c "
from comfyui_client import ComfyUIClient
from workflows import build_sdxl_workflow
from PIL import Image
from pathlib import Path

client = ComfyUIClient('http://127.0.0.1:8188')
negative = 'text, title, logo, banner, watermark, signature, username, artist name, blurry, deformed face, extra fingers, bad anatomy, full body, landscape, multiple characters, multiple views, split screen, lowres, jpeg artifacts, cropped, hat, beret, headwear'

prompt = '1boy, (kizoku:1.0), (anmi:0.5), (kishida_mel:0.5), big expressive brown eyes, 8k, RAW photo, realistic, Japanese high school student, short messy black hair, (dark navy blue school blazer:1.3), white dress shirt, red striped necktie, upper body portrait, portrait from chest up, head and shoulders visible, looking at viewer, gentle smile, blush, simple grey background, masterpiece, best quality'

workflow = build_sdxl_workflow(
    prompt=prompt, negative=negative, seed=77, steps=28, cfg=8.0,
    width=1024, height=1024, checkpoint='Illustrious-XL-v2.0.safetensors',
)
paths = client.generate(workflow, output_path=Path('output.png'))
img = Image.open(str(paths[0])).convert('RGBA').resize((256, 256), Image.LANCZOS)
img.save('output_256.png')
"
```

## モデル比較検証の結果

| モデル | 解像度 | アニメ品質 | 制服色の安定性 | 問題 |
|--------|--------|----------|-------------|------|
| SD 1.5 ベース | 512x512 | ○ | △（紺が出にくい） | アーティストタグが効かない |
| SDXL ベース | 1024x1024 | ○ | △（紺が出にくい） | アーティストタグが効かない |
| FLUX.2 Klein 4B | 1024x1024 | ◎ | ○ | テキスト混入問題 |
| Illustrious-XL v0.1 | 1024x1024 | ◎ | ◎ | v2.0に移行 |
| **Illustrious-XL v2.0** | **1024x1024** | **◎** | **◎** | **採用** |
