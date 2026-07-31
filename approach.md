# PCARDB Loan Automation — Migration & Rebuild Brief

Paste this whole document as your first message to Claude Code CLI on the new machine. It gives full context so it doesn't need to guess.

---

## 1. What this project is

PCARDB is a full-stack app that digitizes the loan application process for a Taluka-level cooperative bank in Karnataka (Gokak Taluka PCARD Bank). It replaces manual paper forms for 6 agricultural loan schemes (Tractor, Land Development, 3x Sheep-rearing variants, Bullock & Cart).

- **Frontend:** React 18 + Vite, Tailwind, React Hook Form
- **Backend:** FastAPI (Python), SQLModel, SQLite
- **Auth:** JWT (python-jose) + Argon2 password hashing
- **Current document generation (BEING REPLACED):** `openpyxl` fills a legacy bank Excel template's `PLDMagic` sheet → `win32com`/`pythoncom` drives real Excel to calculate formulas and export the printable sheets (`A1`, `A2`, `T1`, etc.) to PDF.

Bank operators fill a web form → data saves to SQLite → system generates a print-ready PDF matching the bank's existing legacy paper format exactly.

---

## 2. Why we are rebuilding the document engine

Two separate, tangled problems were identified in the current implementation:

### Problem A — Windows/Excel dependency (hard blocker on this Mac)
`win32com.client.Dispatthc("Excel.Application")` and `pythoncom` **only work on Windows with a licensed Excel install**. There is no macOS equivalent. This code cannot run on this machine at all — it's not a portability bug to patch, it needs to be replaced.

Additional problems with the old engine, independent of OS:
- Unattended server-side Excel automation is unsupported by Microsoft.
- COM is effectively single-threaded — concurrent PDF requests risk zombie `EXCEL.EXE` processes and RAM leaks.
- Fixed Excel row/coordinates make the layout **structurally static** — adding a row to a variable-length section (e.g. more land-parcel lines) requires manual spreadsheet surgery per template, not a code change.

### Problem B — Legacy Nudi 4 Kannada font encoding
The legacy templates render Kannada using **Nudi 01 e**, an 8-bit glyph-substitution font (not Unicode). Text typed via a Nudi keyboard layout is stored as ASCII bytes that only look correct when displayed through that specific font. Standard Unicode Kannada text (which the new React form correctly collects) will NOT render correctly in these cells — it shows as garbled glyphs, silently, with no error thrown.

- The bank only has Nudi 4 templates. No Nudi 6 (Unicode) or Baraha versions are available.
- The existing `backend/utils/nudi_converter.py` is **not usable** — it implements phonetic transliteration (Baraha-style typing scheme), which is the wrong conversion entirely for Nudi's glyph-substitution encoding. It is also currently unused/unwired in the codebase.
- The correct tool for this is **`aravindavk/ascii2unicode`** (GitHub), a mature, community-used Nudi/Baraha → Unicode converter (CLI tool `knconverter`, Python 3, GPL-3.0-or-later license). Known limitation: it can mis-convert certain conjuncts (arkavottu, e.g. ರ್ವ vs ವ್ರ) — every conversion batch needs a manual spot-check against ground truth, not blind trust.
- **License note:** GPL-3.0 is copyleft. Use it as an isolated conversion utility/script (not copied into the proprietary FastAPI codebase and redistributed). Fine for internal use; get real legal advice if this ever becomes a product sold to other banks.

### The fix that solves both problems at once
Move PDF generation from **Excel/COM** to **HTML/CSS + Jinja2 templating + WeasyPrint** (or Playwright print-to-PDF as an alternative renderer).

This gets us:
- Cross-platform (Mac/Linux/Windows identical behavior) — no COM, no Windows dependency.
- Real Unicode Kannada fonts (Noto Sans Kannada / Tunga) via `@font-face` — Nudi problem disappears entirely for anything built going forward.
- Genuine dynamic layout — `{% for %}` loops over land parcels / co-applicants / cost rows render however many rows actually exist; no manual row-insertion surgery, no fixed coordinates.

**Important scope boundary:** fixing the Nudi encoding and fixing the row-dynamism are two separate concerns that happen to be solved by the same migration. Don't conflate "converted to Unicode" with "now dynamic" — the HTML/Jinja2 rebuild is what buys dynamism; the Unicode font is what buys correct rendering.

---

## 3. What NOT to do / non-negotiables

- **Do not attempt to make `win32com`, `pythoncom`, or any COM-based code run on this Mac.** Don't wrap it in `platform.system() == "Windows"` guards to "keep it working" — it has no purpose in the new engine. Treat `generator.py`'s `convert_to_pdf()` and all of `pdf_service.py`'s COM logic as retired code, not code to port.
- **Do not use `nudi_converter.py` as-is.** It's the wrong transliteration scheme. Either replace it with an `ascii2unicode`/`knconverter`-based wrapper, or remove it if no historical Nudi data needs migrating.
- **Do not commit real applicant data to git** — no `database.db`, no filled-in legacy `.xlsx` copies with real names/Aadhaar numbers, no `.env` secrets. These contain PII and must move via direct copy (AirDrop/USB/private cloud), never through the repo.
- **Do not silently swallow document-generation errors.** The old pipeline's biggest weakness was silent failures (garbled fonts, blank fields from unresolved merged cells, wrong templates from mis-derived scheme routing). The new pipeline should fail loudly and log clearly if a field, template, or font is missing.
- **Do not reconcile the three currently-conflicting field-mapping sources by picking one arbitrarily.** `excel_service.py`, `generator.py`, and `pdf_service.py` currently disagree on cell coordinates, font handling, and even template filenames (e.g. Land Dev: `Kallangouda_Unicode.xlsx` vs `Kallangouda V Patil.xlsx`). These need to be explicitly reconciled into one canonical schema, not silently merged.

---

## 4. Concrete task list, in order

### Phase 0 — Environment setup on the Mac
- [ ] Clone the private git repo (backend + frontend code, `.gitignore`'d appropriately — no `venv/`, `node_modules/`, `__pycache__`, `.env`, `database.db`, generated PDFs/Excels).
- [ ] Copy over separately (not via git): `database.db`, `.env`, `legacy_assets/excell workbooks/` (blank templates only — check for accidental filled-in copies with real data before copying).
- [ ] Backend: `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
  - Strip `pywin32` from `requirements.txt` entirely (Windows-only, will fail to install on Mac and has no purpose in the new engine).
  - Add: `weasyprint`, `jinja2`.
- [ ] Frontend: `npm install` (fully cross-platform already, no changes needed).
- [ ] Fix hardcoded Windows paths in `pdf_service.py` (e.g. `r"D:\PCARDB\legacy_assets\..."`) — switch to `BASE_DIR`-relative paths matching the pattern already used in `generator.py`.

### Phase 1 — Reconcile the field schema (do this before writing new templates)
- [ ] Build one canonical config (JSON/YAML or Python dict) per scheme, covering every field currently scattered across `LAYOUTS` in `generator.py`, `mapped_data` in `pdf_service.py`, and the manual assignments in `excel_service.py`.
- [ ] Flag every discrepancy found between the three files explicitly (coordinates, template filenames, which fields exist) rather than silently picking one.
- [ ] Identify which sections are genuinely variable-length (land parcels, co-applicants, multiple cost line-items) vs fixed (personal details, KYC).

### Phase 2 — Static label conversion (Nudi → Unicode, one-time)
- [ ] Extract every unique static string (labels, headers, hardcoded scheme-name strings currently embedded as literal Nudi bytes, e.g. `"mÁæöåPÀÖgÀ mÉæÃ®gÀ AiÉÆÃd£À"` in `pdf_service.py`) from all 6 legacy templates via `openpyxl`.
- [ ] Run through an `ascii2unicode`/`knconverter`-based wrapper.
- [ ] Manually verify output against actual printed copies of the legacy forms. Hardcode manual corrections for any known-wrong conversions (arkavottu conjuncts etc.) into an override table.
- [ ] Store the verified result as a clean, versioned Unicode label dictionary — this is what the new HTML templates will use directly.

### Phase 3 — Build the new rendering engine (proof of concept)
- [ ] Start with the **Bullock scheme** (simplest — 2-3 financial rows, per `fill_bullock_details()` in `generator.py`).
- [ ] Build an HTML + CSS template using the Phase 2 Unicode labels, with `Noto Sans Kannada` or `Tunga` embedded via `@font-face`.
- [ ] Model any variable-length section as a Jinja2 `{% for %}` loop over the relevant DB records.
- [ ] Render via:
  ```python
  from jinja2 import Environment, FileSystemLoader
  from weasyprint import HTML

  env = Environment(loader=FileSystemLoader("templates"))
  template = env.get_template("bullock.html")
  html_str = template.render(application=app_data, details=details)
  HTML(string=html_str).write_pdf("output.pdf")
  ```
- [ ] Print the output, compare side-by-side with a legacy paper form, and get bank sign-off before proceeding.

### Phase 4 — Roll out to remaining schemes
- [ ] Repeat Phase 3 for Tractor, Land Development, and the 3 Sheep variants, reusing the Phase 1 schema and Phase 2 label dictionary.
- [ ] Decommission `excel_service.py`, `generator.py`'s COM path, and `pdf_service.py` once all 6 schemes are validated on the new engine.

### Phase 5 — Historical data (only if needed)
- [ ] If old, already-filled Nudi-4 workbooks need their data migrated into the new SQLite DB (not just blank templates), run the same `ascii2unicode` wrapper over the filled `PLDMagic` cells.
- [ ] Sample and manually verify a meaningful percentage against known-correct records before bulk-importing — do not trust this conversion blindly at scale, especially for names.

---

## 5. Reference: known specifics from the current codebase

- Legacy templates and scheme mapping (`generator.py`'s `SCHEME_MAP`): `TRACTOR → Vasant Malli.xlsx`, `LAND_DEV → Kallangouda_Unicode.xlsx` (⚠ conflicts with `pdf_service.py`'s `Kallangouda V Patil.xlsx` — resolve in Phase 1), `SHEEP_40 → Adiveppa Sannakki 3.20.xlsx`, `SHEEP_20 → Smt Basavva Shidnal 1.60.xlsx`, `SHEEP_10 → Allappa Mahaling Melmatti 0.87.xlsx`, `BULLOCK → Mahesh M Pattar.xlsx`.
- ⚠ `pdf_service.py` currently re-derives which Sheep template to use from `loan_amount` thresholds, ignoring the actual `SHEEP_40`/`SHEEP_20`/`SHEEP_10` scheme value chosen upstream — this is a real data-integrity bug to fix during Phase 1/4, independent of the rendering engine change.
- Every printable sheet in the legacy workbooks reads from the single `PLDMagic` input sheet via formulas — the new HTML templates should be driven by the same underlying data model (Pydantic/SQLModel objects), not by re-reading Excel formulas.

---

## 6. First message to send to Claude Code

Once environment setup (Phase 0) is done, a good first working instruction is:

> "Read CLAUDE.md, BACKEND_ARCHITECTURE.md, and PROJECT_OVERVIEW.md for context. We're rebuilding the PDF generation engine — moving off win32com/Excel COM entirely to Jinja2 + WeasyPrint, and fixing the legacy Nudi 01 e Kannada font problem by converting static labels to Unicode using an ascii2unicode-style converter. Start with Phase 1: build one canonical field-mapping schema per loan scheme by reconciling `LAYOUTS` in generator.py, `mapped_data` in pdf_service.py, and the manual field assignments in excel_service.py. Flag every discrepancy you find between them instead of silently picking one."