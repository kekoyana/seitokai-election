#!/bin/bash
# ai-sprites-local セットアップスクリプト
#
# 使い方:
#   ./setup.sh /path/to/ComfyUI
#
# やること:
#   1. Python venv を作成し依存パッケージをインストール
#   2. .env に ComfyUI パスを保存（起動スクリプト用）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <ComfyUI_PATH>"
  echo ""
  echo "Example:"
  echo "  $0 ~/tools/ComfyUI"
  exit 1
fi

# ComfyUI の存在確認
if [ ! -d "$1" ] || [ ! -f "$1/main.py" ]; then
  echo "ERROR: ComfyUI not found at $1 (main.py missing)"
  exit 1
fi

COMFYUI_PATH="$(cd "$1" && pwd)"

echo "[1/3] Creating Python venv..."
python3 -m venv "$SCRIPT_DIR/venv"

echo "[2/3] Installing dependencies..."
"$SCRIPT_DIR/venv/bin/pip" install --quiet --upgrade pip
"$SCRIPT_DIR/venv/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"

echo "[3/3] Saving config to .env..."
cat > "$SCRIPT_DIR/.env" << EOF
COMFYUI_PATH=$COMFYUI_PATH
COMFYUI_VENV=$COMFYUI_PATH/venv/bin/python
COMFYUI_URL=http://127.0.0.1:8188
EOF

echo ""
echo "Setup complete!"
echo ""
echo "ComfyUI path: $COMFYUI_PATH"
echo "Python venv:  $SCRIPT_DIR/venv"
echo ""
echo "To start ComfyUI:"
echo "  $COMFYUI_PATH/venv/bin/python $COMFYUI_PATH/main.py --listen 127.0.0.1 --port 8188"
echo ""
echo "To generate images:"
echo "  $SCRIPT_DIR/venv/bin/python generate_portrait.py --name hero --description '...' --output ../workspace/src/assets/portraits"
