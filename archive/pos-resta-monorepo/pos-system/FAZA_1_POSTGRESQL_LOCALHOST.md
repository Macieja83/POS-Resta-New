# 🎯 FAZA 1: Migracja na PostgreSQL (LOCALHOST)

## ✅ Status: Przygotowania zakończone

### Co zostało zrobione automatycznie:

1. ✅ Zaktualizowano `schema.prisma` z SQLite → PostgreSQL
2. ✅ Utworzono plik `.env` z konfiguracją PostgreSQL
3. ✅ Dodano skrypt sprawdzający połączenie: `npm run db:check`
4. ✅ Zainstalowano niezbędne pakiety (pg, dotenv)
5. ✅ Utworzono automatyczny skrypt migracji

---

## 🚀 Co musisz teraz zrobić (WYBIERZ OPCJĘ):

### OPCJA A: Szybki start z Docker (5 minut) ⚡

**Najlepsze dla:** szybkiego setupu, izolacji, łatwego zarządzania

```powershell
# 1. Zainstaluj Docker Desktop
#    https://www.docker.com/products/docker-desktop/

# 2. Uruchom PostgreSQL
docker run --name pos-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=pos_system `
  -p 5432:5432 `
  -d postgres:16-alpine

# 3. Przejdź do backendu i uruchom migrację
cd apps\backend
.\migrate-to-postgresql.ps1
```

📖 **Szczegóły:** Zobacz `QUICK_DOCKER_SETUP.md`

---

### OPCJA B: Lokalna instalacja PostgreSQL (15 minut) 🔧

**Najlepsze dla:** bardziej tradycyjnego setupu, pgAdmin, trwałej instalacji

```powershell
# 1. Pobierz i zainstaluj PostgreSQL
#    https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

# 2. Utwórz bazę danych
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql -U postgres
CREATE DATABASE pos_system;
\q

# 3. Przejdź do backendu i uruchom migrację
cd C:\Users\mmaci\Desktop\pos-system\apps\backend
.\migrate-to-postgresql.ps1
```

📖 **Szczegóły:** Zobacz `SETUP_POSTGRESQL_WINDOWS.md`

---

## 🎯 Weryfikacja - Sprawdź czy wszystko działa

Po uruchomieniu migracji:

### 1. Sprawdź połączenie z bazą
```powershell
cd apps\backend
npm run db:check
```
Oczekiwany rezultat: ✅ Połączenie z PostgreSQL: SUKCES

### 2. Otwórz Prisma Studio
```powershell
npm run db:studio
```
Powinno otworzyć się GUI z tabelami: customers, orders, employees, etc.

### 3. Uruchom backend
```powershell
npm run dev
```
Powinno uruchomić się na http://localhost:4000

### 4. Przetestuj endpoint
```powershell
# W nowym terminalu
curl http://localhost:4000/api/health
```
Oczekiwany rezultat: `{"status":"ok",...}`

### 5. Uruchom testy
```powershell
npm test
```
Wszystkie testy powinny przejść ✅

---

## 📋 Checklist Fazy 1

Zaznacz po wykonaniu:

- [ ] PostgreSQL jest zainstalowany (Docker lub lokalnie)
- [ ] PostgreSQL jest uruchomiony
- [ ] `npm run db:check` pokazuje ✅
- [ ] Migracje wykonane: `.\migrate-to-postgresql.ps1`
- [ ] Dane testowe załadowane
- [ ] Backend uruchamia się: `npm run dev`
- [ ] Endpoint `/api/health` odpowiada
- [ ] Prisma Studio działa: `npm run db:studio`
- [ ] Frontend łączy się z backendem
- [ ] Testy przechodzą: `npm test`

---

## 🎉 Po zakończeniu Fazy 1

Gdy wszystko działa lokalnie:

1. ✅ **FAZA 1 UKOŃCZONA** - PostgreSQL działa lokalnie
2. 📋 **Następny krok:** Faza 2 - Deployment na Vercel
3. 🔗 **Cel Fazy 2:** Połączenie z Vercel Postgres na produkcji

---

## 📚 Pliki pomocnicze

- `QUICK_DOCKER_SETUP.md` - Szybki start z Docker (zalecane)
- `SETUP_POSTGRESQL_WINDOWS.md` - Szczegółowa instrukcja lokalnej instalacji
- `POSTGRESQL_SETUP.md` - Pełna dokumentacja obu opcji
- `apps/backend/migrate-to-postgresql.ps1` - Automatyczny skrypt migracji
- `apps/backend/check-db-connection.js` - Narzędzie diagnostyczne

---

## 🆘 Problemy?

### PostgreSQL nie startuje
```powershell
# Docker
docker logs pos-postgres
docker restart pos-postgres

# Lokalny
Get-Service postgresql-x64-16
Start-Service postgresql-x64-16
```

### Migracja się nie udaje
```powershell
# Sprawdź połączenie
npm run db:check

# Reset i ponowna próba
npm run db:reset
npm run db:seed
```

### Port 5432 zajęty
```powershell
# Zobacz co używa portu
netstat -ano | findstr :5432

# Dla Docker - użyj innego portu
# Zmień -p 5432:5432 na -p 5433:5432
# I zaktualizuj DATABASE_URL w .env
```

---

## 💡 Wskazówki

- **Docker jest szybszy** - instalacja zajmuje 5 minut
- **Lokalna instalacja jest trwalsza** - przetrwa restart systemu
- **Dane są izolowane** - stara baza SQLite została zachowana w backup
- **Możesz przełączać** - między SQLite a PostgreSQL zmieniając schema.prisma i .env
- **Connection string jest w .env** - możesz go zmienić w razie potrzeby

---

## 🔄 Rollback do SQLite (gdyby coś poszło nie tak)

```powershell
# 1. Przywróć schema.prisma
# datasource db {
#   provider = "sqlite"
#   url      = "file:./dev.db"
# }

# 2. Zregeneruj client
npm run db:generate

# 3. Uruchom backend
npm run dev
```

Backup SQLite znajduje się w: `apps/backend/prisma/backups/`

---

**Powodzenia z migracją! 🚀**

Gdy ukończysz Fazę 1, daj znać - przejdziemy do Fazy 2 (Vercel deployment).



