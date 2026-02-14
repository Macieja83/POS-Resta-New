# 🎯 KROK 3: Konfiguracja projektów Vercel (AUTOMATYCZNE)

## Cel
Skonfigurować 2 projekty na Vercel (backend + frontend) i ustawić zmienne środowiskowe.

---

## 📋 Co zostanie zrobione automatycznie

### 3.1 Sprawdzenie istniejących projektów Vercel
- Lista aktualnych projektów
- Identyfikacja projektów związanych z pos-system

### 3.2 Konfiguracja Backend Project
**Ustawienia które zostaną sprawdzone/skonfigurowane:**
- **Project Name**: `pos-system-backend` (lub podobna)
- **Root Directory**: `apps/backend`
- **Build Command**: `npm run vercel-build && npx prisma generate`
- **Output Directory**: (domyślnie dla Node.js)
- **Install Command**: `npm install`
- **Node Version**: 20.x

**Environment Variables** (zostaną dodane automatycznie):
```bash
DATABASE_URL=<Twój POOLING URL z Supabase>
DIRECT_DATABASE_URL=<Twój DIRECT URL z Supabase>
JWT_SECRET=<Wygenerowany bezpieczny klucz>
NODE_ENV=production
```

### 3.3 Konfiguracja Frontend Project
**Ustawienia które zostaną sprawdzone/skonfigurowane:**
- **Project Name**: `pos-system-frontend` (lub podobna)
- **Root Directory**: `apps/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework Preset**: Vite

**Environment Variables** (zostaną dodane automatycznie):
```bash
VITE_API_URL=https://<backend-url>.vercel.app/api
```

---

## 🔄 Co musisz zrobić

### TERAZ (przed KROKIEM 3):
**Prześlij 2 connection stringi z Supabase:**
```
POOLING: postgres://postgres...
DIRECT: postgresql://postgres...
```

### PO OTRZYMANIU URL-i:
1. ✅ Automatycznie utworzymy plik `.env` lokalnie
2. ✅ Automatycznie ustawimy zmienne na Vercel (backend)
3. ✅ Automatycznie wygenerujemy JWT_SECRET
4. ✅ Automatycznie uruchomimy migracje na Supabase
5. ✅ Automatycznie skonfigurujemy CORS
6. ✅ Automatycznie ustawimy VITE_API_URL (frontend)

---

## 📝 Format odpowiedzi (skopiuj i uzupełnij)

```
POOLING: postgres://postgres.abcdefgh:TWOJE_HASLO@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
DIRECT: postgresql://postgres:TWOJE_HASLO@db.abcdefgh.supabase.co:5432/postgres?sslmode=require
```

**Gdy tylko to prześlesz, wszystko zostanie skonfigurowane automatycznie!** 🚀

---

## 🆘 Gdzie znaleźć te URL-e na Supabase?

1. https://supabase.com/dashboard/projects
2. Kliknij swój projekt
3. **Settings** → **Database**
4. Przewiń do **"Connection string"** lub **"Connection parameters"**
5. Skopiuj:
   - **Session mode** / **Connection pooling** (port 6543) → POOLING
   - **Transaction mode** / **Direct connection** (port 5432) → DIRECT
6. Dodaj `?sslmode=require` na końcu każdego URL

