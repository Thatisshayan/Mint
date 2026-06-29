# AI Provider Configuration

MINT supports multiple AI providers with automatic fallback. Local services are prioritized — no cloud API keys required for basic usage.

## Provider Chain

```
Ollama (primary, local, free) → DeepSeek (if configured) → OpenAI (if configured)
```

The system tries providers in order. If one fails, it falls back to the next.

## Ollama (Primary — Free, Local)

**Cost:** Free (runs locally)

### Setup

1. Install Ollama: https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama3.2        # 2GB, fits 6GB VRAM
   ollama pull llama3.2:3b     # Smaller, faster
   ollama pull gemma4          # Larger, more capable
   ```
3. Add to `backend/.env`:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   ```

### Recommended Models

| Model | Size | VRAM | Speed | Quality |
|-------|------|------|-------|---------|
| `llama3.2` | 2GB | 2GB | Fast | Good |
| `llama3.2:3b` | 2GB | 2GB | Faster | OK |
| `gemma4` | 9.6GB | 6GB+ | Slow | Best |

### Already Installed

- Ollama v0.30.11
- Models: `llama3.2`, `gemma4`, `llama3.2:3b`

## DeepSeek (Optional, Cloud)

**Cost:** ~$0.001/1K tokens (cheapest cloud option)

### Setup

1. Create account at https://platform.deepseek.com
2. Generate API key
3. Add to `backend/.env`:
   ```env
   DEEPSEEK_API_KEY=your-api-key
   ```

### Models

- `deepseek-chat` (default) — General purpose
- `deepseek-coder` — Code-focused

## OpenAI (Optional, Cloud)

**Cost:** ~$0.00015/1K tokens (GPT-4o-mini)

### Setup

1. Create account at https://platform.openai.com
2. Generate API key
3. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=your-api-key
   ```

### Models

- `gpt-4o-mini` (default) — Fast and cheap
- `gpt-4o` — Most capable

## Image Generation (ComfyUI)

**Cost:** Free (runs locally with GPU)

### Setup

1. ComfyUI is installed at `D:\AgentDevWork\Programs\comfyui\`
2. SD 1.5 model is downloaded (~4GB)
3. Add to `backend/.env`:
   ```env
   IMAGE_PROVIDER=stable-diffusion
   COMFYUI_BASE_URL=http://localhost:8188
   ```

### Requirements

- NVIDIA GPU with 6GB+ VRAM
- PyTorch with CUDA 12.4
- SD 1.5 model (~4GB)

## Text-to-Speech (Piper TTS)

**Cost:** Free (runs locally, offline)

### Setup

1. Piper TTS is installed at `D:\AgentDevWork\Programs\piper-tts\`
2. Voice model: `en_US-amy-medium` (~50MB)
3. Add to `backend/.env`:
   ```env
   TTS_PROVIDER=piper
   PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe
   PIPER_VOICE_DIR=D:\AgentDevWork\Programs\piper-tts\voices
   ```

## Cost Comparison

| Provider | Cost per 1K tokens | Monthly estimate (100 generations) |
|----------|-------------------|-----------------------------------|
| Ollama | $0 | $0 |
| DeepSeek | $0.001 | ~$0.50 |
| OpenAI GPT-4o-mini | $0.00015 | ~$0.10 |
| OpenAI GPT-4o | $0.005 | ~$2.50 |

## Fallback Behavior

If the primary provider fails:
1. System automatically tries the next provider
2. Circuit breaker opens after 3 failures
3. After 60 seconds, tries again (half-open state)
4. Circuit breaker status visible in Studio page

## Environment Variables Reference

```env
# Provider Selection
LLM_PROVIDER=ollama           # Options: ollama, deepseek, openai

# Ollama (primary)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# DeepSeek (optional)
DEEPSEEK_API_KEY=

# OpenAI (optional)
OPENAI_API_KEY=

# Image Generation
IMAGE_PROVIDER=stable-diffusion
COMFYUI_BASE_URL=http://localhost:8188

# Text-to-Speech
TTS_PROVIDER=piper
PIPER_EXECUTABLE=D:\AgentDevWork\Programs\piper-tts\piper.exe
PIPER_VOICE_DIR=D:\AgentDevWork\Programs\piper-tts\voices
```
