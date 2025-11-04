# ============================================
# Automatyczna migracja do PostgreSQL
# ============================================

Write-Host "`n" -NoNewline
Write-Host "🔄 MIGRACJA DO POSTGRESQL" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Krok 1: Sprawdź połączenie z PostgreSQL
Write-Host "📡 Krok 1/5: Sprawdzanie połączenia z PostgreSQL..." -ForegroundColor Yellow
npm run db:check

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Błąd: PostgreSQL nie jest dostępny!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Proszę:" -ForegroundColor Yellow
    Write-Host "  1. Sprawdź SETUP_POSTGRESQL_WINDOWS.md" -ForegroundColor White
    Write-Host "  2. Zainstaluj PostgreSQL (Docker lub lokalnie)" -ForegroundColor White
    Write-Host "  3. Uruchom PostgreSQL" -ForegroundColor White
    Write-Host "  4. Spróbuj ponownie: .\migrate-to-postgresql.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Połączenie OK!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Krok 2: Backup starej bazy SQLite (opcjonalnie)
Write-Host ""
Write-Host "💾 Krok 2/5: Backup bazy SQLite..." -ForegroundColor Yellow
$backupDir = "prisma\backups"
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if (Test-Path "prisma\dev.db") {
    Copy-Item "prisma\dev.db" "$backupDir\dev.db.$timestamp.backup"
    Write-Host "✅ Backup utworzony: dev.db.$timestamp.backup" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Brak bazy SQLite do backupu" -ForegroundColor Gray
}

# Krok 3: Wygeneruj Prisma Client
Write-Host ""
Write-Host "🔧 Krok 3/5: Generowanie Prisma Client dla PostgreSQL..." -ForegroundColor Yellow
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Błąd podczas generowania Prisma Client!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client wygenerowany!" -ForegroundColor Green

# Krok 4: Uruchom migracje
Write-Host ""
Write-Host "🗄️  Krok 4/5: Uruchamianie migracji na PostgreSQL..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Prisma może zapytać o nazwę migracji - wpisz:" -ForegroundColor Yellow
Write-Host "   init_postgresql" -ForegroundColor Cyan
Write-Host ""

npm run db:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Błąd podczas migracji!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migracje wykonane!" -ForegroundColor Green

# Krok 5: Załaduj dane testowe
Write-Host ""
Write-Host "🌱 Krok 5/5: Ładowanie danych testowych..." -ForegroundColor Yellow
npm run db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Uwaga: Problem z seedowaniem danych" -ForegroundColor Yellow
    Write-Host "   Możesz spróbować ponownie: npm run db:seed" -ForegroundColor Gray
} else {
    Write-Host "✅ Dane testowe załadowane!" -ForegroundColor Green
}

# Podsumowanie
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "✨ MIGRACJA ZAKOŃCZONA POMYŚLNIE!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Co dalej?" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Uruchom backend:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Otwórz Prisma Studio (GUI dla bazy):" -ForegroundColor White
Write-Host "     npm run db:studio" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Uruchom testy:" -ForegroundColor White
Write-Host "     npm test" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Connection string w .env:" -ForegroundColor White
Write-Host "     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_system" -ForegroundColor Gray
Write-Host ""



