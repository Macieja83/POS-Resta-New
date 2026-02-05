# Quick Commands Reference - POS System

## 🚀 Development Commands

### Start Development
```bash
# Start both backend and frontend
npm run dev

# Start only backend (Terminal 1)
npm run dev:backend

# Start only frontend (Terminal 2)
npm run dev:frontend

# Kill stuck ports and restart
npm run predev
```

### URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **Prisma Studio**: http://localhost:5555
- **Production Frontend**: https://pos-system-frontend-flax.vercel.app
- **Production Backend**: https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app

## 🗄️ Database Commands

### Prisma Operations
```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# Create new migration
cd apps/backend && npm run db:migrate

# Deploy migrations to production
cd apps/backend && npm run db:migrate:deploy

# Regenerate Prisma Client
npm run db:generate

# Seed database with test data
npm run db:seed

# Reset database (DANGER: deletes all data)
cd apps/backend && npm run db:reset
```

### Database Connection Test
```bash
# Test database connection
cd apps/backend && npm run db:check
```

## 🔨 Build & Test Commands

### Build
```bash
# Build everything
npm run build

# Build only backend
npm run build:backend

# Build only frontend
npm run build:frontend
```

### Code Quality
```bash
# TypeScript check (all workspaces)
npm run typecheck

# ESLint check (all workspaces)
npm run lint

# Run tests
npm run test
```

## 🚀 Vercel Deployment

### Deploy Commands
```bash
# Deploy backend to production
cd apps/backend && vercel --prod

# Deploy frontend to production
cd apps/frontend && vercel --prod

# Deploy preview (not production)
cd apps/backend && vercel
cd apps/frontend && vercel
```

### Vercel Management
```bash
# List all deployments
vercel list

# View deployment logs
vercel logs [deployment-url]

# Environment variables
vercel env ls
vercel env add [name]
vercel env rm [name]
vercel env pull .env.vercel
```

## 🔧 Git Commands

### Basic Git
```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: add new feature"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main
```

### Branch Management
```bash
# Create new branch
git checkout -b feature/new-feature

# Switch to main
git checkout main

# Merge branch to main
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

## 🧪 Testing Commands

### API Testing (PowerShell)
```powershell
# Test health endpoint
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET; $response.Content

# Test employees endpoint
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/employees" -Method GET; $response.Content

# Test login
$body = '{"loginCode":"1234"}'; $response = Invoke-WebRequest -Uri "http://localhost:4000/api/employees/login" -Method POST -ContentType "application/json" -Body $body; $response.Content

# Test production health
$response = Invoke-WebRequest -Uri "https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/health" -Method GET; $response.Content
```

### API Testing (curl)
```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test employees endpoint
curl http://localhost:4000/api/employees

# Test login
curl -X POST http://localhost:4000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{"loginCode":"1234"}'

# Test production
curl https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/health
```

## 🔍 Debugging Commands

### Check Running Processes
```bash
# Check if ports are in use
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Kill process by PID
taskkill /PID [process_id] /F
```

### Environment Check
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if Vercel CLI is installed
vercel --version
```

## 📊 Monitoring Commands

### Logs
```bash
# View Vercel deployment logs
vercel logs [deployment-url] --follow

# View local backend logs (in terminal where npm run dev is running)
# Logs appear automatically in development mode
```

### Health Checks
```bash
# Local health check
curl http://localhost:4000/api/health

# Production health check
curl https://pos-system-backend-ll0tv4zej-macieja83s-projects.vercel.app/api/health

# Frontend health check
curl https://pos-system-frontend-flax.vercel.app
```

## 🛠️ Maintenance Commands

### Clean Up
```bash
# Clean node_modules and reinstall
npm run clean

# Fix Prisma cache issues
npm run fix:prisma

# Kill stuck ports
npm run predev
```

### Update Dependencies
```bash
# Update all dependencies
npm update

# Update specific package
npm install package-name@latest --workspace=apps/backend
npm install package-name@latest --workspace=apps/frontend
```

## 🚨 Emergency Commands

### Rollback Production
```bash
# Quick rollback via Vercel Dashboard
# 1. Go to Vercel Dashboard → Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"

# Or via Git revert
git revert [commit-hash]
git push origin main
```

### Database Emergency
```bash
# Reset database (DANGER: deletes all data)
cd apps/backend && npm run db:reset

# Restore from backup (if you have backup.sql)
psql -h aws-1-eu-central-1.pooler.supabase.com \
  -U postgres.ijgnqzeljosdpnlssqjp \
  -d postgres < backup.sql
```

## 📝 Common Workflows

### Add New Feature
```bash
# 1. Create branch
git checkout -b feature/new-feature

# 2. Develop locally
npm run dev

# 3. Test
npm run typecheck
npm run lint

# 4. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 5. Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

### Quick Bug Fix
```bash
# 1. Fix locally
npm run dev

# 2. Test fix
npm run typecheck

# 3. Commit and push
git add .
git commit -m "fix: resolve bug in component"
git push origin main
```

### Database Schema Change
```bash
# 1. Edit schema
cd apps/backend
nano prisma/schema.prisma

# 2. Create migration
npm run db:migrate

# 3. Regenerate client
npm run db:generate

# 4. Test locally
npm run dev

# 5. Commit changes
git add prisma/
git commit -m "feat: add new field to model"
git push origin main
```

## 🔑 Login Codes (Test Data)
- **Manager**: 1234 (Jan Kowalski)
- **Driver**: 5678 (Anna Nowak)  
- **Cook**: 9012 (Piotr Wiśniewski)

## 📞 Support URLs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repository**: https://github.com/Macieja83/pos-system
- **Prisma Studio**: http://localhost:5555 (when running locally)
