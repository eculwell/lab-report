# Lab Report Builder

A Next.js app for streamlined lab report creation. Professors set up labs with questions; students fill them in and export to PDF.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/professor` | Professor | Create/edit lab with questions |
| `/student/lab/[labId]` | Student | Fill in answers |
| `/student/print/[submissionId]` | Student | Review & print/save as PDF |

## Local development

```bash
# 1. Copy env
cp .env.example .env

# 2. Start Postgres + MinIO via Docker
docker compose up db minio -d

# 3. Install and migrate
npm install
npx prisma generate
npx prisma db push

# 4. Run dev server
npm run dev
```

App runs at http://localhost:3000.
MinIO console at http://localhost:9001 (login with MINIO_ACCESS_KEY / MINIO_SECRET_KEY).

## Production (Docker)

```bash
cp .env.example .env
# Edit .env with real secrets

# Build and run everything
docker compose up --build -d

# Run migrations (first deploy or after schema changes)
docker compose run --rm migrate
```

## Key files

```
src/
  app/
    api/
      labs/           GET list, POST create, GET/PUT/DELETE by id
      submissions/    POST create (multipart), GET by id with presigned URLs
    professor/        Lab setup page
    student/
      lab/[labId]/    Student submission page
      print/[id]/     Print-ready report
  components/
    lab-report/
      QuestionCard    Sortable question card (dnd-kit)
  lib/
    prisma.ts         Prisma singleton
    minio.ts          MinIO client + helpers
  types/              Shared TypeScript types
prisma/
  schema.prisma       DB schema
docker/
  nginx.conf          Reverse proxy config
```

## Adding BetterAuth

The stack includes BetterAuth (10-BetterAuth) — wire it in at `src/lib/auth.ts` and add middleware to protect `/professor` routes by role. Students access labs via direct URL (no login required).
