# MINT Local AI Bundle

Goal: Open MINT and have the local generation stack ready.
Use zero-cost self-hosted tools only. No paid APIs required.

## Bundle Components

1. **Ollama** — Local LLM backend for scripts/captions/prompts
   - Installed: v0.30.11
   - Models: llama3.2 (2GB), gemma4 (9.6GB), llama3.2:3b (2GB)
   - Port: 11434

2. **ComfyUI** — Local image generation (Stable Diffusion)
   - Installed at: `D:\AgentDevWork\Programs\comfyui\`
   - Model: SD 1.5 (~4GB VRAM)
   - Port: 8188

3. **Piper TTS** — Local text-to-speech
   - Installed at: `D:\AgentDevWork\Programs\piper-tts\`
   - Voice: en_US-amy-medium (~50MB)
   - Offline, no internet required

4. **Money Printer Turbo** — Video generation (optional)
   - Install at: `D:\AgentDevWork\Programs\money-printer-turbo\`
   - Port: 8501
   - Requires separate setup

## Current Status

- Backend exposes `/api` routes for projects, research, studio, library, publish.
- Studio can call Ollama via AI provider chain.
- ComfyUI integration wired for image generation.
- Piper TTS integration wired for voiceover.
- `start-mint.bat` launches all services.

## Configuration

Edit `backend/.env`:

```env
# LLM: Use Ollama locally (no API key needed)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Image generation: Use ComfyUI
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188

# TTS: Use Piper
TTS_PROVIDER=piper
PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe
PIPER_VOICE_DIR=D:\AgentDevWork\Programs\piper-tts\voices

# Research: Add Brave Search API key for web research
RESEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=
```

## Zero-Cost Design Rule

All generation endpoints work with local services.
If a local service is not installed, return a clear error instead of falling back to external APIs.

## Service Ports

| Service | Port | Status |
|---------|------|--------|
| Ollama | 11434 | ✅ Running |
| ComfyUI | 8188 | ✅ Running |
| Piper TTS | — | ✅ Installed |
| Money Printer Turbo | 8501 | ⏳ Optional |
| Backend | 4000 | ✅ Running |
| Frontend | 5173 | ✅ Running |
