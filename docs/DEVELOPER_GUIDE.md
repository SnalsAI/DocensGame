# EDU-ATELIER Developer Guide

## Indice

1. [Setup Ambiente di Sviluppo](#setup-ambiente-di-sviluppo)
2. [Architettura del Progetto](#architettura-del-progetto)
3. [Backend API](#backend-api)
4. [Frontend](#frontend)
5. [AI Service](#ai-service)
6. [Video Service](#video-service)
7. [Database](#database)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Setup Ambiente di Sviluppo

### Prerequisiti

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Git
- (Opzionale) GPU NVIDIA con CUDA per AI models

### Installazione Rapida

```bash
# 1. Clona il repository
git clone https://github.com/your-org/edu-atelier.git
cd edu-atelier

# 2. Installa le dipendenze Node.js
npm install

# 3. Copia i file di configurazione
cp apps/backend/.env.example apps/backend/.env

# 4. Avvia i servizi Docker (PostgreSQL, Redis, MinIO, Keycloak)
npm run docker:dev

# 5. Esegui le migrazioni del database
cd apps/backend && npx prisma migrate dev && npx prisma db seed

# 6. Avvia tutti i servizi in modalità sviluppo
npm run dev
```

### URL dei Servizi

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Web App Next.js |
| Backend API | http://localhost:3001 | API NestJS |
| API Docs | http://localhost:3001/api/docs | Swagger UI |
| AI Service | http://localhost:8001 | FastAPI AI |
| Video Service | http://localhost:8002 | FastAPI Video |
| Keycloak | http://localhost:8080 | Identity Provider |
| MinIO Console | http://localhost:9001 | Object Storage |
| PostHog | http://localhost:8000 | Analytics |

### Credenziali di Test

```
Admin Keycloak: admin / admin123
Docente: docente@scuola.it / docente123
Studente: studente@scuola.it / studente123
Studente DSA: studente.dsa@scuola.it / studente123
Codice Classe Demo: DEMO2024
```

---

## Architettura del Progetto

### Struttura Monorepo

```
edu-atelier/
├── apps/
│   ├── backend/          # NestJS API Gateway
│   │   ├── src/
│   │   │   ├── common/   # Moduli condivisi (Prisma, Redis, Storage)
│   │   │   └── modules/  # Feature modules
│   │   └── prisma/       # Schema e migrazioni DB
│   │
│   ├── frontend/         # Next.js 14 App Router
│   │   └── src/
│   │       ├── app/      # Route pages
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/      # API client, Socket
│   │       └── store/    # Zustand stores
│   │
│   ├── ai-service/       # FastAPI AI Microservice
│   │   └── app/
│   │       ├── api/      # Endpoints
│   │       ├── prompts/  # LLM Prompt templates
│   │       └── services/ # Business logic
│   │
│   └── video-service/    # FastAPI Video Microservice
│       └── app/
│           ├── api/      # Endpoints
│           └── services/ # TTS, SadTalker, FFmpeg
│
├── docker/               # Docker configurations
├── docs/                 # Documentation
└── packages/             # Shared packages (future)
```

### Flusso delle Richieste

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│ Frontend │────▶│ Backend  │────▶│ PostgreSQL   │
│ (Next.js)│     │ (NestJS) │     │ Redis        │
└──────────┘     └──────────┘     └──────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │AI Service│ │Video Svc │ │  MinIO   │
   │(FastAPI) │ │(FastAPI) │ │(Storage) │
   └──────────┘ └──────────┘ └──────────┘
```

---

## Backend API

### Moduli Principali

#### Auth Module
- JWT authentication
- Integrazione Keycloak
- Gestione ruoli (Admin, Teacher, Student)

```typescript
// Proteggere un endpoint
@UseGuards(JwtAuthGuard)
@Roles(UserRole.TEACHER)
async createContent() { ... }
```

#### Content Module
- CRUD contenuti didattici
- Upload file (PDF, immagini)
- Integrazione AI per parsing

```typescript
// Generare quiz da contenuto
POST /api/v1/content/:id/quiz
{
  "type": "MULTIPLE_CHOICE",
  "numQuestions": 10
}
```

#### Games Module
- Gestione sessioni di gioco
- Socket.io per real-time
- Sistema XP e Badge

```typescript
// Eventi Socket.io
socket.emit('join_room', { roomCode, odisplayname, nickname });
socket.on('question', (question) => { ... });
socket.emit('submit_answer', { questionId, answer, timeSpent });
```

### Aggiungere un Nuovo Modulo

```bash
# 1. Genera il modulo con NestJS CLI
cd apps/backend
npx nest g module modules/newmodule
npx nest g controller modules/newmodule
npx nest g service modules/newmodule

# 2. Aggiungi il modulo a app.module.ts
# 3. Crea i DTO in dto/
# 4. Implementa la logica nel service
```

---

## Frontend

### Stack Tecnologico

- **Next.js 14** con App Router
- **Tailwind CSS** per styling
- **TanStack Query** per data fetching
- **Zustand** per state management
- **Socket.io-client** per real-time

### Struttura delle Route

```
/                           # Landing page
/dashboard/teacher          # Dashboard docente
/dashboard/teacher/content  # Gestione contenuti
/dashboard/teacher/games    # Gestione giochi
/dashboard/student          # Dashboard studente
/game/join                  # Join game
/game/play/[roomCode]       # Game play
```

### Creare una Nuova Pagina

```tsx
// apps/frontend/src/app/dashboard/teacher/newpage/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function NewPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => api.get('/my-endpoint').then(res => res.data),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">New Page</h1>
      {/* Content */}
    </div>
  );
}
```

### Gestione Stato Gioco

```typescript
// Zustand store per il gioco
const useGameStore = create((set) => ({
  status: 'idle',
  currentQuestion: null,
  leaderboard: [],

  setStatus: (status) => set({ status }),
  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  updateLeaderboard: (lb) => set({ leaderboard: lb }),
}));
```

---

## AI Service

### Endpoint Disponibili

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/v1/content/parse` | POST | Estrae concetti e entità |
| `/api/v1/content/summarize` | POST | Genera riassunti |
| `/api/v1/content/concept-map` | POST | Crea mappa concettuale |
| `/api/v1/quiz/generate` | POST | Genera domande quiz |
| `/api/v1/simplify/text` | POST | Semplifica per DSA/L2 |

### Usare i Prompt Templates

```python
from app.prompts.templates import get_prompt, build_chat_messages

# Ottenere system e user prompt
system, user = get_prompt('quiz_mc', content=text, num_questions=5)

# Costruire messaggi per LLM
messages = build_chat_messages('summarize_brief', content=text)
```

### Aggiungere un Nuovo Modello

```python
# In app/services/model_manager.py

async def _load_models(self):
    from transformers import AutoModelForCausalLM, AutoTokenizer

    self.tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B")
    self.model = AutoModelForCausalLM.from_pretrained(
        "mistralai/Mistral-7B",
        device_map="auto",
        torch_dtype=torch.float16,
    )
```

---

## Video Service

### Pipeline di Generazione Video

```
Testo → Script AI → TTS (Coqui) → Audio
                                    ↓
Avatar Image → SadTalker → Video animazione
                                    ↓
                          FFmpeg merge → Video finale
```

### Endpoint Disponibili

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/v1/tts/generate` | POST | Text-to-Speech |
| `/api/v1/video/generate` | POST | Genera video con avatar |
| `/api/v1/avatars/` | GET | Lista avatar disponibili |

### Configurare TTS

```python
# In app/core/config.py
TTS_MODEL = "tts_models/it/mai_female/vits"  # Modello italiano

# In app/services/video_engine.py
from TTS.api import TTS
self.tts = TTS(model_name=settings.TTS_MODEL)
self.tts.tts_to_file(text=script, file_path=audio_path)
```

---

## Database

### Schema Prisma

Le principali entità sono:

- **User** → StudentProfile | TeacherProfile
- **Classroom** → ClassroomStudent
- **Content** → VideoLesson, Quiz, Summary, ConceptMap
- **GameSession** → GameParticipant
- **XPReward**, **Badge**, **UserBadge**

### Comandi Utili

```bash
# Generare migration
npx prisma migrate dev --name add_new_field

# Reset database
npx prisma migrate reset

# Visualizzare dati
npx prisma studio

# Seed database
npx prisma db seed
```

### Aggiungere una Nuova Tabella

```prisma
// In prisma/schema.prisma

model NewEntity {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])

  @@map("new_entities")
}
```

---

## Testing

### Backend Tests

```bash
cd apps/backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd apps/frontend

# Component tests
npm run test

# E2E con Playwright (da configurare)
npm run test:e2e
```

---

## Deployment

### Requisiti Server

**Server CPU (Backend + DB):**
- 4 vCPU, 8GB RAM
- 100GB SSD
- Costo: ~20-40€/mese (Hetzner/Contabo)

**Server GPU (AI):**
- GPU entry-level (RTX 3060 o simile)
- 16GB RAM
- Costo: ~40-100€/mese

### Docker Production

```bash
# Build images
docker-compose -f docker/docker-compose.prod.yml build

# Deploy
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db:5432/eduatelier
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-key-change-me
KEYCLOAK_URL=https://auth.yourdomain.com
MINIO_ENDPOINT=storage.yourdomain.com
```

---

## Contribuire

### Git Workflow

1. Crea un branch da `main`: `git checkout -b feature/my-feature`
2. Sviluppa e testa localmente
3. Commit con messaggi descrittivi: `git commit -m "feat: add new feature"`
4. Push e crea Pull Request
5. Code review
6. Merge in `main`

### Convenzioni Commit

- `feat:` nuova funzionalità
- `fix:` bug fix
- `docs:` documentazione
- `refactor:` refactoring
- `test:` test
- `chore:` manutenzione

---

## Supporto

Per domande o problemi:
- Apri una Issue su GitHub
- Controlla la documentazione in `/docs`
- Consulta l'API Docs su `/api/docs`
