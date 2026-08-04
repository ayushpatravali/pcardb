# LAND_DEV scheme v1 — design spec

**Status:** approved, implementation starting 2026-08-04.
**Reference documents:** `legacy_assets/pdfss/Kallangouda Patil Land Development Scheme.pdf`
(23-page bank reference packet) and `legacy_assets/excell workbooks/Kallangouda V Patil.xlsx`
(source workbook, sheets `A1–A4, SSM, SSM2, BO1–BO4, Ap1–Ap5, LD1–LD4, TV, Val, spot., Memb`).
Both gitignored (real applicant PII) — do not commit contents, only derived
labels/formulas.

## 1. Page inventory

23 pages total (Tractor is 21). Confirmed by page count of the reference PDF
and by sheet count (`A1-4`+`SSM`+`SSM2`+`BO1-4` = 10 shared front sheets;
`TV`+`Val`+`spot.`+`Memb` = 4 shared back sheets; `Ap1-5`+`LD1-4` = 9
scheme-specific sheets; 10 + 9 + 4 = 23).

- **Pages 1–10**: identical to Tractor's `a1, a2, a3, a4, ssm, ssm2, b1, b2,
  b3, b4` — reused unchanged, no code changes.
- **Pages 11–19**: new — 9 templates under `templates/pages/land_dev/`,
  transcribed from the reference PDF, named to match the workbook sheets
  (`ap1.html`…`ap5.html`, `ld1.html`…`ld4.html`). Print order matches sheet
  order: `Ap1, Ap2, Ap3, Ap4, Ap5, LD1, LD2, LD3, LD4` — confirm exact order
  against the reference PDF page-by-page during transcription (workbook
  sheet order is a starting assumption, not proven page order).
- **Pages 20–23**: identical to Tractor's `valuation, inspection, pp,
  varadi` — reused unchanged.

Labels are transcribed visually from the reference PDF (workbook text cells
are legacy Nudi-ASCII glyphs, garbled as literal Unicode — same issue
CLAUDE.md already flags for other workbooks). Workbook formulas/numbers
(via openpyxl, `data_only=True` for values / `data_only=False` for
formulas) are used directly since they're numeric, not text.

## 2. Domain logic (what's actually new vs. Tractor)

Tractor computes `post_dev_income` as a flat +30% of `annual_income`,
and `incremental_income` as that 30% slice. Land Dev's workbook computes
real pre- and post-development income from two separate crop lists —
confirmed via `Ap3` (ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತಃಖ್ತೆ), which pulls two blocks of crop
rows (ಅಭಿವೃದ್ಧಿ ಪೂರ್ವದ ಆದಾಯ / ಅಭಿವೃದ್ಧಿ ನಂತರದ ಆದಾಯ) from `Sheet2 (4)`, each
row = {crop, season, irrigated, acres, guntas} plus per-acre cost/yield/rate
columns, net income summed per block (`Ap3!O13` = pre total, `Ap3!O21` =
post total). `Ap4` item 18 computes ಹೆಚ್ಚುವರಿ ನಿವ್ವಳ ಆದಾಯ = `O21 − O13` —
this is the number that must land in `computed.incremental_income`, not a
flat percentage.

`LD1`/`LD4` (development-cost estimate) is a 6-fixed-row table: each row
has a bank-assessed rate (varies per application) applied as
`rate_per_acre × total_area_acres` (confirmed via `LD1!E10 =
ROUND(D10/40*PLDMagic!N12,0)` where `D10` is the per-acre rate and
`PLDMagic!N12` is total guntas — i.e. `rate × (guntas/40)`, the same
shape as the extent/valuation formula already implemented for Tractor's
land valuation). The 6 rows (fixed, in this order): clearing brush /
filling ditches, leveling + bunding into strips, plowing/harrowing to
smooth the surface, shaping for irrigation channel layout, pond-silt +
farmyard manure spreading, miscellaneous/unforeseen work. Total = sum of
the 6 row amounts.

## 3. Data model

Replace the stub `LandDevDetails` (survey_no/area_acres/assessment/
land_type/pre_development_income/post_development_income/
incremental_income — leftover from the pre-rebuild engine) with:

```python
class LandDevDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    land_type: Optional[str] = None  # Dry/Wet — ಖುಷ್ಕಿ / ತರಿ

    # JSON-string columns, same convention as Application's land_parcels/current_crop.
    pre_dev_crops: Optional[str] = None   # list[{crop_name, season, irrigated, acres, guntas, annual_income}]
    post_dev_crops: Optional[str] = None  # same shape
    dev_work_items: Optional[str] = None  # list[6x {description (fixed), rate_per_acre, amount}]

    total_dev_cost: Optional[float] = None  # computed, stored for quick reference
```

Per-parcel land data (survey no, extent) continues to use the existing
shared `Application.land_parcels` field — no duplicate column.

`pre_dev_crops`/`post_dev_crops` reuse the exact row shape already used by
Tractor's `current_crop` (crop name from the existing Kannada crop-chart
dropdown, `CROP_LABEL_MAP` and per-acre rate chart apply unchanged).

Local dev DB: `ALTER TABLE landdevdetails` in place per the existing hard
rule (drop the 3 stub income columns, drop survey_no/area_acres/assessment,
add the 4 new columns). Railway recreates its DB on redeploy, no migration
needed there.

## 4. Computed fields (`render_service.py`)

New `elif app.scheme_type == SchemeType.LAND_DEV:` branch (mirrors the
existing `if ... TRACTOR:` branch) sets:

- `annual_income` from `pre_dev_crops` (sum of row `annual_income`) — takes
  priority over the generic `app.annual_income` fallback already in place,
  same pattern as Tractor's crop-sum fallback.
- `post_dev_income` from `post_dev_crops` (real sum, not `annual_income *
  1.3`).
- `incremental_income` = `post_dev_income - annual_income` (real delta, not
  `annual_income * 0.3`).
- `total_dev_cost` from `dev_work_items` (sum of 6 row amounts, each
  `rate_per_acre × computed.total_extent_decimal`).

These three keys (`annual_income`, `post_dev_income`, `incremental_income`)
are exactly what the *already-built* shared page 10 (`b4.html`, ಆರ್ಥಿಕ
ಸಕ್ಷಮತೆ) consumes — no changes needed to that template; it becomes correct
for Land Dev automatically once these keys are populated with real numbers
instead of Tractor's approximation.

**Generalize `installment_kantu`.** Currently computed only inside the
Tractor branch, keyed off `details.total_loan_amount` (a Tractor-only field
name). Move it outside the scheme conditional, keyed off the generic
`app.loan_amount` (present on every scheme via the shared `LOAN_FIELDS`)
divided by `loan_duration_years` — so Land Dev (and any future scheme)
gets the same corrected yearly-installment formula for free instead of
printing blank on page 10.

Every other Tractor-era correction already lives on the shared pages
(bank.place static prints, blank-by-hand branch-scrutiny sections, the
insurance-amount constant, Indian-digit-grouping `num` filter) — nothing
scheme-specific to redo there.

**Insurance line:** not yet confirmed present in the Land Dev packet — no
"+ 1,00,000"-style line was found in the `Ap`/`LD` sheet dump. Decide during
page transcription: if the reference PDF shows an insurance addition on any
of the 9 new pages, apply the existing `INSURANCE_AMOUNT` constant there;
otherwise omit. Do not assume it applies by default.

## 5. Schema package

New `schemas/land_dev.py`, structured exactly like `schemas/tractor.py`:
`SCHEME_NAME_KN`, `SCHEME_CODE`, `DETAIL_FIELDS` (tier-tagged: `collected`
for the two crop lists and dev-work rates, `computed` for income/cost
totals), `PAGES` (23-entry list), `SPEC` dict. Register in
`schemas/__init__.py` and `models.DETAILS_MODEL`.

## 6. Frontend (`NewApplication.jsx`)

New `LAND_DEV`-gated section, following existing scheme-conditional
patterns:

- Land type dropdown (ಖುಷ್ಕಿ / ತರಿ).
- Two copies of the existing crop-row field-array component (already built
  for Tractor's `current_crop`), labeled "ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಬೆಳೆಗಳು" /
  "ಅಭಿವೃದ್ಧಿ ನಂತರದ ಬೆಳೆಗಳು", writing to `pre_dev_crops` / `post_dev_crops`.
- A 6-row dev-cost table: fixed row labels, one rate-per-acre number input
  per row (operator-entered, varies per site), computed per-row amount and
  total — read-only computed cells, same `InputField`/wheel-blur/`min="0"`
  conventions fixed for Tractor earlier this session.
- Sticky summary bar extended to show `total_dev_cost` and the real
  incremental income once entered.

## 7. Formula extraction

Dump `Kallangouda V Patil.xlsx` formulas (openpyxl, both `data_only`
modes) to a gitignored `legacy_assets/formula_maps/land_dev_formulas.json`
(same convention as `tractor_formulas.json`), and write a short tracked
summary `docs/formula_map_land_dev.md` covering the `Ap3`/`Ap4`/`LD1`
formulas above (mirrors `docs/formula_map_pages_9_10.md`).

## 8. Testing

- `tools/render_test.py`: add a `FIXTURE_LAND_DEV_APP`/`FIXTURE_LAND_DEV_DETAILS`
  fixture (Kallangouda-shaped, no PII — synthetic values) and assert 23
  pages for the `LAND_DEV` scheme.
- `tools/seed_reference_apps.py`: add an editable Kallangouda-pattern sample
  alongside the existing Vasant Malli one.
- Manual check: render full Land Dev packet, visually diff against the
  reference PDF page-by-page (same process used for Tractor's original
  build and every correction round since).

## Open items to resolve during build, not blocking start

- Exact print order of `Ap1-5`/`LD1-4` against the reference PDF (assumed
  sheet order above).
- Whether an insurance line applies anywhere in the 9 new pages.
- Whether `dev_work_items` row descriptions need any wording adjustment
  once transcribed from the reference PDF (workbook text is legacy-encoded,
  so PDF is the source of truth).
