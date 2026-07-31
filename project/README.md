# PCARDB - Loan Automation System
**Primary Co-operative Agriculture & Rural Development Bank — Digital Loan Processing Platform**

A full-stack web application that digitizes the loan application lifecycle for the Gokak Taluka PCARD Bank. It replaces manual paper-based form filling with a modern web form, automatically generates Excel workbooks and PDFs using legacy bank templates, and provides role-based access for Bank Managers and Field Officers.

---

## Table of Contents
1. [What This System Does](#what-this-system-does)
2. [Current Project Status](#current-project-status)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [How to Run](#how-to-run)
6. [Architecture & Data Flow](#architecture--data-flow)
7. [Backend Deep Dive](#backend-deep-dive)
8. [Frontend Deep Dive](#frontend-deep-dive)
9. [API Reference](#api-reference)
10. [Database Schema](#database-schema)
11. [Document Generation Pipeline](#document-generation-pipeline)
12. [Default Credentials](#default-credentials)

---

## What This System Does

### The Problem
The bank processes 6 types of agricultural loans. Each loan application involves filling a multi-page printed form by hand, calculating financial fields manually, and photocopying the application for records. This is slow, error-prone, and makes tracking applications difficult.

### The Solution
This system provides:
- **Digital Form Entry** — A web form with auto-calculated fields (Total Cost, Margin Money etc.)
- **6 Loan Schemes** — Tractor, Land Development, Sheep (40+2, 20+1, 10+1), and Bullock Cart
- **Auto Document Generation** — Fills the bank's official Excel templates with form data and converts them to PDF
- **Role-Based Access** — Managers see all applications and can approve; Field Officers see only their own
- **Print-Ready Output** — PDFs match the bank's existing printed format exactly

### Supported Loan Schemes

| Scheme | Code | Description |
|--------|------|-------------|
| Tractor Purchase | `TRACTOR` | Tractor + Trailer + Implements |
| Land Development | `LAND_DEV` | Survey-based land improvement |
| Sheep Rearing (40+2) | `SHEEP_40` | 40 sheep + 2 rams unit |
| Sheep Rearing (20+1) | `SHEEP_20` | 20 sheep + 1 ram unit |
| Sheep Rearing (10+1) | `SHEEP_10` | 10 sheep + 1 ram unit |
| Bullock & Cart | `BULLOCK` | Bullock pair + cart purchase |

---

## Current Project Status

### Completed (Phase 1 — Core Reliability)
- [x] User Authentication (Login, Signup, JWT Tokens)
- [x] Application CRUD (Create, Read, Update, Delete)
- [x] All 6 scheme forms with auto-calculation
- [x] Excel generation using legacy bank templates
- [x] PDF generation via Win32COM (Excel → PDF)
- [x] Role-based access (Manager vs. Field Officer)
- [x] Tractor-specific pixel-perfect PDF overlay layout
- [x] Generic print layout for non-Tractor schemes

### Recent Changes (2026-07-18)
- `NewApplication.jsx`: Improved edit-mode parsing so saved land/crop arrays load as rows and auto-calculations (crop income, land totals, tractor loan) run immediately on open.
- Added `UPDATES-2026-07-18.md` summarizing the frontend changes and verification steps.
- [x] Vite proxy setup for local hosting

### Pending (Phase 2 — Data Safety & Deployment)
- [ ] Manual backup feature (download database)
- [ ] Automatic scheduled backups
- [ ] Production deployment guide (Nginx reverse proxy)

### Future (Phase 3 — Client Customization)
- [ ] Ad-hoc form field changes per client request
- [ ] Application number auto-generation format changes

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Single-page app with fast dev server |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **State** | React Hook Form | Form management with `watch` and `setValue` |
| **Routing** | React Router v6 | Client-side navigation with protected routes |
| **Backend** | FastAPI (Python) | REST API with automatic OpenAPI docs |
| **ORM** | SQLModel | Type-safe ORM combining SQLAlchemy + Pydantic |
| **Database** | SQLite | Single-file database, zero config |
| **Auth** | JWT (python-jose) | Stateless token-based authentication |
| **Passwords** | Argon2 (passlib) | Secure password hashing |
| **Excel** | openpyxl | Read/write Excel templates programmatically |
| **PDF** | Win32COM (pywin32) | Convert Excel to PDF using installed MS Excel |

---

## Project Structure

```
project/
├── run_app.py                  # One-click launcher (Backend + Frontend + Ngrok)
├── run_backend.bat             # Windows shortcut: start backend only
├── run_frontend.bat            # Windows shortcut: start frontend only
├── install_fonts.bat           # Install Kannada Unicode fonts
├── README.md                   # This file
│
├── backend/
│   ├── main.py                 # FastAPI app entry point, router mounting, CORS
│   ├── auth.py                 # JWT logic: token creation, verification, password hashing
│   ├── database.py             # SQLite engine setup, session management
│   ├── models.py               # SQLModel/Pydantic models (Application, TractorDetails, etc.)
│   ├── init_db.py              # Seed script: creates default Manager + Officer users
│   ├── migrate_db.py           # Schema migration helper
│   ├── reset_db.py             # Wipe and recreate database
│   ├── requirements.txt        # Python dependencies
│   │
│   ├── routers/
│   │   ├── auth.py             # POST /token, POST /register, GET /users/me
│   │   ├── applications.py     # Full CRUD + /generate endpoint
│   │   ├── pdf.py              # GET /pdf/download/{id} (legacy PDF pipeline)
│   │   └── excel.py            # GET /excel/download-excel/{id} (legacy Excel pipeline)
│   │
│   ├── services/
│   │   ├── generator.py        # PRIMARY: Template-based Excel generation + PDF conversion
│   │   ├── excel_service.py    # Legacy: older Excel generation service
│   │   └── pdf_service.py      # Legacy: ReportLab-based PDF generation
│   │
│   ├── utils/
│   │   └── nudi_converter.py   # Nudi → Unicode Kannada text converter
│   │
│   ├── assets/
│   │   ├── templates/          # Bank's official Excel workbook templates (one per scheme)
│   │   ├── fonts/              # Kannada Unicode fonts
│   │   └── generated/          # Output folder for generated Excel/PDF files
│   │
│   └── config/
│       └── tractor_coordinates.json  # Cell coordinate map for Tractor PDF overlay
│
└── frontend/
    ├── vite.config.js          # Dev server + proxy config (/api → :8000, /token → :8000)
    ├── package.json
    │
    └── src/
        ├── App.jsx             # Route definitions
        ├── main.jsx            # React entry point
        │
        ├── pages/
        │   ├── Login.jsx           # Login form
        │   ├── SignUp.jsx          # Registration form
        │   ├── Home.jsx            # Dashboard with stats
        │   ├── SelectScheme.jsx    # Scheme selection cards
        │   ├── NewApplication.jsx  # THE MAIN FORM (create + edit mode)
        │   ├── ApplicationsList.jsx # Table of all applications
        │   └── PrintApplication.jsx # Print preview + PDF/Excel download
        │
        ├── components/
        │   ├── Layout.jsx          # Sidebar + top bar wrapper
        │   ├── ProtectedRoute.jsx  # Auth guard (redirects to /login)
        │   ├── PDFOverlay/         # Pixel-perfect PDF page overlay (Tractor)
        │   └── forms/              # Scheme-specific form sub-components
        │
        ├── services/
        │   └── api.js              # Axios instance, all API helper functions
        │
        ├── context/
        │   ├── AuthContext.jsx     # Auth state provider (token, role)
        │   └── LanguageContext.jsx # Kannada/English toggle
        │
        ├── config/
        │   └── tractor_map.js     # Coordinate map for Tractor PDF overlay
        │
        └── utils/
            └── translations.js    # Kannada ↔ English label mappings
```

---

## How to Run

### Prerequisites
- **Python 3.10+** (with pip)
- **Node.js 18+** (with npm)
- **Microsoft Excel** (installed, for PDF conversion via Win32COM)

### Quick Start (One Command)
```bash
cd d:\PCARDB\project
python run_app.py
```
This starts:
1. **Backend** at `http://localhost:8000` (FastAPI with auto-reload)
2. **Frontend** at `http://localhost:5173` (Vite dev server)
3. **Ngrok tunnel** (if `ngrok.exe` is present, for remote access)

### Manual Start
```bash
# Terminal 1: Backend
cd project/backend
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd project/frontend
npm run dev
```

### First-Time Setup
```bash
# Backend
cd project/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python init_db.py    # Creates default users

# Frontend
cd project/frontend
npm install
```

---

## Architecture & Data Flow

### High-Level Architecture
```
┌─────────────────┐     HTTP/JSON      ┌──────────────────┐     SQLite      ┌────────────┐
│   React Frontend │ ◄──────────────► │  FastAPI Backend  │ ◄────────────► │ database.db│
│   (Port 5173)    │    via /api proxy  │   (Port 8000)    │                 └────────────┘
└─────────────────┘                    └──────────────────┘
                                              │
                                              │ openpyxl + Win32COM
                                              ▼
                                       ┌──────────────┐
                                       │ Excel + PDF   │
                                       │ Generation    │
                                       └──────────────┘
```

### Request Flow (Creating an Application)
```
1. User fills form on NewApplication.jsx
2. onSubmit() sanitizes data (empty "" → null) and nests scheme details
3. Frontend sends POST /api/applications/ with JWT token in header
4. Vite proxy strips /api prefix → forwards to backend port 8000
5. Backend validates JWT → extracts current_user
6. Pydantic validates request body against ApplicationCreate schema
7. Application header saved to `application` table
8. Scheme details saved to appropriate table (e.g. tractordetails)
9. Response: Application object with ID
10. Frontend navigates to /applications list
```

### Document Generation Flow
```
1. User clicks "Generate" on PrintApplication.jsx
2. Frontend sends POST /api/applications/{id}/generate
3. Backend fetches Application + Details from DB
4. generator.py copies the correct Excel template for the scheme
5. Fills common fields (name, address, bank) using layout coordinates
6. Fills scheme-specific fields (costs, calculations)
7. Saves the filled Excel file to assets/generated/
8. Win32COM opens Excel, exports as PDF (A4, fit-to-width)
9. Returns PDF file as download response
10. If Win32COM fails, falls back to returning the Excel file
```

### Authentication Flow
```
1. User submits credentials on Login.jsx
2. Frontend sends POST /token (form-data, NOT JSON)
3. Backend verifies password against Argon2 hash
4. Returns JWT token with {username, role} embedded
5. Frontend stores token + role in localStorage
6. Every API request includes Authorization: Bearer <token> header
7. Backend decodes token on each request to identify user
8. Token expires after 8 hours (configurable via TOKEN_EXPIRE_MINUTES env var)
```

---

## Backend Deep Dive

### Entry Point: `main.py`
Mounts all routers onto the FastAPI app:
- `auth.router` → no prefix (handles `/token`, `/register`, `/users/me`)
- `applications.router` → inherits `/applications` prefix from router definition
- `pdf.router` → inherits `/pdf` prefix from router definition
- `excel.router` → mounted with `/excel` prefix

### Models: `models.py`
Uses **SQLModel** (hybrid of SQLAlchemy ORM + Pydantic validation).

**Core Models:**
- `User` — Authentication identity (`username`, `hashed_password`, `role`)
- `Application` — The main loan application header (personal info, bank details, address)
- `TractorDetails` — Tractor scheme financials (cost breakdowns, loan, margin)
- `LandDevDetails` — Land development metrics (survey, area, income projections)
- `SheepDetails` — Sheep rearing costs (animals, shed, feed, insurance)
- `BullockDetails` — Bullock purchase costs (pair, cart, loan, margin)

Each detail table is linked to Application via `application_id` foreign key.

### Auth: `auth.py`
- Uses **Argon2** for password hashing (more secure than bcrypt)
- JWT tokens encoded with **HS256 algorithm**
- `get_current_user()` is a FastAPI **dependency** injected into every protected endpoint
- Secret key configurable via `SECRET_KEY` environment variable

### Generator Service: `services/generator.py`
This is the **primary document generation engine**. It:
1. Maps each scheme type to a specific Excel template file via `SCHEME_MAP`
2. Copies the template to avoid overwriting the original
3. Fills common fields (name, mobile, address, etc.) using `LAYOUTS` coordinate dictionary
4. Fills scheme-specific fields via dedicated functions (`fill_tractor_details`, etc.)
5. Uses `safe_write()` to handle merged cells and apply Unicode fonts
6. Converts to PDF using Microsoft Excel's COM interface (Windows only)

---

## Frontend Deep Dive

### Page Flow
```
Login → Home (Dashboard) → Select Scheme → New Application (Form)
                                                    ↓
                           Applications List ← ← ← ↓
                                ↓
                         Print Application → Download PDF/Excel
```

### Key Pages

**`NewApplication.jsx`** — The core of the app
- Handles both **Create** and **Edit** mode (detects `id` URL param)
- Uses `react-hook-form` with individual `watch()` calls per field
- Auto-calculates **Total Project Cost** and **Margin Money** in real-time
- Auto-calculated fields are greyed out and read-only
- `onSubmit()` explicitly maps form fields to backend schema (no fragile prefix magic)
- Number inputs have scroll-wheel disabled and min=0 to prevent accidents

**`SelectScheme.jsx`** — Card grid for choosing loan type before form

**`ApplicationsList.jsx`** — Data table with Edit, Print, Delete actions

**`PrintApplication.jsx`** — Print preview with two rendering modes:
- **Tractor**: Pixel-perfect PDF overlay using coordinate mapping
- **All Others**: Clean generic HTML table layout with Kannada headers

**`Home.jsx`** — Dashboard showing total/pending counts and recent applications

### API Layer: `services/api.js`
- Axios instance with `baseURL: '/api'` (works with Vite proxy in dev)
- Request interceptor auto-attaches JWT `Authorization` header
- Login uses raw `axios.post('/token')` (proxied separately as form-data)
- Export helpers: `fetchApplications()`, `getApplication()`, `updateApplication()`, etc.

### Proxy Setup: `vite.config.js`
```
/api/*    →  http://127.0.0.1:8000/*  (prefix stripped)
/token    →  http://127.0.0.1:8000/token (direct pass-through)
```

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/token` | No | Login (form-data: username, password) → JWT token |
| `POST` | `/register` | No | Create new user |
| `GET` | `/users/me` | Yes | Get current user info |

### Applications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/applications/stats` | Yes | Dashboard stats (total, pending, recent 5) |
| `POST` | `/applications/` | Yes | Create new application |
| `GET` | `/applications/` | Yes | List all applications (filtered by role) |
| `GET` | `/applications/{id}` | Yes* | Get single application + details + local_index |
| `PUT` | `/applications/{id}` | Yes | Update application |
| `PUT` | `/applications/{id}/status` | Manager | Approve/reject application |
| `DELETE` | `/applications/{id}` | Yes | Delete application (cascades to details) |
| `POST` | `/applications/{id}/generate` | Yes* | Generate Excel/PDF document |

### Documents (Legacy Endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/pdf/download/{id}` | No* | Download PDF (legacy pipeline) |
| `GET` | `/excel/download-excel/{id}` | No* | Download Excel (legacy pipeline) |

> \* Some endpoints may not enforce auth checks — see Known Issues.

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐
│     User     │       │   Application    │
├──────────────┤       ├──────────────────┤
│ id (PK)      │◄──────│ applicant_id (FK)│
│ username     │       │ id (PK)          │
│ hashed_pass  │       │ application_no   │
│ role         │       │ scheme_type      │
│ full_name    │       │ status           │
└──────────────┘       │ created_at       │
                       │ applicant_name_kn│
                       │ father_name_kn   │
                       │ age, gender      │
                       │ mobile_no        │
                       │ aadhaar_no       │
                       │ caste            │
                       │ farmer_type      │
                       │ loan_amount      │
                       │ account_no       │
                       │ ifsc_code        │
                       │ bank_name        │
                       │ branch_name      │
                       │ village, hobli   │
                       │ taluk, district  │
                       │ occupation       │
                       │ annual_income    │
                       │ current_crop     │
                       │ irrigation_source│
                       │ borrower_type    │
                       │ co_applicant_1   │
                       │ dob              │
                       └────────┬─────────┘
                                │ application_id (FK)
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │ TractorDetails │  │ LandDevDetails │  │  SheepDetails  │
  ├────────────────┤  ├────────────────┤  ├────────────────┤
  │ tractor_make   │  │ survey_no      │  │ variant        │
  │ tractor_model  │  │ area_acres     │  │ animal_cost    │
  │ tractor_hp     │  │ assessment     │  │ shed_cost      │
  │ tractor_cost   │  │ land_type      │  │ feed_cost      │
  │ trailer_make   │  │ pre_dev_income │  │ insurance_amt  │
  │ trailer_capacity│ │ post_dev_income│  │ misc_cost      │
  │ trailer_cost   │  │ incr_income    │  │ total_cost     │
  │ implement_cost │  └────────────────┘  └────────────────┘
  │ total_project  │
  │ loan_amount    │  ┌────────────────┐
  │ margin_money   │  │ BullockDetails │
  └────────────────┘  ├────────────────┤
                      │ bullock_cost   │
                      │ cart_cost      │
                      │ total_cost     │
                      │ loan_amount    │
                      │ margin_money   │
                      └────────────────┘
```

---

## Document Generation Pipeline

### Template Files
Located in `backend/assets/templates/`. Each scheme has its own official bank Excel workbook:

| Scheme | Template File |
|--------|--------------|
| TRACTOR | `Vasant Malli.xlsx` |
| LAND_DEV | `Kallangouda_Unicode.xlsx` |
| SHEEP_40 | `Adiveppa Sannakki 3.20.xlsx` |
| SHEEP_20 | `Smt Basavva Shidnal 1.60.xlsx` |
| SHEEP_10 | `Allappa Mahaling Melmatti 0.87.xlsx` |
| BULLOCK | `Mahesh M Pattar.xlsx` |

### Cell Mapping Strategy
Each template has a `PLDMagic` sheet where data is injected. The `LAYOUTS` dictionary in `generator.py` maps field names to `(row, column)` coordinates. Different templates may have slightly different layouts (e.g., the name field is at row 8 for Tractor but row 9 for Land Dev).

### PDF Conversion
Uses Windows COM automation to open the filled Excel file in Microsoft Excel and export it as PDF with A4 paper size and fit-to-width scaling. Falls back to returning the raw Excel file if COM is unavailable.

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `manager123` |
| Field Officer | `officer` | `officer123` |

> Run `python init_db.py` from the `backend/` directory to create these users.

---

## Known Issues

1. **`pywin32` is Windows-only** — PDF generation won't work on Linux/Mac
2. **Database path is relative** — Starting the server from a different directory creates a new empty DB
3. **Print route is unprotected** — `/applications/:id/print` is outside `ProtectedRoute` in `App.jsx`
4. **Login uses raw axios** — `axios.post('/token')` works via Vite proxy but needs a separate proxy rule in production

---

*Built for the Gokak Taluka PCARD Bank, Belagavi District, Karnataka.*
