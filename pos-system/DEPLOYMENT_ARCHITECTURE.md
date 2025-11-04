# Architektura Deployment - POS System

## 🌐 Projekty Vercel

### Backend
- **URL:** https://pos-system-backend.vercel.app
- **Root Directory:** `apps/backend`
- **Build Command:** `npm run build`
- **Framework:** Node.js (Express)

### Frontend
- **URL:** https://pos-system-frontend.vercel.app
- **Root Directory:** `apps/frontend`
- **Build Command:** `npm run build`
- **Framework:** Vite (React)

## 🗄️ Baza Danych

### Provider
- **Nazwa:** Supabase PostgreSQL
- **Region:** EU Central (Frankfurt)
- **Connection:** Pooled via PgBouncer

### Connection Strings
```env
# Pooling URL (dla Prisma runtime)
DATABASE_URL="postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connect_timeout=15"

# Direct URL (dla migracji)
DIRECT_DATABASE_URL="postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres?connect_timeout=15"
```

## 🔧 Environment Variables

### Backend (`pos-system-backend`)
```env
DATABASE_URL="postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_DATABASE_URL="postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres?connect_timeout=15"
NODE_ENV="production"
JWT_SECRET="your-super-secret-production-jwt-key-here"
CORS_ORIGINS="https://pos-system-frontend.vercel.app"
API_URL="https://pos-system-backend.vercel.app/api"
```

### Frontend (`pos-system-frontend`)
```env
VITE_API_URL="https://pos-system-backend.vercel.app/api"
```

## 🚀 Workflow Deployment

### 1. Backend Deployment
```bash
cd apps/backend
vercel --prod
```

### 2. Database Migration
```bash
# Ustaw environment variables lokalnie
$env:DATABASE_URL = "postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
$env:DIRECT_DATABASE_URL = "postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres"

# Uruchom migracje (używamy db push zamiast migrate deploy dla Supabase)
npx prisma db push --accept-data-loss

# Załaduj dane testowe
npx tsx prisma/seed.ts
```

### 3. Frontend Deployment
```bash
cd apps/frontend
vercel --prod
```

## 🧪 Testowanie

### Backend Health Check
```bash
curl https://pos-system-backend.vercel.app/api/health
```

### API Endpoints
```bash
# Employees
curl https://pos-system-backend.vercel.app/api/employees

# Menu
curl https://pos-system-backend.vercel.app/api/menu/public

# Orders
curl https://pos-system-backend.vercel.app/api/orders
```

### Frontend
- Otwórz: https://pos-system-frontend.vercel.app
- Sprawdź logowanie
- Sprawdź połączenie z API
- Przetestuj tworzenie zamówienia

## 📁 Struktura Plików

```
pos-system/
├── apps/
│   ├── backend/
│   │   ├── vercel.json          # Konfiguracja Vercel dla backendu
│   │   ├── package.json         # Z vercel-build script
│   │   └── src/
│   │       └── app.ts           # Z dynamicznymi CORS i Swagger
│   └── frontend/
│       ├── vercel.json          # Konfiguracja Vercel dla frontendu
│       └── src/
│           └── api/
│               └── client.ts    # API client z /api proxy
└── DEPLOYMENT_ARCHITECTURE.md   # Ten plik
```

## 🔄 Aktualizacje

### Po zmianach w kodzie:
1. **Backend:** Push do GitHub → Vercel automatycznie wdroży
2. **Frontend:** Push do GitHub → Vercel automatycznie wdroży
3. **Database:** Uruchom `prisma db push` jeśli zmieniłeś schema

### Po zmianach w environment variables:
1. Zaktualizuj w Vercel Dashboard
2. Redeploy projektów

## 🚨 Troubleshooting

### Problem: CORS errors
- Sprawdź `CORS_ORIGINS` w environment variables
- Dodaj frontend URL do listy dozwolonych

### Problem: Database connection failed
- Sprawdź `DATABASE_URL` i `DIRECT_DATABASE_URL`
- Upewnij się że baza jest dostępna

### Problem: Build failures
- Sprawdź Vercel build logs
- Upewnij się że wszystkie dependencies są w `package.json`

### Problem: Advisory locks na Supabase
- Użyj `prisma db push` zamiast `migrate deploy`
- Dodaj `--accept-data-loss` jeśli potrzeba

## 📊 Monitoring

### Vercel Dashboard
- **Backend:** https://vercel.com/dashboard → pos-system-backend
- **Frontend:** https://vercel.com/dashboard → pos-system-frontend

### Supabase Dashboard
- **Database:** https://supabase.com/dashboard → Project → Database

### Logs
- **Backend:** Vercel Dashboard → Deployments → [deployment] → Logs
- **Database:** Supabase Dashboard → Logs

---

*Dokument utworzony: 2025-01-13*  
*Status: Production Ready* ✅
