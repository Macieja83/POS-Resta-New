# 📚 Instrukcja: Utworzenie Vercel Postgres Database

## 🎯 CEL

Utworzyć produkcyjną bazę danych PostgreSQL w Vercel i połączyć ją z projektem backend.

---

## 📋 KROK PO KROKU

### Krok 1: Otwórz Dashboard Vercel

1. Otwórz przeglądarkę i przejdź do: https://vercel.com/dashboard
2. Zaloguj się jeśli potrzeba

### Krok 2: Znajdź Projekt Backend

1. W dashboard znajdź projekt **"backend"**
2. Kliknij na niego aby otworzyć szczegóły projektu

### Krok 3: Dodaj Vercel Postgres

1. W górnym menu projektu kliknij zakładkę **"Storage"**
2. Kliknij przycisk **"Create Database"** lub **"Connect Store"**
3. Wybierz **"Postgres"** z listy opcji
4. Pojawi się formularz utworzenia bazy danych

### Krok 4: Skonfiguruj Bazę Danych

1. **Database Name:** Zostaw domyślną (np. `pos-system-db`) lub wpisz własną
2. **Region:** Wybierz **najbliższy region** (np. `fra1` dla Europy, `iad1` dla USA East)
   - Im bliżej użytkowników, tym szybsze połączenia
3. Kliknij **"Create"**

⏳ Tworzenie bazy zajmie **30-60 sekund**.

### Krok 5: Połącz Bazę z Projektem

1. Po utworzeniu bazy pojawi się ekran z opcjami
2. Wybierz projekt **"backend"** z listy
3. Kliknij **"Connect"**

✅ Vercel automatycznie doda zmienne środowiskowe do projektu backend:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Krok 6: Weryfikacja

1. Przejdź do projektu **backend**
2. Kliknij **Settings** → **Environment Variables**
3. Sprawdź czy zmienne `POSTGRES_*` są obecne

✅ Jeśli widzisz zmienne - baza jest gotowa!

---

## 📋 SCREENSHOT GUIDE

### 1. Dashboard Vercel
```
┌─────────────────────────────────────┐
│  [Logo] Vercel Dashboard            │
├─────────────────────────────────────┤
│  Your Projects:                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  backend  [Production]     │◄── Kliknij tutaj
│  │  https://backend-...       │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 2. Storage Tab
```
┌─────────────────────────────────────┐
│  backend                            │
├─────────────────────────────────────┤
│  Overview | Deployments | Storage  │◄── Kliknij
│                                     │
│  ┌────────────────────────────┐    │
│  │  [+] Create Database       │◄── Kliknij
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 3. Create Database
```
┌─────────────────────────────────────┐
│  Create Database                    │
├─────────────────────────────────────┤
│  Select Database Type:              │
│                                     │
│  [ Postgres ]◄── Wybierz            │
│  [ KV Store ]                       │
│  [ Blob ]                           │
│                                     │
│  Name: pos-system-db                │
│  Region: fra1 (Frankfurt)           │
│                                     │
│  [Create]◄── Kliknij                │
└─────────────────────────────────────┘
```

---

## ✅ PO UTWORZENIU BAZY

Po ukończeniu tych kroków wróć do terminala i wpisz:

```powershell
continue
```

Kontynuujemy automatyczny deployment! 🚀

---

## ⚠️ WAŻNE UWAGI

1. **Region:** Wybierz region bliski użytkownikom:
   - Europa: `fra1` (Frankfurt) lub `ams1` (Amsterdam)
   - USA East: `iad1` (Washington)
   - USA West: `sfo1` (San Francisco)

2. **Darmowy Plan:** Vercel Postgres daje:
   - 256 MB storage (wystarczy dla ~100k zamówień)
   - 60 godzin compute time/miesiąc
   - Connection pooling
   - Automatyczne backupy

3. **Zmienne Środowiskowe:** Nie kopiuj ich ręcznie - Vercel doda je automatycznie

4. **DATABASE_URL vs POSTGRES_PRISMA_URL:**
   - Używaj `POSTGRES_PRISMA_URL` w kodzie
   - To connection pooling URL - lepszy dla serverless

---

## 🔍 TROUBLESHOOTING

### Problem: Nie widzę opcji "Storage"
**Rozwiązanie:** Upewnij się że jesteś w projekcie (nie na głównej stronie dashboard)

### Problem: Nie mogę utworzyć bazy
**Rozwiązanie:** 
- Sprawdź czy masz aktywny plan Vercel (darmowy wystarczy)
- Spróbuj odświeżyć stronę

### Problem: Baza utworzona ale nie ma zmiennych
**Rozwiązanie:**
1. Przejdź do Storage → Twoja baza → Settings
2. Kliknij "Connect to Project"
3. Wybierz "backend"

---

## 📞 GOTOWE?

Gdy ukończysz te kroki:

1. Sprawdź czy zmienne `POSTGRES_*` są w Settings → Environment Variables
2. Wróć do terminala
3. Kontynuuj deployment!

**Czas realizacji: ~3 minuty** ⏱️

---

*Dokument utworzony: 2025-10-13*  
*Status: Aktywny*

