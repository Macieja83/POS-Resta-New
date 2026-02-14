# 🔧 Naprawa 404 na Backend i EmpApp

## Problem

Backend zwraca **404 NOT_FOUND** (z kodem typu `arn1::...`) – to odpowiedź **Vercel**, nie Expressa. Oznacza to, że Vercel nie znalazł żadnej serverless function dla tego adresu.

---

## 🎯 Dwie poprawne konfiguracje backendu

Backend może być deployowany z **jednym z dwóch** Root Directory. Ważne, żeby był **spójny** z resztą ustawień.

### Wariant A: Root = **`pos-system`** (monorepo)

- Repo ma strukturę np. `POS-Resta-New/pos-system/api/`, `pos-system/apps/backend/`.
- **Root Directory:** `pos-system` (albo `pos-system` jeśli repo to sam folder pos-system).
- Używany jest plik **`pos-system/api/index.js`** – ładuje `../apps/backend/dist/app`, build: `pnpm run vercel:backend` z roota (w `pos-system/vercel.json`).

### Wariant B: Root = **`apps/backend`**

- **Root Directory:** `apps/backend` (albo `pos-system/apps/backend` jeśli repo ma nadkatalog `pos-system`).
- Używany jest plik **`apps/backend/api/index.js`** – ładuje `../dist/app`, build: `npm run vercel-build` (w `apps/backend/vercel.json`).

Jeśli ustawisz Root na `pos-system`, a w repozytorium kod jest w `pos-system/`, to **nie ustawiaj** Root na `apps/backend` – wtedy Vercel nie widzi `pos-system/api/index.js` i może zwracać 404. I na odwrót: przy Root = `apps/backend` musi być widoczny **`api/index.js`** wewnątrz tego folderu (już jest i ma poprawny handler).

---

## ✅ ROZWIĄZANIE

### Opcja 1: Ustaw Root Directory w Vercel Dashboard (NAJŁATWIEJSZE)

1. Przejdź na [vercel.com/dashboard](https://vercel.com)
2. Otwórz projekt `pos-system-backend` (lub jak się nazywa)
3. Przejdź do **Settings** → **General**
4. Znajdź **Root Directory**
5. Ustaw na: `apps/backend`
6. Kliknij **Save**
7. Przejdź do **Deployments**
8. Kliknij **Redeploy** na najnowszym deployment

---

### Opcja 2: Dodaj .vercelignore w root

**Problem**: Vercel może widzieć cały monorepo i nie wie który folder deployować.

**Rozwiązanie**: Dodaj `.vercelignore`:

```bash
cd "C:\Users\mmaci\Desktop\POS Resta\pos-system"
```

Stwórz `.vercelignore` w root:
```
apps/frontend
apps/empapp
packages
*.md
node_modules
.git
```

---

### Opcja 3: Oddzielny deployment dla backend

Backend powinien być osobnym projektem Vercel:
- **Project name**: `pos-system-backend`
- **Root Directory**: `apps/backend`
- **Framework**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 🔍 SPRAWDZENIE KONFIGURACJI

### 1. Czy Vercel wykrywa backend?

Sprawdź w Vercel Dashboard:
- **Root Directory** = ?
- **Framework** = Other? Node?
- **Build Command** = ?

### 2. Czy build działa?

```bash
cd apps/backend
npm run build
ls dist/server.js
```

### 3. Czy api/index.js istnieje?

```bash
ls api/index.js
```

---

## 📝 CO TERAZ ZROBIĆ

### Krok 1: Sprawdź Vercel Dashboard

1. Wejdź na [vercel.com/dashboard](https://vercel.com/dashboard)
2. Znajdź projekt backend
3. Sprawdź **Root Directory** w Settings

### Krok 2: Jeśli Root Directory jest złe:

1. Zmień na `apps/backend`
2. Save
3. Redeploy

### Krok 3: Jeśli Root Directory jest OK:

1. Sprawdź **Build Logs**
2. Sprawdź czy build się powiódł
3. Sprawdź czy `dist/server.js` został wdrożony

---

## 🚨 BŁĄD 404 NOT_FOUND (Vercel) – przyczyny

**Możliwe przyczyny**:
1. **Root Directory** – niezgodne ze strukturą repo (np. puste gdy repo ma `pos-system/` w środku → ustaw `pos-system` lub `pos-system/apps/backend`).
2. **Brak pliku `api/index.js`** w wybranym rootcie – przy Root = `pos-system` musi być `pos-system/api/index.js`, przy Root = `apps/backend` musi być `apps/backend/api/index.js`.
3. **Build** – przy Root = `pos-system` build musi tworzyć `apps/backend/dist/` (skrypt `vercel:backend`); przy Root = `apps/backend` – folder `dist/` w tym katalogu.
4. Handler w `api/index.js` musi eksportować **funkcję (req, res)** – nie samą aplikację Express (to już poprawione w obu plikach).

---

## ✅ SZYBKA NAPRAWA

### W Vercel Dashboard:

1. **Backend project** → **Settings** → **General**
2. **Root Directory**: `apps/backend`
3. **Build Command**: `npm run build` (lub `npx tsc`)
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`
6. **Save**
7. **Redeploy**

### Sprawdź czy działa:

```bash
curl https://pos-system-backend-rjmou5bzc-macieja83s-projects.vercel.app/api/health
```

---

## 📞 Co dalej?

**Najważniejsze**: Ustaw Root Directory na `apps/backend` w Vercel Dashboard!

To najszybszy sposób na naprawę 404.

