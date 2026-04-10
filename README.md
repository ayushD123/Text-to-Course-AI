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

### MongoDB

- Backend now requires MongoDB.
- Configure `MONGO_URI` in `server/.env`.
- Example in `server/.env.example` uses local MongoDB:

```env
MONGO_URI=mongodb://127.0.0.1:27017/text_to_learn
```

### Outline generation provider

- `GENERATION_PROVIDER` controls course outline generation provider:
  - `mock` (default): deterministic local mock generator
  - `groq`: uses Groq via official Node SDK (`groq-sdk`)
- `GROQ_API_KEY` is required only when `GENERATION_PROVIDER=groq`.
- `GROQ_MODEL` is optional (default: `llama-3.3-70b-versatile`).

Example:

```env
GENERATION_PROVIDER=mock
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

Notes:

- Lesson generation (`POST /api/lessons/generate`) remains on the existing mock generator in this step.
- If Groq returns malformed JSON, the server does one repair attempt, then returns a clean API error.

## API

- `GET /api/health`
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses/generate-outline`
- `GET /api/lessons/:id`
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
    "id": "67f5f95e1a5e2639da9e8e01",
    "topic": "JavaScript closures",
    "title": "Javascript Closures Course",
    "description": "A practical and beginner-friendly course outline for Javascript Closures.",
    "tags": ["javascript-closures", "javascript", "closures", "beginner-friendly"],
    "modules": [
      {
        "id": "67f5f95e1a5e2639da9e8e02",
        "title": "Javascript Closures Module 1",
        "order": 1,
        "lessons": [
          {
            "id": "67f5f95e1a5e2639da9e8e03",
            "title": "Javascript Closures Lesson 1.1",
            "order": 1,
            "status": "stub"
          }
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
  "lessonId": "67f5f95e1a5e2639da9e8e03"
}
```

Response (shape):

```json
{
  "ok": true,
  "data": {
    "id": "67f5f95e1a5e2639da9e8e03",
    "courseId": "67f5f95e1a5e2639da9e8e01",
    "moduleId": "67f5f95e1a5e2639da9e8e02",
    "title": "Javascript Closures Lesson 1.1",
    "status": "generated",
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

### GET /api/courses

Returns all saved courses (without nested modules).

### GET /api/courses/:id

Returns a single course with nested modules and lesson stubs/generated lesson statuses.

### GET /api/lessons/:id

Returns one lesson by id, including generated content if already generated.

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
