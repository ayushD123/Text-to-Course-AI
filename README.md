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
- `POST /api/courses/generate-outline`
- `POST /api/lessons/generate`

Response:

```json
{
  "ok": true,
  "service": "text-to-learn-api"
}
```

### POST /api/courses/generate-outline

Request:

```json
{
  "topic": "JavaScript closures"
}
```

Response (shape):

```json
{
  "ok": true,
  "data": {
    "title": "Javascript Closures Course",
    "description": "A practical and beginner-friendly course outline for Javascript Closures.",
    "tags": ["javascript-closures", "javascript", "closures", "beginner-friendly"],
    "modules": [
      {
        "id": "module-1",
        "title": "Javascript Closures Module 1",
        "lessons": [
          { "id": "m1-l1", "title": "Javascript Closures Lesson 1.1" }
        ]
      }
    ]
  }
}
```

### POST /api/lessons/generate

Request:

```json
{
  "courseTitle": "Javascript Closures Course",
  "moduleTitle": "Javascript Closures Module 1",
  "lessonTitle": "Javascript Closures Lesson 1.1"
}
```

Response (shape):

```json
{
  "ok": true,
  "data": {
    "title": "Javascript Closures Lesson 1.1",
    "objectives": ["..."],
    "content": [
      { "type": "heading", "text": "..." },
      { "type": "paragraph", "text": "..." },
      { "type": "code", "language": "javascript", "code": "..." },
      { "type": "video", "provider": "youtube", "title": "...", "url": "..." },
      { "type": "mcq", "text": "..." }
    ],
    "readings": ["..."],
    "mcqs": [
      {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "answer": "A",
        "explanation": "..."
      }
    ]
  }
}
```

Error response (for validation issues):

```json
{
  "ok": false,
  "error": {
    "message": "Invalid request body",
    "details": ["topic is required and must be a non-empty string"]
  }
}
```
