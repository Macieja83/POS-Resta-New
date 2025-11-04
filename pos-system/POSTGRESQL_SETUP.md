# PostgreSQL Setup - Lokalna Instalacja

## Opcja 1: Docker (Zalecane - Szybkie i Izolowane)

### Krok 1: Zainstaluj Docker Desktop
- Pobierz z: https://www.docker.com/products/docker-desktop/
- Zainstaluj i uruchom Docker Desktop

### Krok 2: Uruchom PostgreSQL w kontenerze
```bash
docker run --name pos-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=pos_system -p 5432:5432 -d postgres:16-alpine
```

### Krok 3: Sprawdź czy kontener działa
```bash
docker ps
```

### Przydatne komendy Docker:
```bash
# Zatrzymaj kontener
docker stop pos-postgres

# Uruchom ponownie
docker start pos-postgres

# Usuń kontener (wraz z danymi)
docker rm -f pos-postgres

# Połącz się z PostgreSQL przez psql
docker exec -it pos-postgres psql -U postgres -d pos_system
```

---

## Opcja 2: Lokalna Instalacja PostgreSQL na Windows

### Krok 1: Pobierz PostgreSQL
- Wejdź na: https://www.postgresql.org/download/windows/
- Pobierz instalator (np. PostgreSQL 16)

### Krok 2: Instalacja
1. Uruchom instalator
2. Wybierz komponenty: PostgreSQL Server, pgAdmin 4, Command Line Tools
3. Ustaw hasło dla użytkownika `postgres` (np. `postgres`)
4. Port: `5432` (domyślny)
5. Locale: `Polish, Poland` lub `Default locale`

### Krok 3: Utwórz bazę danych
Otwórz PowerShell i wykonaj:
```powershell
# Przejdź do folderu PostgreSQL bin
cd "C:\Program Files\PostgreSQL\16\bin"

# Zaloguj się do PostgreSQL
.\psql -U postgres

# W psql utwórz bazę
CREATE DATABASE pos_system;

# Sprawdź czy baza istnieje
\l

# Wyjdź z psql
\q
```

### Krok 4: Dodaj PostgreSQL do PATH (Opcjonalnie)
1. Wyszukaj "Environment Variables" w Windows
2. Dodaj do PATH: `C:\Program Files\PostgreSQL\16\bin`
3. Otwórz nowy terminal i sprawdź: `psql --version`

---

## Weryfikacja Połączenia

Po instalacji PostgreSQL (Docker lub lokalnie), przetestuj połączenie:

### Opcja A: Przez psql
```bash
# Dla Docker:
docker exec -it pos-postgres psql -U postgres -d pos_system

# Dla lokalnej instalacji:
psql -U postgres -d pos_system
```

### Opcja B: Przez pgAdmin
1. Otwórz pgAdmin 4
2. Dodaj nowy serwer:
   - Name: `POS System Local`
   - Host: `localhost`
   - Port: `5432`
   - Database: `pos_system`
   - Username: `postgres`
   - Password: `postgres`

---

## Connection String

Dla obu opcji connection string będzie:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_system"
```

Jeśli używasz innego hasła, zmień `postgres:postgres` na `postgres:TWOJE_HASLO`



