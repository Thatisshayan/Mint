# ComfyUI Integration Notes

## Current Status

- ComfyUI is installed at `D:\AgentDevWork\Programs\comfyui\ComfyUI`
- Python venv created at `D:\AgentDevWork\Programs\comfyui\venv`
- PyTorch with CUDA 12.4 installed
- SD 1.5 model downloaded (~4GB)
- Backend configured to use ComfyUI on port 8188

## ComfyUI Provider API

Files:
- `backend/src/services/ai/comfyui.service.ts`
- `backend/src/services/studio.service.ts`

Behavior:
- Submits a simple default-image workflow to `{COMFYUI_BASE_URL}/prompt`.
- Waits for completion.
- Returns raw image bytes.

Notes:
- The workflow is currently conservative. It assumes standard node names (`3`, `4`, `5`, `6`, `7`, `8`, `9`).
- If the local install's node IDs differ, update the workflow map in `comfyui.service.ts`.

## Starting ComfyUI

```bash
# Activate the venv
D:\AgentDevWork\Programs\comfyui\venv\Scripts\activate

# Start ComfyUI
python D:\AgentDevWork\Programs\comfyui\ComfyUI\main.py --listen 0.0.0.0 --port 8188
```

Or directly:
```bash
D:\AgentDevWork\Programs\comfyui\venv\Scripts\python.exe D:\AgentDevWork\Programs\comfyui\ComfyUI\main.py --listen 0.0.0.0 --port 8188
```

## Backend Configuration

In `backend/.env`:
```env
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188
```

## API Endpoint

`POST /api/studio/generate-image`

Request body:
```json
{
  "prompt": "a beautiful sunset over mountains",
  "negative_prompt": "blurry, low quality",
  "width": 512,
  "height": 512,
  "steps": 20,
  "cfg_scale": 7.5
}
```

Response:
```json
{
  "imageUrl": "http://localhost:8188/view?filename=..."
}
```

## Requirements

- NVIDIA GPU with 6GB+ VRAM (RTX 2060 recommended)
- Python 3.11+
- PyTorch with CUDA 12.4
- SD 1.5 model (~4GB)

## Model Location

SD 1.5 model: `D:\AgentDevWork\Programs\comfyui\ComfyUI\models\checkpoints\v1-5-pruned-emaonly.safetensors`
