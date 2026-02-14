# 🚀 Vercel Deployment Script - Optimized POS System
# This script deploys the optimized POS system to Vercel

Write-Host "🚀 Starting Vercel Deployment - POS System Optimization" -ForegroundColor Green
Write-Host ""

# Step 1: Clean up duplicate projects
Write-Host "📋 Step 1: Cleaning up duplicate Vercel projects..." -ForegroundColor Yellow
Write-Host "⚠️  You need to manually delete the 'backend' project from Vercel Dashboard" -ForegroundColor Red
Write-Host "   Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "   Delete project: 'backend' (keep pos-system-backend and pos-system-frontend)" -ForegroundColor Cyan
Write-Host ""

# Step 2: Deploy Backend
Write-Host "📋 Step 2: Deploying optimized backend..." -ForegroundColor Yellow
Set-Location "apps/backend"

Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan
Write-Host "You need to add these environment variables in Vercel Dashboard:" -ForegroundColor Red
Write-Host ""
Write-Host "DATABASE_URL:" -ForegroundColor Green
Write-Host "postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1" -ForegroundColor White
Write-Host ""
Write-Host "DIRECT_DATABASE_URL:" -ForegroundColor Green
Write-Host "postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres" -ForegroundColor White
Write-Host ""
Write-Host "NODE_ENV: production" -ForegroundColor Green
Write-Host "JWT_SECRET: [Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"]" -ForegroundColor Green
Write-Host "CORS_ORIGINS: https://pos-system-frontend.vercel.app" -ForegroundColor Green
Write-Host ""

$continue = Read-Host "Press Enter when you've added the environment variables to Vercel Dashboard"

Write-Host "🚀 Deploying backend to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy Frontend
Write-Host "📋 Step 3: Deploying optimized frontend..." -ForegroundColor Yellow
Set-Location "../frontend"

Write-Host "🔧 Setting up frontend environment variables..." -ForegroundColor Cyan
Write-Host "You need to add this environment variable in Vercel Dashboard:" -ForegroundColor Red
Write-Host ""
Write-Host "VITE_API_URL: https://pos-system-backend.vercel.app/api" -ForegroundColor Green
Write-Host ""

$continue = Read-Host "Press Enter when you've added the environment variable to Vercel Dashboard"

Write-Host "🚀 Deploying frontend to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Database Migration
Write-Host "📋 Step 4: Running database migrations..." -ForegroundColor Yellow
Set-Location "../backend"

Write-Host "🔧 Setting up local environment for migrations..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
$env:DIRECT_DATABASE_URL = "postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres"

Write-Host "📊 Running Prisma migrations..." -ForegroundColor Cyan
npx prisma db push

Write-Host "🌱 Seeding database with test data..." -ForegroundColor Cyan
npm run db:seed

Write-Host "✅ Database setup completed!" -ForegroundColor Green
Write-Host ""

# Step 5: Testing
Write-Host "📋 Step 5: Testing deployment..." -ForegroundColor Yellow

Write-Host "🔍 Testing backend health..." -ForegroundColor Cyan
$backendUrl = "https://pos-system-backend.vercel.app/api/health"
try {
    $response = Invoke-RestMethod -Uri $backendUrl -Method GET
    Write-Host "✅ Backend health check: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Your POS System is now live:" -ForegroundColor Cyan
Write-Host "   Frontend: https://pos-system-frontend.vercel.app" -ForegroundColor White
Write-Host "   Backend:  https://pos-system-backend.vercel.app/api" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the application end-to-end" -ForegroundColor White
Write-Host "   2. Check all features work correctly" -ForegroundColor White
Write-Host "   3. Monitor performance and logs" -ForegroundColor White
Write-Host ""

Set-Location "../.."
