@echo off
echo ============================================
echo  Stern Trading Platform - OpenFin Launcher
echo ============================================
echo.
echo Prerequisites:
echo 1. Dev server running on http://localhost:5173
echo 2. OpenFin Runtime installed
echo.
echo Starting checks...

REM Check if dev server is running
echo Checking if dev server is running...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Dev server not running on port 5173
    echo Please start it with: npm run dev
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Dev server is running
)

REM Check OpenFin installation
echo Checking OpenFin installation...
if not exist "C:\Users\%USERNAME%\AppData\Local\OpenFin\OpenFinRVM.exe" (
    echo [ERROR] OpenFin Runtime not found
    echo Please install OpenFin from https://www.openfin.co/download/
    echo.
    pause
    exit /b 1
) else (
    echo [OK] OpenFin Runtime found
)

echo.
echo Launching Stern Trading Platform in OpenFin...
echo Manifest: http://localhost:5173/manifest.fin.json
echo.

REM Launch OpenFin with the manifest
start  openfinrvm --config http://localhost:5173/manifest.fin.json

echo Platform launched!
echo.
echo Expected behavior:
echo - OpenFin workspace should initialize
echo - Home, Dock, Store components should be available
echo - Platform should show trading blotter apps
echo.
echo Check the developer console (F12) for logs and errors.
echo.
pause