# 🚀 Vercel Environment Variables Setup

## Quick Setup Guide

### Step 1: Go to Vercel Dashboard
1. Navigate to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings → Environment Variables**

### Step 2: Add These Variables

Copy and paste each variable below. Make sure to select **Production**, **Preview**, and **Development** for each one.

---

#### DATABASE_URL
**Value:**
```
postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

#### DIRECT_DATABASE_URL
**Value:**
```
postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

#### NODE_ENV
**Value:**
```
production
```
**Environments:** ✅ Production only

---

#### JWT_SECRET
**Value:**
```
your-super-secret-jwt-key-change-this-in-production
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

⚠️ **Important:** Generate a secure random string for production!
```bash
# Generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

#### CORS_ORIGINS
**Value:**
```
https://your-frontend-domain.vercel.app,https://your-backend-domain.vercel.app
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

📝 **Note:** Replace with your actual Vercel domain(s) after first deployment

---

#### PORT (Optional)
**Value:**
```
4000
```
**Environments:** ✅ Development only

---

#### LOG_LEVEL (Optional)
**Value:**
```
info
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## Step 3: Deploy

### Option A: Automatic Deployment (Recommended)
```bash
git add .
git commit -m "Configure Supabase and environment"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Run `npm run db:generate`
3. Build the application
4. Deploy to production

### Option B: Manual Deployment via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Step 4: Verify Deployment

After deployment completes:

### Test Backend Health
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "environment": "production",
  "timestamp": "2025-10-13T..."
}
```

### Test API Endpoints
```bash
# Get employees
curl https://your-backend.vercel.app/api/employees

# Get menu
curl https://your-backend.vercel.app/api/menu
```

## 🔍 Troubleshooting

### Error: "Can't reach database server"
**Solution:** Verify DATABASE_URL is exactly as shown above, including:
- `?pgbouncer=true&connection_limit=1` parameters
- URL-encoded password: `Aleksander11%21%2122%40%40`

### Error: "Prisma Client not found"
**Solution:** Check `package.json` has:
```json
"vercel-build": "npm run db:generate && npm install"
```

### Error: "Timeout connecting to database"
**Solution:** 
1. Ensure using transaction pooler (port 6543)
2. Check `connection_limit=1` is in DATABASE_URL
3. Verify Supabase database is active in dashboard

### Logs Not Showing Database Status
**Solution:**
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

## 📋 Environment Variables Checklist

Before deploying, verify all these are set:

- [ ] DATABASE_URL (with pgbouncer and connection_limit)
- [ ] DIRECT_DATABASE_URL (session pooler)
- [ ] NODE_ENV (production)
- [ ] JWT_SECRET (strong random string)
- [ ] CORS_ORIGINS (your actual domains)

## 🎯 Quick Copy-Paste for Vercel CLI

If you prefer to set environment variables via CLI:

```bash
# DATABASE_URL
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# DIRECT_DATABASE_URL
vercel env add DIRECT_DATABASE_URL production
# Paste: postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# NODE_ENV
vercel env add NODE_ENV production
# Paste: production

# JWT_SECRET (generate first!)
vercel env add JWT_SECRET production
# Paste: your-generated-secret

# CORS_ORIGINS
vercel env add CORS_ORIGINS production
# Paste: https://your-frontend.vercel.app
```

## ✅ Success!

Once all variables are set and deployment succeeds:

1. ✅ Backend connects to Supabase
2. ✅ Health check returns "db": "connected"
3. ✅ API endpoints return data
4. ✅ Frontend can communicate with backend

**You're ready to go! 🎉**

