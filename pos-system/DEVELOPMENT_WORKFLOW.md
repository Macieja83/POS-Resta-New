# Development Workflow - POS System

## Analiza Obecnej Architektury

### Struktura Projektu
```
pos-system/
├── apps/
│   ├── backend/           # Express + Prisma + PostgreSQL
│   │   ├── src/           # TypeScript source
│   │   ├── dist/          # Compiled JS (deployed to Vercel)
│   │   ├── prisma/        # Schema + migrations + seed
│   │   └── vercel.json    # Vercel config (builds dist/server.js)
│   └── frontend/          # React + Vite + TypeScript
│       ├── src/           # React components + API client
│       ├── dist/          # Build output
│       └── vercel.json    # Vercel config (rewrites /api/* to backend)
├── packages/shared/       # Shared types (DTO, menu)
└── package.json           # Root workspace manager
```

### Kluczowe Połączenia
1. **Database**: Supabase PostgreSQL (SHARED dla localhost i Vercel)
   - Connection pooler (port 6543) dla serverless/Vercel
   - Direct connection (port 5432) dla migrations
   
2. **Localhost**:
   - Backend: `http://localhost:4000/api/*`
   - Frontend: `http://localhost:5173` → API calls go to `/api/*` (Vite proxy)
   
3. **Vercel Production**:
   - Backend: `https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app`
   - Frontend: `https://pos-system-frontend-flax.vercel.app`
   - Frontend rewrites `/api/*` to backend URL

4. **Vercel Auto-Deploy**:
   - GitHub push to `main` → auto-deploy backend + frontend
   - Vercel runs `vercel-build` scripts automatically

5. **Environment Variables**:
   - Localhost: `apps/backend/.env` (gitignored)
   - Vercel: Dashboard → Project Settings → Environment Variables

## Workflow dla Zmian i Poprawek

### Zasada Główna: LOCALHOST FIRST, VERCEL SECOND

Zawsze testuj lokalnie przed deploymentem na produkcję!

---

## SCENARIUSZ 1: Nowa Funkcjonalność (duża zmiana)

**Kiedy**: Dodajesz nową feature, zmiany w wielu plikach, zmiany w DB schema

**Workflow**:

### Krok 1: Przygotowanie
```bash
# 1. Upewnij się że main jest aktualny
git checkout main
git pull origin main

# 2. Utwórz feature branch
git checkout -b feature/nazwa-funkcji

# Przykład: git checkout -b feature/payment-methods
```

### Krok 2: Development na Localhost

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev
# Serwer na http://localhost:4000

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
# Aplikacja na http://localhost:5173
```

**Wprowadź zmiany w plikach:**

- Backend: `apps/backend/src/`
- Frontend: `apps/frontend/src/`
- Shared types: `packages/shared/src/`

**Testuj w przeglądarce**: `http://localhost:5173`

### Krok 3: Zmiany w Bazie Danych (jeśli potrzebne)

```bash
cd apps/backend

# 1. Edytuj schema
nano prisma/schema.prisma
# Dodaj nowe pola/modele

# 2. Utwórz migrację
npm run db:migrate
# Wpisz nazwę migracji: np. "add_payment_method_field"

# 3. Regeneruj Prisma Client
npm run db:generate

# 4. Zrestartuj backend dev server (Ctrl+C → npm run dev)
```

**WAŻNE**: Migracja zostanie wykonana na Supabase - baza jest współdzielona!

### Krok 4: Testy Lokalne

**Checklist testów**:
- [ ] Backend endpoints działają (test w Postman/curl)
- [ ] Frontend wyświetla dane poprawnie
- [ ] Login działa (kod 1234)
- [ ] Nowa funkcjonalność działa end-to-end
- [ ] Brak błędów w konsoli DevTools
- [ ] Brak błędów TypeScript: `npm run typecheck` (w root)
- [ ] Brak błędów ESLint: `npm run lint` (w root)

### Krok 5: Commit i Push

```bash
# Dodaj wszystkie zmiany
git add .

# Commit z opisowym message
git commit -m "feat: add payment methods to orders

- Add paymentMethod field to Order model
- Create payment selection UI in OrderForm
- Update OrdersController to handle payment data
- Add validation for payment methods"

# Push feature branch
git push origin feature/nazwa-funkcji
```

### Krok 6: Merge do Main

**Opcja A - Bezpośredni merge (pracujesz sam)**:
```bash
git checkout main
git merge feature/nazwa-funkcji
git push origin main

# Usuń feature branch
git branch -d feature/nazwa-funkcji
```

**Opcja B - Pull Request (zalecane dla większych zmian)**:
1. Przejdź do GitHub
2. Utwórz Pull Request: `feature/nazwa-funkcji` → `main`
3. Przejrzyj zmiany (self-review)
4. Merge PR
5. Usuń branch

### Krok 7: Weryfikacja Vercel Deployment

```bash
# Vercel auto-deploy z main zajmuje ~2-3 minuty
# Sprawdź status w Vercel Dashboard
```

**Test produkcji**:
1. Otwórz: `https://pos-system-frontend-flax.vercel.app`
2. Zaloguj się (kod 1234)
3. Przetestuj nową funkcjonalność
4. Sprawdź Console → Network → czy nie ma błędów

**Jeśli coś nie działa**:
- Sprawdź logi: Vercel Dashboard → Deployments → Latest → Logs
- Sprawdź env vars: Vercel Dashboard → Settings → Environment Variables
- Rollback: Vercel Dashboard → Deployments → Previous → Promote to Production

---

## SCENARIUSZ 2: Mała Poprawka/Bugfix (szybka zmiana)

**Kiedy**: Typo, poprawka CSS, mała zmiana logiki bez DB changes

**Workflow (uproszczony)**:

```bash
# 1. Przejdź na main
git checkout main
git pull origin main

# 2. Wprowadź zmianę bezpośrednio
nano apps/frontend/src/components/OrderForm.tsx
# Fix bug

# 3. Test lokalnie
npm run dev
# Sprawdź czy fix działa

# 4. Commit i push na main
git add .
git commit -m "fix: correct order total calculation in OrderForm"
git push origin main

# 5. Verify na Vercel (auto-deploy)
# Poczekaj 2-3 min, sprawdź w przeglądarce
```

**UWAGA**: Mimo że to mała zmiana, ZAWSZE testuj lokalnie przed push!

---

## SCENARIUSZ 3: Zmiany w Bazie Danych

**Workflow specjalny dla DB schema changes**:

### Krok 1: Planowanie

**Pytania przed zmianą**:
- Czy to breaking change? (usuwa kolumnę, zmienia typ)
- Czy trzeba migrować istniejące dane?
- Czy wpłynie na produkcję?

### Krok 2: Backup Production Data (zalecane)

```bash
# Supabase Dashboard → Database → Backups → Create Backup
# Lub:
pg_dump -h aws-1-eu-central-1.pooler.supabase.com \
  -U postgres.ijgnqzeljosdpnlssqjp \
  -d postgres > backup.sql
```

### Krok 3: Schema Change na Localhost

```bash
cd apps/backend

# 1. Edit schema
nano prisma/schema.prisma

# Przykład: Dodanie pola
model Order {
  id String @id
  // ... existing fields
  paymentStatus String @default("PENDING") // NEW
}

# 2. Utwórz i uruchom migrację
npm run db:migrate
# Nazwa: "add_payment_status_to_orders"

# To utworzy:
# - prisma/migrations/[timestamp]_add_payment_status_to_orders/migration.sql
# - Wykona migrację na bazie Supabase

# 3. Regeneruj Prisma Client
npm run db:generate

# 4. Zrestartuj dev server
```

### Krok 4: Update Backend Code

```typescript
// apps/backend/src/controllers/orders.controller.ts
// Dodaj nowe pole do responses/requests
```

### Krok 5: Update Frontend Code

```typescript
// apps/frontend/src/types/shared.ts
// Dodaj nowe pole do Order interface

// apps/frontend/src/components/OrdersList.tsx
// Wyświetl nowe pole
```

### Krok 6: Test Kompletny

- [ ] Localhost backend działa
- [ ] Localhost frontend widzi nowe pole
- [ ] Stare zamówienia mają default value ("PENDING")
- [ ] Nowe zamówienia można utworzyć z nowym polem
- [ ] Prisma Studio pokazuje nowe pole

### Krok 7: Commit Migration Files

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git add apps/backend/src/  # Updated backend code
git add apps/frontend/src/  # Updated frontend code
git commit -m "feat: add payment status tracking to orders"
git push origin main
```

### Krok 8: Weryfikacja na Vercel

**Automatyczne**:
- `vercel-build` uruchomi `prisma generate`
- Prisma Client zostanie zaktualizowany

**NIE automatyczne - migracje**:
- Migracja została JUŻ wykonana lokalnie na Supabase
- Baza jest współdzielona, więc Vercel widzi zmiany natychmiast
- Jeśli używasz osobnej bazy dla produkcji, musisz uruchomić:
  ```bash
  # W apps/backend z production DATABASE_URL
  npx prisma migrate deploy
  ```

---

## SCENARIUSZ 4: Rollback (coś poszło nie tak)

### Opcja 1: Rollback przez Vercel (szybkie)

1. Vercel Dashboard → Deployments
2. Znajdź poprzedni working deployment
3. Kliknij "..." → "Promote to Production"
4. Gotowe! (1-2 minuty)

### Opcja 2: Git Revert (bardziej kontrolowane)

```bash
# 1. Znajdź commit do revert
git log --oneline
# abc1234 feat: broken feature
# def5678 fix: working state <- ten chcemy przywrócić

# 2. Revert commit
git revert abc1234

# 3. Push
git push origin main

# 4. Vercel auto-deploy do working state
```

### Opcja 3: Database Rollback (jeśli DB migration poszła źle)

```bash
cd apps/backend

# Przywróć do poprzedniej migracji
npx prisma migrate resolve --rolled-back [migration_name]

# Lub restore z backupu
psql -h aws-1-eu-central-1.pooler.supabase.com \
  -U postgres.ijgnqzeljosdpnlssqjp \
  -d postgres < backup.sql
```

---

## Checklist Przed Każdym Deploymentem

### Pre-Push Checklist

- [ ] Localhost backend działa bez błędów
- [ ] Localhost frontend działa bez błędów
- [ ] `npm run typecheck` (root) - brak błędów TypeScript
- [ ] `npm run lint` (root) - brak błędów ESLint
- [ ] Login działa (kod 1234, 5678, 9012)
- [ ] Główne funkcjonalności działają (zamówienia, menu)
- [ ] Console DevTools - brak errors
- [ ] Database changes przetestowane w Prisma Studio
- [ ] `.env` NIE jest w commitach (sprawdź `.gitignore`)

### Post-Deploy Checklist

- [ ] Vercel deployment sukces (zielony checkmark)
- [ ] Sprawdź logi deployment (brak errors)
- [ ] Test production URL - login działa
- [ ] Test production - główne funkcjonalności działają
- [ ] Sprawdź Sentry/error monitoring (jeśli masz)

---

## Przydatne Komendy

### Development

```bash
# Start całego systemu (backend + frontend)
npm run dev

# Start tylko backendu
npm run dev:backend

# Start tylko frontendu
npm run dev:frontend

# Kill stuck ports (4000, 5173)
npm run predev
```

### Database

```bash
# Prisma Studio (GUI do bazy)
npm run db:studio
# Otwórz: http://localhost:5555

# Nowa migracja
cd apps/backend && npm run db:migrate

# Deploy migrations (production)
cd apps/backend && npm run db:migrate:deploy

# Seed test data
npm run db:seed

# Regeneruj Prisma Client
npm run db:generate
```

### Build & Test

```bash
# Build wszystkiego
npm run build

# Build tylko backend
npm run build:backend

# Build tylko frontend
npm run build:frontend

# TypeScript check (all workspaces)
npm run typecheck

# ESLint (all workspaces)
npm run lint

# Tests
npm run test
```

### Vercel

```bash
# Deploy preview (nie production)
cd apps/backend && vercel
# Lub:
cd apps/frontend && vercel

# Deploy production
vercel --prod

# Zobacz logi
vercel logs [deployment-url]

# Lista deployments
vercel list

# Environment variables
vercel env ls
vercel env add [name]
vercel env rm [name]
vercel env pull .env.vercel  # Pull do lokalnego pliku
```

### Git

```bash
# Status
git status

# Branch nowy
git checkout -b feature/nazwa

# Commit
git add .
git commit -m "type: description"

# Push
git push origin [branch-name]

# Merge do main
git checkout main
git merge feature/nazwa
git push origin main

# Delete branch
git branch -d feature/nazwa
```

---

## Troubleshooting - Najczęstsze Problemy

### Problem 1: Backend nie łączy się z bazą na Vercel

**Objawy**: 500 errors, "database connection failed"

**Rozwiązanie**:
1. Vercel Dashboard → pos-system-backend → Settings → Environment Variables
2. Sprawdź `DATABASE_URL` i `DIRECT_DATABASE_URL`
3. Powinny wskazywać na Supabase pooler (port 6543)
4. Redeploy: Deployments → Latest → Redeploy

### Problem 2: Frontend nie widzi backendu na Vercel

**Objawy**: 404 errors na `/api/*`, CORS errors

**Rozwiązanie**:
1. Sprawdź `apps/frontend/vercel.json` - rewrites:
   ```json
   {
     "source": "/api/(.*)",
     "destination": "https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/$1"
   }
   ```
2. Sprawdź backend CORS_ORIGINS zawiera frontend URL
3. Redeploy frontend

### Problem 3: Prisma Client out of date

**Objawy**: TypeScript errors, "Unknown field" errors

**Rozwiązanie**:
```bash
cd apps/backend
npm run db:generate
# Restart dev server
```

### Problem 4: Migration conflict

**Objawy**: "Migration XYZ is already applied"

**Rozwiązanie**:
```bash
cd apps/backend
npx prisma migrate resolve --applied [migration_name]
```

### Problem 5: Vercel build fails

**Objawy**: Red X na deployment

**Rozwiązanie**:
1. Sprawdź logi: Vercel Dashboard → Deployment → Logs
2. Najczęstsze przyczyny:
   - TypeScript errors → fix lokalnie, push again
   - Missing env vars → dodaj w Vercel Settings
   - Prisma generate failed → sprawdź `vercel-build` script

### Problem 6: Localhost działa, Vercel nie

**Rozwiązanie - Debug systematycznie**:
```bash
# 1. Test backend production
curl https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/health

# 2. Test employees
curl https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/employees

# 3. Sprawdź logi
vercel logs [deployment-url] --follow

# 4. Sprawdź env vars
vercel env ls

# 5. Porównaj z localhost .env
cat apps/backend/.env
```

---

## Bezpieczeństwo i Best Practices

### NIGDY nie commituj:
- `apps/backend/.env` ❌
- `.env.local`, `.env.production` ❌
- `node_modules/` ❌
- Database credentials w kodzie ❌
- API keys hardcoded w kodzie ❌

### ZAWSZE:
- Używaj zmiennych środowiskowych ✅
- Testuj lokalnie przed push ✅
- Commituj Prisma migrations ✅
- Używaj meaningful commit messages ✅
- Keep `.gitignore` up to date ✅

### Commit Message Convention:
```
feat: nowa funkcjonalność
fix: poprawka buga
refactor: refactoring kodu (bez zmian funkcjonalności)
style: formatowanie, CSS changes
docs: dokumentacja
test: dodanie/poprawka testów
chore: maintenance (dependencies, config)
```

---

## Quick Reference - Typowe Scenariusze

### Dodaję nową stronę we frontend
```bash
# 1. Utwórz komponent
touch apps/frontend/src/pages/NewPage.tsx
touch apps/frontend/src/pages/NewPage.css

# 2. Dodaj routing w App.tsx
nano apps/frontend/src/App.tsx

# 3. Test localhost:5173/new-page
npm run dev:frontend

# 4. Commit + push
git add apps/frontend/
git commit -m "feat: add new page"
git push origin main
```

### Dodaję nowy endpoint w backend
```bash
# 1. Utwórz controller
nano apps/backend/src/controllers/newFeature.controller.ts

# 2. Utwórz routes
nano apps/backend/src/routes/newFeature.routes.ts

# 3. Zarejestruj w app.ts
nano apps/backend/src/app.ts
# Dodaj: app.use('/api/new-feature', newFeatureRouter);

# 4. Test
curl http://localhost:4000/api/new-feature

# 5. Commit + push
git add apps/backend/
git commit -m "feat: add new feature API endpoint"
git push origin main
```

### Zmieniam istniejące pole w DB
```bash
# 1. Edit schema
cd apps/backend
nano prisma/schema.prisma
# np. zmień typ pola: String → Int

# 2. Migracja
npm run db:migrate
# Nazwa: "change_field_type_to_int"

# 3. Update backend code (controllers, services)
# 4. Update frontend code (types, components)
# 5. Test end-to-end
# 6. Commit wszystko + push
```

### Aktualizuję dependencies
```bash
# 1. Update package.json
npm update

# Lub konkretny package:
npm install react@latest --workspace=apps/frontend

# 2. Test lokalnie
npm run dev

# 3. Build test
npm run build

# 4. Commit + push
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main
```

---

## Podsumowanie - Złote Zasady

1. **LOCALHOST FIRST** - zawsze testuj przed deploymentem
2. **Feature branches dla dużych zmian** - małe poprawki mogą iść na main
3. **Prisma migrations przez CLI** - nie edytuj ręcznie w Supabase Dashboard
4. **Shared database** - localhost i Vercel używają tej samej Supabase
5. **Auto-deploy z main** - każdy push to deployment
6. **Vercel logs są twoim przyjacielem** - sprawdzaj je gdy coś nie działa
7. **Backup przed dużymi zmianami DB** - lepiej dmuchać na zimne
8. **TypeScript i ESLint przed commitami** - oszczędź sobie debugowania

**Masz działający system. Ten workflow pomoże Ci go nie zepsuć! 🚀**

---

## Konfiguracja Nowych Projektów Vercel

### Dla Przyszłych Deploymentów

Jeśli kiedykolwiek będziesz musiał skonfigurować nowe projekty Vercel (np. dla nowego środowiska lub klona), oto kroki:

#### 1. Backend Project Setup

```bash
cd apps/backend

# Login to Vercel (if not already logged in)
vercel login

# Link to new project
vercel link

# Set up environment variables
vercel env add DATABASE_URL production
vercel env add DIRECT_DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
vercel env add CORS_ORIGINS production

# Deploy
vercel --prod
```

#### 2. Frontend Project Setup

```bash
cd apps/frontend

# Link to new project
vercel link

# Update vercel.json with new backend URL
# Edit apps/frontend/vercel.json:
# {
#   "source": "/api/(.*)",
#   "destination": "https://NEW-BACKEND-URL.vercel.app/api/$1"
# }

# Deploy
vercel --prod
```

#### 3. Environment Variables Template

**Backend Environment Variables:**
```
DATABASE_URL=postgresql://postgres.ijgnqzeljosdpnlssqjp:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres.ijgnqzeljosdpnlssqjp:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:5173
API_URL=https://your-backend-url.vercel.app/api
LOG_LEVEL=info
```

**Frontend Environment Variables:**
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

#### 4. Vercel Project Settings

**Backend Settings:**
- Framework Preset: Other
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Install Command: `npm install`

**Frontend Settings:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### 5. Auto-Deploy Setup

1. Connect GitHub repository to Vercel
2. Set up auto-deploy from `main` branch
3. Configure build settings for each project
4. Set environment variables in Vercel Dashboard

### Troubleshooting New Setup

**Common Issues:**
1. **Build fails**: Check `vercel-build` script in package.json
2. **Environment variables not working**: Verify they're set in Vercel Dashboard
3. **CORS errors**: Update CORS_ORIGINS with new frontend URL
4. **Database connection fails**: Verify DATABASE_URL format and credentials

**Debug Commands:**
```bash
# Check deployment logs
vercel logs [deployment-url]

# Test endpoints
curl https://your-backend-url.vercel.app/api/health

# Verify environment variables
vercel env ls
```