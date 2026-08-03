"""HTML/CSS -> PDF document generation (replaces the Excel/COM pipeline).

build_context() turns ORM objects into the template context.
render_packet() renders the scheme's full page packet to a PDF.

Error policy: fail loudly. Missing required fields raise MissingFieldsError
(surfaced as HTTP 422 with the field list). There is no fallback output.
"""
import json
import os
import re
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
# Tractor hire-income chain (packet page 14 section 7 -> feeds T5 8.7 as
# "ಅಂಶ 7:ಇ(7)"). Bank set the hourly rate to 400 on 2026-08-03; the workbook's
# stale figures (200/hr, +100960) were acknowledged as mistakes.
HIRE_HOURS = 600
HIRE_RATE = 400
HIRE_MAINTENANCE_COST = 20000
HIRE_OWN_USE_COST = 20000
HIRE_INCOME_GROSS = HIRE_HOURS * HIRE_RATE                    # col 3 = 1 x 2
HIRE_INCOME_TOTAL = HIRE_INCOME_GROSS - HIRE_MAINTENANCE_COST  # col 5 = 3 - 4
HIRE_INCOME_NET = HIRE_INCOME_TOTAL - HIRE_OWN_USE_COST        # col 7 = 5 - 6
DEFAULT_LOAN_DURATION_YEARS = 7
DEFAULT_REGION_KN = "ಗೋಕಾಕ"

# Kannada display strings for form-collected English enum-ish values.
FARMER_TYPE_KN = {
    "Small": "ಸಣ್ಣ ರೈತರು",
    "Marginal": "ಅತಿ ಸಣ್ಣ ರೈತರು",
    "Big": "ದೊಡ್ಡ ರೈತರು",
}
# Rows saved before 2026-08-03 stored crop values in English; newer rows store
# the Kannada CROP INCOME CHART names directly (pass through unchanged).
CROP_KN = {
    "Sugarcane": "ಕಬ್ಬು", "Rice": "ಭತ್ತ", "Jowar": "ಹೈಬ್ರಿಡ್ ಜೋಳ",
    "Maize": "ಮುಸುಕಿನಜೋಳ", "Wheat": "ಗೋಧಿ", "Cotton": "ಹೈಬ್ರಿಡ್ ಹತ್ತಿ",
    "Groundnut": "ಸೇಂಗಾ", "Sunflower": "ಸೂರ್ಯಕಾಂತಿ", "Soybean": "ಸೋಯಾಬೀನ್",
    "Tomato": "ಟೊಮ್ಯಾಟೋ", "Onion": "ಈರುಳ್ಳಿ", "Chilli": "ಮೆಣಸಿನಕಾಯಿ",
    "Banana": "ಬಾಳೆ", "Grapes": "ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)", "Other": "ಇತರೆ",
}

_PAREN_RE = re.compile(r"\s*\(([^)]*)\)")


def _has_kannada(text):
    return any("ಀ" <= ch <= "೿" for ch in text or "")


def kn_display(value):
    """Strip the English halves of the form's bilingual option strings.
    'General / ಸಾಮಾನ್ಯ' -> 'ಸಾಮಾನ್ಯ'; 'ಕಾಲುವೆ (Canal)' -> 'ಕಾಲುವೆ';
    '(5 HP)' style parentheticals are kept (HP is wanted on the print)."""
    if not value:
        return value
    value = CROP_KN.get(str(value).strip(), str(value))
    if " / " in value:
        parts = [p.strip() for p in value.split(" / ")]
        kn = [p for p in parts if _has_kannada(p)]
        if kn:
            value = " / ".join(kn)

    def _paren(m):
        inner = m.group(1).strip()
        if _has_kannada(inner) or re.search(r"\d|HP|ಎಚ್", inner, re.IGNORECASE):
            return m.group(0)
        return ""  # English-only parenthetical: drop it

    return _PAREN_RE.sub(_paren, value).strip()


def extent_str(acres, guntas):
    """Bank notation: 8 acres 19 guntas prints as '8.19' (not decimal acres)."""
    a = _to_float(acres)
    g = int(_to_float(guntas))
    if g:
        return f"{int(a)}.{g:02d}"
    return f"{a:.2f}" if a else ""


def _farmer_type_kn(value):
    """Form stores 'ಸಣ್ಣ ರೈತ (Small)' etc. — map the English token to the
    packet's canonical wording, else strip the English half."""
    if not value:
        return ""
    m = _PAREN_RE.search(value)
    token = m.group(1).strip() if m else value.strip()
    return FARMER_TYPE_KN.get(token) or FARMER_TYPE_KN.get(value) or kn_display(value)


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
    """Amounts print with Indian digit grouping (1130000 -> '11,30,000');
    operator-typed commas in the stored value are cleaned first (bank
    instruction 2026-08). Whole floats drop the decimals."""
    if value is None or value == "":
        return ""
    if isinstance(value, str):
        value = value.replace(",", "").strip()
    try:
        f = float(value)
    except (TypeError, ValueError):
        return str(value)
    return indian_format(int(f) if f == int(f) else f)


# Numeric fields inside the JSON-string columns. The React form submits these
# as strings ("4.20", ""); templates do arithmetic on them, so coerce to float.
_NUMERIC_JSON_FIELDS = {"acres", "guntas", "akaar", "annual_income", "sl", "valuation"}


def _to_float(value):
    """Coerce to float; tolerates operator-typed commas ('1,00,000')."""
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
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

    # Display normalization: Kannada-only values, and acre.gunta extent
    # notation (8 acres 19 guntas -> "8.19") for every parcel/crop row.
    for p in parsed["land_parcels"]:
        if isinstance(p, dict):
            p["extent"] = extent_str(p.get("acres"), p.get("guntas"))
    for c in parsed["crops"]:
        if isinstance(c, dict):
            c["crop_name"] = kn_display(c.get("crop_name"))
            c["extent"] = extent_str(c.get("acres"), c.get("guntas"))
    for co in parsed["co_applicants"]:
        if isinstance(co, dict) and co.get("relation"):
            co["relation"] = kn_display(co["relation"])

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

    # Financial-viability chain (page 10 section 12) — formulas lifted from the
    # bank's Tractor workbook, sheets B4/T5 (see docs/formula_map_pages_9_10.md):
    #   loan eligibility   = 80% of security (land valuation total)  [B4!E14]
    #   net loan elig.     = that − old-loan outstanding             [B4!F18]
    #   incremental income = 30% of annual income                    [T5!I3]
    #   repayment elig.    = 75% of incremental income               [B4!J20]
    #   net repayment      = that − old-loan annual installment      [B4!J24]
    prev_outstanding = _to_float(previous_loans.get("outstanding"))
    prev_installment = _to_float(previous_loans.get("annual_installment"))
    inc = float(annual_income or 0)
    incremental_income = round(inc * 0.30) if inc else None
    loan_eligibility = round(valuation_total * 0.80) if valuation_total else None
    net_loan_eligibility = (
        round(loan_eligibility - prev_outstanding) if loan_eligibility else None
    )
    repayment_eligibility = round(incremental_income * 0.75) if incremental_income else None
    net_repayment_eligibility = (
        round(repayment_eligibility - prev_installment) if repayment_eligibility else None
    )
    # T5 8.7 total = 75% of incremental income + net hire income (T4 col 7);
    # also prints as "expected income from the scheme" at page 6 item 13.
    repayment_capacity = (
        repayment_eligibility + HIRE_INCOME_NET if repayment_eligibility else None
    )

    computed = {
        "application_date": _fmt_date(app.application_date or app.created_at),
        "region_kn": region_kn,
        "incremental_income": incremental_income,
        "post_dev_income": round(inc + inc * 0.30) if inc else None,
        "loan_eligibility": loan_eligibility,
        "net_loan_eligibility": net_loan_eligibility,
        "repayment_eligibility": repayment_eligibility,
        "net_repayment_eligibility": net_repayment_eligibility,
        "repayment_capacity": repayment_capacity,
        "hire_income": HIRE_INCOME_NET,
        "hire_rate": HIRE_RATE,
        "hire_hours": HIRE_HOURS,
        "hire_income_gross": HIRE_INCOME_GROSS,
        "hire_maintenance_cost": HIRE_MAINTENANCE_COST,
        "hire_income_total": HIRE_INCOME_TOTAL,
        "hire_own_use_cost": HIRE_OWN_USE_COST,
        "prev_outstanding": prev_outstanding or None,
        "installment_kantu": None,  # set below when scheme details carry the loan total
        "insurance_amount": INSURANCE_AMOUNT,
        "loan_duration_years": int(app.loan_duration_years or DEFAULT_LOAN_DURATION_YEARS),
        "dob": _fmt_date(app.dob),
        "farmer_type_kn": _farmer_type_kn(app.farmer_type),
        "borrower_type_kn": borrower_type_kn(app.borrower_type),
        "caste_kn": kn_display(app.caste),
        "irrigation_kn": kn_display(app.irrigation_source),
        "total_extent": extent_str(app.total_area_acres, app.total_guntas),
        "annual_income": annual_income,
        "total_akaar": round(total_akaar, 2) if total_akaar else None,
        "land_valuation_total": round(valuation_total) if valuation_total else None,
        "loan_amount_words": amount_in_words_kn(app.loan_amount),
    }

    # Scheme-specific document figures derived from stored values.
    if details is not None and app.scheme_type == SchemeType.TRACTOR:
        computed["total_project_cost"] = details.total_quotation
        computed["margin_money"] = details.total_down_payment
        # Page 10 ಏ) prints the PER-INSTALLMENT amount: installments are
        # half-yearly, so N years = 2N kantu -> total loan / (years * 2).
        # (t5's 8.9 stays annual — its label says ವಾರ್ಷಿಕ.)
        if details.total_loan_amount:
            computed["installment_kantu"] = round(
                details.total_loan_amount / (computed["loan_duration_years"] * 2)
            )

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
