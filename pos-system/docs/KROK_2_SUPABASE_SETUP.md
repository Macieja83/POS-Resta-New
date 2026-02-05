# 🎯 KROK 2: Konfiguracja Supabase (TERAZ TO ROBIMY!)

## Cel
Skonfigurować bazę danych PostgreSQL na Supabase i pobrać 2 connection stringi potrzebne do działania aplikacji.

---

## 📋 Instrukcja krok po kroku

### 2.1 Przejdź do Dashboard Supabase
1. Otwórz przeglądarkę
2. Wejdź na: **https://supabase.com/dashboard/projects**
3. Zaloguj się (już masz dostęp ✅)

---

### 2.2 Wybierz lub utwórz projekt

**OPCJA A - Jeśli masz już projekt "pos-system" lub podobny:**
- Kliknij na ten projekt
- Przejdź do sekcji **Settings** (ikona zębatki w lewym menu na dole)

**OPCJA B - Jeśli nie masz jeszcze projektu:**
1. Kliknij **"New Project"** (zielony przycisk)
2. Wypełnij formularz:
   - **Name**: `pos-system`
   - **Database Password**: Wygeneruj silne hasło (zapisz je! Będzie potrzebne)
   - **Region**: Wybierz **Europe (Frankfurt)** lub najbliższy region
   - **Pricing Plan**: Free (wystarczy na start)
3. Kliknij **"Create new project"**
4. Poczekaj 2-3 minuty aż projekt się utworzy (zobaczysz pasek postępu)

---

### 2.3 Pobierz Connection Strings

Teraz musimy skopiować 2 URL-e do bazy danych:

#### 2.3.1 Przejdź do ustawień bazy
1. W lewym menu kliknij **Settings** (ikona zębatki na dole)
2. Kliknij **Database** w submenu

#### 2.3.2 Znajdź sekcję "Connection String"
Przewiń w dół do sekcji **"Connection parameters"** lub **"Connection string"**

#### 2.3.3 Skopiuj POOLING URL (dla aplikacji)
1. Znajdź zakładkę lub opcję **"Connection pooling"** lub **"Session mode"**
2. Skopiuj URL który zawiera **`:6543`** (port 6543)
3. Powinien wyglądać tak:
   ```
   postgres://postgres.[project-ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
4. **DODAJ NA KOŃCU**: `?sslmode=require`
5. Finalny format:
   ```
   postgres://postgres.[project-ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

#### 2.3.4 Skopiuj DIRECT URL (dla migracji)
1. Znajdź zakładkę lub opcję **"Direct connection"** lub **"Transaction mode"**
2. Skopiuj URL który zawiera **`:5432`** (port 5432)
3. Powinien wyglądać tak:
   ```
   postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres
   ```
4. **DODAJ NA KOŃCU**: `?sslmode=require`
5. Finalny format:
   ```
   postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
   ```

---

## ✅ Co powinieneś teraz mieć

Dwa URL-e, które wyglądają tak:

```bash
# POOLING URL (port 6543) - do użytku aplikacji
DATABASE_URL="postgres://postgres.abcdefgh:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"

# DIRECT URL (port 5432) - tylko do migracji
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.abcdefgh.supabase.co:5432/postgres?sslmode=require"
```

---

## 📝 ZADANIE DLA CIEBIE

**Skopiuj te 2 URL-e i wklej je w odpowiedzi** (zamień `[PASSWORD]` na prawdziwe hasło).

Format odpowiedzi:
```
POOLING: postgres://postgres...
DIRECT: postgresql://postgres...
```

**Jak tylko mi je prześlesz, przejdziemy do KROKU 3!** 🚀

---

## 🆘 Problemy?

**Nie widzę sekcji Connection String:**
- Upewnij się że projekt jest w pełni utworzony (status "Active")
- Odśwież stronę
- Sprawdź czy jesteś w Settings → Database

**Hasło nie działa:**
- Możesz zresetować hasło w Settings → Database → Database password → Reset

**Nie wiem które URL wybrać:**
- **POOLING** = zawiera `pooler.supabase.com` i port `:6543`
- **DIRECT** = zawiera `db.[project].supabase.co` i port `:5432`

