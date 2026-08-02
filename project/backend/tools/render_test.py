"""Render the Tractor packet with the Vasant Malli fixture data.

Usage (from backend/):
  DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib python tools/render_test.py [--pages a2,a3]

With --pages, renders only those page templates (quick single-page iteration).
Prints the output path and page count.
"""
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import Application, TractorDetails, SchemeType  # noqa: E402

FIXTURE_APP = Application(
    id=1,
    application_no="1/2025-26",
    created_at=datetime(2025, 9, 19),
    applicant_name_kn="ಶ್ರೀ ವಸಂತ ಹಣಮಂತ ಮಳ್ಳಿ",
    father_name_kn="ಹಣಮಂತ",
    age=45,
    gender="Male",
    mobile_no="9008001035",
    aadhaar_no="123456789012",
    caste="ಹಿಂದೂ ಲಿಂಗಾಯತ",
    farmer_type="Big",
    borrower_type="New",
    account_no="12345",
    ifsc_code="KSCB0000001",
    bank_name="PCARD Bank",
    branch_name="ಮೂಡಲಗಿ",
    village="ಗುಲಗೊಂಜಿಕೊಪ್ಪ",
    hobli="ಗುಲಗೊಂಜಿಕೊಪ್ಪ",
    taluk="ಮೂಡಲಗಿ",
    district="ಬೆಳಗಾವಿ",
    loan_amount=1130000,
    scheme_type=SchemeType.TRACTOR,
    co_applicants="[]",
    land_parcels=(
        '[{"sl":1,"village":"ಗುಲಗೊಂಜಿಕೊಪ್ಪ","survey_no":"79","acres":4.20,"guntas":0,"akaar":8.75},'
        '{"sl":2,"village":"ಗುಲಗೊಂಜಿಕೊಪ್ಪ","survey_no":"1137/5","acres":1.21,"guntas":0,"akaar":0.31},'
        '{"sl":3,"village":"ಹನಮನೇರಿ (ಇ)","survey_no":"59/4","acres":2.21,"guntas":0,"akaar":4.22}]'
    ),
    current_crop='[{"crop_name":"ಕಬ್ಬು","acres":8.22,"guntas":0,"annual_income":709650}]',
    irrigation_source="ಕೊಳವೆ ಬಾವಿ",
    total_area_acres=8.22,
    total_guntas=0,
    land_valuation_per_acre=750000,
)

FIXTURE_DETAILS = TractorDetails(
    application_id=1,
    tractor_make="ಜಾನ್ ಡಿಯರ್",
    tractor_model="5210",
    tractor_hp="ಎಚ್‌ಪಿ 50",
    tractor_dealer="ಅನ್ನಪೂರ್ಣ ಮೋಟರ್ಸ",
    tractor_quotation=1002384,
    tractor_down_payment=52384,
    tractor_bank_loan=950000,
    trailer_make="ಮೆಹರಿನ್ ಟ್ರೇಲರ್ಸ ಬೆಳಗಾವಿ",
    trailer_capacity="3 ಟನ್",
    trailer_dealer="ಮೆಹರಿನ್ ಟ್ರೇಲರ್ಸ ಬೆಳಗಾವಿ",
    trailer_quotation=240000,
    trailer_down_payment=70000,
    trailer_bank_loan=170000,
    total_quotation=1242384,
    total_down_payment=122384,
    total_loan_amount=1120000,
)


def main():
    from services.render_service import SCHEMES, build_context, _jinja_env, render_html_to_pdf, OUTPUT_DIR

    only = None
    if len(sys.argv) > 2 and sys.argv[1] == "--pages":
        only = set(sys.argv[2].split(","))

    spec = SCHEMES[SchemeType.TRACTOR]
    context = build_context(FIXTURE_APP, FIXTURE_DETAILS, spec)
    if only:
        context["pages"] = [p for p in context["pages"] if p["name"] in only]

    html = _jinja_env().get_template("packet.html").render(**context)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    suffix = "_".join(sorted(only)).replace("/", "-") if only else "full"
    out = OUTPUT_DIR / f"render_test_{suffix}.pdf"
    render_html_to_pdf(html, out)

    from pypdf import PdfReader

    n = len(PdfReader(str(out)).pages)
    expected = len(context["pages"])
    print(f"rendered: {out}")
    print(f"pages: {n} (expected {expected}) {'OK' if n == expected else 'OVERFLOW!'}")
    return 0 if n == expected else 1


if __name__ == "__main__":
    sys.exit(main())
