# Checklist Vercel – co sprawdzić w panelu (analiza z repo)

Nie mam dostępu do Twojego konta Vercel. Poniżej jest **analiza konfiguracji z repozytorium** oraz **konkretna checklista**, którą możesz przejść w dashboardzie.

---

## 1. Ważna uwaga: dwa projekty, jeden `vercel.json`

W repo w **rootcie monorepo** (`pos-system/`) jest **jeden** plik **`vercel.json`** – ten jest pod **backend**:

- `buildCommand`: `pnpm run vercel:backend`
- `outputDirectory`: `.`
- `rewrites`: wszystko na `/api/index.js`

Gdy **projekt frontendu** ma **Root Directory** = `pos-system` (albo pusty), Vercel i tak bierze **ten sam** `vercel.json` z roota repo.  
W efekcie **projekt frontendu** mógłby budować backend zamiast frontendu, jeśli nie nadpiszesz ustawień w Vercel.

**Wniosek:** W projekcie **frontendu** w Vercel **musisz nadpisać** Build Command i Output Directory (patrz sekcja 3).

---

## 2. Projekt „pos system backend”

| Ustawienie | Oczekiwana wartość | Gdzie sprawdzić |
|------------|--------------------|------------------|
| **Root Directory** | `pos-system` (albo puste, jeśli repo = pos-system) | Settings → General |
| **Framework Preset** | Other | Settings → General |
| **Build Command** | `pnpm run vercel:backend` | Settings → General (może być z vercel.json) |
| **Output Directory** | `.` | Settings → General |
| **Install Command** | `pnpm install` | Settings → General |
| **Node.js Version** | 20.x | Settings → General |

### Environment Variables (Settings → Environment Variables)

Dla **Production** (i ewentualnie Preview) ustaw:

| Zmienna | Wymagane | Opis |
|---------|----------|------|
| `DATABASE_URL` | Tak | Connection string Supabase (pooler, port 6543) |
| `DIRECT_DATABASE_URL` | Tak | Supabase direct (port 5432), dla migracji |
| `JWT_SECRET` | Tak | Długi losowy string (np. 32+ znaki) |
| `CORS_ORIGINS` | Tak | `https://pos-system-frontend-two.vercel.app` (plus inne domeny frontu po przecinku, bez spacji) |

### Szybki test backendu

- **Health:** https://pos-system-backend.vercel.app/api/health  
  - Odpowiedź: JSON z `"db": "connected"` = baza OK.
- **Pracownicy:** https://pos-system-backend.vercel.app/api/employees  
  - Lista pracowników; jeśli pusta lub bez `loginCode`, logowanie kodem nie zadziała.

---

## 3. Projekt „pos system frontend”

Ten projekt **musi** mieć **nadpisane** Build Command i Output Directory (żeby nie używać ustawień z backendowego `vercel.json`).

| Ustawienie | Oczekiwana wartość | Gdzie sprawdzić |
|------------|--------------------|------------------|
| **Root Directory** | `pos-system` (albo puste, jeśli repo = pos-system) | Settings → General |
| **Framework Preset** | Vite | Settings → General (zalecane) |
| **Build Command** | **Override:** `pnpm run build --filter @pos-system/frontend` | Settings → General |
| **Output Directory** | **Override:** `apps/frontend/dist` | Settings → General |
| **Install Command** | `pnpm install` | Settings → General |

### Opcjonalna zmienna

- **`VITE_API_URL`** = `https://pos-system-backend.vercel.app/api`  
  W kodzie jest już wstrzyknięcie URL w buildzie (`vite.config` + `NODE_ENV=production`), więc **nie jest wymagane**, ale możesz ustawić dla spójności.

### Ważne

Jeśli **Build Command** lub **Output Directory** nie są nadpisane, Vercel zbuduje **backend** (bo weźmie z `vercel.json`) i zwróci błąd albo zły output. Wtedy logowanie dalej będzie dawać 404, bo front nie będzie zbudowany.

---

## 4. Co zrobić krok po kroku w Vercel

1. **Backend**
   - Wejdź w projekt **pos system backend**.
   - **Settings → General:** Root Directory, Build/Output/Install jak wyżej.
   - **Settings → Environment Variables:** uzupełnij `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
   - **Deployments:** zrób **Redeploy** ostatniego deploymentu (żeby wziął zmienne).

2. **Frontend**
   - Wejdź w projekt **pos system frontend**.
   - **Settings → General:**  
     - **Build Command:** `pnpm run build --filter @pos-system/frontend`  
     - **Output Directory:** `apps/frontend/dist`  
     (nadpisanie ma pierwszeństwo nad `vercel.json`).
   - **Deployments:** **Redeploy** z opcją **Clear build cache**, żeby wymusić nowy build z pełnym URL API.

3. **Test**
   - Otwórz https://pos-system-backend.vercel.app/api/health → sprawdź `"db": "connected"`.
   - Otwórz frontend (np. https://pos-system-frontend-two.vercel.app), F12 → Network, logowanie: request powinien iść na `https://pos-system-backend.vercel.app/api/employees/login`, nie na domenę frontendu.

---

## 5. Podsumowanie z analizy repo

| Element | Stan w repo |
|---------|-------------|
| `pos-system/vercel.json` | Backend: build `vercel:backend`, output `.`, rewrites na `api/index.js` |
| `pos-system/api/index.js` | Handler async (req, res) → createApp() → app(req, res) – OK |
| `apps/frontend/vercel.json` | Rewrite `/api/*` na backend – używany tylko gdy projekt ma root w `apps/frontend`; przy root = `pos-system` Vercel używa rootowego `vercel.json` |
| Frontend API URL | Wstrzyknięty w buildzie przez `vite.config` (`__POS_API_BASE__`) gdy `NODE_ENV=production`; build frontu ustawia `NODE_ENV=production` |

**Najczęstsza przyczyna 404 przy logowaniu:** projekt frontendu w Vercel nie ma nadpisanego Build Command / Output Directory i buduje backend zamiast frontendu, albo cache – po nadpisaniu zrób Redeploy z **Clear build cache**.
