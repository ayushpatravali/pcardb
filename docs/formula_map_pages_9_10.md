# Packet pages 9 & 10 — field-by-field map to the Tractor workbook

Source: `legacy_assets/excell workbooks/Vasant Malli.xlsx` (sheets **B3**, **B4**)
cross-read with `legacy_assets/formula_maps/tractor_formulas.json` and our
templates `b3.html` / `b4.html`. Workbook labels are Nudi-encoded; decoded to
Unicode below. **Mapping only — nothing here is implemented yet** (except where
marked ✅ already live in our engine).

Legend: `PLDMagic!*` = operator-typed input cell in the workbook (the old
"form"). "Our field" = what our React form / DB stores today.

---

## PAGE 9 — sheet B3 ↔ `templates/pages/b3.html`

### Section 9) ಹಿಂದಿನ ಸಾಲಗಾರರೇ? (previous-borrower block — "the seven points")

Workbook order (ಅ…ಋ). The bank fills these only when the answer to the header
question is ಹೌದು (yes = old borrower).

| # | Kannada label | Meaning | Excel cell | Pulls from | Our field |
|---|---|---|---|---|---|
| hdr | ಹಿಂದಿನ ಸಾಲಗಾರರೇ ? ಹೌದು / ಅಲ್ಲ | old borrower? yes/no | B3!H1 | PLDMagic!D93 | ✅ `borrower_type` (Old/New) |
| hdr2 | ಹೌದು ಎಂದಾದಲ್ಲಿ : ಯೋಜನೆ / ಉದ್ದೇಶ | if yes: scheme/purpose of old loan | B3!H2 | PLDMagic!D94 | ✅ `prev_purpose` |
| ಅ | ಸಾಲಗಳ ಖಾತೆ ನಕಲುಗಳನ್ನು ಲಗತ್ತಿಸಿದ ಪುಟ ಸಂಖ್ಯೆ | loan-account copy attached, page no | B3 row 4 (blank) | handwritten in workbook | ✅ `prev_loan_account_pages` |
| ಆ | ಆಸ್ತಿ ಅಡಮಾನ ಪುಸ್ತಕದ ನಕಲು ಲಗತ್ತಿಸಿದ ಪುಟ ಸಂಖ್ಯೆ | mortgage-book copy attached, page no | B3 row 5 (blank) | handwritten | ✅ `prev_mortgage_book_pages` |
| ಇ | ಪಡೆದಿರುವ ಒಟ್ಟು ಸಾಲದ ಮೊತ್ತ ರೂ. | total amount of old loan(s) | B3!I6 | PLDMagic!D96 | ✅ `prev_total_loan` |
| ಈ | ಹಾಲಿ ಇರುವ ಸಾಲ ಹೊರ ಬಾಕಿ ಮೊತ್ತ ರೂ. | current outstanding balance | B3!I7 | PLDMagic!D97 | ✅ `prev_outstanding` |
| ಉ | ಒಟ್ಟು ವಾರ್ಷಿಕ ಕಂತಿನ ಮೊತ್ತ ರೂ. | total annual installment | B3!I8 | PLDMagic!D98 | ✅ `prev_annual_installment` |
| ಊ | ಚಾಲ್ತಿಯವರೆಗೆ ಮರುಪಾವತಿ ಮಾಡಲಾಗಿದೆಯೇ ? | repaid up to date? | B3!I9 | PLDMagic!D99 | ✅ `prev_repaid_status` |
| ಋ | ಎಲ್ಲಾ ಸಾಲಗಳ ಉಪಯುಕ್ತತೆ ವರದಿ ಲಗತ್ತಿಸಿದ ಪುಟ ಸಂಖ್ಯೆ | utility report of all loans, page no | B3 row 10 (blank) | handwritten | ✅ `prev_utility_report_pages` |

→ All seven inputs already exist in our form (old-borrower section) and print
on page 9, in the owner-requested order (amounts first, attachments last).
The workbook confirms every one of them is an operator input, not a formula.

### Section 10) ಭದ್ರತೆಯ ಹಕ್ಕು / ಶಿರೋನಾಮೆ ಒಪ್ಪಬಹುದೇ?
Title/security acceptability — handwritten judgment. No formula. (Ours: blank.)

### ತಾಂತ್ರಿಕಾರ್ಥಿಕ ವಿಶ್ಲೇಷಣೆ items 1–6 (technical analysis)
| Item | Excel cell | Pulls from | Our field |
|---|---|---|---|
| 5) ಯಂತ್ರೋಪಕರಣಗಳ ತಯಾರಿಕೆ (make) | B3!D32 | PLDMagic!C36 | ✅ `tractor_make` |
| 5) ಅಶ್ವಶಕ್ತಿ (HP) | B3!G32 | PLDMagic!C37 | ✅ `tractor_hp` |
| 5) ಮಾರಾಟಗಾರರ ಹೆಸರು (dealer) | B3!D33 | PLDMagic!C39 | ✅ `tractor_dealer` |
| 6ಅ) ನೀರಾವರಿ ಮೂಲ (irrigation) | B3!C38 | PLDMagic!D24 | ✅ `irrigation_source` |

### Section 7) ಯೋಜನೆಯ ಆರ್ಥಿಕ ಕಾರ್ಯಕ್ರಮ (cost table)
Columns: ಉದ್ದೇಶ / ಯೋಜನಾವೆಚ್ಚ / ಸ್ವಂತ ಕೊಡುಗೆ / ಬ್ಯಾಂಕು ಸಾಲ

| Row | quotation | own contribution | bank loan |
|---|---|---|---|
| ಅ) ಟ್ರ್ಯಾಕ್ಟರ್ | B3!F43 = PLDMagic!F54 | **B3!H43 `=F43−I43`** (computed!) | B3!I43 = PLDMagic!H54 |
| ಆ) ಟ್ರೈಲರ್ | F44 = F55 | H44 `=F44−I44` | I44 = H55 |
| ಈ) totals | F46 `=SUM(F43:G45)` | H46 `=SUM(H43:H45)` | I46 `=SUM(I43:I45)` |

Note: Excel derives own-contribution as *quotation − bank loan*; our form takes
down-payment as input — numerically identical. ✅ All bound. Our new
`+ 100000` insurance line sits below I46 (and the workbook itself hardcodes
`,+100000` beside the sanction amount on B4 — see below).

---

## PAGE 10 — sheet B4 ↔ `templates/pages/b4.html` — THE CALCULATION CHAIN

### Items 8–10 (attachment/verification lines) — handwritten. No formulas.

### Item 11) income appraisal
| Sub | Kannada | Meaning | Excel | Formula chain | We already have |
|---|---|---|---|---|---|
| ಅ | ಅಭಿವೃದ್ಧಿ ಪೂರ್ವದ ಆದಾಯ | income BEFORE development | B4!J8 | `=T3!I24` = `SUM(T3!I4:I23)` = Σ per-crop annual incomes | ✅ `computed.annual_income` (same Σ) |
| ಆ | ಅಭಿವೃದ್ಧಿ ನಂತರದ ಆದಾಯ | income AFTER development | B4!J9 | `=T5!I4` = `I2 + I3` = annual_income × **1.30** | derivable |
| ಇ | ಹೆಚ್ಚುವರಿ ನಿವ್ವಳ ಆದಾಯ | incremental net income | B4!J10 | `=T5!I3` = `ROUND(annual_income × 30%)` | derivable (t5 already computes `inc30`) |

### Item 12) ಆರ್ಥಿಕ ಸಕ್ಷಮತೆ (financial viability — the core chain)
| Sub | Kannada | Meaning | Excel | Formula | Inputs we hold |
|---|---|---|---|---|---|
| ಅ | ಭದ್ರತೆ ಮೌಲ್ಯ | security (land) value | B4!E12 | `=Val!I23` (valuation-sheet total) | ✅ `computed.land_valuation_total` |
| ಆ | ಸಾಲದ ಅರ್ಹತೆ | loan eligibility | B4!E14 | `=ROUND(E12 × 80%)` | derivable |
| ಇ | ಹಿಂದಿನ ಸಾಲಗಳ ಹೊರಬಾಕಿ | old-loan outstanding | B4!E16 | operator input | ✅ `prev_outstanding` |
| ಈ | ನಿವ್ವಳ ಸಾಲದ ಅರ್ಹತೆ | NET loan eligibility | B4!F18 | `= E14 − outstanding` | derivable |
| — | (beside ಈ) ಸಾಲದ ರಕಂ | sanctioned loan amount | B4!F19 | `=PLDMagic!C7` | ✅ `loan_amount` |
| ಉ | ಮರುಪಾವತಿ ಅರ್ಹತೆ (ಅಂಶ 11ಇ × 75%) | repayment eligibility | B4!J20 | `=ROUND(J10 × 75%)` = 75% of incremental income | derivable |
| ಊ | ಹಿಂದಿನ ಸಾಲಗಳ ಮರುಪಾವತಿ ಕಂತು | old-loan annual installment | B4!J22 | operator input | ✅ `prev_annual_installment` |
| ಋ | ನಿವ್ವಳ ಮರುಪಾವತಿ ಅರ್ಹತೆ (ಉ−ಊ) | NET repayment eligibility | B4!J24 | `= J20 − J22` | derivable |
| ಎ | ಮರುಪಾವತಿ ಅವಧಿ | repayment period | B4!F26 | constant 7 | ✅ `loan_duration_years` |
| ಏ | ಕಂತಿನ ಮೊತ್ತ | installment amount | B4!J30 | `=T5!F18` = `ROUND(total_loan ÷ duration)` | ✅ our `kantu` on t5 |

### Item 13) sanction line
`ಕೆಳಕಂಡ ಷರತ್ತುಗಳಿಗೆ ಒಳಪಟ್ಟು ರೂ. [D42 =PLDMagic!C7 =1130000] [F42 =",+100000"] ಸಾಲ ಮಂಜೂರು ಮಾಡಬಹುದು`
→ **the workbook itself hardcodes `+100000` after the loan amount** — matches
the insurance line we added on 2026-08-03. ✅

### Supporting chain on sheet T5 (packet page 15) — for reference
- 8.1 ಹೆಚ್ಚುವರಿ ನಿವ್ವಳ ಆದಾಯ: `I2` = T3 total income; `I3 = ROUND(I2×30%)`
- 8.2 ಅಭಿವೃದ್ಧಿ ನಂತರ ಆದಾಯ: `I4 = I2 + I3`
- 8.3 ಮೌಲ್ಯ ಮಾಪನ: `I6 = I4 × 8`
- 8.4 ಸಾಲದ ಅರ್ಹತೆ: `I8 = 50% of I6`
- 8.6 ನಿವ್ವಳ ಸಾಲದ ಅರ್ಹತೆ: `I12 = I8 − old outstanding`
- 8.7 ಸಾಲದ ಮರುಪಾವತಿ: `F15 = 75% of I3`; workbook adds hire income by hand
  (`",+100960 Trailer Income"` from T4) → `I15 = F15 + 100960`
- 8.9 ಕಂತು: `F18 = ROUND(I16 ÷ F20)` = tractor loan ÷ years
→ our t5 template already computes inc30 / inc82 / val83 / elig / r75 / kantu
with these exact formulas. ✅

---

## If/when we implement page 10 (owner decision pending)
Every B4 figure is computable from data we already store — no new inputs
needed: `annual_income`, `land_valuation_total`, `prev_outstanding`,
`prev_annual_installment`, `loan_amount`, `loan_duration_years`.
The only judgment call: ಊ/ಇ come from the previous-loan block, which is empty
for NEW borrowers (then net = gross, matching the workbook's SUM-with-blank
behaviour).
