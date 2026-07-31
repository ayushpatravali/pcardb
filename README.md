# PCARDB — Loan Application Automation

Digitizes loan applications for Gokak Taluka PCARD Bank. Operators fill a web
form; the system stores it and generates the bank's standard 21-page Kannada
print packet as a PDF (Tractor scheme complete; other schemes follow the same
pattern).

**Stack:** React + Vite frontend · FastAPI + SQLite backend · Jinja2 + WeasyPrint PDF engine.
Fully offline — no internet needed to run, no external services.

---

## 1. Prerequisites (install once)

### Windows
| What | Where | Note |
|---|---|---|
| Python 3.11+ | https://www.python.org/downloads/ | tick **"Add to PATH"** in the installer |
| Node.js LTS | https://nodejs.org/ | |
| GTK3 Runtime | https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases | download `gtk3-runtime-*.exe`, tick **"add to PATH"**. Needed for PDF generation — without it the app runs but PDF download fails with a DLL error |
| ngrok (optional) | https://ngrok.com/download | only for `run_ngrok.bat`; then `ngrok config add-authtoken <token>` |

### macOS
```bash
brew install pango          # WeasyPrint dependency (PDF engine)
brew install ngrok          # optional, only for make run-ngrok
```
Python 3 and Node via brew or installers if not present.

---

## 2. Commands

### Windows
```bat
setup.bat          :: one-time: creates venv, installs everything, creates DB with default users
run.bat            :: localhost only — opens backend + frontend windows, app at http://localhost:5173
run_ngrok.bat      :: same + ngrok tunnel (share the https URL from the ngrok window)
```
Stop = close the spawned windows.

### macOS / Linux
```bash
make setup         # one-time
make run           # localhost only, Ctrl+C stops both
make run-ngrok     # + ngrok tunnel
```

### Default logins
| Role | Username | Password |
|---|---|---|
| Manager | `manager` | `manager123` |
| Field Officer | `officer` | `officer123` |

---

## 3. Using the app

1. Open http://localhost:5173 and log in.
2. New Application → Tractor → fill the form → save.
3. Open the application → **Download PDF** → print. Generation takes ~1–2 seconds.

**Kannada typing:** input must be Unicode. Nudi 6 in **Unicode mode** works, as do
the Windows Kannada keyboard, Google Input Tools, and phone Kannada keyboards.
If someone types with Nudi in legacy (ASCII) mode, the save is rejected with a
message telling them to switch — garbled text can never reach a printout.

---

## 4. Developer / testing commands

Run from `project/backend` with the venv active
(macOS: prefix with `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`):

```bash
python tools/seed_reference_apps.py    # insert the Vasant Malli sample application
python tools/render_test.py            # smoke test: render full 21-page packet from fixture data
python tools/render_test.py --pages a1,a2   # render only specific pages (fast iteration)
python tools/render_highlight.py <id>  # render an application with every UI-input value
                                       # highlighted yellow (for review meetings)
python tools/compare_pdfs.py <generated.pdf>  # page-count check + side-by-side images vs the
                                              # bank's reference PDF (needs poppler + legacy assets)
python reset_db.py                     # wipe and recreate the database (fresh users)
```

Makefile shortcuts (macOS): `make seed`, `make verify`.

---

## 5. Repository layout

```
project/backend/
  templates/            21 HTML page templates + CSS (the printed packet)
  schemas/              canonical field specs per scheme (what's typed vs handwritten)
  services/render_service.py   form data -> PDF
  routers/              FastAPI endpoints (applications, auth, pdf)
  tools/                seed / render-test / compare / highlight scripts
project/frontend/       React app (form, list, print page)
setup.bat run.bat run_ngrok.bat    Windows
Makefile                           macOS/Linux
```

## 6. Not in git (on purpose)

`legacy_assets/` (real customer workbooks/PDFs — PII), all `.xlsx`/`.pdf`/`.db`
files. The app does not need them to run. They're only reference material for
building the remaining schemes' templates — move them by USB/AirDrop, never git.

## 7. Temporary demo hosting (Render free tier)

For letting a client try it without your laptop. **Demo/dummy data only — never
real applicant names or Aadhaar on public hosting.** The free-tier disk is
ephemeral: data resets on redeploys, and the app sleeps when idle (first visit
takes ~30s to wake).

1. https://render.com → New → **Web Service** → connect the `pcardb` GitHub repo.
2. Runtime: **Docker** (it auto-detects the `Dockerfile`). Instance type: **Free**.
3. Environment variables — set both (do NOT keep defaults on a public URL):
   - `MANAGER_PASSWORD` = something strong
   - `OFFICER_PASSWORD` = something strong

   Self-signup is **disabled by default** on any deployment; the local run
   scripts enable it via `ALLOW_SIGNUP=1`. Never set that on public hosting.
   `GET /healthz` shows (as booleans only) whether the env vars reached the
   container.
4. Deploy. Share the `https://pcardb-xxxx.onrender.com` URL + the passwords with the client.
5. Delete the service when the trial is over.

Local container test: `docker build -t pcardb . && docker run -p 8080:8000 -e MANAGER_PASSWORD=xyz pcardb`

Only the **Tractor** scheme is complete; other schemes respond with a clear
"scheme template not built yet" message.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| PDF download fails, DLL/library error | GTK3 Runtime not installed or not on PATH (Windows); `brew install pango` (macOS) |
| `weasyprint` import error on macOS | run backend with `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` (Makefile does this) |
| Port 8000/5173 already in use | close the old backend/frontend windows first |
| Save rejected: "Nudi legacy (ASCII) input" | switch Nudi to Unicode mode and re-type the Kannada fields |
| 422 "missing_fields" on PDF download | the listed fields are empty on that application — edit and fill them |
