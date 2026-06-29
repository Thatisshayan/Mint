# Getting Started with MINT

MINT is a personal AI content workstation for faceless YouTube channels. It runs entirely on your machine — no cloud account needed.

---

## Quick Start (Local AI)

### Requirements

- Windows 10/11 (x64)
- [Node.js 18+](https://nodejs.org)
- [Ollama](https://ollama.ai) — local AI (already installed with llama3.2)
- NVIDIA GPU with 6GB+ VRAM (recommended for ComfyUI image generation)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Thatisshayan/Mint.git
   cd Mint
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. Start all services:
   ```bash
   start-mint.bat
   ```
   Or manually:
   ```bash
   # Start Ollama (if not running)
   ollama serve
   
   # Start backend (port 4000)
   node --import tsx/esm backend/src/index.ts
   
   # Start frontend (port 5173)
   npx vite --host
   ```

4. Open http://localhost:5173
5. Click "Continue" on the landing page (dev auto-authenticates)

---

## Local AI Services

MINT uses local AI services — no API keys required for basic usage.

| Service | Port | Purpose | VRAM |
|---------|------|---------|------|
| **Ollama** | 11434 | LLM text generation | ~2GB |
| **ComfyUI** | 8188 | Image generation | ~4GB |
| **Piper TTS** | — | Text-to-speech | CPU only |
| **Money Printer Turbo** | 8501 | Video generation | (optional) |

### Ollama Setup (Required)

Ollama is already installed and configured with the `llama3.2` model.

```bash
# Verify Ollama is running
ollama list

# Pull a different model if needed
ollama pull llama3.2:3b    # Smaller, faster
ollama pull gemma4         # Larger, more capable
```

### ComfyUI Setup (Optional — for image generation)

ComfyUI is installed at `D:\AgentDevWork\Programs\comfyui\` with the SD 1.5 model.

```bash
# Start ComfyUI
D:\AgentDevWork\Programs\comfyui\venv\Scripts\python.exe D:\AgentDevWork\Programs\comfyui\ComfyUI\main.py --listen 0.0.0.0 --port 8188
```

### Piper TTS Setup (Optional — for voiceover)

Piper TTS is installed at `D:\AgentDevWork\Programs\piper-tts\` with the `en_US-amy-medium` voice.

---

## Configuration

Edit `backend/.env` to configure services:

```env
# LLM: Use Ollama locally (default)
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

# Optional: Cloud AI fallback
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
```

---

## AI Provider Chain

```
Request → Ollama (primary, local, free)
            ↓ fails / not running
          DeepSeek V3 (if API key configured)
            ↓ fails / no key
          OpenAI gpt-4o-mini (if API key configured)
```

### Ollama (Free, Local)

- **Cost:** Free (runs locally)
- **Model:** llama3.2 (2GB VRAM, fits RTX 2060)
- **Setup:** Already installed

### DeepSeek (Optional, Cloud)

- **Cost:** ~$0.001/1K tokens
- **Setup:** Add `DEEPSEEK_API_KEY=sk-...` to `backend/.env`

### OpenAI (Optional, Cloud)

- **Cost:** ~$0.00015/1K tokens (GPT-4o-mini)
- **Setup:** Add `OPENAI_API_KEY=sk-...` to `backend/.env`

---

## Development Commands

| Command | Description |
|---------|-------------|
| `start-mint.bat` | Start all services |
| `npm run dev` | Frontend only (Vite, :5173) |
| `npm run backend:dev` | Backend only (tsx, :4000) |
| `npm run dev:all` | Both backend + frontend |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Troubleshooting

### "Backend not responding" error
- Ensure Node.js is installed: `node --version`
- Check if port 4000 is in use: `netstat -ano | findstr :4000`
- Try restarting: kill node processes and restart

### "Ollama not available" error
- Ensure Ollama is running: `ollama list`
- Start Ollama: `ollama serve`
- Check the model is pulled: `ollama pull llama3.2`

### "ComfyUI not available" error
- Ensure ComfyUI is running: http://localhost:8188
- Start ComfyUI: see ComfyUI Setup section above
- Image generation will return placeholder if ComfyUI is not running

### "AI generation fails" error
- Check if Ollama is running and has a model
- Try switching to a different provider in `backend/.env`
- Check the backend console for error messages

### Port already in use
Kill the stray process:
```powershell
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

---

## Data Location

All your data is stored locally:

| Item | Location |
|------|---------|
| Database | `backend/prisma/mint.db` |
| ComfyUI models | `D:\AgentDevWork\Programs\comfyui\ComfyUI\models\` |
| Piper TTS voices | `D:\AgentDevWork\Programs\piper-tts\voices\` |
| Ollama models | `C:\Users\AgentDev\.ollama\models\` |

To back up your data, copy `backend/prisma/mint.db`.
