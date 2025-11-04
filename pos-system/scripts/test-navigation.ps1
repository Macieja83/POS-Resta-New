# Test Navigation System
# Simple test script to verify navigation works

Write-Host "🧪 Testing Navigation System" -ForegroundColor Yellow

# Test 1: Load the navigation commands
Write-Host "`n1. Loading navigation commands..." -ForegroundColor Cyan
try {
    . "C:\Users\mmaci\Desktop\pos-system\scripts\agent-commands-simple.ps1"
    Write-Host "✅ Navigation commands loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to load navigation commands: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Show current location
Write-Host "`n2. Current location:" -ForegroundColor Cyan
try {
    Show-CurrentLocation
    Write-Host "✅ Current location displayed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to show current location: $_" -ForegroundColor Red
}

# Test 3: Show project structure
Write-Host "`n3. Project structure:" -ForegroundColor Cyan
try {
    Show-ProjectStructure
    Write-Host "✅ Project structure displayed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to show project structure: $_" -ForegroundColor Red
}

# Test 4: Navigate to backend
Write-Host "`n4. Navigating to backend..." -ForegroundColor Cyan
try {
    Navigate-To 'backend'
    Write-Host "✅ Successfully navigated to backend" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to navigate to backend: $_" -ForegroundColor Red
}

# Test 5: Navigate to frontend
Write-Host "`n5. Navigating to frontend..." -ForegroundColor Cyan
try {
    Navigate-To 'frontend'
    Write-Host "✅ Successfully navigated to frontend" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to navigate to frontend: $_" -ForegroundColor Red
}

# Test 6: Navigate back to root
Write-Host "`n6. Navigating back to root..." -ForegroundColor Cyan
try {
    Navigate-To 'root'
    Write-Host "✅ Successfully navigated to root" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to navigate to root: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Navigation system test completed!" -ForegroundColor Green