"""HTML/CSS -> PDF document generation (replaces the Excel/COM pipeline).

build_context() turns ORM objects into the template context.
render_packet() renders the scheme's full page packet to a PDF.

Error policy: fail loudly. Missing required fields raise MissingFieldsError
(surfaced as HTTP 422 with the field list). There is no fallback output.
"""
import json
import os
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from models import Application, SchemeType
from schemas import SCHEMES
from schemas.common_fields import BANK
from utils.kannada_numbers import amount_in_words_kn, indian_format

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
TEMPLATE_DIR = BASE_DIR / "templates"
FONT_DIR = Path(os.environ.get("FONT_DIR", BASE_DIR / "assets" / "fonts"))
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", BASE_DIR / "assets" / "generated"))

# Fixed insurance component added on top of the final loan amount wherever it
# prints (bank instruction 2026-08: show "+ 1 lakh", never the word insurance).
INSURANCE_AMOUNT = 100000
DEFAULT_LOAN_DURATION_YEARS = 7
DEFAULT_REGION_KN = "ಗೋಕಾಕ"

# Kannada display strings for form-collected English enum-ish values.
FARMER_TYPE_KN = {
    "Small": "ಸಣ್ಣ ರೈತರು",
    "Marginal": "ಅತಿ ಸಣ್ಣ ರೈತರು",
    "Big": "ದೊಡ್ಡ ರೈತರು",
}
def borrower_type_kn(value):
    """Form stores 'New / ಹೊಸ' or 'Old / ಹಿಂದಿನ' — match by substring."""
    if not value:
        return ""
    if "Old" in value:
        return "ಹಳೇ ಸಾಲಗಾರರು"
    if "New" in value:
        return "ಹೊಸ ಸಾಲಗಾರರು"
    return value


class MissingFieldsError(Exception):
    def __init__(self, fields):
        self.fields = list(fields)
        super().__init__(f"Missing required fields: {', '.join(self.fields)}")


def plain_number(value):
    """Whole floats print without decimals: 1130000.0 -> '1130000'.
    The legacy forms print raw digits, no thousands separators."""
    if value is None or value == "":
        return ""
    try:
        f = float(value)
    except (TypeError, ValueError):
        return str(value)
    return str(int(f)) if f == int(f) else f"{f:g}"


# Numeric fields inside the JSON-string columns. The React form submits these
# as strings ("4.20", ""); templates do arithmetic on them, so coerce to float.
_NUMERIC_JSON_FIELDS = {"acres", "guntas", "akaar", "annual_income", "sl", "valuation"}


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _parse_json_list(raw):
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return []
    if not isinstance(data, list):
        return []
    for item in data:
        if isinstance(item, dict):
            for key in _NUMERIC_JSON_FIELDS & item.keys():
                item[key] = _to_float(item[key])
    return data


def _fmt_date(value):
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    return value.strftime("%d/%m/%Y")


def build_context(app: Application, details, spec) -> dict:
    _PREV_LOAN_KEYS = (
        "purpose", "total_loan", "outstanding", "annual_installment",
        "repaid_status", "utility_report_pages", "loan_account_pages", "mortgage_book_pages",
    )
    try:
        prev_raw = json.loads(app.previous_loans) if app.previous_loans else {}
        if not isinstance(prev_raw, dict):
            prev_raw = {}
    except (ValueError, TypeError):
        prev_raw = {}
    previous_loans = {k: prev_raw.get(k) or "" for k in _PREV_LOAN_KEYS}

    parsed = {
        "co_applicants": _parse_json_list(app.co_applicants),
        "land_parcels": _parse_json_list(app.land_parcels),
        "crops": _parse_json_list(app.current_crop),
        "previous_loans": previous_loans,
    }

    # Land valuation (TRACTOR): parcel value = per-acre rate x extent. The form
    # stores it per parcel; recompute here so API-created rows behave the same.
    rate = app.land_valuation_per_acre or 0
    valuation_total = 0.0
    for p in parsed["land_parcels"]:
        if not isinstance(p, dict):
            continue
        if not p.get("valuation") and rate:
            extent = float(p.get("acres") or 0) + float(p.get("guntas") or 0) / 40
            p["valuation"] = round(rate * extent) if extent else None
        p.setdefault("valuation", None)  # key must exist: templates use StrictUndefined
        valuation_total += float(p.get("valuation") or 0)

    total_akaar = sum(
        float(p.get("akaar") or 0) for p in parsed["land_parcels"] if isinstance(p, dict)
    )
    annual_income = app.annual_income
    if annual_income is None and parsed["crops"]:
        annual_income = sum(
            float(c.get("annual_income") or 0) for c in parsed["crops"] if isinstance(c, dict)
        )

    # Operator's zone for the ವಲಯ line — from the user who owns the application.
    # getattr chain keeps detached fixtures (no applicant) working.
    applicant = getattr(app, "applicant", None)
    region_kn = (getattr(applicant, "region", None) or "").strip() or DEFAULT_REGION_KN

    computed = {
        "application_date": _fmt_date(app.application_date or app.created_at),
        "region_kn": region_kn,
        "insurance_amount": INSURANCE_AMOUNT,
        "loan_duration_years": int(app.loan_duration_years or DEFAULT_LOAN_DURATION_YEARS),
        "dob": _fmt_date(app.dob),
        "farmer_type_kn": FARMER_TYPE_KN.get(app.farmer_type, app.farmer_type or ""),
        "borrower_type_kn": borrower_type_kn(app.borrower_type),
        "annual_income": annual_income,
        "total_akaar": round(total_akaar, 2) if total_akaar else None,
        "land_valuation_total": round(valuation_total) if valuation_total else None,
        "loan_amount_words": amount_in_words_kn(app.loan_amount),
    }

    # Scheme-specific document figures derived from stored values.
    if details is not None and app.scheme_type == SchemeType.TRACTOR:
        computed["total_project_cost"] = details.total_quotation
        computed["margin_money"] = details.total_down_payment

    context = {
        "bank": BANK,
        "app": app,
        "details": details,
        "parsed": parsed,
        "computed": computed,
        "scheme": {
            "name_kn": spec["scheme_name_kn"],
            "code": spec.get("scheme_code", ""),
        },
        "pages": [{"name": name, "size": size} for name, size in spec["pages"]],
        "font_dir": str(FONT_DIR),
    }

    _check_required(spec, context)
    return context


def _resolve(context, source):
    obj = context
    for part in source.split("."):
        if isinstance(obj, dict):
            obj = obj.get(part)
        else:
            obj = getattr(obj, part, None)
        if obj is None:
            return None
    return obj


def _check_required(spec, context):
    missing = []
    for field in spec["fields"]:
        if field["tier"] in ("constant", "handwritten"):
            continue
        if not field.get("required", True):
            continue
        value = _resolve(context, field["source"])
        if value is None or value == "" or value == []:
            missing.append(field["key"])
    if missing:
        raise MissingFieldsError(missing)


def _jinja_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        undefined=StrictUndefined,  # unknown variables fail loudly
    )
    env.filters["inr"] = indian_format
    env.filters["num"] = plain_number
    env.filters["kn_words"] = amount_in_words_kn
    env.filters["dmy"] = _fmt_date
    return env


def render_html_to_pdf(html: str, out_path: Path) -> Path:
    """Single renderer touchpoint (swap point for a Chromium fallback)."""
    from weasyprint import HTML  # lazy: API can boot without pango installed

    HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf(str(out_path))
    return out_path


def render_packet(app: Application, details) -> Path:
    scheme = SchemeType(app.scheme_type)
    spec = SCHEMES.get(scheme)
    if spec is None:
        raise MissingFieldsError([f"scheme template not built yet: {scheme.value}"])

    context = build_context(app, details, spec)
    html = _jinja_env().get_template("packet.html").render(**context)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_no = (app.application_no or str(app.id) or "draft").replace("/", "-")
    out_path = OUTPUT_DIR / f"{scheme.value}_{safe_no}_{stamp}.pdf"
    return render_html_to_pdf(html, out_path)
