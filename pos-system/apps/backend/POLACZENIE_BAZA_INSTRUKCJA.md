# Połączenie backendu z bazą Supabase

## Co jest zrobione

- Prisma Client jest wygenerowany (`npm run db:generate` – wykonane).
- Schemat i migracje są gotowe.
- Backend ładuje zmienne z `apps/backend/.env`.

## Co trzeba ustawić w `.env`

W pliku **`apps/backend/.env`** muszą być poprawne adresy do **poolera** Supabase (nie do `db.xxx.supabase.co`).

### 1. Wejdź do Supabase

1. Otwórz: **https://supabase.com/dashboard**
2. Zaloguj się i wybierz projekt (np. ten z refem `bkspihtumggygnypwhyj`).
3. Jeśli projekt ma status **Paused** – kliknij **Restore project**.

### 2. Pobierz connection stringi (pooler)

1. W lewym menu: **Settings** (zębatka) → **Database**.
2. Przewiń do **Connection string**.
3. Wybierz **URI** i skopiuj:
   - **Transaction mode** (port **6543**) → wklej jako `DATABASE_URL`
   - **Session mode** (port **5432**, ten sam host `pooler.supabase.com`) → wklej jako `DIRECT_DATABASE_URL`

Oba adresy muszą być w formacie:

- `postgresql://postgres.[PROJECT_REF]:[HASLO]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?...`
- `postgresql://postgres.[PROJECT_REF]:[HASLO]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`

**Nie używaj** adresu typu `db.xxx.supabase.co:5432` – często nie działa (ENOTFOUND / Can't reach database server).

### 3. Edytuj `apps/backend/.env`

Ustaw (wklej swoje wartości z dashboardu):

```env
# Pooler – port 6543 (dla aplikacji)
DATABASE_URL="postgresql://postgres.TWOJ_PROJECT_REF:HASLO@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Pooler – port 5432 (dla migracji Prisma)
DIRECT_DATABASE_URL="postgresql://postgres.TWOJ_PROJECT_REF:HASLO@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

- Zamień `TWOJ_PROJECT_REF` na ref projektu (np. `bkspihtumggygnypwhyj`).
- Zamień `HASLO` na hasło do bazy (znaki specjalne w URL zakoduj, np. `!` → `%21`, `@` → `%40`).
- Region w hostcie może być inny (np. `aws-1-eu-central-1`) – użyj dokładnie tego, co pokazuje Supabase.

### 4. Uruchom migracje i sprawdź połączenie

W katalogu `apps/backend`:

```powershell
npx prisma migrate deploy
node check-db-connection.js
npm run dev
```

Potem sprawdź: **http://localhost:4000/api/health** – powinno być `"db":"connected"`.

---

## Podsumowanie

| Problem | Rozwiązanie |
|--------|-------------|
| `ENOTFOUND db.xxx.supabase.co` | Użyj w `.env` adresów z **pooler.supabase.com** (6543 i 5432), nie `db.xxx.supabase.co`. |
| `Can't reach database server` | To samo – w `DIRECT_DATABASE_URL` ustaw Session pooler (port 5432 na poolerze). |
| Projekt wstrzymany | W Supabase Dashboard: Restore project. |

Po poprawieniu `.env` uruchom ponownie: `npx prisma migrate deploy`, potem `npm run dev`.
