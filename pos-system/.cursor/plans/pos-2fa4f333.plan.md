<!-- 2fa4f333-0f99-47ae-811a-71c2e3e28c96 1823a17f-a90a-4f55-a1a7-aa85a3cf150d -->
# POS System – Plan wdrożenia (Supabase + Vercel A) i workflow

### Cel

- Stabilna prod baza na Supabase Postgres, API na Vercel (oddzielny projekt), frontend na Vercel (oddzielny projekt).
- Spójny workflow: dev→PR→deploy z kontrolą migracji, bez mocków w prod.

### 1) Stan obecny (skrót)

- DB: Prisma + PostgreSQL, `DATABASE_URL` w `apps/backend/prisma/schema.prisma`.
- Start API: `apps/backend/src/server.ts` (eksport default dla Vercel).
- Routing Vercel: `apps/backend/vercel.json` kieruje wszystko do `src/server.ts`.
- Zależność `@supabase/supabase-js` nieużywana w kodzie (do usunięcia).
- Fallback mocków przez `USE_MOCK_DATA` w `apps/backend/src/lib/database.ts` (usunąć dla prod; testy mogą mieć własne mocki).

### 2) Architektura docelowa

- Prod DB: Supabase Postgres.
- Backend: Vercel projekt 1, root `apps/backend`.
- Frontend: Vercel projekt 2, root `apps/frontend`.
- Połączenie w prod:
  - `DATABASE_URL` = Supabase Pooling (PgBouncer, port 6543, `?sslmode=require`).
  - `DIRECT_DATABASE_URL` = Supabase Direct (5432, TLS) – tylko do migracji.
  - (Opcjonalnie) w `schema.prisma` dodać `directUrl = env("DIRECT_DATABASE_URL")` w `datasource db`.

### 3) Dostępy wymagane (Ty robisz w przeglądarce)

- Supabase: zaloguj, utwórz/wybierz projekt, skopiuj 2 connection strings: Pooling i Direct.
- GitHub: repo połączone z Vercel (auto-deploy na push/PR).
- Vercel: dwa projekty (backend, frontend) wskazujące odpowiednie katalogi.

### 4) Backend – konfiguracja środowisk

- `apps/backend/.env` (lokalnie, nie commitować):
  - `DATABASE_URL="postgres://...pooler.supabase.com:6543/postgres?sslmode=require"`
  - `DIRECT_DATABASE_URL="postgresql://...db.<ref>.supabase.co:5432/postgres?sslmode=require"`
  - `JWT_SECRET="<silny_klucz>"`
  - `NODE_ENV="development"`
- Vercel (Settings → Environment Variables) dla projektu backend:
  - `DATABASE_URL` (Production/Preview)
  - `DIRECT_DATABASE_URL` (Production/Preview)
  - `JWT_SECRET` (Production/Preview)

### 5) Prisma i migracje

- (Opcja A – prosto na start) Jednorazowo lokalnie na produkcyjną bazę:
  - Ustaw `DIRECT_DATABASE_URL` na prod.
  - Uruchom: `cd apps/backend`
    - `npx prisma generate`
    - `npx prisma migrate deploy` (aplikuje istniejące migracje na prod)
- (Opcja B – docelowo) CI krok „migrate deploy” przed deployem (GitHub Actions). Na start możemy zostać przy A.
- Seed: tylko dev (`npm run db:seed`), nie wykonywać na prod.

### 6) Vercel backend – build i runtime

- Project root: `apps/backend`.
- Build Command (Vercel Settings): `npm run vercel-build && npx prisma generate`.
- Output: Functions (serverless). Node 20.
- `vercel.json` już kieruje wszystko do `src/server.ts`.
- CORS w `apps/backend/src/app.ts`: dodaj finalne domeny frontu (prod). Obecna lista wygląda OK – dodać rzeczywiste URL-e z Vercel.

### 7) Frontend – konfiguracja

- `apps/frontend` hostowany jako drugi projekt Vercel.
- Vite ENV: `VITE_API_URL=https://<twoj-backend>.vercel.app/api` (Settings → Environment Variables na projekcie frontend lub `.env` lokalnie).

### 8) Porządki i jakość kodu

- Usuń `@supabase/supabase-js` z `apps/backend/package.json` (nieużywane).
- Usuń fallback mocków z runtime prod: wytnij `USE_MOCK_DATA` z `apps/backend/src/lib/database.ts`. Mocki tylko w testach.
- Przejrzyj `apps/backend/src/lib/mockData.ts` – przenieś do testów lub usuń jeśli nieużywane.
- Upewnij testy: `apps/backend/tests/*.spec.ts` przechodzą, lint bez błędów.

### 9) Workflow developerski (Cursor, GitHub Desktop, Vercel)

- Branching: `feat/*`, `fix/*`, `chore/*` od `main`.
- Lokalnie:
  - Backend: `cd apps/backend && cp env.postgresql.example .env` (uzupełnij), `npm i`, `npx prisma generate`, `npm run dev`.
  - Frontend: `cd apps/frontend && npm i && npm run dev`.
- Testy: `npm run test` (jednostkowe i e2e), `npm run lint`.
- Commit przez GitHub Desktop, PR do `main`. Review, squash merge.
- Vercel: preview deployment per PR, produkcja po merge.
- Migracje: przed publikacją – `npx prisma migrate deploy` na prod (Opcja A) lub automatycznie w CI (Opcja B).

### 10) Uruchomienie – checklista produkcyjna

- Supabase gotowe, connection strings sprawdzone (Pooling i Direct działają).
- Prod env na Vercel ustawione: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`.
- Migracje: wykonane `migrate deploy` na prod.
- Backend deploy na Vercel: 200 na `GET /api/health`.
- Frontend deploy: działa, CORS poprawny.

### 11) Monitoring i operacje

- Vercel Logs (API): monitoruj błędy.
- Supabase: Query performance, auth (jeśli użyjemy w przyszłości), logi.
- Rollback: Revert PR → Vercel automatycznie wycofa. Dla destrukcyjnych migracji – przygotować „down” lub backup przed zmianą schematu.

### 12) Standard dodawania funkcji/poprawek

- Każda zmiana bazy: `npx prisma migrate dev --name <nazwa>` → commit migracji.
- PR wymaga: testy OK, lint OK, migracje sprawdzone lokalnie na kopii/test.
- Po merge: migracje deploy na prod (A: ręcznie, B: CI), deploy automatyczny.

### 13) Szybkie komendy (Windows PowerShell)

```bash
# Backend lokalnie
cd apps/backend
$env:DATABASE_URL = '<Pooling URL>'
$env:DIRECT_DATABASE_URL = '<Direct URL>'
npx prisma generate
npx prisma migrate deploy
npm run dev

# Frontend lokalnie
cd ../../apps/frontend
npm run dev
```

### 14) Zmiany w kodzie (krótkie, gdy będziemy implementować)

- `apps/backend/prisma/schema.prisma` (opcjonalnie):
```23:29:apps/backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl ułatwia migracje na Supabase
  directUrl = env("DIRECT_DATABASE_URL")
}
```

- `apps/backend/src/lib/database.ts`: usunąć logikę mocków z prod (pozostawić tylko twarde połączenie Prisma i sensowne logi błędów). 

### 15) Bezpieczeństwo

- Nigdy nie commituj `.env`.
- Silny `JWT_SECRET` i rotacja.
- CORS whitelist tylko dla naszych domen Vercel.
- Supabase: wymuszaj SSL.

### To-dos

- [ ] Potwierdzić dostęp do Supabase, GitHub, Vercel (2 projekty)
- [ ] Skonfigurować Supabase i pobrać Pooling/Direct connection strings
- [ ] Ustawić env na Vercel backend: DATABASE_URL, DIRECT_DATABASE_URL, JWT_SECRET
- [ ] Wygenerować Prisma client i sprawdzić połączenie lokalnie
- [ ] Wykonać prisma migrate deploy na prod (Supabase)
- [ ] Skonfigurować projekt backend na Vercel (root apps/backend, build cmd)
- [ ] Skonfigurować projekt frontend na Vercel (root apps/frontend, VITE_API_URL)
- [ ] Usunąć fallback mocków i nieużywane @supabase/supabase-js
- [ ] Dodać finalne domeny frontu do CORS w app.ts
- [ ] Uruchomić testy/lint i naprawić błędy, upewnić brak mocków w prod
- [ ] Wykonać produkcyjne deploye backend i frontend na Vercel
- [ ] Skonfigurować monitoring logów i spisać runbook operacyjny