# Tasks queued by owner (dictated 2026-08-02, night)

**STATUS 2026-08-03: items 0–4 DONE (see CLAUDE.md changelog). Item 5 (page-10
calculation) still WAITING on owner's explanation — the formula map at
`legacy_assets/formula_maps/tractor_formulas.json` is ready for it.**

Owner's instruction: these were dictated quickly; verify each against the actual
PDF/templates before implementing. Plan + execute in the next session, on owner's go.

## 0. FIRST STEP (owner's explicit priority): extract formulas from the Tractor Excel workbook
- Scan the Tractor Excel workbook in `legacy_assets/` (e.g. `Vasant Malli.xlsx`) and
  extract **all cell formulas** (per sheet, per cell), save them to a reference file.
- Purpose: the workbook encodes the bank's real calculation logic for each row/figure
  printed in the packet — having the formulas mapped to cells makes every computed
  field unambiguous (especially the page-10 calculation, item 5).
- Owner: "either do it for the concerned fields, or else you can just scan it for
  everything" → scan everything, save the full formula map.

## 1. Loan duration (ಸಾಲದ ಅವಧಿ / "Saal-e-awadhi") + insurance +1 lakh on final loan amount
- Add a **loan duration** field (Kannada: ಸಾಲದ ಅವಧಿ).
- The final loan amount appears in **4 places** across the PDF (sometimes inside a
  table, sometimes a plain line in a table). At each of those 4 places, add
  **+1 lakh (₹1,00,000)**:
  - In a table: add the +1 lakh **below** the total/final amount row.
  - In a single line: append the +1 lakh **after** the final loan amount.
- (Exact rendering — whether it's shown as a separate "+100000" line or folded into
  a new total — to be confirmed with owner while implementing.)

## 2. Insurance labelling + bank name Yadavad → Gokak
- The +1 lakh is insurance, but **do NOT print the word "insurance"** anywhere —
  just add the +1 lakh amount.
- **Bank name is wrong**: currently prints "Yadavad" somewhere; it must be **Gokak**.
  Check where the bank name is fetched/stored (`schemas/common_fields.py` BANK
  constants, DB `bank_name` column, seed data) and fix at the source, not per-template.

## 3. Page 5: place field ("Thada" / ಸ್ಥಳ, left side) shows Yadavad → must be Gokak
- On PDF page 5, the left-side "place" line (owner said "Thada", likely ಸ್ಥಳ = place)
  currently prints Yadavad; correct it to **Gokak**.

## 4. Page 4: region ("Valya" / ವಲಯ?) — per-user region assignment at login
- On PDF page 4 there's a field owner calls "Valya" (likely ವಲಯ = zone/region).
- Feature: assign a **region/city + role to each user account**; the region of the
  logged-in operator who types the application prints in that spot.
- Until branch cities are provided: **default region = Gokak** for everyone.
- Must print in **correct Kannada** — currently it's in English and wrong.
- Touches: User model (new region column), auth/user creation, render context.

## 5. Page 10: complex calculation — owner will explain tomorrow
- Placeholder only. Do nothing until owner explains. The formula extraction in
  item 0 will likely cover this.

## 6. ✅ DONE 2026-08-03 — form respects the language switch (owner pulled it in early)
Kannada mode = 100% Kannada via src/lib/kannada.js; English mode keeps the
bilingual mix (owner's preference for testing). Original spec below.

## (original) PRE-GO-LIVE: form must respect the language switch
- The app has a KN/EN toggle (`frontend/src/context/LanguageContext.jsx`,
  `t()` + `utils/translations.js`, switch in Layout.jsx) — but
  `NewApplication.jsx` ignores it: ~100 labels are hardcoded bilingual
  ("ಬ್ಯಾಂಕ್ ಹೆಸರು — Bank Name"), plus the amber Kannada-input note, the HP
  note, section headers, and dropdown option labels (caste, crops, irrigation,
  relations, farmer/borrower type).
- Required: Kannada mode = 100% Kannada (labels, notes, options — no English
  anywhere); English mode = English. Move every form string into the
  translations map; option lists get per-language labels (stored values stay
  unchanged so the backend contract and PDF mapping are untouched).
- Owner explicitly wants the bilingual UI KEPT for now (they read it during
  testing). Do this only as the final step before bank go-live.

## 7. Feature requests embedded in CROP INCOME CHART.xlsx
**✅ DONE 2026-08-03: caste dropdown (12 chart castes verbatim, prints exactly
on PDF) + free-text add-caste option. STILL PENDING: female-loanees dashboard
card, "last name next line" (clarify), hobli/taluk dropdowns.**
The chart's side columns contain owner notes (Nudi-encoded, decoded here):
- **Caste dropdown list** (per chart): 1) ಪರಿಶಿಷ್ಟ ಜಾತಿ 2) ಪರಿಶಿಷ್ಟ ಪಂಗಡ
  3) ಅಲ್ಪಸಂಖ್ಯಾತರು 4) ಇತರೆ ಸಾಮಾನ್ಯ, plus: ದಿಗಂಬರ ಜೈನ, ಮುಸ್ಲಿಂ, ಹಿಂದೂ ರಡ್ಡಿ,
  ಹಿಂದೂ ಮಾಳಿ, ಹಿಂದೂ ಬಣಜಿಗ, ಹಿಂದೂ ಕುರಬರ, ಹಿಂದೂ ಲಿಂಗವಂತ, ಹಿಂದೂ ಉಪ್ಪಾರ
- "Add Female Loanees in Dashboard along with above caste (1 to 4)" —
  dashboard card: female applicants count + caste categories 1–4
- "Give option to Add Caste if not in the dropdown list" — free-text caste entry
- "Also add after this Last Name next line" (clarify with owner)
- **Hobli dropdown**: ಅರಬಾಂವಿ, ಕೌಜಲಗಿ, ಗೋಕಾಕ; **Taluk dropdown**: ಮೂಡಲಗಿ, ಗೋಕಾಕ

## Reminders carried over
- After implementing: update CLAUDE.md Changelog (standing rule).
- Owner still to: sync fork + redeploy Railway for land-valuation/previous-loans
  commits; revoke the two GitHub PATs pasted in chat earlier.
