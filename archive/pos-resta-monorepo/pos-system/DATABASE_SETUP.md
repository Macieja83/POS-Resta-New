# 🗄️ Konfiguracja bazy danych PostgreSQL

## Opcja 1: Neon (ZALECANA - Darmowa)

### 1. Utwórz konto na Neon
1. Przejdź na [neon.tech](https://neon.tech)
2. Kliknij "Sign Up" i zaloguj się przez GitHub
3. Kliknij "Create Project"

### 2. Skonfiguruj bazę danych
1. Wybierz region (np. Europe - Frankfurt)
2. Nazwa projektu: `pos-system`
3. Kliknij "Create Project"

### 3. Skopiuj connection string
1. Przejdź do Dashboard
2. Kliknij "Connection Details"
3. Skopiuj "Connection String" (wygląda tak):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Ustaw zmienną środowiskową
Utwórz plik `.env` w folderze `apps/backend/`:
```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="development"
```

---

## Opcja 2: Supabase

### 1. Utwórz konto na Supabase
1. Przejdź na [supabase.com](https://supabase.com)
2. Kliknij "Start your project"
3. Zaloguj się przez GitHub

### 2. Utwórz nowy projekt
1. Kliknij "New Project"
2. Wybierz organizację
3. Nazwa: `pos-system`
4. Hasło: wybierz silne hasło
5. Region: wybierz najbliższy

### 3. Skopiuj connection string
1. Przejdź do Settings > Database
2. Skopiuj "Connection string" z sekcji "Connection parameters"
3. Dodaj `?sslmode=require` na końcu

### 4. Ustaw zmienną środowiskową
Utwórz plik `.env` w folderze `apps/backend/`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="development"
```

---

## Opcja 3: Lokalna baza PostgreSQL

### 1. Zainstaluj PostgreSQL
- Windows: Pobierz z [postgresql.org](https://www.postgresql.org/download/windows/)
- Lub użyj Docker:
  ```bash
  docker run --name postgres-pos -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pos_system -p 5432:5432 -d postgres:15
  ```

### 2. Utwórz bazę danych
```sql
CREATE DATABASE pos_system;
```

### 3. Ustaw zmienną środowiskową
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pos_system"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="development"
```

---

## Po skonfigurowaniu DATABASE_URL

Uruchom te komendy:

```bash
# Przejdź do folderu backend
cd apps/backend

# Wygeneruj klienta Prisma
npx prisma generate

# Utwórz migrację
npx prisma migrate dev --name init_postgresql

# Zasiej bazę danych
npm run db:seed
```

## Testowanie połączenia

```bash
# Sprawdź połączenie z bazą
npx prisma db pull

# Otwórz Prisma Studio
npx prisma studio
```

## Dla Vercel

Po skonfigurowaniu lokalnie, dodaj te same zmienne do Vercel:
1. Przejdź do Vercel Dashboard
2. Wybierz projekt backend
3. Przejdź do Settings > Environment Variables
4. Dodaj:
   - `DATABASE_URL` = twój connection string
   - `JWT_SECRET` = twój secret key
   - `NODE_ENV` = production

