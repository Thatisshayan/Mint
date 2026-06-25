# AI Provider Configuration

MINT supports multiple AI providers with automatic fallback.

## Provider Chain

```
DeepSeek (if configured) → OpenAI (if configured) → Ollama (local)
```

The system tries providers in order. If one fails, it falls back to the next.

## DeepSeek

**Cost:** ~$0.001/1K tokens (cheapest cloud option)

### Setup

1. Create account at https://platform.deepseek.com
2. Generate API key
3. Add to `backend/.env`:
   ```env
   DEEPSEEK_API_KEY=your-api-key
   DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
   ```

### Models

- `deepseek-chat` (default) - General purpose
- `deepseek-coder` - Code-focused

## OpenAI

**Cost:** ~$0.005/1K tokens (GPT-4o) or ~$0.00015/1K tokens (GPT-4o-mini)

### Setup

1. Create account at https://platform.openai.com
2. Generate API key
3. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=your-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

### Models

- `gpt-4o-mini` (default) - Fast and cheap
- `gpt-4o` - Most capable

## Ollama (Free)

**Cost:** Free (runs locally)

### Setup

1. Install Ollama: https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Add to `backend/.env`:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1:8b
   ```

### Recommended Models

- `llama3.1:8b` - Good balance of speed and quality
- `llama3.1:70b` - Best quality (requires 64GB+ RAM)
- `mistral` - Fast and capable

## Image Generation (ComfyUI)

**Cost:** Free (runs locally with GPU)

### Setup

1. Install ComfyUI: https://github.com/comfyanonymous/ComfyUI
2. Start ComfyUI server
3. Add to `backend/.env`:
   ```env
   COMFYUI_BASE_URL=http://localhost:8188
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
LLM_PROVIDER=deepseek  # Options: deepseek, openai

# DeepSeek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# OpenAI
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# ComfyUI (Image Generation)
COMFYUI_BASE_URL=http://localhost:8188
```
