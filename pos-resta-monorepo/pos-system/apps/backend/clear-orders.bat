@echo off
echo 🧹 Rozpoczynam czyszczenie zamówień...
cd /d "C:\Users\mmaci\Desktop\pos-system\apps\backend"
npx tsx clear-orders.ts
echo ✅ Skrypt zakończony
pause
