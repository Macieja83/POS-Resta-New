# Wdrożenie POS na Vercel – krok po kroku

Projekt składa się z **dwóch aplikacji** na Vercel: **Backend** (API + baza) i **Frontend** (React). Baza to **Supabase** – ta sama co na localhost.

---

## Przygotowanie

- Repozytorium na GitHubie (np. `POS-Resta-New` z folderem `pos-system` w środku, albo cały repo to `pos-system`).
- Konto na [vercel.com](https://vercel.com).
- W pliku `apps/backend/.env` masz działające: `DATABASE_URL`, `DIRECT_DATABASE_URL` (Supabase pooler), `JWT_SECRET`, `CORS_ORIGINS`.

**Struktura repo:** W katalogu głównym (Root) projektu **Backend** na Vercel muszą być widoczne: folder `api/` (z plikiem `index.js`), folder `apps/` (z `backend` i `frontend`), plik `package.json` oraz `vercel.json`. Jeśli repo ma np. strukturę `POS-Resta-New/pos-system/...`, ustaw **Root Directory** na `pos-system`.

---

## KROK 1: Projekt Backend na Vercel

### 1.1 Nowy projekt

1. Wejdź na [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** – wybierz repozytorium z kodem (np. `POS-Resta-New`).
3. Kliknij **Import**.

### 1.2 Konfiguracja projektu Backend

1. **Project Name:** np. `pos-system-backend` (zapamiętaj – będzie w URL).
2. **Root Directory:**  
   - Kliknij **Edit** przy "Root Directory".  
   - Wskaż folder, w którym jest `api/`, `apps/`, `package.json`.  
   - Jeśli repo to sam `pos-system`, wybierz `pos-system` albo zostaw `.`  
   - Jeśli repo zawiera np. `POS-Resta-New/pos-system`, wybierz `pos-system`.
3. **Framework Preset:** zostaw **Other** (nie Vite, nie Next.js).
4. **Build Command:** zostaw pusty albo ustaw:  
   `npm install && npm run vercel:backend`  
   (w katalogu głównym projektu jest już `vercel.json` z tą komendą – Vercel może go użyć automatycznie).
5. **Output Directory:** zostaw pusty (backend to serverless, nie statyczny export).
6. **Install Command:** `npm install` lub `pnpm install` – tak jak używasz lokalnie.

### 1.3 Zmienne środowiskowe (Backend)

W tym samym ekranie (albo po utworzeniu projektu: **Settings → Environment Variables**) dodaj:

| Nazwa | Wartość | Środowisko |
|-------|---------|------------|
| `DATABASE_URL` | Twój URL Supabase **pooler, port 6543** (jak w `apps/backend/.env`) | Production, Preview |
| `DIRECT_DATABASE_URL` | Twój URL Supabase **pooler, port 5432** (jak w `.env`) | Production, Preview |
| `JWT_SECRET` | Ten sam co lokalnie (albo nowy, długi losowy string) | Production, Preview |
| `CORS_ORIGINS` | `https://twoj-frontend.vercel.app` (na razie wpisz np. `https://pos-system-frontend.vercel.app` – poprawisz po deployu frontendu) | Production, Preview |

Wartości `DATABASE_URL` i `DIRECT_DATABASE_URL` skopiuj z działającego `apps/backend/.env` (Supabase → Project Settings → Database → Connection string, pooler).

### 1.4 Deploy Backend

1. Kliknij **Deploy**.
2. Poczekaj na koniec buildu.
3. Zapisz **adres projektu**, np. `https://pos-system-backend.vercel.app` (albo inny, jeśli zmieniłeś nazwę).

### 1.5 Sprawdzenie Backend

- W przeglądarce: `https://TWOJ-BACKEND-URL.vercel.app/api/health`  
  Powinna być odpowiedź JSON z `"status":"ok"`.
- Jeśli jest błąd 502 / „Backend not fully loaded” – sprawdź **Deployments → ostatni deploy → Logs** (czy build się udał, czy Prisma i `apps/backend/dist` są zbudowane).

---

## KROK 2: Migracje bazy (jeśli jeszcze nie były na tej bazie)

Baza to ta sama Supabase co na localhost. Jeśli migracje i seed już robiłeś na tej bazie – ten krok pomiń.

Lokalnie w terminalu (w katalogu głównym projektu, np. `pos-system`):

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed
```

(Upewnij się, że w `apps/backend/.env` są te same `DATABASE_URL` / `DIRECT_DATABASE_URL` co na Vercel – czyli Supabase.)

---

## KROK 3: Projekt Frontend na Vercel

### 3.1 Nowy projekt

1. Znowu [vercel.com/new](https://vercel.com/new).
2. Wybierz **to samo repozytorium** co dla backendu.
3. Kliknij **Import**.

### 3.2 Konfiguracja projektu Frontend

1. **Project Name:** np. `pos-system-frontend`.
2. **Root Directory:**  
   - **Edit** → wskaż folder **frontendu**, np. `pos-system/apps/frontend` albo `apps/frontend` (zależnie od struktury repo).
3. **Framework Preset:** **Vite** (Vercel powinien wykryć automatycznie).
4. **Build Command:** domyślne (np. `npm run build`).
5. **Output Directory:** `dist`.
6. **Install Command:** `npm install` lub `pnpm install`.

### 3.3 Adres API (rewrite do backendu)

Frontend woła `/api`, a Vercel ma przekierować to na backend.

1. W repozytorium otwórz plik **`apps/frontend/vercel.json`**.
2. W `rewrites` jest wpis:  
   `"destination": "https://pos-system-backend.vercel.app/api/$1"`.
3. **Jeśli** Twój projekt backendu ma inną nazwę (i inny URL), **zamień** `pos-system-backend.vercel.app` na **właściwy adres** z Kroku 1 (np. `https://twoj-projekt-backend.vercel.app`).
4. Zapisz i wypchnij zmiany na GitHub. Potem w Vercel (projekt frontend) zrób **Redeploy**, żeby wczytał nowy `vercel.json`.

### 3.4 Zmienne środowiskowe (Frontend)

Frontend używa względnego `/api`, więc **nie musisz** ustawiać `VITE_API_URL` – rewrites w `vercel.json` wystarczą.  
Jeśli kiedyś dodasz zmienną np. `VITE_API_URL`, wtedy w **Settings → Environment Variables** ustaw ją na URL backendu (np. `https://pos-system-backend.vercel.app/api`).

### 3.5 Deploy Frontend

1. Kliknij **Deploy** (albo po zmianie `vercel.json` zrób **Redeploy**).
2. Zapisz URL frontendu, np. `https://pos-system-frontend.vercel.app`.

---

## KROK 4: CORS i ostatnie poprawki

1. W Vercel: projekt **Backend** → **Settings → Environment Variables**.
2. Zmień **`CORS_ORIGINS`** na dokładny adres frontendu, np.  
   `https://pos-system-frontend.vercel.app`  
   (możesz dodać kilka adresów po przecinku, bez spacji po przecinku).
3. Zapisz i zrób **Redeploy** backendu (Deployments → trzy kropki przy ostatnim deployu → Redeploy).

---

## KROK 5: Test całości

1. Otwórz w przeglądarce URL frontendu (np. `https://pos-system-frontend.vercel.app`).
2. Zaloguj się (np. kody pracowników jak na localhost).
3. Sprawdź listę zamówień, dodawanie zamówienia, mapę – wszystko powinno działać na tej samej bazie Supabase co localhost.

---

## Podsumowanie

| Co | Gdzie |
|----|--------|
| Backend (API) | Osobny projekt Vercel, Root = folder z `api/` i `apps/` |
| Frontend | Osobny projekt Vercel, Root = `apps/frontend` |
| Baza | Supabase (te same URL-e co na localhost) |
| Zmienne backend | `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` |
| Połączenie frontend–backend | `apps/frontend/vercel.json` → rewrite `/api/*` na URL backendu |

---

## Typowe problemy

- **502 na backendzie** – sprawdź logi buildu (czy `npm run vercel:backend` przechodzi, czy jest błąd Prisma/Node). Upewnij się, że Root Directory backendu to ten folder, gdzie jest `api/index.js` i `apps/backend`.
- **Frontend nie łączy się z API** – sprawdź w `apps/frontend/vercel.json`, czy `destination` w rewrite ma dokładnie ten sam URL co backend (z `https://`).
- **CORS** – w backendzie `CORS_ORIGINS` musi zawierać dokładny URL frontendu na Vercel (z `https://`).
- **Baza / migracje** – upewnij się, że w Vercel (Backend) wpisane są te same pooler URL-e Supabase co w lokalnym `.env` (port 6543 i 5432).

Po przejściu tych kroków całość na Vercel działa tak samo jak na localhost z tą samą bazą danych.
