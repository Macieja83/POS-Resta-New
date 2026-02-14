# 🎯 Quick Reference - Supabase + Vercel Setup

## ✅ Current Status

**Database:** ✅ Supabase PostgreSQL 17.6 - Connected  
**Backend:** ✅ Running on localhost:4000  
**Data:** ✅ Seeded with test data  
**Health Check:** ✅ Returns `"db": "connected"`

---

## 🔑 Your Credentials

**Password:** `Aleksander11!!22@@`  
**Encoded:** `Aleksander11%21%2122%40%40`

**Transaction Pooler (Runtime):**
```
postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Session Pooler (Migrations):**
```
postgresql://postgres.ijgnqzeljosdpnlssqjp:Aleksander11%21%2122%40%40@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

---

## 🚀 Deploy to Vercel (3 Steps)

### 1. Set Environment Variables in Vercel Dashboard

Go to: **Project Settings → Environment Variables**

Add for **Production + Preview + Development**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Transaction pooler URL (see above) |
| `DIRECT_DATABASE_URL` | Session pooler URL (see above) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CORS_ORIGINS` | Your frontend URL |

### 2. Deploy
```bash
git add .
git commit -m "Configure Supabase PostgreSQL"
git push origin main
```

### 3. Verify
```bash
curl https://your-backend.vercel.app/api/health
# Should return: {"db":"connected","status":"ok"}
```

---

## 📝 Useful Commands

```bash
# Database
npm run db:check          # Test connection
npm run db:studio         # Open Prisma Studio
npm run db:seed           # Re-seed data

# Development
npm run dev               # Start with hot reload
npm run start             # Start production mode

# Deployment
vercel                    # Deploy to preview
vercel --prod             # Deploy to production
vercel logs --follow      # View real-time logs
```

---

## 🧪 Test Endpoints

```bash
# Health check
curl http://localhost:4000/api/health

# Get employees (3 records)
curl http://localhost:4000/api/employees

# Get menu categories (3 categories)
curl http://localhost:4000/api/menu

# Get orders (3 orders)
curl http://localhost:4000/api/orders
```

---

## 📊 Test Data (Seeded)

- **Employees:** 3 (Anna Nowak, Jan Kowalski, Piotr Wiśniewski)
- **Customers:** 2
- **Orders:** 3
- **Categories:** 3 (Pizza, Napoje, Desery)
- **Dishes:** 3 (Margherita, Pepperoni, Cola)
- **Addon Groups:** 2

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
netstat -ano | findstr :4000

# Kill process if needed
taskkill /PID [process_id] /F
```

### Database connection fails
```bash
# Verify credentials
npm run db:check

# Test with Prisma Studio
npm run db:studio
```

### Vercel deployment fails
```bash
# View logs
vercel logs [deployment-url]

# Check environment variables
vercel env ls

# Redeploy
vercel --prod --force
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `apps/backend/.env` | Local database credentials |
| `apps/backend/prisma/schema.prisma` | Database schema |
| `apps/backend/src/controllers/health.controller.ts` | Health check (updated) |
| `apps/backend/vercel.json` | Vercel configuration |
| `SUPABASE_SETUP_SUCCESS.md` | Full documentation |
| `VERCEL_ENV_SETUP.md` | Deployment guide |

---

## ⚠️ Important Notes

1. **`.env` file is local only** - Never commit it to git
2. **Transaction pooler** (port 6543) is for runtime connections
3. **Session pooler** (port 5432) is for migrations
4. **Direct connection** may not work due to network restrictions
5. **Always URL-encode** the password in connection strings

---

## ✅ What Changed

1. ✅ Created `apps/backend/.env` with Supabase credentials
2. ✅ Updated `health.controller.ts` - removed mock data, added real DB check
3. ✅ Deployed schema to Supabase PostgreSQL
4. ✅ Seeded database with test data
5. ✅ Verified local backend connects successfully

---

## 🎉 You're Ready!

- Local development: **Working ✅**
- Database: **Connected ✅**
- Test data: **Loaded ✅**
- Health check: **Passing ✅**
- Next step: **Deploy to Vercel! 🚀**

---

**Need help?** Check:
- `SUPABASE_SETUP_SUCCESS.md` - Full setup details
- `VERCEL_ENV_SETUP.md` - Deployment guide
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard

