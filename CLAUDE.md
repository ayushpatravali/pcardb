# PCARDB Loan Automation System - Claude Code Guide

This document provides guidance for using Claude Code effectively with the PCARDB Loan Automation System project.

## Project Overview

PCARDB is a full-stack web application that digitizes the loan application lifecycle for the Gokak Taluka PCARD Bank. It replaces manual paper-based forms with a modern web application that:

- Provides digital form entry with auto-calculated fields
- Supports 6 loan schemes (Tractor, Land Development, Sheep Rearing variants, Bullock & Cart)
- Automatically generates Excel workbooks and PDFs using legacy bank templates
- Provides role-based access (Bank Managers and Field Officers)
- Produces print-ready output matching the bank's existing printed format

## Technology Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, React Hook Form, React Router v6
- **Backend**: FastAPI (Python), SQLModel ORM, SQLite database
- **Authentication**: JWT (python-jose) with Argon2 password hashing
- **Document Generation**: openpyxl (Excel), Win32COM (Excel to PDF conversion)
- **Deployment**: Can run as local intranet server or standalone desktop executable

## Project Structure

```
project/
├── run_app.py                  # One-click launcher (Backend + Frontend + Ngrok)
├── run_backend.bat             # Windows shortcut: start backend only
├── run_frontend.bat            # Windows shortcut: start frontend only
├── install_fonts.bat           # Install Kannada Unicode fonts
├── README.md                   # Main project documentation
│
├── backend/                    # FastAPI backend
│   ├── main.py                 # FastAPI app entry point
│   ├── auth.py                 # JWT logic and password hashing
│   ├── database.py             # SQLite engine and session management
│   ├── models.py               # SQLModel/Pydantic models
│   ├── routers/                # API routers
│   │   ├── applications.py     # Application CRUD endpoints
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── pdf.py              # PDF generation endpoints
│   │   └── excel.py            # Excel download endpoints
│   ├── services/               # Business logic services
│   │   ├── generator.py        # PRIMARY: Excel generation + PDF conversion
│   │   ├── excel_service.py    # Legacy Excel generation
│   │   └── pdf_service.py      # Legacy ReportLab PDF generation
│   ├── utils/                  # Utility functions
│   │   └── nudi_converter.py   # Nudi ↔ Unicode Kannada converter
│   ├── assets/                 # Static assets
│   │   ├── templates/          # Bank Excel templates (one per scheme)
│   │   ├── fonts/              # Kannada Unicode fonts
│   │   └── generated/          # Output folder for generated files
│   └── config/                 # Configuration files
│       └── tractor_coordinates.json  # PDF overlay coordinates for Tractor scheme
│
└── frontend/                   # React frontend
    ├── vite.config.js          # Dev server + proxy config
    ├── package.json
    └── src/
        ├── App.jsx             # Route definitions
        ├── main.jsx            # React entry point
        ├── pages/              # Page components
        │   ├── Login.jsx
        │   ├── SignUp.jsx
        │   ├── Home.jsx
        │   ├── SelectScheme.jsx
        │   ├── NewApplication.jsx  # MAIN FORM (create + edit)
        │   ├── ApplicationsList.jsx
        │   └── PrintApplication.jsx
        ├── components/         # Reusable UI components
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── PDFOverlay/     # Pixel-perfect PDF overlay (Tractor)
        │   └── forms/          # Scheme-specific form sub-components
        ├── services/           # API service layer
        │   └── api.js          # Axios instance and API helpers
        ├── context/            # React context providers
        │   ├── AuthContext.jsx
        │   └── LanguageContext.jsx
        ├── config/             # Configuration files
        │   └── tractor_map.js  # PDF overlay coordinates
        └── utils/              # Utility functions
            └── translations.js # Kannada ↔ English label mappings
```

## Key Features & Implementation Details

### 1. Document Generation System (Critical Component)

The system uses a template-based approach to generate bank-standard documents:

- **Templates**: Each loan scheme has a specific Excel template in `backend/assets/templates/`
- **Generation Process**:
  1. Copy the appropriate template
  2. Fill data using coordinate mapping (`LAYOUTS` dictionary in `generator.py`)
  3. Use `openpyxl` to write data to the `PLDMagic` sheet
  4. Use Win32COM to open Excel, calculate formulas, and export to PDF
  5. Fallback to returning Excel file if PDF conversion fails

**Important Notes**:
- PDF generation requires Windows with Microsoft Excel installed (uses `win32com.client`)
- The printable sheets in legacy Excel files use Nudi 01 e ASCII font
- Dynamic user input (like applicant names) must be entered using Nudi keyboard layout
- Hardcoded values (like scheme names) use predefined Nudi ASCII strings

### 2. Form Handling & Data Flow

**Frontend (NewApplication.jsx)**:
- Uses React Hook Form for state management
- Implements real-time auto-calculations for fields like Total Cost and Margin Money
- Uses individual `watch()` calls for performance
- Handles both Create and Edit modes
- Serializes complex arrays (land_parcels, co_applicants) as JSON strings
- Normalizes crop names for consistent lookups

**Backend (applications.py)**:
- Validates and sanitizes input (mobile/aadhaar length checks)
- Maps form data to SQLModel entities
- Handles relationship between Application and scheme-specific detail tables
- Implements role-based access control (Manager vs Field Officer)
- Provides document generation endpoint (`/applications/{id}/generate`)

### 3. Authentication & Security

- JWT-based authentication with 8-hour expiration (configurable)
- Passwords hashed with Argon2 via passlib
- Role-based access: Managers can approve applications, Officers can only see their own
- Token passed in Authorization header as Bearer token
- Vite proxy configured to forward `/api` requests to backend

## Common Development Tasks

### Starting the Development Environment

**One-command startup** (recommended for development):
```bash
# From project root
python run_app.py
```
This starts:
- Backend at http://localhost:8000
- Frontend at http://localhost:5173
- Ngrok tunnel (if ngrok.exe is present)

**Manual startup**:
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
# Backend setup
cd project/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # Creates default users

# Frontend setup
cd project/frontend
npm install
```

### Default Credentials
- Manager: `manager` / `manager123`
- Field Officer: `officer` / `officer123`

### Running Tests
Currently, the project does not have automated tests. Manual testing involves:
1. Creating applications for each loan scheme
2. Verifying auto-calculations work correctly
3. Testing PDF/Excel generation
4. Verifying role-based access controls
5. Checking data persistence across sessions

### Common Issues & Troubleshooting

1. **PDF Generation Failures**:
   - Requires Windows with Microsoft Excel installed
   - Ensure `pywin32` is installed in the virtual environment
   - Check that Excel templates exist in `backend/assets/templates/`

2. **Database Path Issues**:
   - SQLite database path is relative
   - Always start the backend from the `project/` directory
   - Or set absolute path in `database.py`

3. **Font Display Issues**:
   - Kannada text requires Nudi Unicode fonts
   - Run `install_fonts.bat` to install required fonts
   - For dynamic text, users must input via Nudi keyboard layout

4. **CORS/Proxy Issues**:
   - Frontend uses Vite proxy to forward `/api` to backend:8000
   - In production, ensure proper proxy configuration
   - Backend has permissive CORS settings for development

## Claude Code Usage Guidelines

### When working on this project:

1. **Read the Architecture Documentation First**:
   - Start with `README.md` for overall understanding
   - Refer to `BACKEND_ARCHITECTURE.md` for backend details
   - Refer to `FRONTEND_ARCHITECTURE.md` for frontend details

2. **Focus Areas for Improvement**:
   - Document generation is the most complex part - pay attention to `generator.py`
   - Form validation and serialization in `NewApplication.jsx`
   - Authentication flows in `auth.py` and `AuthContext.jsx`
   - Database relationships in `models.py`

3. **Common Claude Code Commands for This Project**:
   - Use `/read` to examine key files
   - Use `/edit` to modify existing files
   - Use `/write` to create new files (following existing patterns)
   - Use `/bash` to run development commands
   - Use `/agent` for complex multi-file operations

4. **When Modifying Document Generation**:
   - Always test with actual Excel templates
   - Verify coordinate mappings in `LAYOUTS` dictionary
   - Test both Excel and PDF output
   - Remember the Nudi font constraint for PDF output

5. **When Modifying Forms**:
   - Test both create and edit modes
   - Verify auto-calculations work correctly
   - Check JSON stringification for complex fields
   - Validate against backend Pydantic models

6. **When Modifying Backend Endpoints**:
   - Follow existing Pydantic model patterns
   - Maintain role-based access controls
   - Ensure proper error handling and validation
   - Test database relationships and cascades

## Recent Changes (as of 2026-07-18)

See `UPDATES-2026-07-18.md` for recent improvements:
- Fixed Tractor application form behavior in edit mode
- Improved parsing of saved applications with older payload shapes
- Normalized crop-name values for consistent lookups
- Prefilled tractor/trailer/implement loan fields when editing
- Ensured computed loan_amount is set correctly

## Future Work (See FUTURE_ROADMAP.md)

- Ad-hoc form field changes per client request
- Application number auto-generation format changes
- Manual backup feature (download database)
- Automatic scheduled backups
- Production deployment guide (Nginx reverse proxy)

## Best Practices for Claude Code

1. **Maintain Consistency**:
   - Follow existing code styling and patterns
   - Use the same naming conventions
   - Keep component structure consistent

2. **Test Thoroughly**:
   - Document generation is fragile - test all schemes
   - Form validation edge cases (empty values, invalid formats)
   - Role-based access controls
   - PDF/Excel output matches bank templates

3. **Document Changes**:
   - Update relevant markdown files when making significant changes
   - Add comments to complex logic (especially coordinate mappings)
   - Note any environmental dependencies

4. **Respect Constraints**:
   - Remember Windows/Excel dependency for PDF generation
   - Keep security considerations in mind (auth, validation)
   - Maintain backward compatibility where possible
   - Consider the target users (bank staff with varying tech proficiency)

This guide should help you effectively use Claude Code to work with the PCARDB Loan Automation System. When in doubt, refer back to the architecture documentation and existing code patterns.