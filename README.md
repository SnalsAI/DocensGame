# EDU-ATELIER

Piattaforma EdTech low-cost / high-margin per la didattica digitale.

## Caratteristiche

- **AI Content Engine**: Generazione automatica di riassunti, mappe concettuali, quiz ed esercizi
- **Video-Lezioni AI**: Trasformazione di testi in video-lezioni con avatar parlanti (SadTalker + Coqui TTS)
- **Gamology Engine**: Quiz multiplayer in tempo reale con Socket.io (Rapid Quiz, Boss Fight, Tournament)
- **Inclusività DSA/BES**: Contenuti adattati, tempi extra, font ad alta leggibilità
- **H5P Integration**: Interattività nei video (quiz, note, bookmark)

## Stack Tecnologico

### Backend
- **API Gateway**: NestJS (Node.js)
- **AI Service**: FastAPI (Python) + Mistral/LLaMA
- **Video Service**: FastAPI (Python) + Coqui TTS + SadTalker + FFmpeg
- **Realtime**: Socket.io

### Frontend
- **Web App**: Next.js 14 + React + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

### Database & Storage
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Object Storage**: MinIO (S3-compatible)

### Infrastruttura
- **Auth**: Keycloak (self-hosted)
- **Analytics**: PostHog (self-hosted)
- **Container**: Docker + Docker Compose

## Quick Start

### Prerequisiti
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- (Opzionale) GPU NVIDIA per AI models

### Sviluppo

1. **Clona il repository**
```bash
git clone https://github.com/your-org/edu-atelier.git
cd edu-atelier
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Avvia i servizi Docker**
```bash
npm run docker:dev
```

4. **Avvia lo sviluppo**
```bash
npm run dev
```

5. **Accedi all'applicazione**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/docs
- Keycloak: http://localhost:8080
- MinIO Console: http://localhost:9001

## Struttura Progetto

```
edu-atelier/
├── apps/
│   ├── backend/          # NestJS API Gateway
│   ├── frontend/         # Next.js Web App
│   ├── ai-service/       # FastAPI AI microservice
│   └── video-service/    # FastAPI Video pipeline
├── packages/             # Shared packages
├── docker/               # Docker configurations
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Documentazione

- [Architettura](docs/ARCHITECTURE.md)
- [API Documentation](http://localhost:3001/api/docs)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

## Licenza

Proprietario - Tutti i diritti riservati.
