# 🔧 Napraw błąd Vercel - Root Directory

## Problem
```
Error: The specified Root Directory ".\" does not exist. Please update your Project Settings.
```

## Rozwiązanie

### Opcja 1: Napraw przez Vercel Dashboard (ZALECANA)

1. **Przejdź do Vercel Dashboard:**
   - Otwórz [vercel.com](https://vercel.com)
   - Przejdź do swojego projektu `pos-system-backend`

2. **Napraw ustawienia projektu:**
   - Przejdź do **Settings** → **General**
   - Znajdź sekcję **"Root Directory"**
   - Zmień z `.\` na **pusty** (zostaw puste)
   - Kliknij **"Save"**

3. **Redeploy:**
   - Przejdź do **Deployments**
   - Kliknij **"Redeploy"** na najnowszym deployment

### Opcja 2: Usuń i utwórz ponownie

1. **Usuń projekt:**
   ```bash
   npx vercel projects remove pos-system-backend
   ```

2. **Utwórz nowy projekt:**
   ```bash
   npx vercel
   ```
   
   **Odpowiedzi:**
   - Set up and deploy? **Y**
   - Which scope? **(wybierz swój)**
   - Link to existing project? **N**
   - What's your project's name? **pos-system-backend**
   - In which directory is your code located? **./** (lub zostaw puste)
   - Want to override the settings? **N**

### Opcja 3: Wdróż z głównego folderu

1. **Przejdź do głównego folderu projektu:**
   ```bash
   cd C:\Users\mmaci\Desktop\pos-system
   ```

2. **Wdróż z określeniem folderu:**
   ```bash
   npx vercel --cwd apps/backend
   ```

### Opcja 4: Użyj Vercel Dashboard (Najłatwiejsze)

1. **Przejdź na [vercel.com](https://vercel.com)**
2. **Kliknij "New Project"**
3. **Importuj z GitHub:**
   - Wybierz repozytorium
   - **Root Directory:** `apps/backend`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

## Po naprawieniu

1. **Połącz bazę danych:**
   - Przejdź do **Storage** w Vercel
   - Znajdź bazę `pos-system-db`
   - Kliknij **"Connect to Project"**
   - Wybierz projekt `pos-system-backend`

2. **Uruchom migracje:**
   ```bash
   npx vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma generate
   npm run db:seed
   ```

3. **Przetestuj:**
   ```bash
   curl https://pos-system-backend.vercel.app/api/health
   ```

## 🎯 Rekomendacja

**Użyj Opcji 4** - to najłatwiejsze i najbardziej niezawodne rozwiązanie. Vercel Dashboard automatycznie skonfiguruje wszystko poprawnie.

