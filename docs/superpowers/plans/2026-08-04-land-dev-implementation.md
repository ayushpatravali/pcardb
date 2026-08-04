# LAND_DEV Scheme v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the LAND_DEV scheme end-to-end (schema, 9 new page templates,
computed-field logic, frontend form section, tests) so a full 23-page Land
Development loan packet renders correctly, mirroring the Tractor scheme's
architecture.

**Architecture:** Reuse pages 1–10 and 20–23 unchanged (shared Jinja
templates already built for Tractor). Add 9 new templates under
`templates/pages/land_dev/` for pages 11–19, a new `LandDevDetails` model
shape, a new `schemas/land_dev.py` spec, a `SchemeType.LAND_DEV` branch in
`render_service.py`'s `build_context()`, and a new form section in
`NewApplication.jsx`.

**Tech Stack:** FastAPI + SQLModel (backend), Jinja2 + WeasyPrint (PDF),
React + react-hook-form (frontend) — all existing, no new dependencies.

## Global Constraints

- PII never in git: reference PDF/xlsx stay in `legacy_assets/` (gitignored).
  Any fixture data used in code/tests must be synthetic, not the real
  applicant's Aadhaar/mobile/bank-account numbers seen in the reference.
- Templates use StrictUndefined — every referenced context key must exist
  (`p.setdefault(...)` pattern for optional keys).
- Page-count fidelity: full render must be exactly 23 pages for LAND_DEV.
- Local schema changes: `ALTER TABLE` the dev `database.db` in place.
- Kannada labels are transcribed from the reference PDF (already read and
  copied into this plan) — do not re-derive from the xlsx's garbled text.
- `num` filter (Indian digit grouping) applies to every rupee amount.

---

## Confirmed reference data (from reading the PDF, pages 9–19)

Applicant: ಶ್ರೀ ಕಲ್ಲನಗೌಡಾ ವೀರನಗೌಡಾ ಪಾಟೀಲ @ ಬಿರಾದಾರ, ಗ್ರಾಮ ಗೋಕಾಕ, ತಾಲೂಕು ಗೋಕಾಕ,
ಜಿಲ್ಲೆ ಬೆಳಗಾವಿ, ದೊಡ್ಡ ರೈತರು, survey 2419/1, extent 24.20 (24 ac 20 gt).

**Dev-work cost table (6 fixed rows)** — rate is per-acre, amount =
`round(rate * extent_decimal)` where `extent_decimal = acres + guntas/40`
(same shape as the existing land-valuation formula):

| # | Kannada description | rate/acre | amount (fixture) |
|---|---|---|---|
| 1 | ಗಿಡಗಂಟೆ, ಕಲ್ಲು ಕಂಟಿಗಳನ್ನು ತೆಗೆದು ಜಮೀನು ಸ್ವಚ್ಛಗೊಳಿಸುವುದು ಮತ್ತು ಕೊರಕಲುಗಳನ್ನು ತುಂಬುವುದು | 5336 | 130732 |
| 2 | ಜಮೀನಿನ ವಿಂಗಡಣೆ, ಸಮತಳ ಮತ್ತು ಮಟ್ಟಿಗೊಳಿಸುವುದು | 61714 | 1511993 |
| 3 | ಮೇರೆ / ಅಂಚುಗಳಿಗೆ ಒಡ್ಡುಗಳನ್ನು ಹಾಕುವುದು | 7807 | 191272 |
| 4 | ಹೆಚ್ಚಿನ ನೀರು ಹೊರಹೋಗಲು ಒಳಗಟ್ಟಿ ನಿರ್ಮಿಸುವುದು | 0 | 0 |
| 5 | ಫಲವತ್ತಾದ ಕೆರೆ ಮಣ್ಣು ಮತ್ತು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಹರಡುವುದು | 3429 | 84011 |
| 6 | ಕಾಣಬರದ ಇತರ ಕಾರ್ಯಗಳು | 1714 | 41993 |

Total = 1,960,001. This exact table (or a subset view of it) prints on
pages 12, 16, 17, and 18 — same 6 numbers, different table layouts per
page (confirmed from the PDF reading; not a guess).

**Crop income (pre/post development)**, sourced from Ap3 (page 13):

- Pre-development crops: ಹೈಬ್ರಿಡ್ ಹತ್ತಿ (24.20 ac, ಮುಂ/ಹಿಂ season, ನೀ
  irrigated, exp/acre 27500, yield/acre 6.5, rate 7600, net income 527700),
  ಹೈಬ್ರಿಡ್ ಜೋಳ (0 ac, net 0), ಸೂರ್ಯಕಾಂತಿ (24.20 ac, exp/acre 16700,
  yield/acre 7, rate 4500, net 356360). **Total pre-dev net income =
  884,060.**
- Post-development crops: ಕಬ್ಬು (24.20 ac, ವಾ season, ನೀ irrigated,
  exp/acre 54500, yield/acre 500, rate 275, net 2008600). **Total post-dev
  net income = 2,008,600.**
- **Incremental income = 2,008,600 − 884,060 = 1,124,540** (confirmed
  printed at shared page 10 item 11-ಇ and Ap4 item 18 — this is a real
  delta, not the Tractor scheme's flat 30% heuristic).

**Loan eligibility percentage is 50%, not 80%.** Page 10 (shared, already
built) prints "ಸಾಲದ ಅರ್ಹತೆ … (ಮೌಲ್ಯ % 50 %)" for this Land Dev application —
land valuation 13,720,000 × 50% = 6,860,000. The existing shared
`b4.html` template hardcodes the literal text `80%` and
`render_service.py` hardcodes `* 0.80` for every scheme. This must become
scheme-configurable.

**No insurance line anywhere in the Land Dev packet** — confirmed by
reading every loan-amount print site in the reference PDF (item 11 "ಸಾಲದ
ಅವಶ್ಯಕತೆ 1500000", page 20 sanction table "1500000" — neither has a
"+ 1,00,000" addition). `computed.insurance_amount` must not be added for
`SchemeType.LAND_DEV`.

**Known gap, not fixed in v1 (documented, not silently dropped):** the
reference PDF shows a 2-year moratorium concept (7 years total duration,
first ~2 years grace, then 5 years of annual installments of 300,000 each)
that the shared `b4.html` template doesn't model (it only has one duration
field, dividing evenly). v1 will print `loan_duration_years` evenly like
Tractor does — this will not exactly match a moratorium-bearing
application until a follow-up correction adds a `moratorium_years` field.
Flag this to the user after building; do not silently guess a fix.

---

## Task 1: Generalize the shared loan-eligibility percentage and drop the Tractor-only insurance assumption

**Files:**
- Modify: `backend/services/render_service.py` (loan-eligibility % constant,
  `SchemeType.LAND_DEV` insurance handling)
- Modify: `backend/templates/pages/b4.html` (print the percentage from a
  variable instead of literal `80%` text)
- Test: `backend/tools/render_test.py` (existing Tractor fixture must still
  print 80% and the same numbers as before)

**Interfaces:**
- Produces: `computed["loan_eligibility_pct"]` (int, e.g. `80` or `50`),
  used by both `render_service.py`'s own `loan_eligibility` calculation and
  by `b4.html`'s printed label.

- [ ] **Step 1: Add a per-scheme percentage constant**

In `backend/services/render_service.py`, near `INSURANCE_AMOUNT` /
`DEFAULT_LOAN_DURATION_YEARS`, add:

```python
LOAN_ELIGIBILITY_PCT = {
    SchemeType.TRACTOR: 80,
    SchemeType.LAND_DEV: 50,
}
DEFAULT_LOAN_ELIGIBILITY_PCT = 80
```

- [ ] **Step 2: Use the constant in the eligibility calculation**

Find this line in `build_context()`:
```python
loan_eligibility = round(valuation_total * 0.80) if valuation_total else None
```
Replace with:
```python
loan_eligibility_pct = LOAN_ELIGIBILITY_PCT.get(app.scheme_type, DEFAULT_LOAN_ELIGIBILITY_PCT)
loan_eligibility = (
    round(valuation_total * loan_eligibility_pct / 100) if valuation_total else None
)
```
Add `"loan_eligibility_pct": loan_eligibility_pct,` to the `computed` dict
literal (alongside `"loan_eligibility": loan_eligibility,`).

- [ ] **Step 3: Print the percentage dynamically in the shared template**

In `backend/templates/pages/b4.html`, find:
```html
<span>(ಮೌಲ್ಯ % <span class="fill short">80%</span> %)</span></div>
```
Replace with:
```html
<span>(ಮೌಲ್ಯ % <span class="fill short">{{ computed.loan_eligibility_pct }}%</span> %)</span></div>
```

- [ ] **Step 4: Skip the insurance addition for LAND_DEV**

Still in `build_context()`, find where `computed["insurance_amount"]` is
set:
```python
"insurance_amount": INSURANCE_AMOUNT,
```
Replace with a scheme-conditional value:
```python
"insurance_amount": INSURANCE_AMOUNT if app.scheme_type != SchemeType.LAND_DEV else 0,
```
This makes every existing `+ {{ computed.insurance_amount | num }}` site
print `+ 0` for Land Dev. That's still visually wrong (an unwanted "+ 0"
suffix) — so also wrap every one of those prints. Rather than touching all
13 sites now, add a small template filter instead: in
`backend/services/render_service.py`, find the `_jinja_env()` function and
its filter registrations (`num`, `kn_display`, etc.), and add:

```python
def _plus_insurance(amount):
    """Render '+ N' only when N is nonzero — LAND_DEV has no insurance line."""
    return f"+ {num(amount)}" if amount else ""
```
```python
env.filters["plus_insurance"] = _plus_insurance
```

This task does NOT rewrite the 13 existing `+ {{ computed.insurance_amount
| num }}` call sites (that's Tractor's stable, reviewed output — don't
touch it without a reason). It only makes the filter available. Land Dev's
own new templates (Task 3 onward) will use
`{{ computed.insurance_amount | plus_insurance }}` instead, which prints
nothing when the amount is 0.

- [ ] **Step 5: Verify Tractor is unaffected**

Run:
```bash
cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python tools/render_test.py
```
Expected: `pages: 21 (expected 21) OK`. Also render page `b4` alone
(`--pages b4`) and confirm the printed percentage is still `80%` and
`loan_eligibility` is still `round(valuation_total * 0.8)` (same number as
before this change).

- [ ] **Step 6: Commit**

```bash
git add backend/services/render_service.py backend/templates/pages/b4.html
git commit -m "Generalize loan-eligibility % and insurance-amount by scheme

Land Dev's reference packet uses 50% (not Tractor's 80%) and has no
insurance line at any of its loan-amount print sites."
```

---

## Task 2: Replace the `LandDevDetails` model and register the scheme

**Files:**
- Modify: `backend/models.py:150-161` (LandDevDetails class)
- Modify: local `backend/database.db` (ALTER TABLE, run manually, not a
  migration file — matches existing project convention)

**Interfaces:**
- Produces: `LandDevDetails.land_type: str | None`,
  `.pre_dev_crops: str | None` (JSON), `.post_dev_crops: str | None`
  (JSON), `.dev_work_items: str | None` (JSON), `.total_dev_cost: float |
  None` — consumed by `render_service.py` (Task 3) and the frontend
  (Task 5).

- [ ] **Step 1: Replace the model class**

In `backend/models.py`, replace the existing `LandDevDetails` class
(currently `survey_no`/`area_acres`/`assessment`/`land_type`/
`pre_development_income`/`post_development_income`/`incremental_income`)
with:

```python
class LandDevDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    land_type: Optional[str] = None  # ಖುಷ್ಕಿ (Dry) / ತರಿ (Wet)

    # JSON-string columns, same convention as Application.land_parcels/current_crop.
    pre_dev_crops: Optional[str] = None
    post_dev_crops: Optional[str] = None
    dev_work_items: Optional[str] = None

    total_dev_cost: Optional[float] = None
```

- [ ] **Step 2: Apply the schema change to the local dev database**

```bash
cd backend && /Users/ayush/project/.venv-mac/bin/python -c "
import sqlite3
con = sqlite3.connect('database.db')
con.execute('ALTER TABLE landdevdetails RENAME TO landdevdetails_old')
con.execute('''CREATE TABLE landdevdetails (
    id INTEGER PRIMARY KEY,
    application_id INTEGER REFERENCES application(id),
    land_type TEXT,
    pre_dev_crops TEXT,
    post_dev_crops TEXT,
    dev_work_items TEXT,
    total_dev_cost REAL
)''')
con.execute('DROP TABLE landdevdetails_old')
con.commit()
print('landdevdetails table replaced')
"
```

- [ ] **Step 3: Verify the app still boots**

```bash
cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python -c "
from main import app
from fastapi.testclient import TestClient
with TestClient(app) as c:
    r = c.get('/healthz')
    print(r.status_code, r.json())
"
```
Expected: `200` and a JSON body (confirms `models.py` imports cleanly and
startup/seeding didn't crash on the model change).

- [ ] **Step 4: Commit**

```bash
git add backend/models.py
git commit -m "Replace LandDevDetails stub with real Land Dev fields

land_type + three JSON-string columns (pre/post-dev crops, dev-work
cost items) + total_dev_cost, matching the Application model's
JSON-column convention. Local database.db altered in place."
```

---

## Task 3: `schemas/land_dev.py` — field spec and page list

**Files:**
- Create: `backend/schemas/land_dev.py`
- Modify: `backend/schemas/__init__.py` (register `SCHEMES[SchemeType.LAND_DEV]`)

**Interfaces:**
- Consumes: `ADDRESS_FIELDS`, `AGRICULTURE_FIELDS`, `APPLICANT_FIELDS`,
  `BANK_ACCOUNT_FIELDS`, `LAND_FIELDS`, `LOAN_FIELDS` from
  `schemas/common_fields.py` (same imports `schemas/tractor.py` uses).
- Produces: `schemas.land_dev.SPEC` (dict with `scheme`, `scheme_name_kn`,
  `scheme_code`, `pages`, `fields`), consumed by `render_service.py`'s
  `SCHEMES` registry and `build_context()`.

- [ ] **Step 1: Read the current registry file**

```bash
cat backend/schemas/__init__.py
```
(Confirms the exact `SCHEMES = {...}` dict shape and the comment marking
where LAND_DEV goes — `# SchemeType.SHEEP_40/20/10, BULLOCK, LAND_DEV:
added in Phase 4 rollout`.)

- [ ] **Step 2: Write the schema file**

Create `backend/schemas/land_dev.py`:

```python
"""LAND_DEV scheme spec.

Page inventory follows the Kallangouda V Patil reference
(legacy_assets/pdfss/Kallangouda Patil Land Development Scheme.pdf,
23 pages) and the sheet taxonomy of Kallangouda V Patil.xlsx.
"""
from schemas.common_fields import (
    ADDRESS_FIELDS,
    AGRICULTURE_FIELDS,
    APPLICANT_FIELDS,
    BANK_ACCOUNT_FIELDS,
    LAND_FIELDS,
    LOAN_FIELDS,
)

SCHEME_NAME_KN = "ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆ"
SCHEME_CODE = "LD"

DETAIL_FIELDS = [
    {"key": "land_type", "label_kn": "ಜಮೀನಿನ ವಿಧ (ಖುಷ್ಕಿ/ತರಿ)", "label_en": "Land Type", "tier": "collected", "source": "details.land_type"},
    {"key": "pre_dev_crops", "label_kn": "ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಬೆಳೆಗಳು", "label_en": "Pre-Development Crops", "tier": "collected", "source": "parsed.pre_dev_crops"},
    {"key": "post_dev_crops", "label_kn": "ಅಭಿವೃದ್ಧಿ ನಂತರದ ಬೆಳೆಗಳು", "label_en": "Post-Development Crops", "tier": "collected", "source": "parsed.post_dev_crops"},
    {"key": "dev_work_items", "label_kn": "ಭೂ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ವೆಚ್ಚ", "label_en": "Development Work Cost Items", "tier": "collected", "source": "parsed.dev_work_items"},
    {"key": "total_dev_cost", "label_kn": "ಒಟ್ಟು ಅಭಿವೃದ್ಧಿ ವೆಚ್ಚ", "label_en": "Total Development Cost", "tier": "computed", "source": "computed.total_dev_cost"},
]

# Print order of the 23-page packet.
PAGES = [
    ("a1", "A4"), ("a2", "A4"), ("a3", "A4"), ("a4", "A4"),
    ("ssm", "A4"), ("ssm2", "A4"),
    ("b1", "A4"), ("b2", "A4"), ("b3", "A4"), ("b4", "A4"),
    ("land_dev/ld1", "A4"), ("land_dev/ld2", "A4"), ("land_dev/ld3", "A4"),
    ("land_dev/ld4", "A4"), ("land_dev/ld5", "A4"), ("land_dev/ld6", "A4"),
    ("land_dev/ld7", "A4"), ("land_dev/ld8", "A4"), ("land_dev/ld9", "A4"),
    ("valuation", "A4"),
    ("inspection", "A4"),
    ("pp", "A4"),
    ("varadi", "A4"),
]

SPEC = {
    "scheme": "LAND_DEV",
    "scheme_name_kn": SCHEME_NAME_KN,
    "scheme_code": SCHEME_CODE,
    "pages": PAGES,
    "fields": (
        APPLICANT_FIELDS
        + ADDRESS_FIELDS
        + BANK_ACCOUNT_FIELDS
        + LAND_FIELDS
        + AGRICULTURE_FIELDS
        + LOAN_FIELDS
        + DETAIL_FIELDS
    ),
}
```

- [ ] **Step 3: Register it**

In `backend/schemas/__init__.py`, add the import and registry entry
alongside the existing `SchemeType.TRACTOR: tractor.SPEC` line (read the
file first to match its exact import/dict style):

```python
from schemas import land_dev
```
```python
SchemeType.LAND_DEV: land_dev.SPEC,
```

- [ ] **Step 4: Verify the registry loads**

```bash
cd backend && /Users/ayush/project/.venv-mac/bin/python -c "
from schemas import SCHEMES
from models import SchemeType
spec = SCHEMES[SchemeType.LAND_DEV]
print(spec['scheme_name_kn'], len(spec['pages']), 'pages')
"
```
Expected: `ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆ 23 pages`.

- [ ] **Step 5: Commit**

```bash
git add backend/schemas/land_dev.py backend/schemas/__init__.py
git commit -m "Add schemas/land_dev.py: 23-page spec, field list, registry entry"
```

---

## Task 4: Computed-field logic for LAND_DEV in `render_service.py`

**Files:**
- Modify: `backend/services/render_service.py` (`build_context()`)

**Interfaces:**
- Consumes: `LandDevDetails` fields from Task 2, `_parse_json_list()`
  (existing helper), `extent_str()`/`_to_float()` (existing helpers).
- Produces: `computed["annual_income"]`, `computed["post_dev_income"]`,
  `computed["incremental_income"]`, `computed["total_dev_cost"]`,
  `parsed["pre_dev_crops"]`, `parsed["post_dev_crops"]`,
  `parsed["dev_work_items"]` — all consumed by the 9 new templates (Task
  5) and the *already-built* shared `b4.html` (page 10).

- [ ] **Step 1: Parse the three new JSON columns**

Find where `parsed` dict is built in `build_context()` (near
`"previous_loans": previous_loans,`). Add, guarded so it only runs for
Land Dev (details is a `LandDevDetails | None`):

```python
if app.scheme_type == SchemeType.LAND_DEV and details is not None:
    parsed["pre_dev_crops"] = _parse_json_list(details.pre_dev_crops)
    parsed["post_dev_crops"] = _parse_json_list(details.post_dev_crops)
    parsed["dev_work_items"] = _parse_json_list(details.dev_work_items)
    for c in parsed["pre_dev_crops"] + parsed["post_dev_crops"]:
        if isinstance(c, dict):
            c["crop_name"] = kn_display(c.get("crop_name"))
            c["extent"] = extent_str(c.get("acres"), c.get("guntas"))
```

- [ ] **Step 2: Compute the real income figures**

Find the existing Tractor-only computed-fields block (the `if details is
not None and app.scheme_type == SchemeType.TRACTOR:` block near the end of
`build_context()`, right before the `context = {...}` return). Add a
parallel `elif`:

```python
elif app.scheme_type == SchemeType.LAND_DEV and details is not None:
    pre_income = sum(
        float(c.get("annual_income") or 0) for c in parsed["pre_dev_crops"] if isinstance(c, dict)
    )
    post_income = sum(
        float(c.get("annual_income") or 0) for c in parsed["post_dev_crops"] if isinstance(c, dict)
    )
    dev_total = sum(
        float(w.get("amount") or 0) for w in parsed["dev_work_items"] if isinstance(w, dict)
    )
    computed["annual_income"] = round(pre_income) if pre_income else None
    computed["post_dev_income"] = round(post_income) if post_income else None
    computed["incremental_income"] = (
        round(post_income - pre_income) if (pre_income or post_income) else None
    )
    computed["total_dev_cost"] = round(dev_total) if dev_total else None
```

Note: this **overwrites** the generic `annual_income`/`post_dev_income`/
`incremental_income` keys already set earlier in `computed` (the ones
using the flat-30%-heuristic and the `app.annual_income`/crop-sum
fallback meant for Tractor). That's intentional — for Land Dev, the real
crop-delta numbers must win. Because Python dict literals are built once
and this block runs after, re-assign with `computed["key"] = ...`
(mutating the existing dict), not by re-declaring the dict literal.

- [ ] **Step 3: Write a quick manual check**

```bash
cd backend && /Users/ayush/project/.venv-mac/bin/python -c "
import json
from services.render_service import build_context, SCHEMES
from models import Application, LandDevDetails, SchemeType

app = Application(
    scheme_type=SchemeType.LAND_DEV, applicant_name_kn='ಪರೀಕ್ಷೆ', village='ಗೋಕಾಕ',
    taluk='ಗೋಕಾಕ', district='ಬೆಳಗಾವಿ', total_area_acres=24, total_guntas=20,
    land_parcels='[]', current_crop='[]', loan_amount=1500000, loan_duration_years=7,
)
details = LandDevDetails(
    land_type='ತರಿ',
    pre_dev_crops=json.dumps([{'crop_name': 'ಸೂರ್ಯಕಾಂತಿ', 'acres': 24, 'guntas': 20, 'annual_income': 884060}]),
    post_dev_crops=json.dumps([{'crop_name': 'ಕಬ್ಬು', 'acres': 24, 'guntas': 20, 'annual_income': 2008600}]),
    dev_work_items=json.dumps([{'description': 'test', 'rate_per_acre': 5336, 'amount': 130732}]),
)
ctx = build_context(app, details, SCHEMES[SchemeType.LAND_DEV])
c = ctx['computed']
print('annual_income', c['annual_income'])
print('post_dev_income', c['post_dev_income'])
print('incremental_income', c['incremental_income'])
print('total_dev_cost', c['total_dev_cost'])
print('insurance_amount', c['insurance_amount'])
print('loan_eligibility_pct', c['loan_eligibility_pct'])
"
```
Expected output:
```
annual_income 884060
post_dev_income 2008600
incremental_income 1124540
total_dev_cost 130732
insurance_amount 0
loan_eligibility_pct 50
```
If any number doesn't match, fix the computation before moving on — these
are the exact figures confirmed from the reference PDF.

- [ ] **Step 4: Commit**

```bash
git add backend/services/render_service.py
git commit -m "Compute real pre/post-dev income and dev-cost total for LAND_DEV

Overrides the generic annual_income/post_dev_income/incremental_income
keys (which default to Tractor's flat-30% heuristic) with the real
crop-income delta Land Dev's reference packet uses."
```

---

## Task 5: Build the 9 new page templates

**Files:**
- Create: `backend/templates/pages/land_dev/ld1.html` through `ld9.html`

**Interfaces:**
- Consumes: `app.*` (generic Application fields), `computed.*` (Task 4 +
  existing generic keys), `parsed.pre_dev_crops` / `parsed.post_dev_crops`
  / `parsed.dev_work_items` (Task 4), `details.land_type` (Task 2),
  `bank.place` (existing constant), `plus_insurance` filter (Task 1 — not
  actually needed here since Land Dev has no insurance, but available if
  a correction round finds one).
- Produces: 9 rendered pages, registered in `schemas/land_dev.py`'s
  `PAGES` list (Task 3) as `land_dev/ld1` … `land_dev/ld9`.

Each sub-step below is one page. Build and verify one at a time — don't
write all 9 before checking the first renders correctly, since a
StrictUndefined typo in page 1 won't stop you from writing page 2, but it
will make debugging 9 pages at once painful.

- [ ] **Step 1: `ld1.html` (reference PDF page 11) — header + items 1–8**

```html
<!-- land_dev/ld1: reference PDF page 11 — ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆ technical scrutiny header, items 1-8 -->
<div class="pg-ld1">
<style>
  .pg-ld1 { font-size: 9.5pt; line-height: 1.4; }
  .pg-ld1 .purpose-list { margin: 2mm 0; }
  .pg-ld1 .purpose-list div { margin-top: 1mm; }
  .pg-ld1 table.hd td { border: 1px solid #000; padding: 1mm 2mm; vertical-align: top; }
  .pg-ld1 .devcrop th, .pg-ld1 .devcrop td { border: 1px solid #000; padding: 1mm 2mm; text-align: center; }
</style>

<div class="bank-header">{{ bank.name_line1 }}</div>
<div class="center bold" style="margin-top:1mm;">ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆಯ : ತಾಂತ್ರಿಕ ಗುಣ ವಿಮರ್ಶಣಾ ವರದಿ</div>

<div class="purpose-list">
  <div class="bold">ಯೋಜನೆ :</div>
  <div>1&nbsp;&nbsp;ಖುಷ್ಕಿ : ನೀರಾವರಿ ಜಮೀನಿಗೆ ಭೂ ಅಭಿವೃದ್ಧಿ (ಸಮತಳ ಒಡ್ಡು)</div>
  <div>2&nbsp;&nbsp;ಅಚ್ಚು ಕಟ್ಟು ಪ್ರದೇಶದ – ಭೂ ಅಭಿವೃದ್ಧಿ</div>
  <div>3&nbsp;&nbsp;ತ್ರೀವ ಇಳಿಜಾರಿನ ಪ್ರದೇಶದ ಭೂ ಅಭಿವೃದ್ಧಿ (ಬೆಂಚ್ ಟೆರೇಸಿಂಗ್)</div>
  <div>4&nbsp;&nbsp;ಹಣ್ಣಿನ / ತೆಂಗಿನ / ಅಡಿಕೆ ತೋಟಗಳಲ್ಲಿ ಭೂ ಅಭಿವೃದ್ಧಿ</div>
  <div>5&nbsp;&nbsp;ಭೂ ಅಭಿವೃದ್ಧಿ ಮತ್ತು ಮುಳ್ಳು ತಂತಿಬೇಲಿ ಸಂಯುಕ್ತ ಯೋಜನೆ</div>
  <div>6&nbsp;&nbsp;ವಿದ್ಯುತ ತಂತಿಬೇಲಿ / ಸೌರಶಕ್ತಿ</div>
  <div class="center small" style="margin-top:1mm;">(ಈ ಉದ್ದೇಶಗಳಿಗೆ ಉಪಯೋಗಿಸುವುದು)</div>
</div>

<div class="center small" style="margin:2mm 0;">
  (ಮೇಲ್ವಿಚಾರಕರು : ತಾಂತ್ರಿಕ ಮೇಲ್ವಿಚಾರಕರು-ಈ ವರದಿಯ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಅಂಶಗಳನ್ನು ಕೂಲಂಕುಶ<br>
  ಸ್ಥಳಾಶದ್ಧ್ಯನಾಧರಿಸಿ ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡುವುದು)
</div>

<table class="hd" style="border-collapse:collapse;">
  <tr>
    <td style="width:38%;">ಪ್ರಾ.ಸ.ಕೃ.ಗ್ರಾ.ಅ.ಬ್ಯಾಂಕ ನಿ<br><span class="value bold">{{ bank.place }}</span></td>
    <td style="width:24%;">ಜಿಲ್ಲೆ<br><span class="value bold">{{ app.district }}</span></td>
    <td>ಸಾಲದ ಅರ್ಜಿ ಸಂಖ್ಯೆ<span class="fill blank"></span><br>ಸಾಲದ ಅರ್ಜಿ ದಿನಾಂಕ<span class="fill blank"></span></td>
  </tr>
  <tr>
    <td colspan="2">ಸಮೀಕ್ಷಣೆ ಕೈಗೊಂಡ ದಿನಾಂಕ:<span class="fill blank"></span></td>
    <td>ವರದಿಯ ದಿನಾಂಕ:<span class="fill blank"></span></td>
  </tr>
</table>

<div class="row" style="margin-top:1.5mm;"><span class="n" style="width:8mm;">1</span>ಅರ್ಜಿದಾರರ ಹೆಸರು :
  <span class="value bold" style="padding-left:4mm;">{{ app.applicant_name_kn }}</span></div>

<table class="hd" style="margin-top:1mm; border-collapse:collapse;">
  <tr>
    <td style="width:25%;">ವಿಳಾಸ: ಗ್ರಾಮ<br><span class="value italic bold">{{ app.village }}</span></td>
    <td style="width:25%;">ಅಂಚೆ<br><span class="value italic bold">{{ app.hobli }}</span></td>
    <td style="width:25%;">ತಾಲ್ಲೂಕು<br><span class="value italic bold">{{ app.taluk }}</span></td>
    <td>ಜಿಲ್ಲೆ<br><span class="value italic bold">{{ app.district }}</span></td>
  </tr>
</table>

<div class="row" style="margin-top:1.5mm;"><span class="n" style="width:8mm;">3</span>
  ರೈತರ ವರ್ಗೀಕರಣ: ಸಣ್ಣ ರೈತರು /ದೊಡ್ಡ ರೈತರು/ಪರಿಶಿಷ್ಟಜಾತಿ :ಸಂಗಡ
  <span class="value bold" style="padding-left:4mm;">{{ computed.farmer_type_kn }}</span></div>

<table class="hd" style="margin-top:1.5mm; border-collapse:collapse;">
  <tr>
    <td rowspan="2" style="width:8%; vertical-align:middle;">4</td>
    <td style="width:30%;">ಅರ್ಜಿದಾರನ ಒಟ್ಟು ಹಿಡುವಳಿ (ಎಕರೆ)</td>
    <td style="width:20%;">ಖುಷ್ಕಿ</td>
    <td style="width:20%;">ನೀರಾವರಿ</td>
    <td>ಕೋಟ / ಒಟ್ಟು ಕ್ಷೇತ್ರ</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td class="value bold">{{ computed.total_extent }}</td>
    <td class="value bold">{{ computed.total_extent }}</td>
  </tr>
  <tr>
    <td rowspan="2">5</td>
    <td>ಅಭಿವೃದ್ಧಿ ಹೊಂದುವ ಜಮೀನು (ಸರ್ವೆ ನಂ)</td>
    <td colspan="3" class="value bold">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %}</td>
  </tr>
  <tr>
    <td>ಕ್ಷೇತ್ರ</td>
    <td colspan="3" class="value bold">{{ computed.total_extent }}</td>
  </tr>
  <tr>
    <td>6</td>
    <td colspan="2">ಮಣ್ಣಿನ ವರ್ಗೀಕರಣ</td>
    <td colspan="2">ಇಳಿಜಾರು ಪ್ರಮಾಣ :-ಶೇಕಡಾ <span class="fill blank"></span></td>
  </tr>
  <tr>
    <td>7</td>
    <td>ನೀರಿನ ಮೂಲ<br>ಅಳತೆ</td>
    <td colspan="2">ನೀರೆತ್ತುವ ಯಂತ್ರದ ವಿವರ<br>ಇಳುವರಿ<br>ನೀರಾವರಿ ವಿಧಾನ</td>
    <td>{{ computed.irrigation_kn }}</td>
  </tr>
</table>

<div style="margin-top:1.5mm;">8&nbsp;&nbsp;ಬೆಳೆಗಳ ವಿವರಗಳು</div>
<table class="devcrop" style="margin-top:0.5mm;">
  <tr>
    <th colspan="3">ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ</th>
    <th colspan="3">ಅಭಿವೃದ್ಧಿ ನಂತರ</th>
  </tr>
  <tr>
    <th>ಖುತು</th><th>ಬೆಳೆ</th><th>ಕ್ಷೇತ್ರ</th>
    <th>ಖುತು</th><th>ಬೆಳೆ</th><th>ಕ್ಷೇತ್ರ</th>
  </tr>
  {% for i in range(3) %}
  <tr>
    {% if i < parsed.pre_dev_crops | length %}
    <td class="value">{{ parsed.pre_dev_crops[i].season or '' }}</td>
    <td class="value">{{ parsed.pre_dev_crops[i].crop_name }}</td>
    <td class="value">{{ parsed.pre_dev_crops[i].extent }}</td>
    {% else %}
    <td></td><td></td><td></td>
    {% endif %}
    {% if i < parsed.post_dev_crops | length %}
    <td class="value">{{ parsed.post_dev_crops[i].season or '' }}</td>
    <td class="value">{{ parsed.post_dev_crops[i].crop_name }}</td>
    <td class="value">{{ parsed.post_dev_crops[i].extent }}</td>
    {% else %}
    <td></td><td></td><td></td>
    {% endif %}
  </tr>
  {% endfor %}
</table>
</div>
```

Verify: run
```bash
cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python tools/render_test.py --pages land_dev/ld1
```
using a `FIXTURE_LAND_DEV_APP`/`FIXTURE_LAND_DEV_DETAILS` you add to
`tools/render_test.py` first (see Task 6, Step 1 — do that step now, out
of order, before this verification, since every subsequent page in this
task needs the same fixture). Expected: `pages: 1 (expected 1) OK`, no
StrictUndefined error.

- [ ] **Step 2: `ld2.html` (reference PDF page 12) — items 9–12**

```html
<!-- land_dev/ld2: reference PDF page 12 — dev-work cost table (item 9), own contribution (10), loan requirement (11), execution details (12) -->
<div class="pg-ld2">
<style>
  .pg-ld2 { font-size: 9.5pt; line-height: 1.4; }
  .pg-ld2 table.cost th, .pg-ld2 table.cost td { border: 1px solid #000; padding: 1mm 2mm; }
  .pg-ld2 table.cost th { text-align: center; }
  .pg-ld2 .row { display: flex; margin-top: 1.5mm; }
</style>

<div style="margin-top:1mm;">9&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳು : ಅಳತೆ ಗಾತ್ರ : ಯೋಜನಾ ವೆಚ್ಚಗಳು</div>
<table class="cost" style="margin-top:0.5mm; width:100%;">
  <tr>
    <th style="width:8%;">ಕ್ರ.ಸಂ</th>
    <th style="width:46%;">ಕಾರ್ಯಗಳು</th>
    <th style="width:16%;">ಅಳತೆ ಮತ್ತು ಗಾತ್ರ</th>
    <th>ಯೋಜನಾ ವೆಚ್ಚ ರೂ.</th>
  </tr>
  {% for w in parsed.dev_work_items %}
  <tr>
    <td class="center">{{ loop.index }}</td>
    <td>{{ w.description }}</td>
    <td class="center value">{{ computed.total_extent }}</td>
    <td class="right value">{{ '%.2f' | format(w.amount or 0) }}</td>
  </tr>
  {% endfor %}
  {% for _ in range(10 - (parsed.dev_work_items | length)) %}
  <tr><td></td><td></td><td></td><td></td></tr>
  {% endfor %}
  <tr>
    <td colspan="3" class="right">ಒಟ್ಟು</td>
    <td class="right value bold">{{ '%.2f' | format(computed.total_dev_cost or 0) }}</td>
  </tr>
</table>

<div class="row"><span style="flex:1">10&nbsp;&nbsp;ಸ್ವಂತ ಕೊಡುಗೆ (ದೊಡ್ಡ ರೈತರಾಗಿದ್ದಲ್ಲಿ ಮಾತ್ರ ಶೇ. 10)</span>
  <span class="value bold">{{ '%.2f' | format((computed.total_dev_cost or 0) * 0.1) if computed.farmer_type_kn == 'ದೊಡ್ಡ ರೈತರು' else '0.00' }}</span>&nbsp;ರೂ.</div>

<div class="row"><span style="flex:1">11&nbsp;&nbsp;ಸಾಲದ ಅವಶ್ಯಕತೆ (ಮೊತ್ತ)</span>
  <span class="value bold">{{ app.loan_amount | num }}</span>&nbsp;ರೂ.&nbsp;{{ app.loan_amount | num }}</div>

<div style="margin-top:2mm;">12&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಕೈಗೊಳ್ಳುವ ವಿಧಾನ</div>
<div style="margin-left:8mm; margin-top:1mm;">
  <div>ಬ)&nbsp;ಭೂ ಅಭಿವೃದ್ಧಿಯನ್ನು ಮಾನ : ಎತ್ತುಗಳಿಂದ/ ಟ್ರ್ಯಾಕ್ಟರಿನಿಂದ /ಬುಲ್ಡೋಜರಿನಿಂದ ಮಾಡಲಾಗುವುದು</div>
  <div>(ಅ)&nbsp;ಭೂ ಅಭಿವೃದ್ಧಿಯನ್ನು – ರೈತರ ಮಾಡಿಸುವರು /ಸಂಸ್ಥೆಯಿಂದ ಮಾಡಲಾಗುವುದ</div>
  <div style="margin-top:1mm;">ಸಂಸ್ಥೆಯ ಹೆಸರು<span class="fill blank" style="min-width:60mm; margin-left:2mm;"></span></div>
  <div style="margin-top:2mm;">(ಇ)&nbsp;ಕೆರೆ ಮುಚ್ಚು ಅಳವಡಿಸುವುದಾದಲ್ಲಿ :ಸೇರೆಯ ಹೆಸರು<span class="fill blank" style="min-width:40mm; margin-left:2mm;"></span></div>
  <div style="margin-top:1mm;">ಜಮೀನಿಗಿರುವ ದೂರ<span class="fill blank" style="min-width:20mm; margin-left:2mm;"></span>ಕಿ.ಮೀ</div>
  <div style="margin-top:2mm;">(ಈ)&nbsp;ಮುಳ್ಳು ತಂತಿ ಬೇಲಿಯ–ಜಮೀನು ನಕ್ಷೆ, ಮತ್ತು ಅಂದಾಜು ಪತ್ರಿಕೆ ಲಗತ್ತಿಸಿದೆ.</div>
  <div style="margin-top:2mm;">(ಉ)&nbsp;ವಿದ್ಯುತ ತಂತಿ ಬೇಲಿಗಾಗಿ – ಜಮೀನಿನ ನಕ್ಷೆ ಮತ್ತು ಅಧಿಕೃತ ವಿತರಕರಿಂದ ದರಪಟ್ಟಿ ಲಗತ್ತಿಸಿದೆ ವಿತರಕರ</div>
  <div style="margin-top:1mm;">ಹೆಸರು /ವಿಳಾಸ<span class="fill blank" style="min-width:60mm; margin-left:2mm;"></span></div>
</div>
</div>
```

Verify: `--pages land_dev/ld2`, same fixture, confirm 1-page render and
the total row prints `1,960,001.00`-shaped output with the fixture's
numbers.

- [ ] **Step 3: `ld3.html` (reference PDF page 13) — crop income table**

```html
<!-- land_dev/ld3: reference PDF page 13 — ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತ:ಖ್ತೆ (pre/post-dev crop income table) -->
<div class="pg-ld3">
<style>
  .pg-ld3 { font-size: 8pt; }
  .pg-ld3 .center-title { text-align: center; font-weight: bold; margin-bottom: 2mm; }
  .pg-ld3 table.crops { width: 100%; table-layout: fixed; }
  .pg-ld3 table.crops th, .pg-ld3 table.crops td { border: 1px solid #000; padding: 0.8mm; text-align: center; word-wrap: break-word; }
  .pg-ld3 .section-lab { font-weight: bold; text-align: left; }
</style>

<div class="center-title">ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತ:ಖ್ತೆ</div>
<table class="crops">
  <tr>
    <th rowspan="2" style="width:6%;">ಸರ್ವೆ<br>ನಂ</th>
    <th rowspan="2" style="width:6%;">ಕ್ರ<br>ಸಂ</th>
    <th rowspan="2" style="width:10%;">ಬೆಳೆಯ<br>ಹೆಸರು</th>
    <th rowspan="2" style="width:6%;">ಋತು</th>
    <th rowspan="2" style="width:7%;">ಖುಷ್ಕಿ /<br>ನೀರಾವರಿ</th>
    <th style="width:8%;">ಕ್ಷೇತ್ರ<br>(ಎಕರೆಗಳಲ್ಲಿ)</th>
    <th style="width:8%;">ಎಕರೆಗೆ ವ್ಯವಸಾಯ<br>ಖರ್ಚು</th>
    <th style="width:8%;">ಒಟ್ಟು ವ್ಯವಸಾಯ<br>ಖರ್ಚು</th>
    <th style="width:8%;">ಎಕರೆಗೆ<br>ಇಳುವರಿ</th>
    <th style="width:8%;">ಒಟ್ಟು ಇಳುವರಿ</th>
    <th style="width:7%;">ಪೇಟೆ ಧಾರಣೆ</th>
    <th style="width:8%;">ಒಟ್ಟು ಆದಾಯ</th>
    <th style="width:8%;">ಇತರೆ ಖರ್ಚು</th>
    <th style="width:8%;">ನಿವ್ವಳ ಆದಾಯ</th>
  </tr>
  <tr><th colspan="13"></th></tr>
  <tr>
    <td colspan="13" class="section-lab">ಅಭಿವೃದ್ಧಿ ಪೂರ್ವದ ಆದಾಯ</td>
  </tr>
  {% for c in parsed.pre_dev_crops %}
  <tr>
    <td class="value">{% if loop.first %}{% for p in parsed.land_parcels %}{{ p.survey_no }}{% endfor %}{% endif %}</td>
    <td>{{ loop.index }}</td>
    <td class="value">{{ c.crop_name }}</td>
    <td class="value">{{ c.season or '' }}</td>
    <td class="value">{{ c.irrigated or '' }}</td>
    <td class="value">{{ c.extent }}</td>
    <td class="value">{{ c.cost_per_acre | num }}</td>
    <td class="value">{{ c.total_cost | num }}</td>
    <td class="value">{{ c.yield_per_acre | num }}</td>
    <td class="value">{{ c.total_yield | num }}</td>
    <td class="value">{{ c.rate | num }}</td>
    <td class="value">{{ c.total_income | num }}</td>
    <td class="value">{{ c.other_cost | num }}</td>
    <td class="value">{{ c.annual_income | num }}</td>
  </tr>
  {% endfor %}
  <tr>
    <td colspan="12" class="section-lab" style="text-align:right;">ಒಟ್ಟು</td>
    <td class="value bold">{{ computed.annual_income | num }}</td>
  </tr>
  <tr>
    <td colspan="13" class="section-lab">ಅಭಿವೃದ್ಧಿ ನಂತರದ ಆದಾಯ</td>
  </tr>
  {% for c in parsed.post_dev_crops %}
  <tr>
    <td class="value">{% if loop.first %}{% for p in parsed.land_parcels %}{{ p.survey_no }}{% endfor %}{% endif %}</td>
    <td>{{ loop.index }}</td>
    <td class="value">{{ c.crop_name }}</td>
    <td class="value">{{ c.season or '' }}</td>
    <td class="value">{{ c.irrigated or '' }}</td>
    <td class="value">{{ c.extent }}</td>
    <td class="value">{{ c.cost_per_acre | num }}</td>
    <td class="value">{{ c.total_cost | num }}</td>
    <td class="value">{{ c.yield_per_acre | num }}</td>
    <td class="value">{{ c.total_yield | num }}</td>
    <td class="value">{{ c.rate | num }}</td>
    <td class="value">{{ c.total_income | num }}</td>
    <td class="value">{{ c.other_cost | num }}</td>
    <td class="value">{{ c.annual_income | num }}</td>
  </tr>
  {% endfor %}
  <tr>
    <td colspan="12" class="section-lab" style="text-align:right;">ಒಟ್ಟು</td>
    <td class="value bold">{{ computed.post_dev_income | num }}</td>
  </tr>
</table>
</div>
```

Note: this template reads `c.cost_per_acre`, `c.total_cost`,
`c.yield_per_acre`, `c.total_yield`, `c.rate`, `c.total_income`,
`c.other_cost` — fields on each crop row beyond the base
`{crop_name, season, irrigated, acres, guntas, annual_income}` shape.
These must exist on every row (StrictUndefined) — Task 7 (frontend) must
either collect them or default them to `0`/blank at parse time. Add this
line to Task 4 Step 1's parsing loop (`for c in parsed["pre_dev_crops"] +
parsed["post_dev_crops"]:`):

```python
for key in ("cost_per_acre", "total_cost", "yield_per_acre", "total_yield", "rate", "total_income", "other_cost"):
    c.setdefault(key, None)
```

Verify: `--pages land_dev/ld3`, confirm no StrictUndefined error and the
"ಒಟ್ಟು" rows print `884,060` / `2,008,600` (the fixture's committed
totals, once the fixture's crop rows carry those numbers directly as
`annual_income` — matching Step 3 of Task 6).

- [ ] **Step 4: `ld4.html` (reference PDF page 14) — financial capacity items 14–24**

```html
<!-- land_dev/ld4: reference PDF page 14 — valuation, loan/repayment eligibility (14-24) -->
<div class="pg-ld4">
<style>
  .pg-ld4 { font-size: 9.5pt; line-height: 1.6; }
  .pg-ld4 .row { display: flex; margin-top: 1.5mm; }
  .pg-ld4 .n { width: 8mm; flex: none; }
</style>

<div class="row"><span class="n">14)</span><span style="flex:1">ಮೌಲ್ಯಮಾಪನ :ಉಪನೋಂದಣಾಧಿಕಾರಿಗಳಲ್ಲಿನ ಬೆಲೆಯನ್ವಯ ರೂ:</span>
  <span class="value bold">{{ computed.land_valuation_total | num }}</span></div>
<div class="row"><span class="n">15)</span><span style="flex:1">ಸಾಲದ ಅರ್ಹತೆ: ಮೌಲ್ಯಮಾಪನದ ಶೇಕಡಾ {{ computed.loan_eligibility_pct }} ({{ computed.loan_eligibility_pct }} X 14) ರೂ:</span>
  <span class="value bold">{{ computed.loan_eligibility | num }}</span></div>
<div class="row"><span class="n">16)</span><span style="flex:1">ಹಿಂದಿನ ಸಾಲಗಳ ಹೊರ ಬಾಕಿ (ಔಟ್ ಸ್ಟ್ಯಾಂಡಿಂಗ್) ರೂ:</span>
  <span class="value">{{ computed.prev_outstanding | num }}</span></div>
<div class="row"><span class="n">17)</span><span style="flex:1">ನಿವ್ವಳ ಸಾಲದ ಅರ್ಹತೆ</span>
  <span>(15-16) ರೂ:&nbsp;<span class="value bold">{{ computed.net_loan_eligibility | num }}</span></span></div>
<div class="row"><span class="n">18)</span><span style="flex:1">ಹೆಚ್ಚುವರಿ ನಿವ್ವಳ ಆದಾಯ</span></div>
<div class="row"><span class="n"></span><span style="flex:1">= (ಅಭಿವೃದ್ಧಿ ನಂತರದ ನಿವ್ವಳ ಆದಾಯ–ಅಭಿವೃದ್ಧಿ ಪೂರ್ವದ ನಿವ್ವಳ ಆದಾಯ)</span></div>
<div class="row"><span class="n"></span><span style="flex:1">=(ರೂ&nbsp;<span class="value bold">{{ computed.post_dev_income | num }}</span>&nbsp;−&nbsp;ರೂ&nbsp;<span class="value bold">{{ computed.annual_income | num }}</span>)</span></div>
<div class="row"><span class="n"></span><span style="flex:1">=(ರೂ&nbsp;<span class="value bold">{{ computed.incremental_income | num }}</span></span></div>
<div class="row"><span class="n">19)</span><span style="flex:1">ಉದ್ದೇಶಿತ ಸಾಲದ ಮರುಪಾವತಿ ಅವಧಿ:ಒಟ್ಟು <span class="fill short">{{ computed.loan_duration_years }}</span> ವರ್ಷಗಳಲ್ಲಿ, ಇದರಲ್ಲಿ <span class="fill blank" style="min-width:20mm"></span> ವರ್ಷ</span></div>
<div class="row"><span class="n"></span><span style="flex:1">ಪ್ರಾರಂಭಿಕ ಅವಧಿ ಮತ್ತು <span class="fill short">&nbsp;</span> ವರ್ಷಗಳಲ್ಲಿ ಮಾಸಿಕ / ತ್ರೈಮಾಸಿಕ /ಅರ್ಧವಾರ್ಷಿಕ/<span class="bold italic">ವಾರ್ಷಿಕ</span> ಕಂತುಗಳು</span></div>
<div class="row"><span class="n">20)</span><span style="flex:1">ಉದ್ದೇಶಿತ ಸಾಲದ ಮರುಪಾವತಿ ಕಂತಿನ ಮೊತ್ತ ರೂ.</span>
  <span class="value bold">{{ computed.installment_kantu | num }}</span>&nbsp;+ ಬಡ್ಡಿ</div>
<div class="row"><span class="n">21)</span><span style="flex:1">ಸಾಲದ ಮರುಪಾವತಿ ಅರ್ಹತೆ :ಉದ್ದೇಶಿತ ನಿವ್ವಳ ಆದಾಯದ ಶೇಕಡಾ</span></div>
<div class="row"><span class="n"></span><span style="flex:1">= ರೂ:&nbsp;<span class="value bold">{{ computed.incremental_income | num }}</span>&nbsp;X&nbsp;75%&nbsp;% = ರೂ&nbsp;<span class="value bold">{{ computed.repayment_eligibility | num }}</span></span></div>
<div class="row"><span class="n">22)</span><span style="flex:1">ಹಿಂದಿನ ಸಾಲಗಳ ಮರುಪಾವತಿ ಕಂತಿನ ಒಟ್ಟು ಮೊತ್ತ ರೂ</span>
  <span class="value">{{ parsed.previous_loans.annual_installment | num }}</span></div>
<div class="row"><span class="n">23)</span><span style="flex:1">ನಿವ್ವಳ ಮರುಪಾವತಿ ಅರ್ಹತೆ (21-22) ರೂ</span>
  <span class="value bold">{{ computed.net_repayment_eligibility | num }}</span></div>
<div class="row" style="margin-top:3mm;"><span class="n">24)</span><span style="flex:1">ಸಾಲದ ಮತ್ತು ಮರುಪಾವತಿ ಅರ್ಹತೆ ಬಗ್ಗೆ ಶಿಫಾರಸ್ಸು ಮತ್ತು ದೃಢೀಕರಣ</span></div>
<div class="center italic" style="margin-top:1mm;">ಆರ್ಜಿದಾರರು ಒಳ್ಳೆಯ ಅನುಭವವುಳ್ಳವರಿದ್ದು ಸದರಿ ಯೋಜನೆಯಿಂದ ಲಾಭ ಪಡೆದು ಕಂತನ್ನು<br>
ಸರಿಯಾಗಿ ತುಂಬುವ ಮನೋಭಾವ ಹೊಂದಿದ್ದಾರೆ.</div>
</div>
```

Verify: `--pages land_dev/ld4`, confirm `computed.loan_eligibility_pct`
prints `50` (from Task 1) and item 18's arithmetic line prints the same
`884,060` / `2,008,600` / `1,124,540` figures as `ld3.html`.

- [ ] **Step 5: `ld5.html` (reference PDF page 15) — items 25–27, checklist, signatures**

```html
<!-- land_dev/ld5: reference PDF page 15 — technical checklist (25), recommendations (26-27), signatures, notes -->
<div class="pg-ld5">
<style>
  .pg-ld5 { font-size: 9.3pt; line-height: 1.6; }
  .pg-ld5 .item { display: flex; margin-top: 1.5mm; }
  .pg-ld5 .lab { flex: 1; }
  .pg-ld5 .ans { min-width: 40mm; font-style: italic; font-weight: bold; text-align: right; }
</style>

<div class="bold" style="margin-top:1mm;">25) ತಾಂತ್ರಿಕ ಅಂಶಗಳ ಬಗ್ಗೆ ವಿವರಣೆ:</div>
<div class="item"><span class="lab">(ಅ)&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಪ್ರದೇಶಕ್ಕೆ ಬೇಕಾಗುಷ್ಟು ನೀರಿನ ಲಭ್ಯತೆ ಇದೆಯೇ?</span><span class="ans">ಇದೆ</span></div>
<div class="item"><span class="lab">(ಆ)&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಮಣ್ಣು ಮತ್ತು ನೀರು ಸೂಕ್ತವಾಗಿದೆಯೇ?</span><span class="ans">ಸೂಕ್ತವಾಗಿದೆ</span></div>
<div class="item"><span class="lab">(ಇ)&nbsp;&nbsp;ಪ್ರದೇಶ ಲವಣ, ಕ್ಷಾರ, ಜವುಳು ಮುಂತಾದವುಗಳಿಂದ ಮುಕ್ತವಾಗಿದೆಯೇ?</span><span class="ans">ಮುಕ್ತವಾಗಿದೆ</span></div>
<div class="item"><span class="lab">(ಈ)&nbsp;&nbsp;ಭೂ ಅಭಿವೃದ್ಧಿಯಿಂದ ಉದ್ದೇಶಿತ ಕ್ಷೇತ್ರ ಪೂರ್ತಿ ನೀರಾವರಿಯಾಗುವುದೇ?</span><span class="ans">ನೀರಾವರಿಯಾಗಿದೆ</span></div>
<div class="item"><span class="lab">(ಉ)&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯ ನಿರ್ವಹಿಸುವವರ ಹೆಸರು</span><span class="ans">ಸ್ವತಃ ರೈತರು ನಿರ್ವಹಿಸುವವರು</span></div>
<div class="item"><span class="lab">(ಊ)&nbsp;&nbsp;ರೈತರಿಗೆ ಅನುಭವ /ನೈಪುಣ್ಯ ಇದೆಯೇ?</span><span class="ans">ಸಾಕಷ್ಟು ಅನುಭವ/ನೈಪುಣ್ಯತೆ ಇದೆ.</span></div>
<div class="item"><span class="lab">(ಋ)&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ಬಗ್ಗೆ ರೈತರಿಗೆ ತಿಳುವಳಿಕೆ ನೀಡಲಾಗಿದೆಯೇ?</span><span class="ans">ನೀಡಲಾಗಿದೆ.</span></div>
<div class="item"><span class="lab">(ಎ)&nbsp;&nbsp;ಅಭಿವೃದ್ಧಿ ನಂತರ ಬೆಳೆಗಳ ಬಗ್ಗೆ ತಿಳುವಳಿಕೆ ನೀಡಲಾಗಿದೆಯೇ?</span><span class="ans">ನೀಡಲಾಗಿದೆ.</span></div>

<div class="bold" style="margin-top:2mm;">25) ಇತರೆ ಪೂರಕ ಸೌಲಭ್ಯಗಳು</div>
<div class="item"><span class="lab">(ಅ)&nbsp;&nbsp;ಬೀಜ, ಸಸಿ, ಗೊಬ್ಬರ, ಕೀಟನಾಶಕ ದೊರೆಯುವ ಸ್ಥಳ:</span><span class="ans">ಸ್ಥಳೀಯದಲ್ಲಿ</span></div>
<div class="item"><span class="lab">(ಆ)&nbsp;&nbsp;ಅಲ್ಪಾವಧಿ ಸಾಲ ಪಡೆಯುವ ಸಂಸ್ಥೆ :</span><span class="ans">ಪಿ ಕೆ ಪಿ ಎಸ್ ಸೊಸಾಯಿಟಿ</span></div>
<div class="item"><span class="lab">(ಇ)&nbsp;&nbsp;ಬೆಳೆದ ಉತ್ಪನ್ನದ ಮಾರಾಟಕ್ಕಾಗಿ ಮಾರುಕಟ್ಟೆ ಸ್ಥಳ:</span><span class="ans">ಸ್ಥಳೀಯದಲ್ಲಿ</span></div>
<div class="item"><span class="lab">(ಈ)&nbsp;&nbsp;ಪ್ರಾಥಮಿಕ ಬ್ಯಾಂಕಿನ ಹಿಂದಿನ ಸಾಲಗಾರರಾಗಿದ್ದಲ್ಲಿ ಮರುಪಾವತಿ ಚಾಲ್ತಿಯಾಗಿದೆಯೇ?</span><span class="ans">&nbsp;</span></div>
<div class="item"><span class="lab">(ಉ)&nbsp;&nbsp;ಇತರೆ ಸಂಘ /ಬ್ಯಾಂಕುಗಳಲ್ಲಿನ ಸಾಲಗಳ ಮರುಪಾವತಿ ಚಾಲ್ತಿಯಾಗಿದೆಯೇ?</span><span class="ans">&nbsp;</span></div>

<div class="item" style="margin-top:2mm;"><span class="lab bold">26)&nbsp;&nbsp;ಈ ಸಾಲದ ಮಂಜೂರಿಗೆ ತಾಂತ್ರಿಕ /ಮೇಲ್ವಿಚಾರಕ ಶಿಫಾರಸ್ಸು</span></div>
<div class="center bold" style="border-bottom:1px solid #000; padding-bottom:1mm;">ಮಂಜೂರು ಮಾಡಬಹುದು</div>

<div class="item" style="margin-top:2mm;"><span class="lab bold">27)&nbsp;&nbsp;ವ್ಯವಸ್ಥಾಪಕರ ಶಿಫಾರಸ್ಸು (ತಾಂತ್ರಿಕ –ಆರ್ಥಿಕ ಅಂಶಗಳನ್ನೊಳಗೊಂಡಂತೆ ಸ್ಪಷ್ಟ ಅಭಿಪ್ರಾಯ ನಮೂದಿಸುವುದು)</span></div>
<div class="center bold" style="border-bottom:1px solid #000; padding-bottom:1mm;">ಮಂಜೂರು ಮಾಡಬಹುದು</div>

<div style="display:flex; justify-content:space-between; margin-top:12mm;">
  <div>ತಾಂತ್ರಿಕ : ಮೇಲ್ವಿಚಾರಕರು</div>
  <div>ವ್ಯವಸ್ಥಾಪಕರು</div>
</div>
<div style="display:flex; justify-content:space-between; margin-top:8mm; font-weight:bold;">
  <div>ಪಿಕಾರ್ಡ ಬ್ಯಾಂಕು<br><span style="border-top:1px solid #000; display:inline-block; padding-top:1mm; margin-top:1mm;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
  <div>ಪಿಕಾರ್ಡ ಬ್ಯಾಂಕ<br><span style="border-top:1px solid #000; display:inline-block; padding-top:1mm; margin-top:1mm;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
</div>

<div class="bold" style="margin-top:8mm;">ಸೂಚನೆ</div>
<div style="margin-top:1mm; line-height:1.6;">
  1&nbsp;&nbsp;ಆಯಾ ಉದ್ದೇಶಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ಜಾರಿಯಲ್ಲಿರುವ ತಾಂತ್ರಿಕಾರ್ಥಿಕ ನಿಯಮಗಳನ್ವಯ, ವಾಸ್ತವಿಕ<br>
  &nbsp;&nbsp;&nbsp;&nbsp;ಅಂಶಗಳನ್ನಾಧರಿಸಿದ –ನೈಜ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ಅಂದಾಜು ಪತ್ರಿಕೆ – ಯೋಜನಾ ನಕ್ಷೆ ತಯಾರಿಸಿ ಲಗತ್ತಿಸಬೇಕು.<br>
  2&nbsp;&nbsp;ಜಾರಿಯಲ್ಲಿರುವ –ವಿವಿಧ ಬೆಳೆಗಳ ನಿವ್ವಳ ಆದಾಯದ ಸುತ್ತೋಲೆಗಳಿಗನುಗುಣವಾಗಿಯೇ ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ<br>
  &nbsp;&nbsp;&nbsp;&nbsp;ತಃಖೆ ತಯಾರಿಸಬೇಕು.<br>
  3&nbsp;&nbsp;ತಾಂತ್ರಿಕವಾಗಿ ಯೋಗ್ಯವೂ ಮತ್ತು ಆರ್ಥಿಕವಾಗಿ ಸಕ್ಷಮವಾದ ಘಟಕಗಳಿಗೆ ಮಾತ್ರ ಸಾಲ ಮಂಜೂರಿಗೆ ಪರಿಗಣಿಸುವುದು.<br>
  4&nbsp;&nbsp;ಆಯಾ ವರ್ಷದ ಸಾಲದ ದೊರೆಯುವ ನಿಯಮ /ಷರತ್ತುಗಳನ್ನು ಚಾಚುತ್ಪದೆ ಪಾಲಿಸುವುದು.
</div>
</div>
```

Verify: `--pages land_dev/ld5`, confirm 1-page render.

- [ ] **Step 6: `ld6.html` (reference PDF page 16) — LD1 development-cost estimate**

```html
<!-- land_dev/ld6: reference PDF page 16 — LD1: dev-cost estimate sheet with applicant/survey header -->
<div class="pg-ld6">
<style>
  .pg-ld6 { font-size: 9.5pt; line-height: 1.5; }
  .pg-ld6 table.cost { width: 100%; margin-top: 2mm; }
  .pg-ld6 table.cost th, .pg-ld6 table.cost td { border: 1px solid #000; padding: 1mm 2mm; }
  .pg-ld6 table.cost th { text-align: center; }
</style>

<div class="bank-header">{{ bank.name_line1 }}</div>
<div style="margin-top:3mm;">
  ಶ್ರೀ&nbsp;&nbsp;<span class="value bold">{{ app.applicant_name_kn }}</span>
  <span style="float:right;">ಸಾ: <span class="value bold">{{ bank.place }}</span></span>
</div>
<div style="margin-top:2mm;">
  ಇವರು ಜಮೀನು ಸರ್ವೆ ನಂ.&nbsp;<span class="value">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %}</span>&nbsp;ನೇದ್ದರಲ್ಲಿ ಕೈಗೊಳ್ಳಬೇಕಾದ ಭೂ ಸುಧಾರಣಾ ಕಾರ್ಯಗಳಿಗೆ ತಗಲುವ
</div>
<div>ಖರ್ಚನ್ನು ತೋರಿಸುವ ಅಂದಾಜು ಪತ್ರಿಕೆ.</div>
<div style="margin-top:2mm;">
  ಜಮೀನು ಸರ್ವೆ ನಂ&nbsp;&nbsp;<span class="value bold">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %}</span>
  <span style="margin-left:8mm;">ಒಟ್ಟು ಎಕರೆ&nbsp;<span class="value bold">{{ computed.total_extent }}</span></span>
</div>

<table class="cost">
  <tr>
    <th style="width:8%;">ಅ.ನಂ</th>
    <th style="width:52%;">ಕಾರ್ಯಗಳ ವಿವರ</th>
    <th style="width:14%;">ಎಕರೆ ಗುಂಟೆ</th>
    <th style="width:12%;">ದರ</th>
    <th>ಮೊತ್ತ</th>
  </tr>
  {% for w in parsed.dev_work_items %}
  <tr>
    <td class="center">{{ loop.index }}</td>
    <td>{{ w.description }}</td>
    <td class="center value">{{ computed.total_extent }}</td>
    <td class="center value">{{ w.rate_per_acre | num }}</td>
    <td class="right value">{{ '%.2f' | format(w.amount or 0) }}</td>
  </tr>
  {% endfor %}
  <tr>
    <td colspan="4" class="right">ಒಟ್ಟು</td>
    <td class="right value bold">{{ '%.2f' | format(computed.total_dev_cost or 0) }}</td>
  </tr>
</table>

<div class="right bold" style="margin-top:10mm;">ವಲಯ ಮೇಲ್ವಿಚಾರಕರು</div>
</div>
```

Verify: `--pages land_dev/ld6`, confirm total row matches `ld2.html`'s
total exactly (both read the same `computed.total_dev_cost`).

- [ ] **Step 7: `ld7.html` (reference PDF page 17) — LD2 technical description (ಅನುಬಂಧ-3ಕೆ)**

```html
<!-- land_dev/ld7: reference PDF page 17 — LD2: ಅನುಬಂಧ-3ಕೆ technical description -->
<div class="pg-ld7">
<style>
  .pg-ld7 { font-size: 9.5pt; line-height: 1.6; }
  .pg-ld7 .row { display: flex; margin-top: 1.5mm; }
  .pg-ld7 .n { width: 8mm; flex: none; }
</style>

<div class="bank-header">{{ bank.name_line1 }}</div>
<div class="center bold" style="margin-top:1mm;">ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆಯ ತಾಂತ್ರಿಕ ಗುಣವಿಮರ್ಷಣಾ ವಿವರ</div>
<div class="center" style="margin-top:1mm;">ಅನುಬಂಧ - 3ಕೆ</div>

<div class="row"><span class="n">1)</span><span>ಅರ್ಜಿದಾರನ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.applicant_name_kn }}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಅ)&nbsp;ಗ್ರಾಮ</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.village }}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಆ)&nbsp;ತಾಲೂಕು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.taluk }}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಇ)&nbsp;ಜಿಲ್ಲೆ</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.district }}</span></div>
<div class="row"><span class="n">2)</span><span>ಅರ್ಜಿದಾರರ ಒಟ್ಟು ಹಿಡುವಳಿ</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಅ)&nbsp;ಖುಷ್ಕಿ</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಆ)&nbsp;ತರಿ (ನೀರಾವರಿ)</span>
  <span class="value bold" style="margin-left:4mm;">{{ computed.total_extent }}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">ಇ)&nbsp;ಸಣ್ಣ ರೈತರು / ದೊಡ್ಡ ರೈತರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ computed.farmer_type_kn }}</span></div>
<div class="row"><span class="n">3)</span><span>ಅಭಿವೃದ್ಧಿ ಹೊಂದುವ ಹಿಡುವಳಿ (ಎಕರಗಳು) ಸರ್ವೆ ನಂ</span>
  <span class="value bold" style="margin-left:4mm;">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %}</span></div>
<div class="row"><span class="n">4)</span><span>ಮಣ್ಣಿನ ಮೇಲೆ ಲಕ್ಷಣ ಇಳಿಜಾರು</span></div>
<div class="row"><span class="n">5)</span><span>ಅಭಿವೃದ್ಧಿ ಹೊಂದುವ ಜಮೀನಿನ ನಕ್ಷೆ</span>
  <span style="margin-left:4mm;">ಭೂ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ವಿವರ ಗುರುತಿಸಿ ಪ್ರತ್ಯೇಕವಾಗಿ ಲಗತ್ತಿಸುವದು ತ:ಖೆ -1</span></div>
<div class="row"><span class="n">6)</span><span>ಅವಶ್ಯಕ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ವಿವರ</span>
  <span style="margin-left:4mm;">ಅಂದಾಜು ಪಟ್ಟಿ ವಿವರವಾಗಿ ತಯಾರಿಸಿ ಪ್ರತ್ಯೇಕವಾಗಿ ಲಗತ್ತಿಸುವದು ತ:ಖೆ -2</span></div>
<div class="row"><span class="n">7)</span><span>1) ಅಭಿವೃದ್ಧಿ ಪೂರ್ವದಲ್ಲಿ ಬೆಳೆಯುವ ಬೆಳೆಗಳು</span>
  <span class="value bold" style="margin-left:4mm;">{% for c in parsed.pre_dev_crops %}{{ c.crop_name }}{% if not loop.last %}, {% endif %}{% endfor %}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">2) ಅಭಿವೃದ್ಧಿ ನಂತರ ಬೆಳೆಯುವ ಬೆಳೆಗಳು</span>
  <span class="value bold" style="margin-left:4mm;">{% for c in parsed.post_dev_crops %}{{ c.crop_name }}{% if not loop.last %}, {% endif %}{% endfor %}</span></div>
<div class="row"><span class="n"></span><span style="margin-left:8mm;">3) ಆಯವ್ಯಯ ತ:ಖೆ</span>
  <span style="margin-left:4mm;">ತ:ಖೆ -3 ಲಗತ್ತಿಸುವದು</span></div>
<div class="row"><span class="n">8)</span><span>ಅರ್ಜಿದಾರರು ಭೂ ಸಮತಳ ಮಾಡಲು ಉಪಯೋಗಿಸುವ ಸಾಧನ</span>
  <span style="margin-left:4mm;">ಎತ್ತು : ಟ್ರಾಕ್ಟರ ಬೋಡೋಜರ</span></div>
<div class="row"><span class="n">9)</span><span>ಯೋಜನೆಯ ಅಂದಾಜು ವೆಚ್ಚ ರೂ</span>
  <span class="value bold" style="margin-left:4mm;">{{ computed.total_dev_cost | num }}</span></div>
<div class="row"><span class="n">10)</span><span>ತಾಂತ್ರಿಕ ಮೇಲ್ವಿಚಾರಕರು ವಿಶೇಷ ಸ್ಥಳ ಪರಿಶೀಲನಾ ವರದಿ</span>
  <span style="margin-left:4mm;">ತ:ಖೆ-4 ಆಗತ್ತಿಸುವದು</span></div>

<div style="margin-top:6mm;">ಮೇಲ್ಕಂಡ ಅರ್ಜಿದಾರರ ಜಮೀನಿಗೆ ದಿನಾಂಕ <span class="fill blank" style="min-width:26mm;"></span> ರಂದು ಬೇಟಿ ನೀಡಿ</div>
<div>ಸ್ಥಳ ಸಮೀಕ್ಷೆ ನಡೆಸಿ ತಾಂತ್ರಿಕ ಗುಣವಿಮರ್ಷಣಾ ವರದಿ ಲಗತ್ತಿಸಿದೆ.</div>

<div style="display:flex; justify-content:space-between; margin-top:10mm; font-weight:bold;">
  <div>ವಲಯ ಮೇಲ್ವಿಚಾರಕರು</div>
  <div>ತಾಂತ್ರಿಕ ಮೇಲ್ವಿಚಾರಕರು</div>
</div>
</div>
```

Verify: `--pages land_dev/ld7`, confirm crop-name lists print from the
fixture's crop rows.

- [ ] **Step 8: `ld8.html` (reference PDF page 18) — LD3 land leveling technical report (ಅನುಬಂಧ-5)**

```html
<!-- land_dev/ld8: reference PDF page 18 — LD3: ಅನುಬಂಧ-5 land leveling / bunding technical report -->
<div class="pg-ld8">
<style>
  .pg-ld8 { font-size: 9.3pt; line-height: 1.6; }
  .pg-ld8 .item { display: flex; margin-top: 1.5mm; }
  .pg-ld8 .n { width: 8mm; flex: none; }
  .pg-ld8 table.cost { width: 60%; margin-top: 3mm; }
  .pg-ld8 table.cost th, .pg-ld8 table.cost td { border: 1px solid #000; padding: 1mm 2mm; }
</style>

<div class="center bold">ಅನುಬಂಧ - 5</div>
<div class="center" style="margin-top:1mm;">ಸಾಮಾನ್ಯ ಯೋಜನೆಯಲ್ಲಿ ಭೂ ಸಮತಳ ಮತ್ತು ಒಡ್ಡುಗಳ ನಿರ್ಮಾಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ನೀಡಬೇಕಾದ<br>ತಾಂತ್ರಿಕ ವರದಿ ನಮೂನೆ</div>

<div class="item" style="margin-top:2mm;"><span class="n">1)</span><span>ಭೂ ಅಭಿವೃದ್ಧಿ ಬ್ಯಾಂಕ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">ಪ್ರಾಥಮಿಕ ಬ್ಯಾಂಕ ನಿ. {{ bank.place }}</span></div>
<div class="item"><span class="n">2)</span><span>ಅ) ಅರ್ಜಿದಾರನ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.applicant_name_kn }}</span></div>
<div class="item"><span class="n">3)</span><span>ಅ) ಹಳ್ಳಿಯ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.village }}</span></div>
<div class="item"><span class="n"></span><span style="margin-left:8mm;">ಬ) ತಾಲೂಕಿನ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.taluk }}</span></div>
<div class="item"><span class="n"></span><span style="margin-left:8mm;">ಕ) ಜಿಲ್ಲೆಯ ಹೆಸರು</span>
  <span class="value bold" style="margin-left:4mm;">{{ app.district }}</span></div>
<div class="item"><span class="n">4)</span><span>ಒಟ್ಟು ಸರ್ವೆ ನಂಬರ ವಿಸ್ತೀರ್ಣ</span>
  <span class="value bold" style="margin-left:4mm;">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %} — {{ computed.total_extent }}</span></div>
<div class="item"><span class="n">5)</span><span>ಭೂ ಅಭಿವೃದ್ಧಿಗೊಳಿಸುವ ವಿಸ್ತೀರ್ಣ</span>
  <span class="value bold" style="margin-left:4mm;">{{ computed.total_extent }}</span></div>
<div class="item"><span class="n">6)</span><span>ಶೇಕಡಾವಾರು ಇಳಿಜಾರು (ವಿಸ್ತೀರ್ಣ)</span></div>
<div class="item"><span class="n">7)</span><span>ಅಭಿವೃದ್ಧಿಗೊಳಿಸುವ ಜಮೀನಿನಲ್ಲಿ</span></div>
<div class="item"><span class="n">8)</span><span>ಭೂ ಅಭಿವೃದ್ಧಿ ಶಿಫಾರಸ್ಸು ಮಾಡಿದ ಒಟ್ಟು ಮೊತ್ತ ವಿವರ</span>
  <span class="value bold" style="margin-left:4mm;">{{ computed.total_dev_cost | num }}</span></div>

<table class="cost">
  <tr>
    <th>ಕಾರ್ಯಗಳ ವಿವರ</th>
    <th>ಮೊತ್ತ (ರೂ.ಗಳಲ್ಲಿ)</th>
  </tr>
  {% for w in parsed.dev_work_items %}
  {% if w.amount %}
  <tr>
    <td class="value">{{ loop.index }}. {{ w.description }}</td>
    <td class="right value">{{ '%.2f' | format(w.amount) }}</td>
  </tr>
  {% endif %}
  {% endfor %}
  <tr>
    <td class="right">ಒಟ್ಟು</td>
    <td class="right value bold">{{ '%.2f' | format(computed.total_dev_cost or 0) }}</td>
  </tr>
</table>

<div class="item" style="margin-top:2mm;"><span class="n">9)</span><span>ಭೂ ನಕಾಶೆ (ಜ್ಞಾನ) ಮತ್ತು ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ನಕಾಶೆ ಪ್ರೊಜೆಕ್ಟರ ಪ್ಲಾನ</span></div>
<div class="item" style="margin-top:2mm;"><span class="n">10)</span><span>ಇತಲೇ ವಿವರಗಳು ಮತ್ತು ವಿಶೇಷ ಮಾಹಿತಿಗಳು</span></div>

<div style="margin-top:8mm;">ಸ್ಥಳ : <span class="value bold">{{ bank.place }}</span></div>
<div style="margin-top:1mm;">ದಿನಾಂಕ :- <span class="fill blank" style="min-width:26mm;"></span></div>
</div>
```

Verify: `--pages land_dev/ld8`, confirm the cost table skips rows with a
zero/falsy amount (matches the reference PDF, which shows 5 non-zero rows
out of 6 in this specific fixture).

- [ ] **Step 9: `ld9.html` (reference PDF page 19) — LD4 cost estimate table**

```html
<!-- land_dev/ld9: reference PDF page 19 — LD4: dev-cost estimate, ಅಳತೆ/ಪರಿಮಾಣ columns -->
<div class="pg-ld9">
<style>
  .pg-ld9 { font-size: 9pt; }
  .pg-ld9 table.cost { width: 100%; margin-top: 3mm; table-layout: fixed; }
  .pg-ld9 table.cost th, .pg-ld9 table.cost td { border: 1px solid #000; padding: 1mm; text-align: center; }
</style>

<div class="bank-header">{{ bank.name_line1 }}</div>
<div style="margin-top:2mm;">ಯೋಜನೆ: ನೀರಾವರಿ ಜಮೀನಿಗೆ ಭೂ-ಅಭಿವೃದ್ಧಿ ಅಂದಾಜು ಪಟ್ಟಿ</div>
<div style="display:flex; justify-content:space-between; margin-top:1mm;">
  <span>ಸಾಲಗಾರರ ಹೆಸರು :&nbsp;<span class="value bold">{{ app.applicant_name_kn }}</span></span>
  <span>ಕ್ಷೇತ್ರ&nbsp;<span class="value bold">{{ computed.total_extent }}</span>&nbsp;ಗ್ರಾಮ&nbsp;<span class="value bold">{{ app.village }}</span></span>
</div>
<div style="margin-top:1mm;">ಅಭಿವೃದ್ಧಿ ಪಡಿಸಲಿರುವ ಜಮೀನು ಸರ್ವೆ ನಂ.
  <span class="value bold">{% for p in parsed.land_parcels %}{{ p.survey_no }}{% if not loop.last %}, {% endif %}{% endfor %}</span></div>

<table class="cost">
  <tr>
    <th rowspan="2" style="width:6%;">ಕ್ರ.ಸಂ</th>
    <th rowspan="2" style="width:34%;">ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳು</th>
    <th colspan="2" style="width:16%;">ಅಳತೆಗಳು</th>
    <th colspan="2" style="width:16%;">ಪರಿಮಾಣ</th>
    <th style="width:9%;">ಎಕರೆಗೆ</th>
    <th style="width:9%;">ಇತರೆ</th>
    <th>ಒಟ್ಟು ವೆಚ್ಚ</th>
  </tr>
  <tr>
    <th>ಇತರೆ</th><th>ಕಬ್ಬು</th><th>ಇತರೆ</th><th>ಕಬ್ಬು</th>
  </tr>
  {% for w in parsed.dev_work_items %}
  <tr>
    <td>{{ loop.index }}</td>
    <td style="text-align:left;">{{ w.description }}</td>
    <td></td><td></td><td></td><td></td>
    <td class="value">{{ w.rate_per_acre | num }}</td>
    <td></td>
    <td class="value">{{ '%.2f' | format(w.amount or 0) }}</td>
  </tr>
  {% endfor %}
  <tr>
    <td colspan="8" style="text-align:right;">ಒಟ್ಟು</td>
    <td class="value bold">{{ '%.2f' | format(computed.total_dev_cost or 0) }}</td>
  </tr>
</table>

<div style="display:flex; justify-content:space-between; margin-top:14mm; font-weight:bold;">
  <div>ವಲಯ ಮೇಲ್ವಿಚಾರಕರು</div>
  <div>ತಾಂತ್ರಿಕ ಅಧಿಕಾರಿಗಳು / ಅಭಿಯಂತರರು</div>
</div>
</div>
```

Verify: `--pages land_dev/ld9`, then run the FULL fixture render:
```bash
DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python tools/render_test.py --scheme LAND_DEV
```
Expected: `pages: 23 (expected 23) OK` (requires Task 6's fixture and a
`--scheme` flag — add that flag in Task 6 if `render_test.py` doesn't
already support selecting a scheme; check the file first, it currently
hardcodes `SCHEMES[SchemeType.TRACTOR]`).

- [ ] **Step 10: Commit**

```bash
git add backend/templates/pages/land_dev/
git commit -m "Add 9 LAND_DEV page templates (pages 11-19), transcribed from
the Kallangouda Patil reference PDF"
```

---

## Task 6: Test fixtures for LAND_DEV

**Files:**
- Modify: `backend/tools/render_test.py` (add `--scheme` flag, LAND_DEV fixture)

**Interfaces:**
- Produces: `FIXTURE_LAND_DEV_APP`, `FIXTURE_LAND_DEV_DETAILS` module-level
  fixtures, selectable via `--scheme LAND_DEV` (default remains TRACTOR so
  no existing invocation breaks).

- [ ] **Step 1: Read the current file structure**

```bash
cat backend/tools/render_test.py
```
Note exactly how `FIXTURE_APP`/`FIXTURE_TRACTOR_DETAILS` are constructed
(field names, `Application(...)` kwargs) so the new fixture matches the
same style.

- [ ] **Step 2: Add the LAND_DEV fixture and a `--scheme` flag**

Add near the existing fixtures (synthetic data — do not copy the real
applicant's Aadhaar/mobile numbers from the reference PDF):

```python
FIXTURE_LAND_DEV_APP = Application(
    scheme_type=SchemeType.LAND_DEV,
    application_no="LD-1/2025-26",
    applicant_name_kn="ಶ್ರೀ ಪರೀಕ್ಷಾ ಅಭಿವೃದ್ಧಿ ಪಾಟೀಲ",
    village="ಗೋಕಾಕ", hobli="ಗೋಕಾಕ", taluk="ಗೋಕಾಕ", district="ಬೆಳಗಾವಿ",
    farmer_type="big", borrower_type="new",
    total_area_acres=24, total_guntas=20,
    land_parcels=json.dumps([{"sl": 1, "village": "ಗೋಕಾಕ", "survey_no": "2419/1", "acres": 24, "guntas": 20, "akaar": 0}]),
    current_crop="[]",
    land_valuation_per_acre=560000,
    loan_amount=1500000, loan_duration_years=7,
)
FIXTURE_LAND_DEV_DETAILS = LandDevDetails(
    land_type="ತರಿ",
    pre_dev_crops=json.dumps([
        {"crop_name": "ಹೈಬ್ರಿಡ್ ಹತ್ತಿ", "season": "ಮುಂ/ಹಿಂ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
         "cost_per_acre": 27500, "total_cost": 665500, "yield_per_acre": 6.5, "total_yield": 157,
         "rate": 7600, "total_income": 1193200, "other_cost": 665500, "annual_income": 527700},
        {"crop_name": "ಸೂರ್ಯಕಾಂತಿ", "season": "ಮುಂ/ಹಿಂ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
         "cost_per_acre": 16700, "total_cost": 404140, "yield_per_acre": 7, "total_yield": 169,
         "rate": 4500, "total_income": 760500, "other_cost": 404140, "annual_income": 356360},
    ]),
    post_dev_crops=json.dumps([
        {"crop_name": "ಕಬ್ಬು", "season": "ವಾ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
         "cost_per_acre": 54500, "total_cost": 1318900, "yield_per_acre": 500, "total_yield": 12100,
         "rate": 275, "total_income": 3327500, "other_cost": 1318900, "annual_income": 2008600},
    ]),
    dev_work_items=json.dumps([
        {"description": "ಗಿಡಗಂಟೆ, ಕಲ್ಲು ಕಂಟಿಗಳನ್ನು ತೆಗೆದು ಜಮೀನು ಸ್ವಚ್ಛಗೊಳಿಸುವುದು ಮತ್ತು ಕೊರಕಲುಗಳನ್ನು ತುಂಬುವುದು", "rate_per_acre": 5336, "amount": 130732},
        {"description": "ಜಮೀನಿನ ವಿಂಗಡಣೆ, ಸಮತಳ ಮತ್ತು ಮಟ್ಟಿಗೊಳಿಸುವುದು", "rate_per_acre": 61714, "amount": 1511993},
        {"description": "ಮೇರೆ / ಅಂಚುಗಳಿಗೆ ಒಡ್ಡುಗಳನ್ನು ಹಾಕುವುದು", "rate_per_acre": 7807, "amount": 191272},
        {"description": "ಹೆಚ್ಚಿನ ನೀರು ಹೊರಹೋಗಲು ಒಳಗಟ್ಟಿ ನಿರ್ಮಿಸುವುದು", "rate_per_acre": 0, "amount": 0},
        {"description": "ಫಲವತ್ತಾದ ಕೆರೆ ಮಣ್ಣು ಮತ್ತು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಹರಡುವುದು", "rate_per_acre": 3429, "amount": 84011},
        {"description": "ಕಾಣಬರದ ಇತರ ಕಾರ್ಯಗಳು", "rate_per_acre": 1714, "amount": 41993},
    ]),
)
```

Find `def main():` and the line `spec = SCHEMES[SchemeType.TRACTOR]`.
Change the argument parsing to support a scheme flag:

```python
scheme_name = "TRACTOR"
if "--scheme" in sys.argv:
    scheme_name = sys.argv[sys.argv.index("--scheme") + 1]
scheme_type = SchemeType[scheme_name]
spec = SCHEMES[scheme_type]
app_fixture = FIXTURE_LAND_DEV_APP if scheme_type == SchemeType.LAND_DEV else FIXTURE_APP
details_fixture = FIXTURE_LAND_DEV_DETAILS if scheme_type == SchemeType.LAND_DEV else FIXTURE_TRACTOR_DETAILS
context = build_context(app_fixture, details_fixture, spec)
```
(Replace the two variable names `FIXTURE_APP`/`FIXTURE_TRACTOR_DETAILS`
above with whatever the existing file actually calls them — confirmed in
Step 1.) Also import `LandDevDetails` at the top of the file alongside the
existing `TractorDetails` import.

- [ ] **Step 3: Run the full LAND_DEV render**

```bash
cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python tools/render_test.py --scheme LAND_DEV
```
Expected: `pages: 23 (expected 23) OK`. Also re-run with no `--scheme` flag
and confirm Tractor is still `pages: 21 (expected 21) OK` (regression
check — the flag must not break the default path).

- [ ] **Step 4: Visual check**

```bash
sips -s format png --resampleWidth 1200 assets/generated/render_test_full.pdf --out /tmp/land_dev_full.png
```
(or split into per-page PNGs like earlier in this session) and read the
images to confirm every new page matches the numbers in this plan's
"Confirmed reference data" section — 884,060 / 2,008,600 / 1,124,540 /
1,960,001 / 50% / no insurance line anywhere.

- [ ] **Step 5: Commit**

```bash
git add backend/tools/render_test.py
git commit -m "render_test: add --scheme flag and LAND_DEV fixture (23 pages)"
```

---

## Task 7: Frontend form section for LAND_DEV

**Files:**
- Modify: `backend/../frontend/src/pages/NewApplication.jsx`

**Interfaces:**
- Consumes: the existing crop-row field-array pattern (`current_crop`
  field array — read its exact JSX before duplicating), `InputField`
  component, `landAppend`/`useFieldArray` patterns already in the file.
- Produces: `pre_dev_crops`, `post_dev_crops`, `dev_work_items`,
  `land_type` form fields, submitted as part of the `LAND_DEV` payload
  (backend router already routes by `scheme_type`, matching
  `ApplicationCreate` field names — confirm exact payload key names match
  Task 3's `DETAIL_FIELDS` `key` values: `land_type`, `pre_dev_crops`,
  `post_dev_crops`, `dev_work_items`).

- [ ] **Step 1: Read the existing crop-row field array**

```bash
grep -n "current_crop\|cropFields\|cropAppend\|useFieldArray" frontend/src/pages/NewApplication.jsx
```
Read the surrounding ~60 lines to see the exact row shape (crop dropdown,
season, irrigated checkbox, acres/guntas inputs, computed income
readonly field) before duplicating it.

- [ ] **Step 2: Add the LAND_DEV-gated section**

Following the existing `{schemeType === 'TRACTOR' && (...)}` pattern
elsewhere in the file, add a `{schemeType === 'LAND_DEV' && (...)}` block
containing:
- A `land_type` dropdown (ಖುಷ್ಕಿ / ತರಿ) using the existing `SelectField`
  component.
- Two copies of the crop-row field array from Step 1, one bound to
  `pre_dev_crops` (label "ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಬೆಳೆಗಳು"), one to
  `post_dev_crops` (label "ಅಭಿವೃದ್ಧಿ ನಂತರದ ಬೆಳೆಗಳು") — same
  `useFieldArray({ name: 'pre_dev_crops' })` /
  `useFieldArray({ name: 'post_dev_crops' })` pattern as the existing
  `land_parcels`/`current_crop` arrays.
- A fixed 6-row dev-cost table (not a field array — the 6 descriptions are
  constant, matching Task 5's `DEV_WORK_DESCRIPTIONS`): one `InputField
  type="number" step="any" min="0"` per row for `rate_per_acre`
  (apply the same `onWheel={(e) => e.target.blur()}` guard fixed earlier
  this session), with a read-only computed `amount` cell
  (`rate_per_acre * total_extent_decimal`, rounded) recalculated on every
  keystroke via a `watch()`-driven `useEffect` (same pattern the existing
  land-valuation total effect already uses — find and copy it).

Concretely, define the fixed descriptions once near the top of the
component (outside the render function) so both the row-rendering JSX and
the submit payload reference the same array:

```javascript
const DEV_WORK_DESCRIPTIONS = [
  'ಗಿಡಗಂಟೆ, ಕಲ್ಲು ಕಂಟಿಗಳನ್ನು ತೆಗೆದು ಜಮೀನು ಸ್ವಚ್ಛಗೊಳಿಸುವುದು ಮತ್ತು ಕೊರಕಲುಗಳನ್ನು ತುಂಬುವುದು',
  'ಜಮೀನಿನ ವಿಂಗಡಣೆ, ಸಮತಳ ಮತ್ತು ಮಟ್ಟಿಗೊಳಿಸುವುದು',
  'ಮೇರೆ / ಅಂಚುಗಳಿಗೆ ಒಡ್ಡುಗಳನ್ನು ಹಾಕುವುದು',
  'ಹೆಚ್ಚಿನ ನೀರು ಹೊರಹೋಗಲು ಒಳಗಟ್ಟಿ ನಿರ್ಮಿಸುವುದು',
  'ಫಲವತ್ತಾದ ಕೆರೆ ಮಣ್ಣು ಮತ್ತು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಹರಡುವುದು',
  'ಕಾಣಬರದ ಇತರ ಕಾರ್ಯಗಳು',
];
```

On submit (find the existing `onSubmit`/payload-building function), for
`schemeType === 'LAND_DEV'`, build `dev_work_items` as:
```javascript
const devWorkItems = DEV_WORK_DESCRIPTIONS.map((description, i) => {
  const rate = parseFloat(watch(`dev_work_rates.${i}`)) || 0;
  const amount = Math.round(rate * totalExtentDecimal);
  return { description, rate_per_acre: rate, amount };
});
```
where `totalExtentDecimal` is `acres + guntas / 40`, matching the existing
land-valuation extent calculation already in the file (reuse that exact
expression, don't reintroduce a second formula for the same thing).

- [ ] **Step 3: Wire `land_type` into the payload**

Ensure `land_type` (from the new dropdown) is included in the submitted
JSON body alongside `pre_dev_crops`/`post_dev_crops`/`dev_work_items` —
find where the existing `TRACTOR`-specific fields (`tractor_make` etc.)
get added to the submit payload and mirror that pattern for LAND_DEV's
fields.

- [ ] **Step 4: Verify the build**

```bash
cd frontend && npx vite build
```
Expected: `✓ built in ...s`, no errors.

- [ ] **Step 5: Manual smoke test**

Run the app (`make run` from repo root, or the documented dev commands),
log in, go to New Application, select ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆ (Land Dev), and
confirm: the land-type dropdown appears, both crop tables accept rows and
show a computed income column, the 6 dev-cost rows accept a rate and show
a computed amount, and submitting creates an application without a 422
error (check the backend log / browser network tab for the exact 422
field-list if it fails — that tells you which `ApplicationCreate` field
name doesn't match the form's payload key).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/NewApplication.jsx
git commit -m "Add LAND_DEV form section: land type, pre/post-dev crop
tables, 6-row development-cost table"
```

---

## Task 8: Seed a reference sample and update CLAUDE.md

**Files:**
- Modify: `backend/tools/seed_reference_apps.py`
- Modify: `/Users/ayush/project/CLAUDE.md` (changelog + "Next / pending")

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: an editable Kallangouda-pattern LAND_DEV sample in the dev
  database, and an updated project changelog (per the project's own
  "Keep this file current" rule).

- [ ] **Step 1: Read the existing seed script**

```bash
cat backend/tools/seed_reference_apps.py
```

- [ ] **Step 2: Add a LAND_DEV sample**

Following the exact same pattern as the existing Vasant Malli seed entry,
add a second seeded application using `FIXTURE_LAND_DEV_APP`/
`FIXTURE_LAND_DEV_DETAILS`'s shape (synthetic values, not the real
Kallangouda applicant's PII) so testers have an editable Land Dev example
alongside the Tractor one.

- [ ] **Step 3: Run the seed script and confirm**

```bash
cd backend && DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib /Users/ayush/project/.venv-mac/bin/python tools/seed_reference_apps.py
```
Expected: no errors, and a new application row visible via the dashboard
or a direct DB query.

- [ ] **Step 4: Update CLAUDE.md**

Add a new changelog entry (most recent at top of the changelog section)
summarizing: LAND_DEV scheme built end-to-end (schema, 9 pages, real
pre/post-dev income computation, no-insurance + 50%-eligibility
generalization, frontend form section, 23-page fixture). Move the
"Bank sign-off on printed Tractor packet → then replicate..." line in
"Next / pending" to reflect that LAND_DEV is now built (pending its own
bank review round, same as Tractor went through), and add the known
moratorium-period gap as a follow-up item.

- [ ] **Step 5: Commit and push**

```bash
git add backend/tools/seed_reference_apps.py CLAUDE.md
git commit -m "Seed LAND_DEV reference sample; update CLAUDE.md changelog"
git push
```

---

## Self-review notes (completed during planning, not a task)

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-04-land-dev-design.md`
  has a task — page inventory (Task 5), data model (Task 2), computed
  fields (Task 4), schema package (Task 3), frontend (Task 7), formula
  extraction (folded into "Confirmed reference data" above, sourced
  directly from reading the PDF rather than a separate extraction script,
  since the numbers needed were fully confirmed by visual reading — no
  further xlsx dump needed), testing (Task 6), migration (Task 2 Step 2).
- **New finding not in the original spec, added to Task 1:** the 50%
  loan-eligibility percentage and no-insurance-line discovery came from
  actually reading the PDF during plan-writing (the spec only flagged
  insurance as "unconfirmed, decide during build" — now confirmed absent).
- **Known deferred gap:** the moratorium/grace-period duration mismatch
  (documented above and in Task 8) — do not attempt to silently fix this
  by guessing; it needs the same kind of explicit bank-review correction
  round Tractor's installment logic went through.
