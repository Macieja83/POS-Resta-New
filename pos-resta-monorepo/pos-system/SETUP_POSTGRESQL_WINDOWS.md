# 🚀 PostgreSQL Setup dla Windows - Krok po Kroku

## Status: PostgreSQL nie wykryto w systemie

Masz 2 opcje instalacji:

---

## ✅ OPCJA 1: Docker Desktop (ZALECANE - Najszybsze)

### Krok 1: Zainstaluj Docker Desktop
1. Pobierz: https://www.docker.com/products/docker-desktop/
2. Uruchom instalator
3. Po instalacji uruchom Docker Desktop
4. Poczekaj aż Docker się uruchomi (ikona wieloryba w tray)

### Krok 2: Uruchom PostgreSQL
Otwórz terminal PowerShell i wykonaj:

```powershell
# Pobierz i uruchom PostgreSQL w kontenerze
docker run --name pos-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=pos_system `
  -p 5432:5432 `
  -d postgres:16-alpine

# Sprawdź czy działa
docker ps

# Sprawdź logi
docker logs pos-postgres
```

### Krok 3: Zweryfikuj połączenie
```powershell
cd apps\backend
npm run db:check
```

### Przydatne komendy Docker:
```powershell
# Zatrzymaj PostgreSQL
docker stop pos-postgres

# Uruchom ponownie
docker start pos-postgres

# Zobacz status
docker ps -a

# Usuń całkowicie (wraz z danymi!)
docker rm -f pos-postgres

# Połącz się z bazą przez psql
docker exec -it pos-postgres psql -U postgres -d pos_system
```

---

## 🔧 OPCJA 2: Lokalna Instalacja PostgreSQL

### Krok 1: Pobierz PostgreSQL
1. Wejdź na: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Wybierz wersję: PostgreSQL 16 dla Windows x86-64
3. Pobierz instalator (~300MB)

### Krok 2: Instalacja
1. Uruchom instalator jako Administrator
2. Zaakceptuj domyślną lokalizację: `C:\Program Files\PostgreSQL\16`
3. Wybierz komponenty:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Command Line Tools
   - ❌ Stack Builder (nie potrzebne)
4. Port: **5432** (domyślny - zostaw)
5. Hasło dla superużytkownika `postgres`: **postgres** (łatwe dla dev)
6. Locale: **Default locale** lub **Polish, Poland**
7. Kliknij Next → Next → Install

### Krok 3: Utwórz bazę danych
Po instalacji otwórz PowerShell:

```powershell
# Przejdź do folderu PostgreSQL
cd "C:\Program Files\PostgreSQL\16\bin"

# Zaloguj się do PostgreSQL
.\psql -U postgres

# W psql wykonaj:
CREATE DATABASE pos_system;

# Sprawdź czy baza istnieje
\l

# Wyjdź
\q
```

### Krok 4: Dodaj PostgreSQL do PATH (Opcjonalnie)
1. Otwórz: Start → Wyszukaj "Environment Variables"
2. Kliknij "Environment Variables"
3. W sekcji "System variables" wybierz "Path" → Edit
4. Dodaj nowy wpis: `C:\Program Files\PostgreSQL\16\bin`
5. Kliknij OK we wszystkich oknach
6. Otwórz NOWY PowerShell i sprawdź: `psql --version`

### Krok 5: Zweryfikuj połączenie
```powershell
cd apps\backend
npm run db:check
```

---

## 📋 Co dalej po instalacji PostgreSQL?

Po pomyślnej instalacji i uruchomieniu PostgreSQL, wykonaj w katalogu `apps/backend`:

```powershell
# 1. Wygeneruj Prisma Client dla PostgreSQL
npm run db:generate

# 2. Uruchom migracje (stworzy wszystkie tabele)
npm run db:migrate

# 3. Załaduj dane testowe
npm run db:seed

# 4. Uruchom backend
npm run dev
```

---

## 🔍 Diagnostyka i Rozwiązywanie Problemów

### Problem: "connection refused" lub timeout
**Docker:**
```powershell
docker ps -a  # Sprawdź status
docker start pos-postgres  # Uruchom jeśli zatrzymany
docker logs pos-postgres  # Zobacz co się dzieje
```

**Lokalny PostgreSQL:**
```powershell
# Sprawdź czy usługa działa
Get-Service -Name "*postgre*"

# Uruchom usługę
Start-Service postgresql-x64-16
```

### Problem: "database does not exist"
```powershell
# Dla Docker:
docker exec -it pos-postgres psql -U postgres -c "CREATE DATABASE pos_system;"

# Dla lokalnego:
psql -U postgres -c "CREATE DATABASE pos_system;"
```

### Problem: "authentication failed"
Sprawdź plik `.env` w `apps/backend/`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_system"
```

Upewnij się że hasło w connection string zgadza się z hasłem PostgreSQL.

---

## 💡 Wskazówki

1. **Docker jest lepszy dla development** - łatwiejszy w zarządzaniu, nie zahacza o system
2. **Lokalna instalacja jest OK** jeśli już masz PostgreSQL lub potrzebujesz pgAdmin
3. Po zakończeniu pracy z projektem możesz zatrzymać Docker: `docker stop pos-postgres`
4. Dane pozostają w kontenerze nawet po zatrzymaniu
5. Aby całkowicie usunąć: `docker rm -f pos-postgres` (stracisz dane!)

---

## ✅ Checklist przed migracją

- [ ] PostgreSQL jest zainstalowany (Docker lub lokalny)
- [ ] PostgreSQL jest uruchomiony
- [ ] Baza danych `pos_system` istnieje
- [ ] Połączenie działa: `npm run db:check` pokazuje ✅
- [ ] Jesteś w katalogu `apps/backend`

**Gdy wszystko gotowe, wróć do terminala i poinformuj mnie - dokończę automatyczną migrację!** 🚀



