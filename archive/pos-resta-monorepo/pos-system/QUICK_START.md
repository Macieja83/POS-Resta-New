# 🚀 Szybki start - Baza danych

## Opcja 1: Vercel Postgres (NAJŁATWIEJSZA)

### 1. Utwórz bazę w Vercel
1. Przejdź na [vercel.com](https://vercel.com)
2. **Storage** → **Create Database** → **Postgres**
3. Nazwa: `pos-system-db`
4. Kliknij **Create**

### 2. Połącz z projektem
1. Kliknij **"Connect to Project"**
2. Wybierz swój projekt backend
3. Vercel automatycznie doda zmienne środowiskowe

### 3. Wdróż i przetestuj
```bash
# Wdróż backend
vercel --prod

# Sprawdź czy działa
curl https://your-backend-url.vercel.app/api/health
```

---

## Opcja 2: Neon (Zewnętrzna)

### 1. Utwórz bazę na Neon
1. Przejdź na [neon.tech](https://neon.tech)
2. **Sign Up** → **Create Project**
3. Nazwa: `pos-system`
4. Skopiuj connection string

### 2. Dodaj do Vercel
1. Vercel Dashboard → Twój projekt
2. **Settings** → **Environment Variables**
3. Dodaj:
   - `DATABASE_URL` = connection string z Neon
   - `JWT_SECRET` = wygeneruj klucz
   - `NODE_ENV` = production

### 3. Wdróż
```bash
vercel --prod
```

---

## Opcja 3: Test lokalny (SQLite)

Jeśli chcesz przetestować lokalnie:

### 1. Tymczasowo zmień na SQLite
W `apps/backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 2. Uruchom migracje
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### 3. Przetestuj
```bash
npm run dev
# Otwórz http://localhost:4000/api/health
```

---

## 🎯 Rekomendacja

**Użyj Vercel Postgres** - to najłatwiejsze rozwiązanie:
- ✅ Automatyczna konfiguracja
- ✅ Integracja z Vercel
- ✅ Darmowy plan
- ✅ Automatyczne skalowanie
- ✅ Backup i monitoring

Po skonfigurowaniu bazy danych, Twój system POS będzie gotowy do komunikacji z aplikacją kierowców!

## 📱 Komunikacja z kierowcami

System obsługuje:
- **Login kierowców**: 4-cyfrowy kod
- **Zamówienia**: Z geolokalizacją
- **Status updates**: Real-time
- **Przypisywanie**: Automatyczne i manualne

**API Endpoints:**
- `POST /api/orders/mobile/login`
- `GET /api/orders/geo`
- `PATCH /api/orders/:id/status`
- `PATCH /api/orders/:id/assign`

