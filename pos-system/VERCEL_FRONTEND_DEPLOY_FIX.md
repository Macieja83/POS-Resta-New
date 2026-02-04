# Błąd deployu frontendu (backend zamiast Reacta, handler z api/index.js)

## Błąd: "The specified Root Directory apps/frontend does not exist"

**Przyczyna:** Vercel patrzy na **root repozytorium**. Jeśli repo ma strukturę `POS-Resta-New/pos-system/apps/frontend`, to w rootcie repo **nie ma** folderu `apps/` – jest on wewnątrz `pos-system/`.

**Rozwiązanie:** W **Vercel Dashboard** → projekt frontendu → **Settings → General** → **Root Directory**:

- Zamiast `apps/frontend` ustaw: **`pos-system/apps/frontend`**
- Zapisz i zrób **Redeploy** (z opcją **Clear build cache**).

Jeśli Twoje repo to **sam** katalog `pos-system` (bez nadrzędnego folderu), wtedy Root Directory = **`apps/frontend`** jest poprawne. Błąd „does not exist” oznacza zwykle, że root repo jest poziom wyżej – wtedy zawsze używaj **`pos-system/apps/frontend`**.

---

## Objawy (inny problem: backend zamiast Reacta)

Po wejściu na URL frontendu na Vercel widać:
- kod backendu (handler z `api/index.js`), albo
- JSON z backendu zamiast aplikacji React.

To znaczy, że **Vercel serwuje projekt backendu zamiast frontendu**.

## Dlaczego

W rootcie repo (`pos-system/`) jest **vercel.json dla backendu**: buduje backend i **wszystkie** żądania przekierowuje do `api/index.js`.  
Jeśli projekt **frontendu** w Vercel ma **Root Directory** = `pos-system` (albo puste), Vercel bierze **ten** plik i buduje + serwuje backend. Nadpisanie samego Build Command / Output Directory **nie wystarczy**, bo **rewrites** dalej kierują cały ruch na backend.

---

## Rozwiązanie (obowiązkowe)

**Projekt frontendu** musi mieć Root Directory ustawiony na folder z frontendem, żeby Vercel użył **vercel.json** z tego folderu (statyczny build + rewrites do backendu tylko pod `/api`).

Wejdź w **Vercel Dashboard** → **projekt frontendu** → **Settings → General**:

| Ustawienie | Wartość |
|------------|--------|
| **Root Directory** | **`pos-system/apps/frontend`** (gdy repo to np. POS-Resta-New z folderem pos-system wewnątrz). Gdy repo = sam pos-system: **`apps/frontend`** |
| **Framework Preset** | Vite |
| **Build Command** | `pnpm run build` (domyślne z vercel.json) |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

Zapisz, potem **Redeploy** z **Clear build cache**.

---

### Gdy Root Directory = `pos-system` (niezalecane dla frontu)

Nawet przy nadpisanym Build Command i Output Directory Vercel nadal stosuje **rootowy vercel.json**, w tym rewrites: `"source": "/(.*)", "destination": "/api/index.js"`. Czyli **każde** żądanie idzie na backend – stąd widoczny handler zamiast Reacta. Dla frontendu **zawsze** używaj Root Directory = **`apps/frontend`**.

---

## Zmienna środowiskowa (opcjonalnie)

W **Settings → Environment Variables** dodaj (dla Production i Preview):

- **Name:** `VITE_API_URL`  
- **Value:** `https://pos-system-backend.vercel.app/api`

W kodzie ten URL jest już domyślny w `vite.config.ts`, więc zmienna nie jest obowiązkowa, ale warto ją ustawić dla jasności.

---

## Po zmianach

1. **Zapisz** ustawienia.
2. **Redeploy:** Deployments → trzy kropki przy ostatnim deployu → **Redeploy**.
3. Zaznacz **Clear build cache** i potwierdź.

---

## Sprawdzenie backendu

Frontend woła m.in.:

- `https://pos-system-backend.vercel.app/api/health`
- `https://pos-system-backend.vercel.app/api/employees/login`
- itd.

Otwarcie w przeglądarce samego `https://pos-system-backend.vercel.app/api` może pokazać Swagger UI – to normalne. Ważne, żeby działały konkretne ścieżki jak `/api/health` i `/api/employees/login`.

W projekcie **backendu** w Vercel w **Environment Variables** ustaw też:

- **CORS_ORIGINS** = dokładna domena frontendu, np.  
  `https://twoja-domena-frontendu.vercel.app`  
  (bez końcowego slasha, wiele domen po przecinku bez spacji).

Bez tego przeglądarka zablokuje requesty (CORS).
