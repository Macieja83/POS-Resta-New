# Nowy projekt Vercel od zera – Backend + Frontend (logowanie kodami jak lokalnie)

Ten przewodnik zakłada: **usunięcie starych projektów** na Vercel i **utworzenie dwóch nowych** (Backend, Frontend) z poprawnymi ustawieniami, z tą samą bazą Supabase co lokalnie, żeby logowanie kodami użytkowników działało tak samo.

---

## Wymagania przed startem

- Repozytorium z kodem na GitHubie (np. `POS-Resta-New` z folderem `pos-system` w środku).
- Konto Vercel (możesz zalogować się przez GitHub).
- Działające lokalnie zmienne z **`apps/backend/.env`** (Supabase):
  - `DATABASE_URL`
  - `DIRECT_DATABASE_URL`
  - `JWT_SECRET`

Te same wartości użyjesz na Vercel w projekcie Backend.

---

## Krok 0: Usunięcie starych projektów (opcjonalnie)

1. Wejdź na [vercel.com/dashboard](https://vercel.com/dashboard).
2. Dla każdego starego projektu (np. stary frontend, stary backend):
   - Otwórz projekt → **Settings** → na dole **Delete Project**.
   - Potwierdź usunięcie.

Potem utworzysz dwa nowe projekty.

---

## Krok 1: Projekt Backend na Vercel

### 1.1 Utworzenie projektu

1. [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** – wybierz repozytorium z kodem (np. `POS-Resta-New`).
3. Kliknij **Import**.

### 1.2 Konfiguracja (przed pierwszym deployem)

Ustaw **dokładnie** (ważne: Root Directory od struktury repo):

| Ustawienie | Wartość |
|------------|--------|
| **Project Name** | `pos-system-backend` (wtedy URL będzie `https://pos-system-backend.vercel.app`) |
| **Root Directory** | **`pos-system`** – jeśli repo ma w środku folder `pos-system`. Jeśli całe repo to już `pos-system`, zostaw **puste** lub `.` |
| **Framework Preset** | **Other** |
| **Build Command** | `pnpm run vercel:backend` |
| **Output Directory** | `.` (kropka) |
| **Install Command** | `pnpm install` |

Jeśli Twoje repo ma strukturę **`nazwa-repo/pos-system/...`**, w polu Root Directory wybierz/ wpisz: **`pos-system`**.

**Zapisz** (Save) bez deployu, przejdź do **Settings → Environment Variables**.

### 1.3 Zmienne środowiskowe – Backend

Dodaj (Production + Preview) – **skopiuj wartości z `apps/backend/.env`**:

| Name | Value | Environments |
|------|--------|---------------|
| `DATABASE_URL` | (z `.env` – Supabase **pooler port 6543**) | Production, Preview |
| `DIRECT_DATABASE_URL` | (z `.env` – Supabase **pooler port 5432**) | Production, Preview |
| `JWT_SECRET` | (ten sam co lokalnie) | Production, Preview |
| `NODE_ENV` | `production` | Production, Preview |

**CORS:** Backend w kodzie akceptuje już wszystkie domeny `*.vercel.app`, więc **CORS_ORIGINS** nie jest obowiązkowe. Opcjonalnie możesz dodać:

| Name | Value |
|------|--------|
| `CORS_ORIGINS` | `https://pos-system-frontend.vercel.app` (dopisz po pierwszym deployu frontendu) |

### 1.4 Deploy backendu

- **Deploy** (albo **Redeploy**).
- Po zakończeniu skopiuj URL, np. `https://pos-system-backend.vercel.app`.
- Sprawdź: w przeglądarce otwórz `https://pos-system-backend.vercel.app/api/health` – powinien być JSON z `"db":"ok"` (jeśli baza jest ustawiona).

---

## Krok 2: Projekt Frontend na Vercel

### 2.1 Utworzenie projektu

1. Znowu [vercel.com/new](https://vercel.com/new).
2. **Import** tego samego repozytorium (np. `POS-Resta-New`).
3. **Import**.

### 2.2 Konfiguracja

| Ustawienie | Wartość |
|------------|--------|
| **Project Name** | `pos-system-frontend` |
| **Root Directory** | **`pos-system/apps/frontend`** – gdy repo ma folder `pos-system`. Gdy repo = sam `pos-system`, ustaw **`apps/frontend`** |
| **Framework Preset** | **Vite** |
| **Build Command** | `pnpm run build` (domyślne) |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

### 2.3 Zmienna środowiskowa – Frontend

W **Settings → Environment Variables** dodaj (Production + Preview):

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://pos-system-backend.vercel.app/api` |

(Jeśli backend nazwałeś inaczej, wpisz tam URL backendu + `/api`.)

### 2.4 Deploy frontendu

- **Deploy**.
- Skopiuj URL frontendu, np. `https://pos-system-frontend.vercel.app`.

---

## Krok 3: Weryfikacja logowania

1. Otwórz **URL frontendu** (np. `https://pos-system-frontend.vercel.app`).
2. Przejdź do logowania pracowników (kodami) – ta sama strona co lokalnie.
3. Wpisz **kod użytkownika** taki sam jak w bazie (ta sama baza Supabase co lokalnie).
4. Powinno zalogować tak samo jak na localhost.

Jeśli backend ma inną domenę niż `pos-system-backend.vercel.app`, w projekcie **frontend** na Vercel ustaw **VITE_API_URL** na `https://TWOJ-BACKEND-URL.vercel.app/api` i zrób **Redeploy** frontendu. W pliku **`apps/frontend/vercel.json`** w polu `destination` (rewrite `/api/...`) też wpisz ten sam URL backendu, np. `https://TWOJ-BACKEND-URL.vercel.app/api/$1`.

---

## Szybka tabela – co gdzie ustawić

| Projekt | Root Directory (gdy repo = X/pos-system/...) | Build Command | Ważne zmienne |
|---------|---------------------------------------------|----------------|----------------|
| **Backend** | `pos-system` | `pnpm run vercel:backend` | `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` |
| **Frontend** | `pos-system/apps/frontend` | `pnpm run build` | `VITE_API_URL` = `https://pos-system-backend.vercel.app/api` |

---

## Częste problemy

- **404 NOT_FOUND** na backendzie → sprawdź Root Directory (ma być `pos-system` lub `pos-system/apps/backend` – patrz [VERCEL_FIX_BACKEND.md](./VERCEL_FIX_BACKEND.md)).
- **CORS** przy logowaniu → backend już akceptuje `*.vercel.app`; jeśli masz własną domenę, dopisz ją do `CORS_ORIGINS` w backendzie.
- **Failed to fetch** / brak połączenia z API → sprawdź `VITE_API_URL` we frontendzie (bez końcowego `/`) i że backend działa (`/api/health`).
- **Logowanie nie działa** mimo poprawnego kodu → upewnij się, że w backendzie na Vercel są te same `DATABASE_URL` i `JWT_SECRET` co w `apps/backend/.env` (ta sama baza i ten sam klucz JWT).

Po wykonaniu tych kroków masz **całkowicie nowe** projekty Vercel z poprawnymi ustawieniami i logowaniem kodami tak jak lokalnie.
