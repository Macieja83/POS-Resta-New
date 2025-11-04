# POS Resta - Monorepo

Kompleksowy system POS (Point of Sale) dla restauracji z trzema aplikacjami:

## Projektów

### 1. **POS System** (`pos-system/`)
Backend + Frontend dla systemu POS
- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Położenie**: `pos-system/apps/backend` i `pos-system/apps/frontend`

### 2. **EmpApp** (`empapp/`)
Aplikacja dla kierowców (Expo/React Native)
- **Technologie**: Expo Router, React Native, TypeScript
- **Funkcje**: Przeglądanie i realizacja zamówień, śledzenie lokalizacji

### 3. **Restaurant Shop** (`restaurant-shop/`)
Sklep internetowy dla zamówień online (Next.js)
- **Technologie**: Next.js 15, React 19, Prisma, TypeScript
- **Funkcje**: Menu, koszyk, checkout, system płatności

## Architektura

```
┌─────────────────┐
│  Restaurant Shop│
│   (Next.js)     │
└────────┬────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌────────────────┐  ┌──────────┐
│  POS Frontend  │  │  EmpApp  │
│   (React)      │  │  (Expo)  │
└───────┬────────┘  └────┬─────┘
        │                 │
        └────────┬────────┘
                 ▼
         ┌─────────────┐
         │ POS Backend │
         │  (Express)  │
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │ PostgreSQL  │
         │  Database   │
         └─────────────┘
```

## Wymagania

- Node.js >= 20
- npm >= 9
- PostgreSQL
- Git

## Rozwój Lokalny

### Backend + Frontend POS

```bash
cd pos-system
npm install
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### EmpApp

```bash
cd empapp
npm install
npm start
```

### Restaurant Shop

```bash
cd restaurant-shop
npm install
npm run dev
```

- Aplikacja: http://localhost:3000

## Deploy na Vercel

Projekty są skonfigurowane jako oddzielne projekty Vercel:

1. **pos-backend**: Backend API
2. **pos-frontend**: Frontend aplikacji POS
3. **empapp**: Aplikacja mobilna (web version)
4. **restaurant-shop**: Sklep internetowy

Każdy projekt ma swoje pliki `vercel.json` z odpowiednią konfiguracją.

## Połączenia

Wszystkie aplikacje frontend łączą się z tym samym backendem:
- `VITE_API_URL` (Frontend)
- `EXPO_PUBLIC_API_URL` (EmpApp)
- `NEXT_PUBLIC_API_URL` (Restaurant Shop)

## Baza Danych

PostgreSQL z migracjami Prisma:
- **Backend**: `pos-system/apps/backend/prisma/`
- **Restaurant Shop**: `restaurant-shop/prisma/`

## Więcej informacji

- [Dokumentacja Backend](pos-system/README.md)
- [Dokumentacja EmpApp](empapp/README.md)
- [Dokumentacja Restaurant Shop](restaurant-shop/README.md)

