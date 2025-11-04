Write-Host "🧹 Rozpoczynam czyszczenie zamówień..." -ForegroundColor Yellow

# Przejdź do katalogu backend
Set-Location "C:\Users\mmaci\Desktop\pos-system\apps\backend"

# Uruchom skrypt TypeScript
try {
    $result = npx tsx clear-orders.ts 2>&1
    Write-Host $result -ForegroundColor Green
} catch {
    Write-Host "❌ Błąd podczas uruchamiania skryptu: $_" -ForegroundColor Red
}

Write-Host "✅ Skrypt zakończony" -ForegroundColor Green
