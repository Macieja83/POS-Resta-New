# 🚀 FAZA 2: Deployment na Vercel + Vercel Postgres

**Status:** W TRAKCIE  
**Data rozpoczęcia:** 2025-10-13

---

## 🎯 CEL FAZY 2

Wdrożyć pełną aplikację POS System na Vercel z produkcyjną bazą danych PostgreSQL.

### Co osiągniemy:
- ✅ Backend API działające w chmurze
- ✅ Produkcyjna baza Vercel Postgres
- ✅ Frontend dostępny publicznie
- ✅ Pełna integracja frontend ↔ backend ↔ database

---

## 📋 PLAN DZIAŁANIA

### Etap 1: Przygotowanie i Setup Vercel
- [ ] Zainstalować/zaktualizować Vercel CLI
- [ ] Zalogować się do Vercel
- [ ] Sprawdzić strukturę projektu

### Etap 2: Vercel Postgres Database
- [ ] Utworzyć Vercel Postgres database
- [ ] Pobrać connection string
- [ ] Skonfigurować zmienne środowiskowe

### Etap 3: Backend Deployment
- [ ] Przygotować konfigurację `vercel.json` dla backendu
- [ ] Ustawić environment variables w Vercel
- [ ] Deploy backendu
- [ ] Uruchomić migracje Prisma na produkcji
- [ ] Załadować dane testowe

### Etap 4: Frontend Deployment
- [ ] Zaktualizować API URL w frontendzie
- [ ] Przygotować konfigurację dla frontendu
- [ ] Deploy frontendu
- [ ] Połączyć z produkcyjnym backendem

### Etap 5: Testy i Weryfikacja
- [ ] Przetestować wszystkie endpointy API
- [ ] Przetestować frontend end-to-end
- [ ] Sprawdzić logowanie pracowników
- [ ] Sprawdzić tworzenie zamówień
- [ ] Zweryfikować menu i zamówienia

---

## 🔧 WYMAGANIA

### 1. Konto Vercel
- Darmowe konto na https://vercel.com
- Połączone z GitHub (opcjonalnie)

### 2. Vercel CLI
```bash
npm install -g vercel
```

### 3. Projekt Git
- Projekt powinien być w repozytorium Git
- `.gitignore` skonfigurowany poprawnie

---

## 📦 STRUKTURA PROJEKTU

```
pos-system/
├── apps/
│   ├── backend/           # API Backend
│   │   ├── vercel.json    # Konfiguracja Vercel
│   │   └── prisma/        # Migracje bazy
│   └── frontend/          # React Frontend
│       └── vercel.json    # Konfiguracja Vercel
└── packages/
    └── shared/            # Współdzielone typy
```

---

## 🌍 ZMIENNE ŚRODOWISKOWE

### Backend (Produkcja)
```env
# Database
DATABASE_URL="postgres://..." # Z Vercel Postgres
POSTGRES_PRISMA_URL="postgres://..." # Auto-generowane
POSTGRES_URL_NON_POOLING="postgres://..." # Auto-generowane

# App
NODE_ENV=production
PORT=4000

# JWT
JWT_SECRET="super-secret-production-key"

# CORS
CORS_ORIGINS="https://your-frontend.vercel.app,https://pos-system.vercel.app"
```

### Frontend (Produkcja)
```env
VITE_API_URL="https://your-backend.vercel.app/api"
```

---

## 🚀 KROK PO KROKU

### Krok 1: Zainstaluj Vercel CLI

```powershell
npm install -g vercel
```

### Krok 2: Zaloguj się do Vercel

```powershell
vercel login
```

### Krok 3: Utwórz Vercel Postgres

1. Idź do https://vercel.com/dashboard
2. Wybierz projekt lub utwórz nowy
3. Kliknij "Storage" → "Create Database"
4. Wybierz "Postgres"
5. Wybierz region (najbliższy użytkownikom)
6. Skopiuj connection strings

### Krok 4: Deploy Backend

```powershell
cd apps/backend

# Link do projektu Vercel
vercel link

# Ustaw zmienne środowiskowe
vercel env add DATABASE_URL

# Deploy
vercel --prod
```

### Krok 5: Uruchom Migracje na Produkcji

```powershell
# Ustaw DATABASE_URL lokalnie na produkcyjną bazę
$env:DATABASE_URL="postgresql://..."

# Uruchom migracje
npx prisma migrate deploy

# Załaduj dane testowe (opcjonalnie)
npx tsx prisma/seed.ts
```

### Krok 6: Deploy Frontend

```powershell
cd ../frontend

# Link do projektu Vercel
vercel link

# Ustaw API URL
vercel env add VITE_API_URL

# Deploy
vercel --prod
```

---

## ✅ CHECKLIST DEPLOYMENT

### Backend:
- [ ] Vercel project utworzony
- [ ] Vercel Postgres database utworzona
- [ ] Environment variables ustawione
- [ ] Backend wdrożony
- [ ] Migracje wykonane na produkcji
- [ ] Health check działa: `/api/health`
- [ ] Endpointy API działają

### Frontend:
- [ ] Vercel project utworzony
- [ ] VITE_API_URL ustawiony
- [ ] Frontend wdrożony
- [ ] Strona się ładuje
- [ ] Połączenie z API działa
- [ ] Logowanie działa
- [ ] Menu wyświetla się poprawnie

### Integracja:
- [ ] CORS skonfigurowany poprawnie
- [ ] Frontend łączy się z backendem
- [ ] Dane z bazy wyświetlają się
- [ ] Tworzenie zamówień działa
- [ ] Wszystkie funkcje działają

---

## 🔍 WERYFIKACJA PO DEPLOYMENT

### 1. Test API
```powershell
# Health check
curl https://your-backend.vercel.app/api/health

# Employees
curl https://your-backend.vercel.app/api/employees

# Orders
curl https://your-backend.vercel.app/api/orders

# Menu
curl https://your-backend.vercel.app/api/menu/public
```

### 2. Test Frontend
- Otwórz https://your-frontend.vercel.app
- Sprawdź logowanie
- Sprawdź listę zamówień
- Sprawdź menu
- Utwórz testowe zamówienie

---

## ⚠️ TYPOWE PROBLEMY

### 1. CORS Error
**Problem:** Frontend nie może połączyć się z API

**Rozwiązanie:**
```typescript
// Backend: src/app.ts
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:5173'
  ]
}));
```

### 2. Database Connection Error
**Problem:** Prisma nie może połączyć się z bazą

**Rozwiązanie:**
- Sprawdź czy `POSTGRES_PRISMA_URL` jest ustawiony
- Użyj connection pooling URL z Vercel

### 3. Build Error
**Problem:** Vercel build fails

**Rozwiązanie:**
- Sprawdź logi w Vercel dashboard
- Upewnij się że wszystkie dependencies są w `package.json`
- Sprawdź `vercel.json` configuration

### 4. Environment Variables
**Problem:** Zmienne nie są dostępne

**Rozwiązanie:**
```powershell
# Sprawdź zmienne
vercel env ls

# Dodaj brakującą
vercel env add VARIABLE_NAME
```

---

## 📚 DOKUMENTACJA

### Vercel Postgres
https://vercel.com/docs/storage/vercel-postgres

### Prisma z Vercel
https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

### Vercel CLI
https://vercel.com/docs/cli

---

## 💡 WSKAZÓWKI

1. **Connection Pooling:** Vercel Postgres automatycznie dodaje connection pooling - używaj `POSTGRES_PRISMA_URL`

2. **Migracje:** Uruchamiaj `prisma migrate deploy` (nie `migrate dev`) na produkcji

3. **Environment Variables:** Ustawiaj je przez Vercel CLI lub dashboard, nie commituj `.env` do repo

4. **Serverless:** Backend na Vercel działa jako serverless functions - optimize for cold starts

5. **Logs:** Sprawdzaj logi w Vercel dashboard: Project → Deployments → [deployment] → Logs

---

## 🎯 NASTĘPNE KROKI

Po ukończeniu Fazy 2:
- ✅ Aplikacja działa w chmurze
- ✅ Dostępna publicznie
- ✅ Baza danych w produkcji
- ✅ Gotowa do użycia przez użytkowników

**Powodzenia z deploymentem! 🚀**

---

*Dokument utworzony: 2025-10-13*  
*Status: W TRAKCIE*

