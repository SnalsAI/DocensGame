# EDU-ATELIER - Documento Architettura

## 1. Overview

EDU-ATELIER è una piattaforma EdTech low-cost e high-margin progettata per:
- Docenti: creazione contenuti didattici con AI
- Studenti: apprendimento gamificato e inclusivo
- Scuole: gestione classi e monitoraggio

## 2. Architettura High-Level

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Teacher    │  │   Student    │  │    Admin     │  │   H5P        │    │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │  │   Player     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (NestJS)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Auth      │  │   Content    │  │   Lessons    │  │   Classes    │    │
│  │   Module     │  │   Module     │  │   Module     │  │   Module     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │   Games      │  │   Users      │  │  Analytics   │                      │
│  │   Module     │  │   Module     │  │   Module     │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                           │
         ┌──────────┴──────────┐               │
         ▼                     ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Socket.io     │  │   AI Service    │  │   Video Service │
│   (Gamology)    │  │   (FastAPI)     │  │   (FastAPI)     │
│                 │  │                 │  │                 │
│  - Rapid Quiz   │  │  - LLM Engine   │  │  - TTS (Coqui)  │
│  - Boss Fight   │  │  - Text Parse   │  │  - SadTalker    │
│  - Squad Puzzle │  │  - Summarize    │  │  - FFmpeg       │
│  - Tournament   │  │  - Quiz Gen     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │                    │
                              ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │   S3/Minio   │  │   Keycloak   │    │
│  │  (Main DB)   │  │   (Cache)    │  │  (Storage)   │  │   (Auth)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Stack Tecnologico

### 3.1 Backend
| Componente | Tecnologia | Scopo |
|------------|-----------|-------|
| API Gateway | NestJS (Node.js) | Orchestrazione, routing, business logic |
| AI Service | FastAPI (Python) | LLM, NLP, content generation |
| Video Service | FastAPI (Python) | TTS, SadTalker, FFmpeg |
| Realtime | Socket.io | Multiplayer games |

### 3.2 Frontend
| Componente | Tecnologia | Scopo |
|------------|-----------|-------|
| Web App | Next.js 14 | SSR, routing, UI |
| UI Library | Tailwind CSS | Styling |
| State | Zustand | State management |
| Video Player | React Player + Custom | Playback + H5P |

### 3.3 Database & Storage
| Componente | Tecnologia | Scopo |
|------------|-----------|-------|
| Main DB | PostgreSQL 15 | Dati strutturati |
| Cache | Redis 7 | Sessioni, caching |
| Object Storage | MinIO (S3-compatible) | Video, file, media |

### 3.4 AI Models (Open Source)
| Modello | Scopo |
|---------|-------|
| Mistral 7B / LLaMA 3.1 | Text generation, parsing |
| Coqui TTS / Bark | Text-to-Speech |
| SadTalker | Talking head generation |

### 3.5 Infrastruttura
| Componente | Tecnologia | Scopo |
|------------|-----------|-------|
| Auth | Keycloak | SSO, OIDC, JWT |
| Analytics | PostHog (self-hosted) | User analytics |
| Monitoring | Prometheus + Grafana | Metrics |
| Container | Docker + Docker Compose | Orchestration |

## 4. Struttura Progetto (Monorepo)

```
edu-atelier/
├── apps/
│   ├── backend/              # NestJS API Gateway
│   ├── frontend/             # Next.js Web App
│   ├── ai-service/           # FastAPI AI microservice
│   └── video-service/        # FastAPI Video pipeline
├── packages/
│   ├── shared-types/         # TypeScript types condivisi
│   ├── ui-components/        # React components condivisi
│   └── game-engine/          # Logica giochi condivisa
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── services/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEVELOPER_GUIDE.md
├── scripts/
└── infrastructure/
    └── terraform/
```

## 5. Flussi Principali

### 5.1 Generazione Video-Lezione
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Upload  │───▶│  Parse   │───▶│  Script  │───▶│   TTS    │───▶│SadTalker │
│  Content │    │   AI     │    │   Gen    │    │  Audio   │    │  Video   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────┐
                                                               │  FFmpeg  │
                                                               │  Merge   │
                                                               └──────────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────┐
                                                               │  MinIO   │
                                                               │  Store   │
                                                               └──────────┘
```

### 5.2 Sessione di Gioco Multiplayer
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Teacher  │───▶│  Create  │───▶│ Students │───▶│   Game   │
│  Start   │    │   Room   │    │   Join   │    │  Start   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                    ┌─────────────────────────────────┤
                    ▼                                 ▼
             ┌──────────┐                      ┌──────────┐
             │  Answer  │◀────────────────────▶│  Sync    │
             │  Submit  │                      │  State   │
             └──────────┘                      └──────────┘
                    │
                    ▼
             ┌──────────┐
             │  Update  │
             │  Score   │
             └──────────┘
```

## 6. Modello Dati (Entità Principali)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  Classroom  │       │   Content   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ keycloak_id │       │ name        │       │ title       │
│ role        │──────▶│ teacher_id  │       │ type        │
│ profile     │       │ students[]  │◀──────│ classroom_id│
└─────────────┘       └─────────────┘       │ raw_content │
      │                                     │ parsed_data │
      │                                     └─────────────┘
      ▼                                           │
┌─────────────┐                                   ▼
│StudentProfile│                           ┌─────────────┐
├─────────────┤                           │VideoLesson  │
│ user_id     │                           ├─────────────┤
│ is_dsa      │                           │ id          │
│ dsa_type    │                           │ content_id  │
│ is_bes      │                           │ script      │
│ is_l2       │                           │ audio_url   │
│ l2_level    │                           │ video_url   │
│ accessibility│                          │ interactions│
└─────────────┘                           └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ GameSession │       │   XPReward  │       │   Badge     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ game_type   │       │ student_id  │       │ name        │
│ classroom_id│       │ amount      │       │ description │
│ host_id     │       │ source      │       │ icon_url    │
│ state       │       │ created_at  │       │ criteria    │
│ participants│       └─────────────┘       └─────────────┘
└─────────────┘
```

## 7. Sicurezza

### 7.1 Autenticazione
- Keycloak come Identity Provider
- JWT tokens per API
- OIDC per SSO

### 7.2 Autorizzazione
- Role-based access control (RBAC)
- Ruoli: admin, teacher, student
- Permission guards su ogni endpoint

### 7.3 Privacy (GDPR)
- Dati minimi necessari
- Consenso esplicito
- Diritto all'oblio implementato
- Log di audit

## 8. Scalabilità

### 8.1 Orizzontale
- Backend stateless
- Load balancer ready
- Session in Redis

### 8.2 AI Workload
- Queue system per video generation
- GPU scheduling
- Fallback a CPU per operazioni leggere

## 9. Costi Stimati (Produzione)

| Componente | Costo Mensile |
|------------|---------------|
| VPS CPU (backend) | 20-40€ |
| VPS GPU (AI) | 40-100€ |
| Storage (S3) | 10-30€ |
| **Totale** | **70-170€** |

## 10. Roadmap Tecnica

- **Fase 1**: Setup & Architettura (settimana 1-2)
- **Fase 2**: Backend Core & Auth (settimana 3-4)
- **Fase 3**: AI Engine & Video Pipeline (settimana 5-7)
- **Fase 4**: Frontend & H5P (settimana 8-10)
- **Fase 5**: Gamology Engine (settimana 11-13)
- **Fase 6**: Inclusione & DSA (settimana 14-15)
- **Fase 7**: Beta & Stabilizzazione (settimana 16+)
