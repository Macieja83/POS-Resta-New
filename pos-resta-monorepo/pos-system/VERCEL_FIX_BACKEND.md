# 🔧 Naprawa 404 na Backend i EmpApp

## Problem

Backend i EmpApp zwracają błąd 404 na Vercel.

---

## 🎯 Główny problem

**Vercel nie wie gdzie jest backend!**

Vercel deployment wymaga:
1. ✅ **Root Directory** w ustawieniach projektu = `apps/backend`
2. ✅ **vercel.json** w tym folderze
3. ✅ **api/index.js** lub inny handler

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

## 🚨 BŁĄD 404 - DLACZEGO?

Backend 404 = Vercel nie może znaleźć server.js

**Możliwe przyczyny**:
1. Root Directory źle ustawione
2. Build się nie powiódł
3. Plik server.js nie został wdrożony
4. vercel.json źle skonfigurowany

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

