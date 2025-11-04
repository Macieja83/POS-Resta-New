# 🔍 DIAGNOSTYKA INTEGRACJI POS-SYSTEM ↔ EMPAPP

## 📁 STRUKTURA FOLDERÓW

### Foldery EmpApp:
1. **`empapp/dist/`** - Zmodydikowany z interceptors - **GŁÓWNY FOLDER UŻYWANY NA LOCALHOST:8081**
2. **Port 8081**: Proces node (PID 2112) - uruchomiony z `empapp/dist/`

### Foldery POS-System:
- **`pos-system/apps/backend/`** - Backend na porcie 4000
- **`pos-system/apps/frontend/`** - Frontend na porcie 5173

### Foldery Restaurant Shop:
- **`pos-resta-monorepo/restaurant-shop/`** - Shop na porcie 3001

## ✅ SPRAWDZENIA

### 1. Backend i Baza Danych
- ✅ Backend działa na porcie 4000
- ✅ Baza danych: POŁĄCZONA (status: connected)
- ✅ Endpoint `/api/orders/available` zwraca **8 zamówień DELIVERY**
- ✅ Endpoint `/api/auth/login` używa **prawdziwej bazy danych** (nie mock data)

### 2. Logowanie
- ✅ Kod **1234** działa - pracownik "Jan Kowalski" ma loginCode w bazie
- ❌ Inne kody nie działają - **inni pracownicy NIE MAJĄ loginCode w bazie**
- ✅ Endpoint `/api/auth/login` używa `EmployeesRepository.findByLoginCode()`

### 3. Zamówienia
- ✅ Backend zwraca 8 zamówień DELIVERY ze statusem OPEN/PENDING/READY
- ✅ Filtry działają poprawnie (`type: 'DELIVERY'`, `status: ['OPEN', 'PENDING', 'READY']`)
- ❌ EmpApp nie może sparsować odpowiedzi - błąd `Cannot read properties of undefined (reading 'parse')`

## 🔧 PROBLEMY I ROZWIĄZANIA

### Problem 1: Tylko kod 1234 działa
**Przyczyna**: Inni pracownicy w bazie nie mają ustawionego `loginCode`

**Rozwiązanie**:
1. Otwórz POS System frontend (http://localhost:5173)
2. Przejdź do zarządzania pracownikami
3. Dla każdego pracownika wygeneruj/ustaw `loginCode`
4. Lub użyj Prisma Studio: `npx prisma studio` w folderze `pos-system/apps/backend`

### Problem 2: Zamówienia nie ładują się w EmpApp
**Przyczyna**: Bundle EmpApp próbuje użyć Zod schematów które są `undefined`

**Rozwiązanie**:
- Interceptory są zainstalowane w `index.html`
- Problem może być w tym, że bundle wywołuje `parse()` zanim interceptory są aktywne
- **Następny krok**: Sprawdź w konsoli przeglądarki czy widzisz logi z interceptorów

## 📝 NASTĘPNE KROKI

1. **Sprawdź logi backendu** przy próbie logowania:
   - Powinieneś widzieć: `🔐 loginWithCode CALLED!`
   - Jeśli kod nie działa, zobaczysz: `📋 Employees with loginCode in database: [...]`

2. **Sprawdź logi backendu** przy ładowaniu zamówień:
   - Powinieneś widzieć: `📦 getAvailableOrders CALLED!`
   - Jeśli nie widzisz tych logów, EmpApp nie wysyła requestu

3. **Sprawdź konsolę przeglądarki** EmpApp:
   - Powinieneś widzieć: `🔧 Redirected fetch/XHR to: http://localhost:4000/api/...`
   - Jeśli nie widzisz, interceptory nie działają

4. **Sprawdź Network tab** w DevTools:
   - Czy requesty idą do `localhost:4000` czy do Vercel?
   - Jakie są odpowiedzi (status 200, 404, 500)?

## 🔗 POŁĄCZENIA

### Backend ↔ Baza Danych:
- ✅ Połączone (Prisma + Supabase)
- ✅ Zwraca prawdziwe dane z bazy

### EmpApp ↔ Backend:
- ✅ CORS skonfigurowany dla `http://localhost:8081`
- ✅ Interceptory przekierowują URL z Vercel na localhost
- ❌ Problem z parsowaniem odpowiedzi (Zod schematy)

### POS System Frontend ↔ Backend:
- ✅ Działa na porcie 5173
- ✅ Łączy się z backendem na porcie 4000

### Restaurant Shop ↔ Backend:
- ✅ Działa na porcie 3001
- ✅ Łączy się z backendem na porcie 4000
- ✅ Zamówienia są tworzone w bazie


