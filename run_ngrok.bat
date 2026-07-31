@echo off
REM PCARDB - localhost + ngrok tunnel (share the https URL ngrok shows).
REM Requires ngrok installed and authed: https://ngrok.com/download

cd /d "%~dp0"

where ngrok >nul 2>nul
if errorlevel 1 (
    echo ngrok not found. Install from https://ngrok.com/download and run:
    echo    ngrok config add-authtoken ^<your-token^>
    exit /b 1
)

start "PCARDB Backend" cmd /k "cd project\backend && ..\..\.venv-win\Scripts\uvicorn.exe main:app --port 8000"
start "PCARDB Frontend" cmd /k "cd project\frontend && npm run dev -- --host"
start "PCARDB ngrok" cmd /k "ngrok http 5173"

echo Three windows opened: backend, frontend, ngrok.
echo Share the https://....ngrok-free.app URL from the ngrok window.
echo Close all three windows to stop.
