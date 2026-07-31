# PCARDB Loan Automation — run modes
#
#   make setup       one-time: venv + deps + frontend packages + fresh DB with default users
#   make run         localhost only  (backend :8000 + frontend :5173)
#   make run-ngrok   localhost + ngrok tunnel on the frontend
#   make seed        insert the Vasant Malli sample application
#   make verify      render the full 21-page tractor packet from the fixture
#
# macOS prerequisite: brew install pango   (WeasyPrint needs it)
# Windows: use WSL or Git Bash; WeasyPrint needs the GTK3 runtime (MSYS2).

VENV      := .venv-mac
PYTHON    := $(VENV)/bin/python
BACKEND   := project/backend
FRONTEND  := project/frontend

UNAME := $(shell uname -s)
ifeq ($(UNAME),Darwin)
  RUN_ENV := DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib
else
  RUN_ENV :=
endif

.PHONY: setup run run-ngrok seed verify

setup:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -r $(BACKEND)/requirements.txt
	cd $(FRONTEND) && npm install
	cd $(BACKEND) && ../../$(PYTHON) init_db.py
	@echo "Setup complete. Default logins: manager/manager123, officer/officer123"

run:
	@echo "Backend: http://localhost:8000  Frontend: http://localhost:5173  (Ctrl+C stops both)"
	@trap 'kill 0' INT TERM; \
	( cd $(BACKEND) && $(RUN_ENV) ../../$(VENV)/bin/uvicorn main:app --port 8000 ) & \
	( cd $(FRONTEND) && npm run dev ) & \
	wait

run-ngrok:
	@command -v ngrok >/dev/null || { echo "ngrok not installed (brew install ngrok, then: ngrok config add-authtoken <token>)"; exit 1; }
	@echo "Starting backend + frontend + ngrok (share the https URL ngrok prints; Ctrl+C stops all)"
	@trap 'kill 0' INT TERM; \
	( cd $(BACKEND) && $(RUN_ENV) ../../$(VENV)/bin/uvicorn main:app --port 8000 ) & \
	( cd $(FRONTEND) && npm run dev -- --host ) & \
	ngrok http 5173 & \
	wait

seed:
	cd $(BACKEND) && $(RUN_ENV) ../../$(PYTHON) tools/seed_reference_apps.py

verify:
	cd $(BACKEND) && $(RUN_ENV) ../../$(PYTHON) tools/render_test.py
