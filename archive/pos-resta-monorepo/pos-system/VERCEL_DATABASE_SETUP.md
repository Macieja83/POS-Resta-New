# 🚀 Konfiguracja bazy danych PostgreSQL na Vercel

## Opcja 1: Vercel Postgres (ZALECANA - Najłatwiejsza)

### 1. Utwórz bazę danych w Vercel
1. Przejdź na [vercel.com](https://vercel.com)
2. Zaloguj się do swojego konta
3. Przejdź do **Storage** w menu głównym
4. Kliknij **"Create Database"**
5. Wybierz **"Postgres"**
6. Nazwa: `pos-system-db`
7. Region: wybierz najbliższy (np. Frankfurt)
8. Kliknij **"Create"**

### 2. Połącz bazę z projektem
1. Po utworzeniu bazy, kliknij **"Connect to Project"**
2. Wybierz swój projekt backend
3. Vercel automatycznie doda zmienne środowiskowe:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` 
   - `POSTGRES_URL_NON_POOLING`

### 3. Zaktualizuj Prisma schema
Vercel automatycznie ustawi `DATABASE_URL` na `POSTGRES_PRISMA_URL`, więc nie musisz nic zmieniać!

---

## Opcja 2: Neon (Zewnętrzna baza)

### 1. Utwórz konto na Neon
1. Przejdź na [neon.tech](https://neon.tech)
2. Kliknij **"Sign Up"** i zaloguj się przez GitHub
3. Kliknij **"Create Project"**

### 2. Skonfiguruj bazę danych
1. Nazwa projektu: `pos-system`
2. Region: Europe (Frankfurt)
3. Kliknij **"Create Project"**

### 3. Skopiuj connection string
1. W Dashboard kliknij **"Connection Details"**
2. Skopiuj **"Connection String"**
3. Wygląda tak:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Dodaj do Vercel
1. Przejdź do swojego projektu w Vercel
2. Settings > Environment Variables
3. Dodaj:
   - `DATABASE_URL` = twój connection string z Neon
   - `JWT_SECRET` = wygeneruj silny klucz
   - `NODE_ENV` = production

---

## Po skonfigurowaniu bazy danych

### 1. Lokalne testowanie
```bash
# Przejdź do folderu backend
cd apps/backend

# Skopiuj .env.example do .env i ustaw DATABASE_URL
cp env.postgresql.example .env
# Edytuj .env i ustaw prawidłowy DATABASE_URL

# Wygeneruj klienta Prisma
npx prisma generate

# Utwórz migrację
npx prisma migrate dev --name init_postgresql

# Zasiej bazę danych
npm run db:seed
```

### 2. Wdrożenie na Vercel
```bash
# Wdróż backend
vercel --prod

# Po wdrożeniu, uruchom migracje
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

### 3. Testowanie
```bash
# Sprawdź połączenie
npx prisma db pull

# Otwórz Prisma Studio
npx prisma studio
```

---

## 🔧 Rozwiązywanie problemów

### Problem: "Database does not exist"
- Sprawdź czy `DATABASE_URL` jest poprawnie ustawiony
- Upewnij się, że baza danych została utworzona

### Problem: "Connection refused"
- Sprawdź czy baza danych jest aktywna
- Sprawdź czy region jest poprawny
- Sprawdź czy nie ma problemów z siecią

### Problem: "Migration failed"
- Sprawdź czy masz uprawnienia do tworzenia tabel
- Sprawdź czy schema jest poprawna

---

## 📱 Komunikacja z aplikacją kierowców

Po skonfigurowaniu bazy danych, aplikacja kierowców będzie mogła:
- ✅ Logować się przez API
- ✅ Pobierać przypisane zamówienia
- ✅ Aktualizować status zamówień
- ✅ Otrzymywać geolokalizację zamówień

**API Endpoints:**
- `POST /api/orders/mobile/login` - Logowanie kierowcy
- `GET /api/orders/geo` - Zamówienia z geolokalizacją
- `PATCH /api/orders/:id/status` - Aktualizacja statusu
- `PATCH /api/orders/:id/assign` - Przypisanie kierowcy

---

## 🚀 Gotowe!

Po wykonaniu tych kroków, Twój system POS będzie miał:
- ✅ Bazę danych PostgreSQL na Vercel
- ✅ Automatyczne migracje
- ✅ Komunikację z aplikacją kierowców
- ✅ Skalowalną infrastrukturę

