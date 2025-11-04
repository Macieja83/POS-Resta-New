@echo off
echo ========================================
echo Stopping existing processes on port 8081...
echo ========================================
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
    echo Killing process %%a on port 8081...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo.
echo ========================================
echo Cleaning all caches and temporary files...
echo ========================================
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
if exist .next rmdir /s /q .next
if exist dist rmdir /s /q dist
if exist .metro rmdir /s /q .metro
if exist metro-* rmdir /s /q metro-* 2>nul
echo.
echo Clearing npm cache...
call npm cache clean --force
echo.
echo Setting environment variables for Windows path handling...
set EXPO_NO_METRO_LAZY=1
set EXPO_USE_FAST_RESOLVER=1
echo.
echo ========================================
echo Starting Expo with cleared cache...
echo ========================================
npx expo start --web --port 8081 --clear
