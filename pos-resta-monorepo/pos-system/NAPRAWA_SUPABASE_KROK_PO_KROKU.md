# 🔧 Naprawa Supabase Setup - Krok Po Kroku

## 📋 PLAN

1. ✅ Wybrano Opcję A (Supabase)
2. 🔄 Uzyskaj connection string z Supabase
3. 🗑️ Usuń duplikat backend
4. ⚙️ Skonfiguruj pos-system-backend
5. 🚀 Deploy i migracje
6. 🎨 Skonfiguruj frontend
7. ✅ Testy

---

## KROK 1: Uzyskaj Connection String z Supabase

### Instrukcja:

1. **Otwórz:** https://supabase.com/dashboard
2. **Zaloguj się** (jeśli potrzeba)
3. **Wybierz projekt** POS System
4. W lewym menu kliknij **⚙️ Settings** → **Database**
5. Przewiń do sekcji **"Connection string"**
6. Wybierz format: **URI**
7. Kliknij **"Use connection pooling"** ✅ (WAŻNE!)
8. Skopiuj connection string

**Będzie wyglądać tak:**
```
postgresql://postgres.PROJECT_ID:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

9. **WAŻNE:** Zamień `[YOUR-PASSWORD]` na prawdziwe hasło projektu

### Gdzie znaleźć hasło?

**Opcja A - Znasz hasło:**
- Po prostu zamień `[YOUR-PASSWORD]` w connection string

**Opcja B - Nie pamiętasz:**
1. Settings → Database → **"Reset database password"**
2. Ustaw nowe hasło (np. `SuperSecure123!`)
3. Zapisz je sobie!
4. Użyj w connection string

---

## KROK 2: Dodaj Connection String do Vercel

Po uzyskaniu connection string wykonaj w terminalu:

```powershell
cd C:\Users\mmaci\Desktop\pos-system\apps\backend

# Link do istniejącego projektu
vercel link

# Wybierz:
# - Scope: macieja83s-projects
# - Link to existing project: Yes
# - Project name: pos-system-backend

# Dodaj DATABASE_URL dla produkcji
vercel env add DATABASE_URL production

# Wklej connection string z Supabase (ten z connection pooling!)
# Przykład: postgresql://postgres.abcd:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## KROK 3: Usuń Duplikat Backend

```powershell
# Usuń nowy, niepotrzebny projekt "backend"
vercel remove backend --yes
```

---

## KROK 4: Redeploy Backend z Supabase

```powershell
# Upewnij się że jesteś w apps/backend
cd C:\Users\mmaci\Desktop\pos-system\apps\backend

# Deploy
vercel --prod
```

Poczekaj ~30-60 sekund na deployment.

---

## KROK 5: Uruchom Migracje na Supabase

```powershell
# Ustaw DATABASE_URL lokalnie (wklej swój connection string!)
$env:DATABASE_URL = "postgresql://postgres.PROJECT_ID:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Uruchom migracje
npx prisma migrate deploy

# Załaduj dane testowe
npx tsx prisma/seed.ts
```

---

## KROK 6: Przetestuj Backend

```powershell
# Test health check
curl https://pos-system-backend-two.vercel.app/api/health

# Powinno zwrócić: "db": "connected" (nie "mock"!)

# Test employees
curl https://pos-system-backend-two.vercel.app/api/employees

# Powinno zwrócić listę pracowników z bazy
```

---

## KROK 7: Skonfiguruj Frontend

```powershell
cd ../frontend

# Link do projektu
vercel link

# Wybierz:
# - Scope: macieja83s-projects
# - Link to existing project: Yes
# - Project name: pos-system-frontend

# Ustaw API URL
vercel env add VITE_API_URL production

# Wpisz: https://pos-system-backend-two.vercel.app/api
```

---

## KROK 8: Redeploy Frontend

```powershell
vercel --prod
```

Poczekaj ~30-60 sekund.

---

## KROK 9: TEST END-TO-END

1. Otwórz frontend: https://pos-system-frontend-macieja83s-projects.vercel.app
2. Spróbuj się zalogować (kod: 1234 dla managera)
3. Sprawdź czy widzisz zamówienia
4. Sprawdź menu

---

## ✅ CHECKLIST

- [ ] Connection string Supabase pobrany
- [ ] DATABASE_URL dodany do pos-system-backend
- [ ] Duplikat backend usunięty
- [ ] Backend redeploy wykonany
- [ ] Migracje uruchomione na Supabase
- [ ] Dane testowe załadowane
- [ ] Backend API działa (nie pokazuje "mock")
- [ ] VITE_API_URL ustawiony w frontend
- [ ] Frontend redeploy wykonany
- [ ] Aplikacja działa end-to-end

---

## 🆘 PROBLEMY?

### "Cannot find module @prisma/client"
```powershell
npm install
npx prisma generate
```

### "Connection refused"
- Sprawdź czy używasz connection pooling URL (port 6543)
- Sprawdź czy hasło jest poprawne

### Backend wciąż pokazuje "mock"
- Sprawdź czy DATABASE_URL jest ustawiony w Vercel
- Redeploy: `vercel --prod`

---

*Gotowy? Zacznijmy od Kroku 1 - pobierz connection string z Supabase!*

