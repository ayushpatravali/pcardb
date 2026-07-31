# PCARDB Loan Automation - Backend Architecture

## 1. Tech Stack Overview
- **Framework:** FastAPI (High performance, async, automatic Swagger docs)
- **Database ORM:** SQLModel (Built on SQLAlchemy and Pydantic)
- **Database Engine:** SQLite (currently `database.db`)
- **PDF Engine:** Python `win32com.client` (Requires a Windows host with Microsoft Excel installed)

## 2. Directory Structure
```text
backend/
├── main.py                 # FastAPI application entry point & exception handlers
├── database.py             # SQLite connection and session dependency
├── models.py               # SQLModel definitions (Database schema)
├── schemas.py              # Pydantic models for API request/response validation
├── routers/
│   ├── applications.py     # CRUD API endpoints for loan applications
│   └── pdf.py              # Endpoints triggering PDF generation
└── services/
    └── pdf_service.py      # The core win32com Excel automation logic
```

## 3. Data Flow & Validation
1. **Request:** The frontend sends a POST request to `/applications/`.
2. **Validation:** FastAPI uses `ApplicationCreate` (Pydantic schema). If the payload fails validation (e.g., missing required fields, wrong data types), FastAPI intercepts it.
   - *Note:* We implemented a custom `RequestValidationError` handler in `main.py` that catches these 422 errors, formats them, and safely avoids Unicode crashes when printing Kannada payloads to the Windows console.
3. **Storage:** The data is committed to the SQLite `Application` table. Complex nested arrays (like `land_parcels` or `co_applicants`) are stored as stringified JSON in text columns.

## 4. The PDF Generation Engine (`pdf_service.py`)

This is the most complex and critical part of the backend.

### How it works:
Because the bank requires PDFs that are *visually identical* to their legacy Excel forms, we do not use standard PDF libraries (like ReportLab). Instead, we use COM automation to physically open Excel in the background.

1. **Routing:** `generate_application_pdf()` accepts `app_data`. It checks `app_data['scheme_type']` and dynamically selects the correct legacy `.xlsx` template (e.g., `LEGACY_TRACTOR`, `LEGACY_SHEEP_1_60`).
2. **Mapping:** The script contains a strict `mapped_data` dictionary for each scheme. It maps database fields directly to exact Excel cells (e.g., `"C8": app_data.get("applicant_name_kn")`).
3. **Injection:** `openpyxl` is used to load a temporary copy of the `.xlsx` file, locate the `PLDMagic` data-entry sheet, inject the mapped data, and save the temp file.
4. **COM Automation:** 
   - `pythoncom.CoInitialize()` is called (mandatory for multithreaded FastAPI COM interactions).
   - `win32com.client.Dispatch("Excel.Application")` opens Excel invisibly.
   - The temp file is opened, and `CalculateFull()` is triggered so all Excel formulas pull the injected data from `PLDMagic` into the printable sheets (`A1`, `A2`, `T1`, etc.).
   - The specific printable sheets are exported via `ExportAsFixedFormat(0)` to a `.pdf` file.
   - Excel processes are strictly cleaned up (Quit/del) to prevent zombie `EXCEL.EXE` processes from leaking RAM.

### The Legacy Nudi Font Constraint
The printable sheets in the legacy Excel files are strictly formatted with the **Nudi 01 e** ASCII font. 
- **What this means:** Standard Unicode Kannada (or English text) injected into the Excel file will render as gibberish (e.g., `mÁæöåPÀÖgÀ`) on the final PDF. 
- **The Workaround:** For hardcoded values (like Scheme Names), `pdf_service.py` directly injects the specific Nudi ASCII strings (e.g., `"mÁæöåPÀÖgÀ mÉæÃ®gÀ AiÉÆÃd£É"` for Tractor). For dynamic user inputs (like Applicant Name), the frontend operator *must* type using a Nudi keyboard layout so the backend receives and injects the raw ASCII string.
