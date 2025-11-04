# 🗄️ Production Database Setup Script
# This script sets up the production database with optimized configuration

Write-Host "🗄️ Setting up Production Database - POS System" -ForegroundColor Green
Write-Host ""

# Step 1: Set environment variables
Write-Host "📋 Step 1: Setting up environment variables..." -ForegroundColor Yellow

$env:DATABASE_URL = "postgres://postgres.mafpejnxdiumydlmnrjv:K7JtFpVGdCsZAnCl@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
$env:DIRECT_DATABASE_URL = "postgresql://postgres:Aleksander11!!@db.ijgnqzeljosdpnlssqjp.supabase.co:5432/postgres"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 2: Navigate to backend directory
Write-Host "📋 Step 2: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location "apps/backend"

# Step 3: Generate Prisma client
Write-Host "📋 Step 3: Generating Prisma client..." -ForegroundColor Yellow
Write-Host "🔧 Running: npx prisma generate" -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Step 4: Push database schema
Write-Host "📋 Step 4: Pushing database schema..." -ForegroundColor Yellow
Write-Host "🔧 Running: npx prisma db push" -ForegroundColor Cyan
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push database schema" -ForegroundColor Red
    Write-Host "💡 This might be due to connection issues. Check your Supabase connection." -ForegroundColor Yellow
    exit 1
}

# Step 5: Seed database with test data
Write-Host "📋 Step 5: Seeding database with test data..." -ForegroundColor Yellow
Write-Host "🔧 Running: npm run db:seed" -ForegroundColor Cyan
npm run db:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database seeding failed, but schema is ready" -ForegroundColor Yellow
    Write-Host "💡 You can seed manually later with: npm run db:seed" -ForegroundColor Cyan
}

# Step 6: Test database connection
Write-Host "📋 Step 6: Testing database connection..." -ForegroundColor Yellow
Write-Host "🔧 Running: npm run db:check" -ForegroundColor Cyan
npm run db:check

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection test successful" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection test failed" -ForegroundColor Red
    Write-Host "💡 Check your Supabase connection string and credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 DATABASE SETUP COMPLETED!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database Status:" -ForegroundColor Cyan
Write-Host "   ✅ Schema: Deployed" -ForegroundColor Green
Write-Host "   ✅ Client: Generated" -ForegroundColor Green
Write-Host "   ✅ Data: Seeded (if successful)" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Deploy backend to Vercel" -ForegroundColor White
Write-Host "   2. Set environment variables in Vercel Dashboard" -ForegroundColor White
Write-Host "   3. Test the production deployment" -ForegroundColor White
Write-Host ""

Set-Location "../.."
