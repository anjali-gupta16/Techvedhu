@echo off
TITLE SmartWatt AI Launcher
echo ========================================================
echo               SmartWatt AI Full-Stack Launcher
echo ========================================================
echo.

echo [1/3] Checking environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

echo [2/3] Starting Python FastAPI Backend Server on port 8000...
start "SmartWatt AI - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Starting Next.js 15 Frontend Server on port 3000...
start "SmartWatt AI - Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo SmartWatt AI is booting up!
echo   - Frontend: http://localhost:3000
echo   - Backend Docs: http://localhost:8000/docs
echo   - Default Login: demo@smartwatt.ai / password123
echo ========================================================
echo.
pause

