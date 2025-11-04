# 🚀 Wdrożenie na Vercel - Krok po kroku

## Krok 1: Utwórz bazę danych PostgreSQL

1. **Przejdź na Vercel:**
   - Otwórz [vercel.com](https://vercel.com)
   - Zaloguj się do swojego konta

2. **Utwórz bazę danych:**
   - W menu głównym kliknij **"Storage"**
   - Kliknij **"Create Database"**
   - Wybierz **"Postgres"**
   - Nazwa: `pos-system-db`
   - Region: wybierz najbliższy (np. **Frankfurt**)
   - Kliknij **"Create"**

## Krok 2: Wdróż backend

```bash
# Przejdź do folderu backend
cd apps/backend

# Zaloguj się do Vercel
npx vercel login

# Wdróż projekt
npx vercel

# Postępuj zgodnie z instrukcjami:
# - Set up and deploy? Y
# - Which scope? (wybierz swój)
# - Link to existing project? N
# - What's your project's name? pos-system-backend
# - In which directory is your code located? ./
# - Want to override the settings? N
```

## Krok 3: Połącz bazę danych z projektem

1. **W Vercel Dashboard:**
   - Przejdź do swojego projektu `pos-system-backend`
   - Kliknij **"Storage"**
   - Znajdź bazę `pos-system-db`
   - Kliknij **"Connect to Project"**
   - Wybierz projekt `pos-system-backend`

2. **Sprawdź zmienne środowiskowe:**
   - Przejdź do **Settings** → **Environment Variables**
   - Powinny być automatycznie dodane:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`

## Krok 4: Uruchom migracje

```bash
# Pobierz zmienne środowiskowe
npx vercel env pull .env.local

# Uruchom migracje
npx prisma migrate deploy

# Wygeneruj klienta Prisma
npx prisma generate

# Zasiej bazę danych
npm run db:seed
```

## Krok 5: Przetestuj API

```bash
# Sprawdź health check
curl https://pos-system-backend.vercel.app/api/health

# Sprawdź dokumentację API
# Otwórz: https://pos-system-backend.vercel.app/api/docs
```

## Krok 6: Wdróż frontend

```bash
# Przejdź do folderu frontend
cd ../frontend

# Wdróż frontend
npx vercel

# Postępuj zgodnie z instrukcjami:
# - Set up and deploy? Y
# - Which scope? (wybierz swój)
# - Link to existing project? N
# - What's your project's name? pos-system-frontend
# - In which directory is your code located? ./
# - Want to override the settings? N
```

## Krok 7: Skonfiguruj frontend

1. **W Vercel Dashboard (frontend):**
   - Przejdź do **Settings** → **Environment Variables**
   - Dodaj:
     - `VITE_API_URL` = `https://pos-system-backend.vercel.app/api`

2. **Redeploy frontend:**
   - Przejdź do **Deployments**
   - Kliknij **"Redeploy"** na najnowszym deployment

## Krok 8: Przetestuj cały system

1. **Frontend:** `https://pos-system-frontend.vercel.app`
2. **Backend API:** `https://pos-system-backend.vercel.app/api`
3. **Dokumentacja:** `https://pos-system-backend.vercel.app/api/docs`

## 🔧 Rozwiązywanie problemów

### Problem: "Database connection failed"
- Sprawdź czy baza danych jest połączona z projektem
- Sprawdź zmienne środowiskowe w Vercel

### Problem: "Migration failed"
- Uruchom: `npx prisma migrate deploy`
- Sprawdź czy masz uprawnienia do bazy danych

### Problem: "CORS error"
- Sprawdź czy frontend ma poprawny `VITE_API_URL`
- Sprawdź CORS settings w backend

## 📱 Komunikacja z kierowcami

Po wdrożeniu, aplikacja kierowców będzie mogła komunikować się z:

- **Login:** `POST https://pos-system-backend.vercel.app/api/orders/mobile/login`
- **Zamówienia:** `GET https://pos-system-backend.vercel.app/api/orders/geo`
- **Status:** `PATCH https://pos-system-backend.vercel.app/api/orders/:id/status`
- **Przypisanie:** `PATCH https://pos-system-backend.vercel.app/api/orders/:id/assign`

## 🎉 Gotowe!

Twój system POS jest teraz dostępny na Vercel z pełną funkcjonalnością komunikacji z aplikacją kierowców!

