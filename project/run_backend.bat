@echo off
cd /d "%~dp0backend"
venv\Scripts\uvicorn main:app --reload --port 8000
pause
