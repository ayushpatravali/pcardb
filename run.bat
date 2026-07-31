@echo off
REM PCARDB - localhost only. Opens two windows (backend + frontend).
REM App: http://localhost:5173   Close both windows to stop.

cd /d "%~dp0"

start "PCARDB Backend" cmd /k "cd project\backend && ..\..\.venv-win\Scripts\uvicorn.exe main:app --port 8000"
start "PCARDB Frontend" cmd /k "cd project\frontend && npm run dev"

echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Close the two spawned windows to stop.
