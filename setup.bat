@echo off
REM PCARDB one-time setup (Windows)
REM
REM PREREQUISITES (install once, before running this):
REM   1. Python 3.11+        https://www.python.org/downloads/  (tick "Add to PATH")
REM   2. Node.js LTS         https://nodejs.org/
REM   3. GTK3 Runtime        https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
REM      (download gtk3-runtime-*.exe, install with "add to PATH" ticked - WeasyPrint needs it for PDF generation)

cd /d "%~dp0"

echo === Creating Python environment ===
python -m venv .venv-win || goto :error
call .venv-win\Scripts\activate.bat

echo === Installing backend dependencies ===
pip install -r project\backend\requirements.txt || goto :error

echo === Installing frontend dependencies ===
cd project\frontend
call npm install || goto :error
cd ..\..

echo === Creating database with default users ===
cd project\backend
..\..\.venv-win\Scripts\python.exe init_db.py || goto :error
cd ..\..

echo.
echo Setup complete. Logins: manager/manager123, officer/officer123
echo Next: run.bat (localhost) or run_ngrok.bat (with tunnel)
goto :eof

:error
echo.
echo SETUP FAILED - read the error above. Most common cause: Python/Node not on PATH.
exit /b 1
