# Getting Started with MINT

MINT is a personal AI content workstation for faceless YouTube channels, packaged as a native Windows desktop app. It runs entirely on your machine — no cloud account needed.

---

## Option A: Install the Desktop App (Recommended)

### Requirements
- Windows 10 or 11 (x64)
- [Node.js 18+](https://nodejs.org) — the app needs this to run its local server
- WebView2 Runtime — pre-installed on Windows 11; the MSI will install it on Windows 10 if missing

### Steps

1. Download `MINT_0.1.0_x64_en-US.msi` from [GitHub Releases](https://github.com/Thatisshayan/Mint/releases)
2. Run the installer (click Yes on the UAC prompt)
3. Launch MINT from the Start menu or Desktop shortcut
4. MINT opens directly to the Dashboard — no login required

### Configure AI Keys

MINT needs at least one AI provider key to generate content.

On first use, go to **Settings** (or edit `backend/.env` directly) and add:

```env
# Cheapest + best quality — recommended
DEEPSEEK_API_KEY=sk-...

# Fallback option
OPENAI_API_KEY=sk-...

# Free local option (requires Ollama installed separately)
OLLAMA_BASE_URL=http://localhost:11434
```

The AI provider chain is: DeepSeek → OpenAI → Ollama. MINT tries each in order and falls back if one fails.

---

## Option B: Run in Development Mode

For contributors or users who want to run from source.

### Prerequisites

- Node.js 20+
- Rust + Cargo (`rustup.rs`)
- npm

### Install

```bash
git clone https://github.com/Thatisshayan/Mint.git
cd Mint
npm install
cd backend && npm install && cd ..
```

### Configure

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=19421
MINT_DESKTOP=true
JWT_SECRET=any-random-string-for-dev

# At least one AI provider:
DEEPSEEK_API_KEY=your-key
```

### Start (Tauri Desktop)

```bash
npm run tauri:dev
```

This opens a hot-reloading desktop window. Backend runs at `localhost:19421`.

### Start (Web Mode — no Tauri)

```bash
npm run dev:all
```

Opens at `http://localhost:5173`. Auth uses magic link (dev mode auto-verifies — enter any email, click the link in the console).

---

## Build the Installer

```bash
npm run tauri:build
```

Outputs: `src-tauri/target/release/bundle/msi/MINT_0.1.0_x64_en-US.msi`

---

## AI Provider Setup

### DeepSeek (Recommended)
- Sign up at https://platform.deepseek.com
- Set `DEEPSEEK_API_KEY=sk-...` in `backend/.env`
- Very cheap — ~$0.0001 per 1K tokens for V3

### OpenAI
- Sign up at https://platform.openai.com
- Set `OPENAI_API_KEY=sk-...`
- Uses `gpt-4o-mini` by default

### Ollama (Free, Local)
- Install from https://ollama.ai
- Run: `ollama pull llama3.1:8b`
- Set `OLLAMA_BASE_URL=http://localhost:11434`
- No cost, but slower than cloud providers

---

## Troubleshooting

### White screen on launch
The app couldn't start the backend. Check:
- Node.js is installed (`node --version` in a terminal)
- No other process is using port 19421
- Try reinstalling the MSI

### "Failed to fetch" errors
The backend didn't start in time or crashed. Check:
- Node.js is on your PATH
- Look for errors in `%APPDATA%\com.mint.app\logs\`

### AI generation fails
- Verify your API key is set and valid
- Try switching to a different provider in Settings
- Check your internet connection for cloud providers

### Port 19421 already in use
Kill the stray process:
```powershell
netstat -ano | findstr :19421
taskkill /PID <pid> /F
```

---

## Data Location

All your data is stored locally:

| Item | Location |
|------|---------|
| Database | `%APPDATA%\com.mint.app\mint.db` |
| Logs | `%APPDATA%\com.mint.app\logs\` |
| Exported content | Where you save it |

To back up your data, copy `mint.db`.

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | Desktop app with hot reload |
| `npm run tauri:build` | Build Windows MSI |
| `npm run dev` | Frontend only (Vite, :5173) |
| `npm run dev:all` | Backend + frontend (web mode) |
| `npm run backend:build` | Bundle backend with esbuild |
| `npm run test` | Run Vitest tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
