# PCARDB Loan Automation — Project Guide for Claude Code

> **Keep this file current.** After every significant change (feature, schema,
> template, deployment), update the **Changelog** and any affected section
> below. This file is the context bridge between sessions.

## What this is

Digitizes loan applications for Gokak Taluka PCARD Bank (Karnataka). Operator
fills a React form → FastAPI + SQLite stores it → the system generates the
bank's standard **21-page Kannada print packet** as a PDF. **Tractor scheme is
fully built**; the other 5 schemes (LAND_DEV, BULLOCK, SHEEP_40/20/10) are
gated on bank sign-off of the Tractor pilot and will replicate its pattern.

**Repo:** https://github.com/ayushpatravali/pcardb (owner's personal GitHub;
a fork on a second account feeds the Railway demo — "Sync fork" after pushes).

## Architecture (current — the old Excel/win32com engine is GONE)

```
React form (frontend/src/pages/NewApplication.jsx)
  → POST/PUT /applications (routers/applications.py, exact SchemeType routing)
  → SQLite row (models.py; JSON-string columns for arrays)
  → GET /pdf/download/{id} or POST /applications/{id}/generate
  → services/render_service.py: build_context() fills 21 Jinja2 HTML pages
  → WeasyPrint → PDF (~1s). Missing required fields → 422 with field list.
```

- **Templates:** `backend/templates/pages/*.html` (+ `pages/tractor/t1–t7`),
  assembled by `templates/packet.html` in the order defined in
  `backend/schemas/tractor.py` `PAGES`. CSS in `templates/css/base.css`.
  Labels are Unicode Kannada transcribed from the bank's reference PDFs
  (`legacy_assets/pdfss/`, NOT in git — contains real customer PII).
- **Field specs:** `backend/schemas/` — tier per field: `collected` (form) /
  `computed` (server-derived) / `constant` / `handwritten` (prints blank).
- **Computed server-side:** annual_income = Σ crop incomes from `current_crop`
  JSON; per-parcel land valuation = `land_valuation_per_acre` × extent;
  totals; Kannada amount-in-words (`utils/kannada_numbers.py`).
- **JSON-string columns on Application:** `co_applicants`, `land_parcels`
  (incl. per-parcel `valuation`), `current_crop`, `previous_loans`.
  Numeric fields inside them are coerced to float at render (form sends strings).
- **Auth:** JWT; roles manager/field_officer; enums stored by VALUE
  (lowercase); signup is DISABLED unless `ALLOW_SIGNUP=1` (local scripts set it).

## Run

| Task | macOS/Linux | Windows |
|---|---|---|
| one-time setup | `make setup` | `setup.bat` |
| localhost | `make run` | `run.bat` |
| + ngrok tunnel | `make run-ngrok` | `run_ngrok.bat` |

Default logins `manager/manager123`, `officer/officer123` (env-overridable:
`MANAGER_PASSWORD`, `OFFICER_PASSWORD`). macOS needs
`DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` (brew pango) — scripts set it.
Never run WeasyPrint through `nohup`/`env` on macOS (SIP strips DYLD vars).

**Demo hosting (Railway, free):** Dockerfile at repo root; single container
serves API + built frontend (`/api/*` routes + SPA fallback in `main.py`).
Env vars on the service: `MANAGER_PASSWORD`, `OFFICER_PASSWORD`, `DEMO_SEED=1`
(auto-seeds the editable Vasant Malli sample each boot). Disk is ephemeral —
data resets on redeploy. `GET /healthz` shows env delivery as booleans.
Final deployment target: fully local on the bank manager's machine, bank LAN only.

## Testing

From `backend/` with venv `/Users/ayush/project/.venv-mac`:
- `python tools/render_test.py [--pages a1,b3]` — render fixture packet; must print `pages: 21 OK`
- `python tools/render_highlight.py <id>` — packet with UI-input values highlighted yellow (bank review)
- `python tools/compare_pdfs.py <pdf>` — page-count + side-by-side images vs reference
- `python tools/seed_reference_apps.py` — seed Vasant Malli sample
- e2e pattern: `with TestClient(main.app) as c:` (context manager, or startup/seeding won't run)

## Hard rules

1. **PII never in git**: `legacy_assets/`, `*.xlsx`, `*.pdf`, `*.db` are
   gitignored. Real applicant data moves by USB/AirDrop only.
2. **Form ↔ backend contract**: backend adapts to what the form sends; field
   names in `ApplicationCreate` mirror the form payload exactly.
3. **Kannada input must be Unicode.** Nudi legacy (ASCII) input is detected
   and rejected server-side (`reject_nudi_ascii`). Bank machines: Nudi 6 in
   Unicode mode.
4. **Templates use StrictUndefined** — every referenced key must exist in the
   context (see `p.setdefault("valuation", None)` pattern).
5. **Local schema changes**: `ALTER TABLE` the dev `database.db` in place
   (see git history for one-liners); Railway recreates its DB on redeploy.
6. **Page-count fidelity**: any page edit must keep `render_test.py` at 21
   pages — fixed-height pages, tighten spacing if content grows.
7. Git identity/remote is repo-local only; never touch global git config
   (owner has separate org GitHub in other VS Code windows).

## Changelog

- **2026-07-31** — Engine rebuild: retired generator.py/excel_service/
  pdf_service/win32com + excel router + nudi_converter. New schemas package,
  render_service (Jinja2+WeasyPrint), 21 Tractor page templates transcribed
  from reference PDFs, models cleanup (enum values, exact scheme routing,
  dropped duplicate columns), verification tools, Makefile, README.
  Cross-checked labels via knconverter; 6 spelling fixes.
- **2026-07-31** — Demo hosting: Dockerfile (node build + python/pango),
  /api route aliases + SPA serving, env-seeded users, signup off by default
  (`ALLOW_SIGNUP` opt-in), `/healthz`, `DEMO_SEED` auto-sample. Railway live
  at pcardbbank-gokak.up.railway.app (via fork on second account).
- **2026-07-31** — Fixes found by e2e: create-response losing id (ORM refresh),
  form's string-typed numbers crashing PDF arithmetic (float coercion).
- **2026-08-02** — Land valuation (Tractor): `land_valuation_per_acre` input,
  locked per-parcel value column + total in form; page 19 (ಅನುಬಂಧ–2) value
  column/total/per-acre certification line filled.
- **2026-08-02** — Application date override (blank = today), irrigation HP
  dropdown 1–20 step 0.5 + "HP only for motorised sources" note, page-1 photo
  box → passport 35×45mm labeled ಅರ್ಜಿದಾರರ ಭಾವಚಿತ್ರ.
- **2026-08-03** — Formula map: all 489 cell formulas from the Vasant Malli
  Tractor workbook extracted to `legacy_assets/formula_maps/tractor_formulas.json`
  (gitignored) — reference for every computed figure in the packet.
- **2026-08-03** — UI v2: shadcn/ui components authored in src/components/ui
  (button/card/input/badge/separator, cva + cn util, @ alias). Login brand
  panel gains bank+farmland SVG backdrop. Dashboard: per-scheme bar chart
  (recharts, counts + sanctioned value) and loan-size band distribution from
  fetchApplications. Form: sticky live-summary bar (extent, loan, installment
  ≈ loan/(2×duration), updates per keystroke), shadcn Buttons for add-row and
  submit, InputField wraps shadcn Input.
- **2026-08-03** — UI overhaul (no flow/field changes): forest-green + harvest-
  gold design system (tailwind.config `primary`/`accent`/`surface`, self-hosted
  Noto Sans Kannada in frontend/public/fonts). Redesigned Login (bank brand
  panel, Kannada identity), SignUp (+ ವಲಯ region input feeding User.region),
  Layout (dark green sidebar), Home (stat cards + recharts status donut),
  SelectScheme; NewApplication restyled via SectionHeader/InputField/SelectField
  (new `variant` prop: dark/highlight for the totals panels). Deps: motion,
  recharts, class-variance-authority. Loan-duration select moved after
  caste/farmer/borrower-type block (owner request).
- **2026-08-03** — Form fix: crop income + land totals/valuation now recompute
  on every keystroke. RHF `watch()` returns the same array ref while typing
  inside field-array rows, so the effects only fired on row add/remove — now
  keyed on JSON-serialized row contents.
- **2026-08-03** — Display normalization (render_service): (1) acre.gunta
  extent notation — parcels/crops get `p.extent`/`c.extent` ("8.19" = 8 ac 19 g)
  and `computed.total_extent`; all templates that printed bare acres now use
  them (page 19 keeps its separate acre/gunta columns). (2) Kannada-only
  output: `kn_display()` strips English halves of bilingual form values —
  "General / ಸಾಮಾನ್ಯ"→ಸಾಮಾನ್ಯ, "ಕಾಲುವೆ (Canal)"→ಕಾಲುವೆ (keeps "(7 HP)"),
  English crop values map via CROP_KN (Sugarcane→ಕಬ್ಬು…), farmer_type token
  mapping. New computed keys: caste_kn, irrigation_kn, total_extent.
- **2026-08-03** — Page 10 section 12 (ಆರ್ಥಿಕ ಸಕ್ಷಮತೆ) fully computed using the
  workbook's B4/T5 formula chain (mapped in `docs/formula_map_pages_9_10.md`):
  security = land_valuation_total; loan eligibility = 80% of it; net = − old
  outstanding; repayment eligibility = 75% of (30% × annual income); net = −
  old installment (page 9 ಉ feeds page 10 ಊ); ಏ = per half-yearly installment
  = total loan ÷ (duration × 2), e.g. 11.2L over 7 yrs = 14 kantu of 80000.
  Also: b4 sanction line now prints "+ 100000" (workbook B4!F42 hardcodes it —
  5th insurance site); b3 item-5 dealer/ಸಮರ್ಪಕವಾಗಿದೆ values left-aligned.
- **2026-08-03** — Loan duration + insurance: `loan_duration_years` field (form
  select 1–15, default 7) drives b4 repayment period ("N ವರ್ಷ (2N ಕಂತು)") and t5
  kantu (= total_loan/duration) + 8.10 row. Fixed `INSURANCE_AMOUNT=100000`
  (render_service constant) prints as "+ 100000" (never the word insurance) at
  the 4 final-loan-amount sites: b3 cost table, t1 totals table, t5 8.8, t7
  recommendation line (fills the existing "+ ___ ವಿಮೆ" blank).
- **2026-08-03** — Gokak fixes + per-user region: a3 ಸ್ಥಳ now prints `bank.place`
  constant (ಗೋಕಾಕ), was operator-typed branch_name. New `User.region` column
  (Kannada, default ಗೋಕಾಕ; settable via /register) prints at a4 ವಲಯ via
  `computed.region_kn`. `app.bank_name` prints nowhere in the packet. Also fixed
  a stray Korean "주소" in the form's Kannada notice (→ ವಿಳಾಸ).
- **2026-08-02** — Previous-loan block (borrower type = Old): 8 inputs stored
  as `previous_loans` JSON; PDF page 9 section 9) reordered (amounts first,
  attachment items last), ಲಗತ್ತಿಸಿದೆ → ಲಗತ್ತಿಸಿರಿ, values bound.

## Next / pending

- **PRE-GO-LIVE (owner, 2026-08-03):** wire NewApplication.jsx into the
  existing KN/EN language switch — Kannada mode must be 100% Kannada (labels,
  notes, dropdown options), English mode English. Bilingual labels stay until
  then (owner reads them during testing). Stored option VALUES must not change
  (backend contract + PDF kn_display mapping depend on them). Details in
  NEXT_SESSION_TASKS.md item 6.

- Bank sign-off on printed Tractor packet → then replicate templates+specs to
  SHEEP_40/20/10 → BULLOCK → LAND_DEV (shared pages already built; their UI
  forms don't exist yet and will copy the Tractor form pattern).
- Optional: Railway volume for persistent demo data; Windows-VM validation of
  the GTK runtime before bank install; frontend dead-code sweep (PDFOverlay,
  tractor_map.js, TractorApplicationForm.jsx) — needs owner approval.
