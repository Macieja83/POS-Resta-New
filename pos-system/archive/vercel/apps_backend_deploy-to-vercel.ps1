# ============================================
# Automatyczny Deployment Backend na Vercel
# ============================================

param(
    [switch]$SkipMigrations = $false,
    [switch]$SkipSeed = $false
)

Write-Host "`n" -NoNewline
Write-Host "🚀 DEPLOYMENT BACKEND NA VERCEL" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Krok 1: Sprawdź czy zmienne środowiskowe są ustawione
Write-Host "📋 Krok 1/5: Sprawdzanie zmiennych środowiskowych..." -ForegroundColor Yellow
Write-Host ""

$envVars = vercel env ls --json 2>&1 | ConvertFrom-Json

$hasPostgresUrl = $false
foreach ($env in $envVars.envs) {
    if ($env.key -eq "POSTGRES_PRISMA_URL" -or $env.key -eq "DATABASE_URL") {
        $hasPostgresUrl = $true
        break
    }
}

if (-not $hasPostgresUrl) {
    Write-Host "❌ Błąd: Brak zmiennych PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Musisz najpierw utworzyć Vercel Postgres database:" -ForegroundColor Yellow
    Write-Host "  1. Przejdź do https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  2. Wybierz projekt 'backend'" -ForegroundColor White
    Write-Host "  3. Storage → Create Database → Postgres" -ForegroundColor White
    Write-Host "  4. Połącz z projektem 'backend'" -ForegroundColor White
    Write-Host ""
    Write-Host "Zobacz: INSTRUKCJA_VERCEL_POSTGRES.md" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Zmienne środowiskowe OK!" -ForegroundColor Green

# Krok 2: Deploy backendu
Write-Host ""
Write-Host "🚀 Krok 2/5: Deployment backendu..." -ForegroundColor Yellow
Write-Host ""

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Błąd podczas deploymentu!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend wdrożony!" -ForegroundColor Green

# Pobierz URL deploymentu
$deployment = vercel ls --json 2>&1 | ConvertFrom-Json | Select-Object -First 1
$backendUrl = "https://$($deployment.url)"

Write-Host ""
Write-Host "🌐 Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host ""

# Krok 3: Pobierz DATABASE_URL z Vercel
if (-not $SkipMigrations) {
    Write-Host ""
    Write-Host "🗄️  Krok 3/5: Konfiguracja connection string..." -ForegroundColor Yellow
    Write-Host ""
    
    # Pobierz POSTGRES_PRISMA_URL
    $productionUrl = vercel env pull .env.production --yes 2>&1
    
    if (Test-Path ".env.production") {
        $envContent = Get-Content ".env.production" -Raw
        $databaseUrl = $envContent | Select-String -Pattern 'POSTGRES_PRISMA_URL="([^"]+)"' | ForEach-Object { $_.Matches.Groups[1].Value }
        
        if ($databaseUrl) {
            $env:DATABASE_URL = $databaseUrl
            Write-Host "✅ DATABASE_URL ustawiony!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Nie znaleziono POSTGRES_PRISMA_URL w .env.production" -ForegroundColor Yellow
            Write-Host "   Spróbuj ręcznie: vercel env pull" -ForegroundColor Gray
        }
    }
}

# Krok 4: Uruchom migracje
if (-not $SkipMigrations -and $env:DATABASE_URL) {
    Write-Host ""
    Write-Host "📊 Krok 4/5: Uruchamianie migracji na produkcji..." -ForegroundColor Yellow
    Write-Host ""
    
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migracje wykonane!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Problem z migracjami - sprawdź connection string" -ForegroundColor Yellow
    }
}

# Krok 5: Załaduj dane testowe
if (-not $SkipSeed -and -not $SkipMigrations -and $env:DATABASE_URL) {
    Write-Host ""
    Write-Host "🌱 Krok 5/5: Ładowanie danych testowych..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Czy chcesz załadować dane testowe na produkcji? (y/n): " -NoNewline -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        npx tsx prisma/seed.ts
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dane testowe załadowane!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Problem z seedowaniem" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⏭️  Pominięto seedowanie" -ForegroundColor Gray
    }
}

# Podsumowanie
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "✨ DEPLOYMENT ZAKOŃCZONY!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Backend URL:" -ForegroundColor Cyan
Write-Host "   $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testuj endpointy:" -ForegroundColor Cyan
Write-Host "   curl $backendUrl/api/health" -ForegroundColor Gray
Write-Host "   curl $backendUrl/api/employees" -ForegroundColor Gray
Write-Host "   curl $backendUrl/api/orders" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  Zarządzanie:" -ForegroundColor Cyan
Write-Host "   vercel logs" -ForegroundColor Gray
Write-Host "   vercel env ls" -ForegroundColor Gray
Write-Host "   vercel domains" -ForegroundColor Gray
Write-Host ""

# Cleanup
if (Test-Path ".env.production") {
    Remove-Item ".env.production" -Force
    Write-Host "🧹 Posprzątano pliki tymczasowe" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "🎉 Gotowe! Backend działa na produkcji!" -ForegroundColor Green
Write-Host ""

