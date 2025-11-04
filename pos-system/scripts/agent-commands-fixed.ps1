# Agent Commands for POS System Project
# PowerShell script with navigation helpers

# Project root detection
function Get-ProjectRoot {
    $currentDir = Get-Location
    while ($currentDir -ne (Split-Path $currentDir -Parent)) {
        $indicators = @('package.json', 'pnpm-workspace.yaml', 'apps', 'packages')
        $hasIndicators = $indicators | ForEach-Object { Test-Path (Join-Path $currentDir $_) } | Where-Object { $_ -eq $true }
        
        if ($hasIndicators) {
            return $currentDir
        }
        $currentDir = Split-Path $currentDir -Parent
    }
    return Get-Location
}

# Project structure mapping
function Get-ProjectStructure {
    $root = Get-ProjectRoot
    return @{
        Root = $root
        Backend = Join-Path $root 'apps\backend'
        Frontend = Join-Path $root 'apps\frontend'
        Shared = Join-Path $root 'packages\shared'
        Scripts = Join-Path $root 'scripts'
        Docs = $root
    }
}

# Navigation functions
function Navigate-To {
    param([string]$Location)
    
    $structure = Get-ProjectStructure
    $targetPath = $null
    
    switch ($Location.ToLower()) {
        'root' { $targetPath = $structure.Root }
        'project' { $targetPath = $structure.Root }
        'backend' { $targetPath = $structure.Backend }
        'frontend' { $targetPath = $structure.Frontend }
        'shared' { $targetPath = $structure.Shared }
        'scripts' { $targetPath = $structure.Scripts }
        'docs' { $targetPath = $structure.Docs }
        default { 
            Write-Error "Unknown location: $Location"
            return $false
        }
    }
    
    if (Test-Path $targetPath) {
        Set-Location $targetPath
        Write-Host "✅ Navigated to: $targetPath" -ForegroundColor Green
        return $true
    } else {
        Write-Error "Path does not exist: $targetPath"
        return $false
    }
}

# Execute command in specific location
function Invoke-InLocation {
    param(
        [string]$Location,
        [string]$Command
    )
    
    $originalLocation = Get-Location
    $structure = Get-ProjectStructure
    $targetPath = $null
    
    switch ($Location.ToLower()) {
        'root' { $targetPath = $structure.Root }
        'project' { $targetPath = $structure.Root }
        'backend' { $targetPath = $structure.Backend }
        'frontend' { $targetPath = $structure.Frontend }
        'shared' { $targetPath = $structure.Shared }
        'scripts' { $targetPath = $structure.Scripts }
        'docs' { $targetPath = $structure.Docs }
        default { 
            Write-Error "Unknown location: $Location"
            return
        }
    }
    
    try {
        Set-Location $targetPath
        Write-Host "📁 Executing in: $targetPath" -ForegroundColor Cyan
        Write-Host "💻 Command: $Command" -ForegroundColor Yellow
        Invoke-Expression $Command
    } finally {
        Set-Location $originalLocation
    }
}

# Show project structure
function Show-ProjectStructure {
    $structure = Get-ProjectStructure
    Write-Host "📁 Project Structure:" -ForegroundColor Magenta
    Write-Host "Root: $($structure.Root)" -ForegroundColor White
    Write-Host "Backend: $($structure.Backend)" -ForegroundColor White
    Write-Host "Frontend: $($structure.Frontend)" -ForegroundColor White
    Write-Host "Shared: $($structure.Shared)" -ForegroundColor White
    Write-Host "Scripts: $($structure.Scripts)" -ForegroundColor White
}

# Show current location
function Show-CurrentLocation {
    $current = Get-Location
    $root = Get-ProjectRoot
    $relative = [System.IO.Path]::GetRelativePath($root, $current)
    
    Write-Host "📍 Current Location:" -ForegroundColor Magenta
    Write-Host "Absolute: $current" -ForegroundColor White
    Write-Host "Relative: $relative" -ForegroundColor White
    Write-Host "In Project: $($current.StartsWith($root))" -ForegroundColor White
}

# Quick navigation aliases
function Go-Backend { Navigate-To 'backend' }
function Go-Frontend { Navigate-To 'frontend' }
function Go-Root { Navigate-To 'root' }
function Go-Shared { Navigate-To 'shared' }

# Common commands with proper navigation
function Start-Backend {
    Navigate-To 'backend'
    Write-Host "🚀 Starting backend server..." -ForegroundColor Green
    npm run dev
}

function Start-Frontend {
    Navigate-To 'frontend'
    Write-Host "🚀 Starting frontend server..." -ForegroundColor Green
    npm run dev
}

function Install-Backend {
    Navigate-To 'backend'
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Green
    npm install
}

function Install-Frontend {
    Navigate-To 'frontend'
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Green
    npm install
}

function Seed-Database {
    Navigate-To 'backend'
    Write-Host "🌱 Seeding database..." -ForegroundColor Green
    npx tsx prisma/seed.ts
}

function Push-Database {
    Navigate-To 'backend'
    Write-Host "📊 Pushing database schema..." -ForegroundColor Green
    npx prisma db push
}

function Generate-Prisma {
    Navigate-To 'backend'
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Green
    npx prisma generate
}

# Auto-load when script is sourced
Write-Host "✅ Agent navigation commands loaded!" -ForegroundColor Green
Write-Host "Use Show-ProjectStructure to see available locations" -ForegroundColor Cyan
Write-Host "Use Navigate-To location to navigate" -ForegroundColor Cyan