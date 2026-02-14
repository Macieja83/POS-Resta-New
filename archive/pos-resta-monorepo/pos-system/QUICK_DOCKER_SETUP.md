# ⚡ Szybki Start z Docker - 5 minut

## 📦 Krok 1: Zainstaluj Docker Desktop (jednorazowo)

1. **Pobierz Docker Desktop:**
   - Link: https://www.docker.com/products/docker-desktop/
   - Wybierz wersję dla Windows

2. **Zainstaluj:**
   - Uruchom instalator
   - Zaakceptuj domyślne ustawienia
   - Po instalacji uruchom Docker Desktop
   - Poczekaj aż ikona wieloryba w systemowym tray przestanie się animować

3. **Sprawdź czy działa:**
   ```powershell
   docker --version
   # Powinno pokazać: Docker version 24.x.x
   ```

---

## 🐘 Krok 2: Uruchom PostgreSQL

Otwórz PowerShell w **katalogu głównym projektu** i wykonaj:

```powershell
# Uruchom PostgreSQL w kontenerze Docker
docker run --name pos-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=pos_system `
  -p 5432:5432 `
  -d postgres:16-alpine

# Sprawdź czy działa
docker ps
```

Powinieneś zobaczyć:
```
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS         PORTS                    NAMES
abc123def456   postgres:16-alpine   "docker-entrypoint.s…"   5 seconds ago   Up 4 seconds   0.0.0.0:5432->5432/tcp   pos-postgres
```

---

## 🔄 Krok 3: Uruchom migrację

```powershell
# Przejdź do backendu
cd apps\backend

# Uruchom automatyczną migrację
.\migrate-to-postgresql.ps1
```

Skrypt automatycznie:
- ✅ Sprawdzi połączenie z PostgreSQL
- ✅ Zrobi backup starej bazy SQLite
- ✅ Wygeneruje Prisma Client
- ✅ Uruchomi wszystkie migracje
- ✅ Załaduje dane testowe

**Podążaj za instrukcjami na ekranie!**

---

## 🚀 Krok 4: Uruchom aplikację

```powershell
# Backend (w apps/backend)
npm run dev

# Frontend (w apps/frontend) - w nowym terminalu
cd ..\frontend
npm run dev
```

---

## 🎯 Gotowe!

Twoja aplikacja POS działa teraz z PostgreSQL!

### Przydatne komendy:

```powershell
# Zatrzymaj PostgreSQL (dane pozostają)
docker stop pos-postgres

# Uruchom ponownie PostgreSQL
docker start pos-postgres

# Zobacz status
docker ps -a

# Zobacz logi
docker logs pos-postgres

# Połącz się z bazą przez psql
docker exec -it pos-postgres psql -U postgres -d pos_system

# Otwórz Prisma Studio (GUI dla bazy)
cd apps\backend
npm run db:studio
```

---

## 🔍 Rozwiązywanie problemów

### PostgreSQL się nie uruchamia?
```powershell
# Zobacz logi
docker logs pos-postgres

# Usuń i utwórz od nowa
docker rm -f pos-postgres
# Następnie uruchom ponownie komendę docker run
```

### Port 5432 jest zajęty?
```powershell
# Sprawdź co używa portu
netstat -ano | findstr :5432

# Zmień port w docker run na inny, np. 5433:
docker run --name pos-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=pos_system `
  -p 5433:5432 `
  -d postgres:16-alpine

# I zaktualizuj .env:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pos_system"
```

### Migracja się nie udała?
```powershell
# Sprawdź połączenie
npm run db:check

# Spróbuj manualnie:
npm run db:generate
npm run db:migrate
npm run db:seed
```

---

## 📚 Następne kroki

Po pomyślnej migracji:

1. ✅ **Faza 1 UKOŃCZONA** - PostgreSQL działa lokalnie
2. 📋 Przejdź do Fazy 2 - Deployment na Vercel
3. 🔗 Połącz z Vercel Postgres

Powodzenia! 🎉



