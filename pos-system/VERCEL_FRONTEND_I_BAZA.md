# Vercel – aktualny stan (backend + frontend)

## Aktualna struktura na Vercel

| Projekt na Vercel        | Status   | Rola    | Adres produkcji                    |
|--------------------------|----------|---------|------------------------------------|
| **pos system backend**   | aktywny  | Backend (API) | `https://pos-system-backend.vercel.app` |
| **pos system frontend**  | aktywny  | Frontend (React) | `https://pos-system-frontend-two.vercel.app` |

Oba projekty są połączone: frontend w `vercel.json` przekierowuje `/api/*` na backend.

---

## 1. Sprawdzenie backendu i bazy

**Logowanie kodem użytkownika** wymaga działającego backendu i połączenia z bazą (tabela `Employee`, pole `loginCode`). Jeśli `/api/health` zwraca błąd lub `db: "error"`, logowanie nie zadziała.

1. Otwórz: **https://pos-system-backend.vercel.app/api/health**
2. Odpowiedź musi być **JSON** (np. `{"status":"ok","db":"connected",...}`). Jeśli widzisz kod źródłowy lub błąd 500 – backend nie jest poprawnie wdrożony (handler w `api/index.js` został poprawiony: musi eksportować funkcję `(req, res)`, która po await `createApp()` przekazuje request do Express).
3. W JSON sprawdź pole **`db`**:
   - **`"db": "connected"`** – backend łączy się z bazą; logowanie kodem powinno działać.
   - **`"db": "error"`** / **`"db": "disconnected"`** – ustaw zmienne w Vercel (patrz niżej).

3. **Jeśli baza nie jest połączona:**  
   Vercel → projekt **pos system backend** → **Settings** → **Environment Variables**:
   - `DATABASE_URL` – Supabase pooler, port **6543**
   - `DIRECT_DATABASE_URL` – Supabase pooler, port **5432**
   - `JWT_SECRET` – długi losowy string
   - `CORS_ORIGINS` – `https://pos-system-frontend-two.vercel.app` (oraz inne domeny frontendu po przecinku)  
   Zapisz i zrób **Redeploy** backendu.

4. Sprawdź też: **https://pos-system-backend.vercel.app/api/employees** – lista pracowników = backend + baza działają.

### 404 „Cannot POST /api/employees/login” (request na domenie frontendu)

Jeśli w konsoli widzisz `POST https://pos-system-frontend-two.vercel.app/api/... 404`, request trafia na **frontend**, a nie na backend. W kodzie jest **fallback**: gdy strona działa na `*.vercel.app`, API jest wywoływane pod `https://pos-system-backend.vercel.app/api`. Wypchnij zmiany, zredeployuj frontend i spróbuj ponownie.

### Dlaczego „Nieprawidłowy kod logowania” na Vercel?

Logowanie kodem działa tylko wtedy, gdy:

- **Backend ma połączenie z bazą** – w `/api/health` jest `"db": "connected"`.
- **W bazie produkcyjnej są pracownicy z kodem** – tabela `Employee` musi mieć rekordy z wypełnionym `loginCode` (4 cyfry).

**Co zrobić:**

1. Upewnij się, że w Supabase (baza produkcyjna) są migracje i że tabela `Employee` istnieje.
2. Dodaj przynajmniej jednego pracownika (np. przez panel POS lokalnie, łącząc się z tą samą bazą, albo przez seed / API).
3. Jeśli pracownicy są, ale bez kodu: wywołaj raz **POST**  
   `https://pos-system-backend.vercel.app/api/employees-fix/ensure-login-codes`  
   – wygeneruje brakujące kody. Potem sprawdź **GET** `/api/employees` i zobacz pole `loginCode`.
4. Na stronie logowania po zmianach w kodzie wyświetlany jest **konkretny błąd z API** (np. „Pracownik z kodem … nie został znaleziony” lub „Database connection error”) – to ułatwia diagnozę.

---

## 2. Konfiguracja projektu „pos system backend”

- **Root Directory:** `pos-system`
- **Install Command:** `pnpm install`
- **Build Command:** `pnpm run vercel:backend`
- **Output Directory:** `.` (w `vercel.json` w repo)

---

## 3. Konfiguracja projektu „pos system frontend”

Projekt **pos-system-frontend** jest dodany i wdrożony (produkcja: **https://pos-system-frontend-two.vercel.app**).

- **Rewrite API:** w `apps/frontend/vercel.json` jest `destination`: `https://pos-system-backend.vercel.app/api/$1`
- **CORS:** w backendzie (`apps/backend/src/app.ts`) są m.in. `pos-system-frontend.vercel.app` i `pos-system-frontend-two.vercel.app`
- **Zmienna dla buildu (opcjonalna):** W projekcie frontendu w Vercel możesz ustawić **`VITE_API_URL`** = `https://pos-system-backend.vercel.app/api`. W kodzie jest **fallback**: gdy aplikacja działa na domenie `*.vercel.app`, a zmienna nie jest ustawiona, requesty API i tak trafiają na backend (`pos-system-backend.vercel.app`). Dzięki temu logowanie działa nawet bez tej zmiennej (projekt frontendu używa bowiem `vercel.json` z roota monorepo, więc rewrite `/api` na backend nie obowiązuje i relative `/api` dawałoby 404).

### Kolejne deploye frontendu (z Git lub CLI)

- **Z Git:** Połącz repo z projektem **pos-system-frontend** w Vercel i ustaw:
  - **Root Directory:** `pos-system`
  - **Build Command:** `pnpm run build --filter @pos-system/frontend`
  - **Output Directory:** `apps/frontend/dist`
  - **Install Command:** `pnpm install`

- **Z CLI (prebuilt):** Z poziomu `pos-system`: zbuduj frontend (`pnpm run build --filter @pos-system/frontend`), skopiuj `apps/frontend/dist` do `apps/frontend/.vercel/output/static`, uzupełnij `apps/frontend/.vercel/output/config.json`, w katalogu `apps/frontend` uruchom: `npx vercel deploy --prebuilt --prod`.

---

## 4. Po zmianie domeny frontendu

Jeśli frontend dostanie inną domenę (np. po redeployu):

1. W projekcie **pos system backend** → **Settings** → **Environment Variables** dopisz ją do **`CORS_ORIGINS`** (kilka adresów: przecinek, bez spacji).
2. W **`apps/backend/src/app.ts`** w tablicy `origin` w CORS dopisz nowy URL (jeśli chcesz mieć go na stałe w kodzie).
3. Zrób **Redeploy** backendu.

---

## Podsumowanie

| Co | URL / ustawienie |
|----|-------------------|
| Backend (API) | https://pos-system-backend.vercel.app |
| Frontend (produkcja) | https://pos-system-frontend-two.vercel.app |
| Health / baza | https://pos-system-backend.vercel.app/api/health |
| Rewrite API we frontendzie | `apps/frontend/vercel.json` → `https://pos-system-backend.vercel.app/api/$1` |
