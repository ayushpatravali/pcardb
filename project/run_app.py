import subprocess
import os
import sys
import time
import shutil

def main():
    PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
    BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
    FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
    
    print("="*50)
    print("PCARDB Loan Automation System - Inline Launcher")
    print("="*50)
    
    # 1. Start Backend (Non-blocking Popen, output to stdout)
    print("[INFO] Starting Backend Server (FastAPI)...")
    backend_cmd = [
        os.path.join(BACKEND_DIR, "venv", "Scripts", "python"),
        "-m", "uvicorn", 
        "main:app", 
        "--reload", 
        "--port", "8000"
    ]
    
    # We pipe stdout and stderr to the current process's stdout/stderr
    backend_process = subprocess.Popen(
        backend_cmd, 
        cwd=BACKEND_DIR,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    time.sleep(3) # Wait for init
    
    # 2. Start Frontend (Non-blocking Popen, output to stdout)
    print("[INFO] Serving Frontend UI (Production Preview)...")
    frontend_cmd = ["npm", "run", "preview", "--", "--port", "5173", "--host"]
    
    frontend_process = subprocess.Popen(
        frontend_cmd, 
        cwd=FRONTEND_DIR,
        shell=True,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    
    # 3. Check for Ngrok and Start if present
    ngrok_path = os.path.join(PROJECT_DIR, "ngrok.exe")
    if not os.path.exists(ngrok_path):
        # Check system path
        system_ngrok = shutil.which("ngrok")
        if system_ngrok:
            ngrok_path = system_ngrok
    
    if os.path.exists(ngrok_path) or shutil.which("ngrok"):
        # Double check actual path valid if we found it via which
        if not os.path.exists(ngrok_path) and shutil.which("ngrok"):
            ngrok_path = "ngrok" # Let subprocess resolve it

        print(f"[INFO] ngrok found ({ngrok_path})! Starting Tunnel for Frontend (Port 5173)...")
        try:
            # Open ngrok in a new console window so user can see the URL
            ngrok_process = subprocess.Popen(
                [ngrok_path, "http", "5173"],
                cwd=PROJECT_DIR,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            print("[INFO] Ngrok started in a new window.")
        except Exception as e:
            print(f"[ERROR] Failed to start ngrok: {e}")
    else:
        print("[INFO] ngrok not found in project directory or PATH. Skipping tunnel.")
        print("       (Tip: Copy ngrok.exe here or add it to your PATH)")

    print("\nSYSTEM RUNNING IN THIS TERMINAL.")
    print("Press Ctrl+C to stop both services safely.")
    print("-" * 50)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_process.terminate()
        frontend_process.terminate() 
        if 'ngrok_process' in locals():
            ngrok_process.terminate()
        
        sys.exit(0)

if __name__ == "__main__":
    main()
