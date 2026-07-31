# PCARDB Loan Application System — Complete Project History

> **Purpose**: This document captures the ENTIRE journey of building the PCARDB system.  
> If you are a new agent or developer picking this up, **read this file first**.  
> **Last Updated**: 2026-05-22 | **Conversation**: `03b6edf2-06d5-4104-85c9-e79befaa7f03`

---

## 1. Project Overview

**PCARDB** (Pashusangavardhane Corporation Agricultural & Rural Development Board) is a government loan management system for rural Karnataka, India.

### Core Requirements:
- Web-based form entry for loan applications (Kannada + English)
- Support for **Kannada language** (ಕನ್ನಡ) — complex Indic script with conjuncts (ottaksara)
- Generate **print-ready PDFs** matching official government form templates exactly
- Multi-user with role-based access (Manager, Field Officer)
- Must work offline/locally (no cloud dependency)

### Tech Stack:
| Layer | Technology | Port |
|---|---|---|
| Frontend | React + Vite | 5173 |
| Backend | FastAPI + Uvicorn | 8000 |
| Database | SQLite (SQLAlchemy/SQLModel) | — |
| PDF Engine | ReportLab + Pillow + PyPDF | — |
| Styling | TailwindCSS | — |
| Auth | JWT tokens | — |

### How to Run:
```powershell
cd d:\PCARDB\project
python run_app.py
```
Opens at `http://localhost:5173/` — Login: `officer` / `password`

---

## 2. Scheme Analysis (Phase 1 — COMPLETED ✅)

6 Excel workbooks analyzed from `d:\PCARDB\`:

| # | Scheme | Excel File | PDF Status |
|---|---|---|---|
| 1 | Land Development | `Kallangouda V Patil.xlsx` | ❌ Not implemented |
| 2 | **Tractor Purchase** | `Vasant Malli.xlsx` | ✅ Working |
| 3 | Sheep (40+2) | `Adiveppa Sannakki 3.20.xlsx` | ❌ Not implemented |
| 4 | Sheep (20+1) | `Smt Basavva Shidnal 1.60.xlsx` | ❌ Not implemented |
| 5 | Sheep (10+1) | `Allappa Mahaling Melmatti 0.87.xlsx` | ❌ Not implemented |
| 6 | Bullock Cart | `Mahesh M Pattar.xlsx` | ❌ Not implemented |

---

## 3. Architecture — The PDF Engine (CRITICAL)

### 3.1 The Kannada Problem

Standard PDF text rendering breaks Kannada conjuncts. **Solution: Image-based stamping.**

```
User types Kannada in form → Backend receives Unicode text
  → Pillow renders text to PNG image (correct shaping via OS text engine)
  → ReportLab stamps PNG onto PDF overlay canvas
  → PyPDF merges overlay with template → Final PDF
```

### 3.2 Dual Font System (FIXED 2026-05-22)

> [!IMPORTANT]
> The system uses TWO fonts to handle mixed Latin/Kannada text:

| Font File | Used For | Latin? | Kannada? |
|---|---|---|---|
| `NotoSansKannada-Regular.ttf` | Pure Kannada fields | ❌ NO | ✅ Superior |
| `Kannada.ttf` | Mixed/Latin fields | ✅ YES | ✅ Good |

**Auto-selection logic** in `_pick_font()`: If text contains any A-Z/a-z → use `Kannada.ttf`. Otherwise → use `NotoSansKannada`.

**Previous bug**: Only used `NotoSansKannada`, which has NO Latin glyphs → English text like "PCARDB-001" rendered as □□□□□-001.

### 3.3 Template Strategy

| File | Purpose | Use? |
|---|---|---|
| `tractor_flattened.pdf` | Original (has legacy sample data) | ❌ NEVER |
| `tractor_blank.pdf` | Cleaned (legacy text erased with white) | ✅ ACTIVE |
| `clean_tractor_template.pdf` | Earlier attempt, small (16KB) | ❌ Obsolete |
| `Tractor_Template.xlsx` | Original Excel source | Reference only |

> [!CAUTION]
> `pdf_service.py` line ~16 MUST point to `tractor_blank.pdf`.
> If it points to `tractor_flattened.pdf`, legacy names ("Basavaraj", "Shivakumar") will bleed through.

### 3.4 Nudi Converter (FIXED 2026-05-22)

File: `backend/utils/nudi_converter.py`

The `to_unicode()` function:
- **Direct Unicode input** (from form) → passes through unchanged ✅
- **Pure numbers/punctuation** → passes through unchanged ✅
- **Legacy ASCII/phonetic input** → transliterates to Kannada

**Bug fixed**: `MATRAS['i']` was mapped to `\u0cc6` (ೆ, vowel sign E) instead of `\u0cbf` (ಿ, vowel sign I).

**Improved Unicode detection**: Now checks `ord(c) > 127` instead of just Kannada range, catching ALL non-ASCII scripts.

### 3.5 Coordinate System

File: `backend/config/tractor_coordinates.json`

- PDF points (72pt = 1 inch), origin at **bottom-left**
- Template: **612 × 792 points** (US Letter)
- Each field: `key`, `x`, `y`, `width`, `height`, `font`, `size`
- `width`/`height` control the white-out eraser rectangle size

---

## 4. Complete File Structure

```
d:\PCARDB\project\
├── run_app.py                    # Main launcher (backend + frontend + optional ngrok)
├── install_fonts.bat             # Installs NotoSansKannada font
├── run_backend.bat / run_frontend.bat
├── README.md
├── PROJECT_HISTORY.md            # THIS FILE
│
├── backend/
│   ├── main.py                   # FastAPI app (CORS *, 4 routers)
│   ├── database.py               # SQLite at backend/database.db
│   ├── models.py                 # SQLModel: User, Application, TractorDetails, etc.
│   ├── auth.py                   # JWT auth
│   ├── init_db.py / migrate_db.py / reset_db.py
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── applications.py       # CRUD + stats (14KB, 357 lines)
│   │   ├── auth.py               # /token, /register
│   │   ├── pdf.py                # GET /pdf/download/{id} (no auth!)
│   │   └── excel.py              # GET /excel/download-excel/{id}
│   │
│   ├── services/
│   │   └── pdf_service.py        # ⭐ CORE: Dual-font image-based PDF stamping
│   │
│   ├── utils/
│   │   └── nudi_converter.py     # ASCII→Kannada transliterator + Unicode passthrough
│   │
│   ├── config/
│   │   └── tractor_coordinates.json  # X,Y field positions (Page 1: 15 fields, Page 2: 10 fields)
│   │
│   └── assets/
│       ├── fonts/
│       │   ├── NotoSansKannada-Regular.ttf  # Pure Kannada font (151KB)
│       │   └── Kannada.ttf                  # Latin + Kannada font (185KB)
│       └── templates/
│           ├── tractor_blank.pdf     # ✅ ACTIVE template (1.5MB)
│           └── tractor_flattened.pdf # ❌ Legacy (1.4MB, don't use)
│
└── frontend/src/pages/
    ├── Home.jsx              # Dashboard
    ├── Login.jsx / SignUp.jsx
    ├── SelectScheme.jsx      # Scheme picker
    ├── NewApplication.jsx    # Form entry (27KB, largest)
    ├── ApplicationsList.jsx  # List/grid view
    └── PrintApplication.jsx  # Print preview + download
```

---

## 5. Database Models

| Model | Table | Key Fields |
|---|---|---|
| `User` | `user` | username, hashed_password, role (manager/field_officer) |
| `Application` | `application` | applicant_name_kn, father_name_kn, village, age, caste, mobile_no, scheme_type, loan_amount, account_no, ifsc_code |
| `TractorDetails` | `tractordetails` | tractor_make/model/hp/cost, trailer_make/cost, total_project_cost |
| `LandDevDetails` | `landdevdetails` | survey_no, area, income projections |
| `SheepDetails` | `sheepdetails` | animal/shed/feed/insurance costs |
| `BullockDetails` | `bullockdetails` | bullock/cart costs |

---

## 6. Known Remaining Issues

### 6.1 ⚠️ Field Placement (Coordinates)
The coordinates in `tractor_coordinates.json` are **estimated** and may not perfectly align with the template form fields. The name appears at the top as a header AND in the correct position. Some fields may overlap.

**To fix**: Generate a debug PDF (`generate_tractor_pdf(data, debug=True)` adds red boxes), compare with the actual template, and adjust X/Y values.

### 6.2 ⚠️ Page 2 Fields Not Drawn
`pdf_service.py` only calls `draw("loan_amount", ..., 2)` on page 2, but the coordinate JSON defines 10 fields (tractor_make, model, hp, cost, etc.). The `pdf.py` router fetches this data from the database but it never gets stamped.

### 6.3 ⚠️ Bold Font Not Implemented
The coordinate JSON specifies `"font": "bold"` for some fields, but the code ignores it — always uses Regular. Need a `NotoSansKannada-Bold.ttf` file.

### 6.4 ⚠️ No Auth on PDF Endpoint
`/pdf/download/{id}` has no authentication — anyone with the URL can download any application's PDF.

### 6.5 ⚠️ `header_cleaned` and `scheme_cleaned` Orphaned
These keys exist in coordinates JSON but are never drawn by pdf_service.py. They were meant to erase legacy header text via the white-out system.

### 6.6 ⚠️ `create_blank_template.py` Missing
The script that generates `tractor_blank.pdf` from `tractor_flattened.pdf` was accidentally deleted during cleanup. If you need to regenerate the blank template, you'll need to recreate it.

---

## 7. Future Plans (Phase 3)

| Feature | Priority | Description |
|---|---|---|
| **Fix PDF field positions** | 🔴 HIGH | Re-calibrate coordinates using debug mode |
| **Draw all Page 2 fields** | 🔴 HIGH | Stamp tractor details on page 2 |
| **Search & Filter** | 🟡 MED | Text search on Applications List |
| **Edit Application** | 🟡 MED | PUT endpoint + form pre-fill |
| **Delete Application** | 🟡 MED | DELETE endpoint + confirm dialog |
| **Auth on PDF endpoint** | 🟡 MED | Add JWT check to /pdf/download |
| **Other scheme PDFs** | 🟢 LOW | Replicate tractor engine for other 5 schemes |
| **Security Hardening** | 🟢 LOW | .env secrets, disable debug |
| **Bold font support** | 🟢 LOW | Add NotoSansKannada-Bold.ttf |

---

## 8. Critical Debugging Checklist

When PDF output looks wrong, check:

1. **Template path** → `pdf_service.py` line ~16 must say `tractor_blank.pdf`
2. **Font files** → Both `.ttf` files must exist in `backend/assets/fonts/`
3. **Font auto-selection** → `_pick_font()` must use `Kannada.ttf` for Latin text
4. **Nudi converter** → `to_unicode()` must NOT corrupt already-Unicode input
5. **Coordinates** → Check `tractor_coordinates.json` for correct X/Y values
6. **Page count** → `can.showPage()` must be called between pages

---

## 9. Change Log

| Date | Change |
|---|---|
| 2025-12 | Phase 1: Scheme analysis, field extraction from 6 Excel files |
| 2025-12 | Phase 2: Full stack app (FastAPI + React + SQLite) |
| 2025-12 | PDF Engine v1: Direct ReportLab text (broken Kannada) |
| 2025-12 | PDF Engine v2: Image-based stamping (working Kannada) |
| 2025-12 | White-out iterations: Aggressive → Disabled → Thin Tape → Smart Eraser |
| 2025-12 | Template cleaning: `create_blank_template.py` → `tractor_blank.pdf` |
| 2026-01 | Cleanup: Removed diagnostic/test files |
| 2026-05-20 | Fixed template path (was pointing to dirty `tractor_flattened.pdf`) |
| **2026-05-22** | **Fixed MATRAS['i'] bug** (was \u0cc6/ೆ, now \u0cbf/ಿ) |
| **2026-05-22** | **Implemented dual-font system** (Kannada.ttf for Latin, NotoSansKannada for Kannada) |
| **2026-05-22** | **Improved Unicode detection** (ord > 127 check, numeric passthrough) |
| **2026-05-22** | **Created this PROJECT_HISTORY.md** for agent handoff |

---

*This file should be kept in sync with the project state. Copy to `d:\PCARDB\project\PROJECT_HISTORY.md` for IDE access.*
