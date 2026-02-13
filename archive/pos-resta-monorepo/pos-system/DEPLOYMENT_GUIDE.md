# Przewodnik wdrożenia na Vercel

## 🚀 Wdrożenie systemu POS na Vercel

### Wymagania
- Konto na Vercel
- Konto na platformie bazy danych (np. Neon, Supabase, PlanetScale)
- Node.js 20+

### 1. Przygotowanie bazy danych PostgreSQL

#### Opcja A: Neon (Zalecana)
1. Przejdź na [neon.tech](https://neon.tech)
2. Utwórz nowy projekt
3. Skopiuj connection string

#### Opcja B: Supabase
1. Przejdź na [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Przejdź do Settings > Database
4. Skopiuj connection string

### 2. Konfiguracja Vercel

#### Frontend
1. Przejdź na [vercel.com](https://vercel.com)
2. Kliknij "New Project"
3. Połącz z repozytorium GitHub
4. Wybierz folder `apps/frontend`
5. Ustaw:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Backend
1. Utwórz nowy projekt Vercel
2. Wybierz folder `apps/backend`
3. Ustaw:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Zmienne środowiskowe

#### Frontend (.env.local)
```env
VITE_API_URL=https://pos-system-backend.vercel.app/api
```

#### Backend (Vercel Environment Variables)
```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
CORS_ORIGINS=https://pos-system-frontend.vercel.app
```

### 4. Migracja bazy danych

Po wdrożeniu backendu:
1. Przejdź do Vercel Dashboard
2. Wybierz projekt backend
3. Przejdź do Functions
4. Uruchom migrację:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Testowanie

1. **Frontend**: `https://pos-system-frontend.vercel.app`
2. **Backend API**: `https://pos-system-backend.vercel.app/api`
3. **Dokumentacja API**: `https://pos-system-backend.vercel.app/api/docs`

### 6. Aplikacja kierowców

Aplikacja kierowców będzie komunikować się z:
- **Login**: `POST https://pos-system-backend.vercel.app/api/orders/mobile/login`
- **Zamówienia**: `GET https://pos-system-backend.vercel.app/api/orders/geo`
- **Aktualizacja statusu**: `PATCH https://pos-system-backend.vercel.app/api/orders/:id/status`

### 7. Monitoring i logi

- **Vercel Dashboard**: Monitoring wydajności
- **Function Logs**: Logi backendu
- **Database Logs**: Logi bazy danych

### 8. Aktualizacje

Po każdej zmianie w kodzie:
1. Push do GitHub
2. Vercel automatycznie wdroży zmiany
3. Sprawdź logi w Vercel Dashboard

### 🔧 Rozwiązywanie problemów

#### Problem: Błąd połączenia z bazą danych
- Sprawdź `DATABASE_URL` w zmiennych środowiskowych
- Upewnij się, że baza danych jest dostępna

#### Problem: CORS errors
- Sprawdź `CORS_ORIGINS` w zmiennych środowiskowych
- Dodaj domenę frontendu do listy dozwolonych

#### Problem: JWT errors
- Sprawdź `JWT_SECRET` w zmiennych środowiskowych
- Upewnij się, że jest taki sam w frontend i backend

### 📱 Komunikacja z aplikacją kierowców

System obsługuje:
- ✅ Autentykację kierowców (4-cyfrowy kod)
- ✅ Przypisywanie zamówień do kierowców
- ✅ Aktualizację statusu zamówień
- ✅ Geolokalizację zamówień
- ✅ Real-time updates (przez polling)

### 🚀 Gotowe!

Twój system POS jest teraz dostępny na Vercel z pełną funkcjonalnością komunikacji z aplikacją kierowców.