# Getting Started with MINT

MINT is a personal AI content workstation for creating faceless YouTube channel content.

## Prerequisites

- Node.js 18+ (recommended: 20+)
- PostgreSQL 15+ (or use Docker)
- npm or yarn

## Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/Thatisshayan/Mint.git
cd Mint

# Copy environment file
cp backend/.env.example backend/.env

# Start everything with Docker
docker-compose up

# Open http://localhost:5173
```

## Manual Setup

### 1. Install Dependencies

```bash
# Root (frontend)
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Set Up Database

```bash
# Start PostgreSQL (or use Docker)
docker-compose up -d postgres

# Run migrations
npm run db:generate

# Seed development data
npm run db:seed
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mint

# JWT (dev only)
JWT_SECRET=your-secret-key

# AI Provider (at least one)
DEEPSEEK_API_KEY=your-deepseek-key
# OR
OPENAI_API_KEY=your-openai-key
# OR
OLLAMA_BASE_URL=http://localhost:11434
```

### 4. Start Development

```bash
# One command (recommended)
npm run dev:all

# Or two terminals:
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run dev
```

### 5. Open Browser

Navigate to `http://localhost:5173`

## AI Provider Configuration

### DeepSeek (Recommended - Cheapest)

1. Sign up at https://platform.deepseek.com
2. Get API key
3. Set in `.env`:
   ```env
   DEEPSEEK_API_KEY=your-key-here
   ```

### OpenAI

1. Sign up at https://platform.openai.com
2. Get API key
3. Set in `.env`:
   ```env
   OPENAI_API_KEY=your-key-here
   ```

### Ollama (Free - Local)

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.1:8b`
3. Set in `.env`:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   ```

## Troubleshooting

### Database Connection Failed

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Try: `docker-compose up -d postgres`

### AI Generation Fails

- Check API keys in `.env`
- Verify network connectivity
- Check backend logs for errors

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run build
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start backend + frontend |
| `npm run dev` | Frontend only |
| `npm run backend:dev` | Backend only |
| `npm run build` | Build frontend |
| `npm run backend:build` | Build backend |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |
