"""
ComfyUIワークフロー定義

各種画像生成のためのComfyUIワークフロー（APIフォーマット）を構築する。
"""
from __future__ import annotations

import os
import platform


def detect_best_model() -> str:
    """システムメモリに基づいて最適なモデルを自動選択する

    Returns:
        "flux": 48GB以上（FLUX.2 Klein 4B fp16）
        "sdxl": 16GB以上（SDXL）
        "sd15": 16GB未満（SD 1.5）
    """
    total_bytes = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    total_gb = total_bytes / (1024 ** 3)

    if total_gb >= 40:
        return "flux"
    if total_gb >= 14:
        return "sdxl"
    return "sd15"


def detect_best_sprite_model() -> str:
    """スプライト生成に最適なモデルを自動選択する

    スプライトはSDXL+LoRAが最も高品質なため、
    メモリが十分あってもSDXLを推奨する。
    """
    total_bytes = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    total_gb = total_bytes / (1024 ** 3)

    if total_gb >= 14:
        return "sdxl"
    return "sd15"


AUTO_MODEL = detect_best_model()
AUTO_SPRITE_MODEL = detect_best_sprite_model()

# 利用可能なモデル
CHECKPOINTS = {
    "sd15": "v1-5-pruned-emaonly.safetensors",
    "sdxl": "sd_xl_base_1.0.safetensors",
}

DIFFUSION_MODELS = {
    "flux_klein_4b": "flux-2-klein-4b.safetensors",
    "flux_klein_4b_fp8": "flux-2-klein-4b-fp8.safetensors",
}

CLIP_MODELS = {
    "clip_l": "clip_l.safetensors",
    "t5xxl": "t5xxl_fp16.safetensors",
    "qwen3_4b": "qwen_3_4b.safetensors",
    "qwen3_4b_fp4": "qwen_3_4b_fp4_flux2.safetensors",
}

# FLUX量子化プリセット
# - full: fp16（48GB環境向け、Mac/CUDA両対応）
# - lite: fp8/fp4（CUDA専用、16GB VRAM向け。MPS非対応）
FLUX_PRESETS = {
    "full": {
        "diffusion_model": "flux-2-klein-4b.safetensors",
        "text_encoder": "qwen_3_4b.safetensors",
    },
    "lite": {
        "diffusion_model": "flux-2-klein-4b-fp8.safetensors",
        "text_encoder": "qwen_3_4b_fp4_flux2.safetensors",
    },
}

VAE_MODELS = {
    "flux_ae": "flux2-vae.safetensors",
}

LORAS = {
    "pixelart": "PixelArtRedmond-Lite64.safetensors",
    "pixelart_xl": "pixel-art-xl.safetensors",
}


def build_sd15_workflow(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 25,
    cfg: float = 7.0,
    width: int = 512,
    height: int = 512,
    checkpoint: str = CHECKPOINTS["sd15"],
    loras: list[dict] | None = None,
) -> dict:
    """SD 1.5ベースのワークフローを構築する

    Args:
        prompt: ポジティブプロンプト
        negative: ネガティブプロンプト
        seed: シード値
        steps: サンプリングステップ数
        cfg: CFGスケール
        width: 生成画像の幅
        height: 生成画像の高さ
        checkpoint: チェックポイントファイル名
        loras: LoRA設定のリスト [{"name": "...", "strength_model": 0.5, "strength_clip": 0.5}]

    Returns:
        ComfyUI APIフォーマットのワークフロー辞書
    """
    workflow: dict = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": checkpoint},
        },
    }

    # LoRAチェーン
    model_source = ["4", 0]
    clip_source = ["4", 1]

    if loras:
        for i, lora in enumerate(loras):
            node_id = str(10 + i)
            workflow[node_id] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "lora_name": lora["name"],
                    "strength_model": lora.get("strength_model", 1.0),
                    "strength_clip": lora.get("strength_clip", 1.0),
                    "model": model_source,
                    "clip": clip_source,
                },
            }
            model_source = [node_id, 0]
            clip_source = [node_id, 1]

    workflow.update({
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": clip_source},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative, "clip": clip_source},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler_ancestral",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": model_source,
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "comfy_gen", "images": ["8", 0]},
        },
    })

    return workflow


def build_sdxl_workflow(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 25,
    cfg: float = 7.0,
    width: int = 1024,
    height: int = 1024,
    checkpoint: str = CHECKPOINTS["sdxl"],
    loras: list[dict] | None = None,
) -> dict:
    """SDXL ベースのワークフローを構築する

    SD1.5と同じノード構成だが、デフォルト解像度が1024x1024。
    """
    workflow: dict = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": checkpoint},
        },
    }

    model_source = ["4", 0]
    clip_source = ["4", 1]

    if loras:
        for i, lora in enumerate(loras):
            node_id = str(10 + i)
            workflow[node_id] = {
                "class_type": "LoraLoader",
                "inputs": {
                    "lora_name": lora["name"],
                    "strength_model": lora.get("strength_model", 1.0),
                    "strength_clip": lora.get("strength_clip", 1.0),
                    "model": model_source,
                    "clip": clip_source,
                },
            }
            model_source = [node_id, 0]
            clip_source = [node_id, 1]

    workflow.update({
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": clip_source},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative, "clip": clip_source},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler_ancestral",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": model_source,
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "comfy_gen", "images": ["8", 0]},
        },
    })

    return workflow


def build_flux_workflow(
    prompt: str,
    seed: int = 42,
    steps: int = 4,
    guidance: float = 1.0,
    width: int = 1024,
    height: int = 1024,
    diffusion_model: str | None = None,
    text_encoder: str | None = None,
    vae: str = VAE_MODELS["flux_ae"],
    preset: str = "full",
) -> dict:
    """FLUX.2 Klein 4B ワークフローを構築する

    FLUX.2はQwen3テキストエンコーダーを使用。CFGGuider + Flux2Scheduler の構成。
    distilled版は4ステップ/guidance=1.0、base版は20ステップ/guidance=5.0。

    Args:
        preset: "full"（fp16、48GB推奨）または "lite"（fp8/fp4、16GB対応）
    """
    flux_preset = FLUX_PRESETS.get(preset, FLUX_PRESETS["full"])
    if diffusion_model is None:
        diffusion_model = flux_preset["diffusion_model"]
    if text_encoder is None:
        text_encoder = flux_preset["text_encoder"]
    workflow: dict = {
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": diffusion_model,
                "weight_dtype": "default",
            },
        },
        "2": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": text_encoder,
                "type": "flux2",
            },
        },
        "3": {
            "class_type": "VAELoader",
            "inputs": {"vae_name": vae},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": ["2", 0]},
        },
        "5": {
            "class_type": "EmptyFlux2LatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "10": {
            "class_type": "CFGGuider",
            "inputs": {
                "model": ["1", 0],
                "positive": ["6", 0],
                "negative": ["6", 0],
                "cfg": guidance,
            },
        },
        "11": {
            "class_type": "KSamplerSelect",
            "inputs": {"sampler_name": "euler"},
        },
        "12": {
            "class_type": "Flux2Scheduler",
            "inputs": {
                "steps": steps,
                "width": width,
                "height": height,
                "denoise": 1.0,
            },
        },
        "13": {
            "class_type": "RandomNoise",
            "inputs": {"noise_seed": seed},
        },
        "4": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {
                "noise": ["13", 0],
                "guider": ["10", 0],
                "sampler": ["11", 0],
                "sigmas": ["12", 0],
                "latent_image": ["5", 0],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["4", 0], "vae": ["3", 0]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "comfy_gen", "images": ["8", 0]},
        },
    }

    return workflow


def build_sprite_workflow(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 25,
    cfg: float = 7.0,
    pixelart_lora_strength: float = 0.7,
) -> dict:
    """ゲームスプライト生成用ワークフロー

    SD 1.5 + PixelArt LoRAでピクセルアート風スプライトを生成する。
    """
    default_negative = (
        "text, watermark, multiple characters, realistic, photo, blurry, "
        "complex background, landscape, partial body, cropped, 3d render"
    )
    neg = negative or default_negative

    return build_sd15_workflow(
        prompt=prompt,
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=512,
        height=512,
        loras=[
            {
                "name": LORAS["pixelart"],
                "strength_model": pixelart_lora_strength,
                "strength_clip": pixelart_lora_strength,
            },
        ],
    )


def build_background_workflow(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 30,
    cfg: float = 7.5,
    width: int = 768,
    height: int = 512,
) -> dict:
    """背景画像生成用ワークフロー

    SD 1.5でゲーム背景を生成する。LoRAなし（自然なスタイル）。
    """
    default_negative = (
        "text, watermark, UI elements, characters, people, "
        "blurry, low quality, jpeg artifacts"
    )
    neg = negative or default_negative

    return build_sd15_workflow(
        prompt=prompt,
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=width,
        height=height,
    )


def build_portrait_workflow(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 30,
    cfg: float = 7.5,
) -> dict:
    """ポートレート生成用ワークフロー

    SD 1.5でキャラクターポートレートを生成する。
    """
    default_negative = (
        "text, watermark, realistic photo, blurry, deformed face, "
        "extra fingers, bad anatomy, full body, landscape, "
        "multiple characters, western cartoon"
    )
    neg = negative or default_negative

    return build_sd15_workflow(
        prompt=prompt,
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=512,
        height=512,
    )


# --- SDXL版ワークフロー ---


def build_sprite_workflow_sdxl(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 25,
    cfg: float = 7.0,
    pixelart_lora_strength: float = 0.8,
) -> dict:
    """ゲームスプライト生成用ワークフロー（SDXL版）

    SDXL + Pixel Art XL LoRAでピクセルアート風スプライトを生成する。
    """
    default_negative = (
        "text, watermark, multiple characters, realistic, photo, blurry, "
        "complex background, landscape, partial body, cropped, 3d render"
    )
    neg = negative or default_negative

    return build_sdxl_workflow(
        prompt=f"pixel art, {prompt}",
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=1024,
        height=1024,
        loras=[
            {
                "name": LORAS["pixelart_xl"],
                "strength_model": pixelart_lora_strength,
                "strength_clip": pixelart_lora_strength,
            },
        ],
    )


def build_background_workflow_sdxl(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 30,
    cfg: float = 7.0,
    width: int = 1024,
    height: int = 768,
) -> dict:
    """背景画像生成用ワークフロー（SDXL版）"""
    default_negative = (
        "text, watermark, UI elements, characters, people, "
        "blurry, low quality, jpeg artifacts"
    )
    neg = negative or default_negative

    return build_sdxl_workflow(
        prompt=prompt,
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=width,
        height=height,
    )


def build_portrait_workflow_sdxl(
    prompt: str,
    negative: str = "",
    seed: int = 42,
    steps: int = 30,
    cfg: float = 7.0,
) -> dict:
    """ポートレート生成用ワークフロー（SDXL版）"""
    default_negative = (
        "text, watermark, realistic photo, blurry, deformed face, "
        "extra fingers, bad anatomy, full body, landscape, "
        "multiple characters, western cartoon"
    )
    neg = negative or default_negative

    return build_sdxl_workflow(
        prompt=prompt,
        negative=neg,
        seed=seed,
        steps=steps,
        cfg=cfg,
        width=1024,
        height=1024,
    )


# --- FLUX版ワークフロー ---


def build_sprite_workflow_flux(
    prompt: str,
    seed: int = 42,
    steps: int = 4,
    preset: str = "full",
) -> dict:
    """ゲームスプライト生成用ワークフロー（FLUX版）

    FLUX.2 Klein 4Bで生成。少ステップ・CFG不要で高速。
    preset="lite" で16GB環境対応（fp8/fp4量子化モデル使用）。
    """
    return build_flux_workflow(
        prompt=f"pixel art game sprite, {prompt}, solid white background, "
               "single character, full body, game asset, clean lines",
        seed=seed,
        steps=steps,
        width=1024,
        height=1024,
        preset=preset,
    )


def build_background_workflow_flux(
    prompt: str,
    seed: int = 42,
    steps: int = 4,
    width: int = 1024,
    height: int = 768,
    preset: str = "full",
) -> dict:
    """背景画像生成用ワークフロー（FLUX版）"""
    return build_flux_workflow(
        prompt=f"game background, {prompt}, no characters, no UI, "
               "wide landscape composition",
        seed=seed,
        steps=steps,
        width=width,
        height=height,
        preset=preset,
    )


def build_portrait_workflow_flux(
    prompt: str,
    seed: int = 42,
    steps: int = 4,
    preset: str = "full",
) -> dict:
    """ポートレート生成用ワークフロー（FLUX版）"""
    return build_flux_workflow(
        prompt=f"character portrait, face close-up, {prompt}, "
               "upper chest visible, detailed face",
        seed=seed,
        steps=steps,
        width=1024,
        height=1024,
        preset=preset,
    )
