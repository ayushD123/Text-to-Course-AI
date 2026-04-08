# Text-to-Learn

Initial MERN monorepo scaffold for the hackathon project.

## Structure

```
.
├─ client/   # Vite + React + Tailwind + React Router
├─ server/   # Node + Express API
└─ package.json (root scripts)
```

## Root Scripts

- `npm run dev` - runs client and server together
- `npm run dev:client` - runs Vite dev server
- `npm run dev:server` - runs Express server with nodemon
- `npm run build:client` - builds client app

## Quick Start

1. Copy env examples:
   - `client/.env.example` -> `client/.env`
   - `server/.env.example` -> `server/.env`
2. Install dependencies:
   - `npm install`
   - `npm --prefix client install`
   - `npm --prefix server install`
3. Run app:
   - `npm run dev`

## API

- `GET /api/health`

Response:

```json
{
  "ok": true,
  "service": "text-to-learn-api"
}
```
