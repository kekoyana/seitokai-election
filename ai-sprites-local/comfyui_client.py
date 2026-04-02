"""
ComfyUI API クライアント

ComfyUI REST APIを介して画像生成を行う共通ユーティリティ。
ComfyUIがhttp://127.0.0.1:8188で起動している前提。
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_URL = "http://127.0.0.1:8188"


class ComfyUIClient:
    """ComfyUI REST APIクライアント"""

    def __init__(self, base_url: str = DEFAULT_URL):
        self.base_url = base_url

    def is_running(self) -> bool:
        """ComfyUIが起動しているか確認する"""
        try:
            urllib.request.urlopen(f"{self.base_url}/system_stats", timeout=5)
            return True
        except (urllib.error.URLError, TimeoutError):
            return False

    def queue_prompt(self, workflow: dict) -> str:
        """ワークフローをキューに追加し、prompt_idを返す"""
        data = json.dumps({"prompt": workflow}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/prompt",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())["prompt_id"]

    def wait_for_completion(self, prompt_id: str, timeout: int = 300) -> dict:
        """生成完了を待ち、結果を返す"""
        start = time.time()
        while time.time() - start < timeout:
            try:
                resp = urllib.request.urlopen(
                    f"{self.base_url}/history/{prompt_id}"
                )
                history = json.loads(resp.read())
                if prompt_id in history:
                    status = history[prompt_id].get("status", {})
                    if status.get("status_str") == "error":
                        msgs = status.get("messages", [])
                        raise RuntimeError(f"ComfyUI error: {msgs}")
                    return history[prompt_id]
            except urllib.error.URLError:
                pass
            time.sleep(1)
        raise TimeoutError(f"Timed out after {timeout}s")

    def download_image(
        self, filename: str, subfolder: str, output_path: Path
    ) -> Path:
        """生成画像をダウンロードして保存する"""
        params = urllib.parse.urlencode(
            {"filename": filename, "subfolder": subfolder, "type": "output"}
        )
        resp = urllib.request.urlopen(f"{self.base_url}/view?{params}")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(resp.read())
        return output_path

    def generate(
        self,
        workflow: dict,
        output_node_id: str = "9",
        output_path: Path | None = None,
        timeout: int = 300,
    ) -> list[Path]:
        """ワークフローを実行して生成画像をダウンロードする

        Args:
            workflow: ComfyUIワークフロー（APIフォーマット）
            output_node_id: SaveImageノードのID
            output_path: 出力先パス（ファイル名。複数画像の場合は連番付与）
            timeout: タイムアウト秒数

        Returns:
            ダウンロードした画像パスのリスト
        """
        prompt_id = self.queue_prompt(workflow)
        result = self.wait_for_completion(prompt_id, timeout)

        images = result["outputs"][output_node_id]["images"]
        paths: list[Path] = []

        for i, img_info in enumerate(images):
            if output_path:
                if len(images) > 1:
                    stem = output_path.stem
                    suffix = output_path.suffix
                    dest = output_path.parent / f"{stem}_{i:02d}{suffix}"
                else:
                    dest = output_path
            else:
                dest = Path(f"output_{i:02d}.png")

            self.download_image(
                img_info["filename"], img_info.get("subfolder", ""), dest
            )
            paths.append(dest)

        return paths
