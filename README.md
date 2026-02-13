# Private Knowledge Q&A

A RAG (Retrieval Augmented Generation) web app where users can upload text documents and ask questions that are answered using only their documents.

## Features

- **Register / Login** – JWT authentication
- **Upload documents** – .txt, .md, .pdf
- **List documents** – See all uploaded documents
- **Ask questions** – Get answers generated from your documents only
- **Source references** – See document name + text snippet for each answer

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Axios
- **Backend**: Node.js, Express, TypeScript, Multer, OpenAI, PostgreSQL, pgvector, Prisma, JWT
- **DevOps**: Docker, Docker Compose

## Project Structure

```
wellfound_pro/
├── frontend/           # Next.js app
│   ├── app/
│   │   ├── page.tsx    # Home (redirect)
│   │   ├── login/      # Login / Register
│   │   ├── upload/     # Upload + document list
│   │   └── chat/       # Q&A chat
│   ├── components/
│   └── lib/            # API client
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   └── prisma/
├── docker-compose.yml
└── README.md
```

## Setup (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector (or use Docker)
- OpenAI API key

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** (`backend/.env`):

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://pkqa:pkqa@localhost:5432/pkqa?schema=public
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
LLM_MODEL=gpt-4o-mini
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Database

Use PostgreSQL with pgvector. If using Docker:

```bash
docker run -d --name pkqa-db -e POSTGRES_DB=pkqa -e POSTGRES_USER=pkqa -e POSTGRES_PASSWORD=pkqa -p 5432:5432 pgvector/pgvector:pg16
```

Then run migrations:

```bash
cd backend && npx prisma migrate deploy
```

### 4. Run the app

**Terminal 1 – Backend:**

```bash
cd backend && npm run dev
```

**Terminal 2 – Frontend:**

```bash
cd frontend && npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000

## How RAG Works

1. **Upload flow**
   - User uploads a file (txt, md, pdf).
   - Backend extracts text, splits into chunks (~800 chars, 100 overlap).
   - Each chunk is embedded with OpenAI `text-embedding-3-small` (1536 dims).
   - Chunks + embeddings are stored in PostgreSQL using pgvector.

2. **Ask flow**
   - User asks a question.
   - Question is embedded with the same model.
   - pgvector similarity search (`<=>` operator) finds top K nearest chunks.
   - Question + retrieved chunks are sent to OpenAI chat model.
   - LLM returns an answer using only the provided context.
   - Response includes answer + source snippets (document name + text).

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register (email, password) |
| POST | `/api/auth/login` | No | Login (email, password) |
| POST | `/api/upload` | Yes | Upload document (multipart/form-data, file) |
| GET | `/api/documents` | Yes | List user's documents |
| POST | `/api/ask` | Yes | Ask question (body: question, documentId?) |

## Run with Docker

```bash
# Create .env in project root with:
# OPENAI_API_KEY=your_key
# JWT_SECRET=your_secret

docker-compose up --build
```

This starts:

- **PostgreSQL** (with pgvector) on port 5432
- **Backend** on http://localhost:4000
- **Frontend** on http://localhost:3000

Open http://localhost:3000 in your browser.

## License

MIT
