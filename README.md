# 🎓 EDU-ATELIER

**Piattaforma EdTech completa per scuole italiane** con AI content generation, video lessons, gamification e supporto DSA/BES/L2.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://typescriptlang.org)

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Architettura](#-architettura)
- [Quick Start](#-quick-start)
- [Sviluppo](#-sviluppo)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)

## ✨ Caratteristiche

### 🤖 AI Content Generation
- **Parsing automatico** di documenti (PDF, testo, immagini)
- **Riassunti intelligenti** (breve, dettagliato, punti chiave)
- **Quiz generation** (scelta multipla, vero/falso, completamento)
- **Mappe concettuali** automatiche
- **Semplificazione testi** per DSA e L2

### 🎬 Video Lessons
- **Avatar parlante** con sintesi vocale (Coqui TTS)
- **Lip sync** automatico (SadTalker)
- **H5P interattività** (quiz in-video, pause, riflessioni)
- **Capitoli e navigazione** intelligente

### 🎮 Gamification Engine
- **Rapid Quiz**: Domande a tempo con leaderboard
- **Boss Fight**: Classe collaborativa vs Boss
- **Dungeon Raid**: Esplorazione RPG educativa
- **Tournament**: Tornei a eliminazione
- **Sistema XP e Badge** con 20+ achievements

### ♿ Accessibilità DSA/BES/L2
- **Font accessibili** (OpenDyslexic, Atkinson Hyperlegible)
- **Text-to-Speech** integrato
- **Tempo extra automatico** nei giochi
- **Semplificazione testi** multilivello (A1/A2/B1)
- **Traduzioni** parole difficili
- **Alto contrasto** e modalità scura

## 🏗 Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js 14 + Tailwind)                   │
├─────────────────────────────────────────────────────────────┤
│                         │                                    │
│    ┌────────────────────┼────────────────────┐              │
│    │                    │                    │              │
│    ▼                    ▼                    ▼              │
│ ┌──────────┐      ┌──────────┐        ┌──────────┐         │
│ │ BACKEND  │      │    AI    │        │  VIDEO   │         │
│ │ (NestJS) │      │ SERVICE  │        │ SERVICE  │         │
│ │          │      │(FastAPI) │        │(FastAPI) │         │
│ └────┬─────┘      └────┬─────┘        └────┬─────┘         │
│      │                 │                   │                │
│      │    ┌────────────┴───────────────────┘                │
│      │    │                                                  │
│      ▼    ▼                                                  │
│ ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│ │  PostgreSQL  │  │  Redis   │  │  MinIO   │  │ Keycloak │ │
│ └──────────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 14, Tailwind CSS, TanStack Query, Zustand |
| Backend | NestJS, Prisma, Socket.io |
| AI Service | FastAPI, Mistral/LLaMA, Transformers |
| Video Service | FastAPI, Coqui TTS, SadTalker, FFmpeg |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Auth | Keycloak |

## 🚀 Quick Start

### Prerequisiti

- **Node.js** 18+
- **pnpm** 8+
- **Docker** & Docker Compose
- **Python** 3.10+ (per AI/Video services)

### 1. Clone e Setup

```bash
git clone https://github.com/your-org/edu-atelier.git
cd edu-atelier
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Avvia con Docker

```bash
pnpm docker:dev
```

### 4. Setup Database

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:seed
```

### 5. Avvia Development

```bash
pnpm dev
```

### 6. Accedi

| Servizio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Keycloak | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

### Utenti di Test

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@edu-atelier.it | admin123 | Admin |
| docente@demo.it | demo123 | Docente |
| studente@demo.it | demo123 | Studente |
| dsa.studente@demo.it | demo123 | Studente DSA |

## 💻 Sviluppo

### Struttura Progetto

```
edu-atelier/
├── apps/
│   ├── frontend/          # Next.js 14 App
│   │   ├── src/app/       # App Router pages
│   │   ├── src/components/# React components
│   │   └── src/hooks/     # Custom hooks
│   ├── backend/           # NestJS API
│   │   ├── src/modules/   # Feature modules
│   │   └── prisma/        # Database schema
│   ├── ai-service/        # FastAPI AI Service
│   └── video-service/     # FastAPI Video Service
├── docker/                # Docker configs
└── docs/                  # Documentation
```

### Comandi

```bash
pnpm dev                    # Avvia tutto
pnpm build                  # Build produzione
pnpm test                   # Esegui test
pnpm --filter backend prisma:studio  # Prisma Studio
```

## 🚢 Deployment

### Docker Production

```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/eduatelier
KEYCLOAK_URL=http://keycloak:8080
AI_SERVICE_URL=http://ai-service:8000
VIDEO_SERVICE_URL=http://video-service:8001
MINIO_ENDPOINT=minio:9000
```

## 📚 API Documentation

Swagger UI disponibile a `/api/docs`

### Endpoints Principali

| Endpoint | Descrizione |
|----------|-------------|
| `POST /auth/login` | Login |
| `GET /classrooms` | Lista classi |
| `POST /content` | Crea contenuto |
| `POST /ai/parse` | Analizza con AI |
| `POST /ai/quiz` | Genera quiz |
| `GET /games` | Lista giochi |
| `GET /gamification/stats` | Stats gamification |
| `GET /health` | Health check |

## 📄 Documentazione

- [Architettura](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

## 📄 License

MIT License

---

Made with ❤️ for Italian schools
