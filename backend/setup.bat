@echo off
setlocal
echo ======================================================
echo   RUDRATIC HR SYSTEM - ALL-IN-ONE INSTALLER
echo ======================================================

:: 1. Check for Node.js
echo.
echo [1/5] Verifying System Requirements...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)
echo Node.js detected.

:: 2. Backend Dependencies & Prisma
echo.
echo [2/5] Setting up Backend Service...
cd .
call npm install --no-audit --no-fund
echo Generating Database Client (Prisma)...
call npx prisma generate
if not exist ".env" (
    echo Creating Backend Environment Template...
    echo PORT=4000 > .env
    echo DATABASE_URL="postgresql://postgres:password@localhost:5432/hr_db" >> .env
    echo JWT_SECRET="hr_system_secret_key_2026" >> .env
)

:: 3. Frontend Dependencies
echo.
echo [3/5] Setting up Frontend Interface...
cd ../frontend
call npm install --no-audit --no-fund
if not exist ".env.local" (
    echo Creating Frontend Environment Template...
    echo NEXT_PUBLIC_API_URL="http://localhost:4000/api" > .env.local
    echo AUTH_SECRET="generate-your-secret-here" >> .env.local
    echo NEXTAUTH_URL="http://localhost:3000" >> .env.local
)
cd ../backend

:: 4. Success Message
echo.
echo ======================================================
echo   SUCCESS: PROJECT IS READY
echo ======================================================
echo To start developing:
echo   - From /backend: npm run dev
echo   - From /frontend: npm run dev
echo.
echo Documents:
echo   - Check backend/README.md for architecture details.
echo ======================================================
pause
