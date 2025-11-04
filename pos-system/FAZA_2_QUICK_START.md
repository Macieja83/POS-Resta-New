# ⚡ FAZA 2: Quick Start Guide

## ✅ CO ZOSTAŁO ZROBIONE

1. ✅ Vercel CLI zainstalowane
2. ✅ Zalogowano do Vercel
3. ✅ Backend wdrożony na Vercel
4. ✅ Przygotowano skrypty automatyzacji

**Backend URL:** https://backend-2wlqmmqw5-macieja83s-projects.vercel.app

---

## 🎯 CO MUSISZ TERAZ ZROBIĆ

### KROK 1: Utwórz Vercel Postgres Database (3 minuty)

📖 **Szczegółowa instrukcja:** Zobacz plik `INSTRUKCJA_VERCEL_POSTGRES.md`

**Szybka ścieżka:**

1. Otwórz: https://vercel.com/dashboard
2. Kliknij projekt **"backend"**
3. Zakładka **"Storage"** → **"Create Database"**
4. Wybierz **"Postgres"**
5. Region: **fra1** (Frankfurt) lub najbliższy
6. **Create** → Poczekaj 30-60 sekund
7. **Connect** → Wybierz projekt **"backend"**

✅ Vercel automatycznie doda zmienne środowiskowe do projektu!

---

### KROK 2: Sprawdź Zmienne Środowiskowe

W projekcie **backend** na Vercel:

1. Settings → **Environment Variables**
2. Sprawdź czy istnieją:
   - ✅ `POSTGRES_URL`
   - ✅ `POSTGRES_PRISMA_URL`
   - ✅ `POSTGRES_URL_NON_POOLING`

Jeśli widzisz te zmienne - **gotowe!** 🎉

---

### KROK 3: Uruchom Automatyczny Deployment

W terminalu:

```powershell
cd apps\backend
.\deploy-to-vercel.ps1
```

**Skrypt automatycznie:**
- ✅ Sprawdzi zmienne środowiskowe
- ✅ Wdroży backend z poprawną konfiguracją
- ✅ Uruchomi migracje Prisma na produkcji
- ✅ Zapyta czy załadować dane testowe
- ✅ Poda URL i instrukcje testowania

---

## 📋 ALTERNATYWNA ŚCIEŻKA (Ręczna)

Jeśli skrypt nie działa, wykonaj ręcznie:

```powershell
# 1. Deploy backend
vercel --prod

# 2. Pobierz zmienne środowiskowe
vercel env pull .env.production

# 3. Ustaw DATABASE_URL lokalnie
$env:DATABASE_URL = (Get-Content .env.production | Select-String "POSTGRES_PRISMA_URL").ToString().Split('"')[1]

# 4. Uruchom migracje
npx prisma migrate deploy

# 5. Załaduj dane testowe (opcjonalnie)
npx tsx prisma/seed.ts
```

---

## 🧪 TESTOWANIE

Po deploymencie przetestuj endpointy:

```powershell
$backend = "https://backend-2wlqmmqw5-macieja83s-projects.vercel.app"

curl "$backend/api/health"
curl "$backend/api/employees"
curl "$backend/api/orders"
curl "$backend/api/menu/public"
```

Każdy endpoint powinien zwrócić **200 OK** z danymi JSON.

---

## 🎯 NASTĘPNY KROK - Frontend

Po ukończeniu backendu:

1. Backend działa na produkcji ✅
2. Baza danych jest gotowa ✅
3. Dane testowe załadowane ✅

**Następnie:** Deploy frontendu i połączenie z API

---

## ⏱️ CZAS REALIZACJI

- **Utworzenie bazy:** ~3 minuty
- **Automatyczny deployment:** ~2 minuty
- **Testy:** ~1 minuta

**Total:** ~6 minut ⚡

---

## 🆘 PROBLEMY?

### "Brak zmiennych PostgreSQL"
→ Upewnij się że utworzyłeś bazę i połączyłeś ją z projektem

### "Nie mogę uruchomić skryptu"
→ Użyj ręcznej ścieżki powyżej

### "Migracje nie działają"
→ Sprawdź czy `DATABASE_URL` jest ustawiony: `echo $env:DATABASE_URL`

### "Backend nie odpowiada"
→ Sprawdź logi: `vercel logs`

---

## 📞 GOTOWE?

Gdy ukończysz:
- ✅ Baza utworzona
- ✅ Backend wdrożony ponownie
- ✅ Migracje wykonane
- ✅ Dane załadowane
- ✅ Endpointy działają

**Daj znać - przechodzimy do Frontendu!** 🚀

---

*Dokument utworzony: 2025-10-13*  
*Status: Aktywny - Do wykonania przez użytkownika*

