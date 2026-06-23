# Mint Content Bundle

Goal: open Mint and have the local generation stack ready.
Use zero-cost self-hosted tools only. No paid APIs.

## Bundle Components

1. Ollama - local LLM backend for scripts/captions/prompts
2. Fooocus - local image generation (SD-based, easier than ComfyUI)
3. AUTOMATIC1111 WebUI - optional image backend
4. InvokeAI - optional image backend
5. ComfyUI + AnimateDiff - video/shorts image-to-video path
6. Wan2.1 / CogVideoX - model-based video generation
7. Whisper - local transcription for audio assets

## Current Status

- Backend exposes `/api` routes for projects, research, studio, library, publish.
- Studio can call Ollama via `generateWithOllama`.
- `COMFYUI_BASE_URL` support exists but is not required for basic text generation.

## Next Steps

1. Add backend auth required helper so frontend redirects to login.
2. Add `/api/studio/image` route that prefers Fooocus/A1111/InvokeAI when configured.
3. Add `/api/studio/video` route for AnimateDiff/Wan2.1/CogVideoX when available.
4. Add `/api/studio/transcribe` route using Whisper CLI/API.
5. Add Settings page to configure local service URLs and active provider.

## Zero-Cost Design Rule

All generation endpoints must work with local services.
If a local service is not installed, return a clear error instead of falling back to external APIs.
