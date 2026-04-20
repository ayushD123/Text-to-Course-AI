# Text-to-Learn (MERN + AI)

Text-to-Learn generates structured learning courses from a topic prompt. It includes Auth0 authentication, AI-assisted course and lesson generation, video suggestions, Hinglish explanation/audio support, and PDF export for lessons.

## Architecture Overview

### High-level flow

1. User logs in on the React frontend (Auth0).
2. Frontend calls Express APIs.
3. Server persists courses/lessons in MongoDB.
4. AI providers enrich outlines/lesson content.
5. Frontend renders lessons, quiz blocks, videos, and optional PDF export.

### Monorepo structure

```
.
├─ client/              # Vite + React + Tailwind
│  ├─ src/pages         # Route-level pages
│  ├─ src/components    # UI components (including LessonPDFExporter)
│  └─ .env.example
├─ server/              # Express + MongoDB + provider services
│  ├─ src/controllers   # API controllers
│  ├─ src/services      # AI, TTS, YouTube service adapters
│  ├─ src/models        # Mongoose models
│  └─ .env.example
├─ .github/workflows/ci.yml
└─ package.json         # root scripts
```

## Local Setup

### 1) Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 2) Configure environment files

Copy examples and fill required values:

- `client/.env.example` -> `client/.env`
- `server/.env.example` -> `server/.env`

### 3) Run in development

```bash
npm run dev
```

### 4) Build frontend

```bash
npm run build
```

## Scripts

### Root

- `npm run dev` - run frontend + backend together
- `npm run dev:client` - run Vite client
- `npm run dev:server` - run Express server with nodemon
- `npm run build` - build client bundle
- `npm run build:client` - build client bundle directly
- `npm run check:server` - run basic backend bootstrap checks

### Server

- `npm --prefix server run dev`
- `npm --prefix server run start`
- `npm --prefix server run check`

## Environment Variables

### Frontend (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend base URL, e.g. `http://localhost:5000/api` |
| `VITE_AUTH0_DOMAIN` | Yes | Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | Yes | Auth0 SPA client id |
| `VITE_AUTH0_AUDIENCE` | Yes | API audience used in access token |

### Backend (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default `5000`) |
| `NODE_ENV` | No | `development` / `production` |
| `MONGO_URI` | Yes | MongoDB connection URI |
| `AUTH0_ISSUER` | Yes | Auth0 issuer URL for JWT verification |
| `AUTH0_AUDIENCE` | Yes | Auth0 API audience for JWT verification |
| `GENERATION_PROVIDER` | No | `mock` or `groq` |
| `GROQ_API_KEY` | If `GENERATION_PROVIDER=groq` | Groq API key |
| `GROQ_MODEL` | No | Groq model name |
| `YOUTUBE_API_KEY` | Recommended | YouTube Data API key for video suggestions |
| `YOUTUBE_CACHE_TTL_MS` | No | YouTube search cache TTL |
| `TTS_PROVIDER` | No | `none` or `streamelements` |
| `TTS_VOICE` | No | TTS voice label |
| `TTS_CACHE_TTL_MS` | No | TTS cache TTL |

## API Endpoints

Base URL: `/api`

### Health
- `GET /health`

### Courses
- `GET /courses`
- `GET /courses/:id`
- `DELETE /courses/:id`
- `POST /courses/:id/claim` (auth required)
- `POST /courses/generate-outline` (auth required)
- `GET /me/courses` (auth required)

### Lessons
- `GET /lessons/:id`
- `POST /lessons/generate`
- `POST /lessons/:id/regenerate`
- `POST /lessons/:id/hinglish`
- `GET /lessons/:id/hinglish-audio`

### Video
- `GET /videos/search?query=...`

## Demo Flow :

1. Sign in.
2. Enter a topic and generate a course outline.
3. Open a module lesson and generate lesson content.
4. Toggle English/Hinglish explanation.
5. Load Hinglish narration audio.
6. Download lesson PDF.

## Suggested Demo Topics

- JavaScript Closures
- React State vs Props
- MongoDB Indexing Basics
- REST API Design for Beginners
- Binary Search and Time Complexity
- System Design Fundamentals for Students

## Deployment Guide (Do not deploy from this doc directly)

### Frontend on Vercel

1. Import GitHub repo in Vercel.
2. Set **Root Directory** to `client`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add frontend env vars in Vercel project settings:
   - `VITE_API_BASE_URL` (point to Render backend `/api` URL)
   - `VITE_AUTH0_DOMAIN`
   - `VITE_AUTH0_CLIENT_ID`
   - `VITE_AUTH0_AUDIENCE`
6. Deploy.

### Backend on Render

1. Create new **Web Service** from repo.
2. Set **Root Directory** to `server`.
3. Runtime: Node 22.
4. Build command: `npm ci`
5. Start command: `npm run start`
6. Add backend env vars:
   - `PORT=5000` (Render usually injects PORT automatically; keep fallback)
   - `NODE_ENV=production`
   - `MONGO_URI`
   - `AUTH0_ISSUER`
   - `AUTH0_AUDIENCE`
   - `GENERATION_PROVIDER`
   - `GROQ_API_KEY` (if using groq)
   - `GROQ_MODEL`
   - `YOUTUBE_API_KEY`
   - `YOUTUBE_CACHE_TTL_MS`
   - `TTS_PROVIDER`
   - `TTS_VOICE`
   - `TTS_CACHE_TTL_MS`
7. Deploy and copy the public backend URL.
8. Update Vercel `VITE_API_BASE_URL` to `${RENDER_BACKEND_URL}/api`.

## GitHub Actions CI

Workflow file: `.github/workflows/ci.yml`

On push/PR, CI runs:
1. dependency install (root/client/server)
2. client build
3. server basic checks

## Keep Render Free Tier Warm (Optional)

Render free web services can sleep after inactivity. To reduce cold starts, this repo includes:

- `.github/workflows/keepalive-render.yml`

It pings your backend health endpoint every 10 minutes.

### Setup

1. Go to GitHub repo -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Add:
   - Name: `RENDER_HEALTHCHECK_URL`
   - Value: `https://text-to-course-ai.onrender.com/api/health` (replace with your backend URL if different)
4. Commit/push workflow file to `main`.
5. Go to **Actions** tab -> **Keep Render Backend Awake**.
6. Click **Run workflow** once manually to verify.

### Notes

- This is best-effort and should not be treated as an official SLA on free tier.
- If you need guaranteed no-sleep behavior, use a paid Render plan.

## Final Sanity Checklist (Pre-handoff)

- [ ] `client/.env` configured with valid Auth0 + API URL
- [ ] `server/.env` configured with MongoDB + Auth0 + provider keys
- [ ] `npm run dev` works locally
- [ ] `npm run build` succeeds
- [ ] `npm run check:server` succeeds
- [ ] Course generation + lesson generation flow works
- [ ] Video search works (if API key provided)
- [ ] Hinglish explanation/audio path behaves as expected
- [ ] Lesson PDF download works for long lessons (multi-page)
- [ ] CI workflow passes on latest commit
