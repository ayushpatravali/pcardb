"""Render a scheme's packet with fixture data (Tractor's Vasant Malli by
default, or Land Dev's Kallangouda fixture with --scheme LAND_DEV).

Usage (from backend/):
  DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib python tools/render_test.py [--scheme LAND_DEV] [--pages a2,a3]

With --pages, renders only those page templates (quick single-page iteration).
Prints the output path and page count.
"""
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import Application, TractorDetails, LandDevDetails, SchemeType  # noqa: E402

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


FIXTURE_LAND_DEV_APP = Application(
    id=2,
    application_no="LD-1/2025-26",
    created_at=datetime(2025, 9, 1),
    scheme_type=SchemeType.LAND_DEV,
    applicant_name_kn="ಶ್ರೀ ಪರೀಕ್ಷಾ ಅಭಿವೃದ್ಧಿ ಪಾಟೀಲ",
    father_name_kn="ಪರೀಕ್ಷಾ",
    age=45,
    gender="Male",
    mobile_no="9008001035",
    aadhaar_no="123456789012",
    caste="ಹಿಂದೂ ರೆಡ್ಡಿ",
    farmer_type="Big",
    borrower_type="New",
    account_no="12345",
    ifsc_code="KSCB0000001",
    bank_name="PCARD Bank",
    branch_name="ಗೋಕಾಕ",
    village="ಗೋಕಾಕ",
    hobli="ಗೋಕಾಕ",
    taluk="ಗೋಕಾಕ",
    district="ಬೆಳಗಾವಿ",
    co_applicants="[]",
    land_parcels=json.dumps(
        [{"sl": 1, "village": "ಗೋಕಾಕ", "survey_no": "2419/1", "acres": 24, "guntas": 20, "akaar": 0}]
    ),
    current_crop="[]",
    irrigation_source="ಕೊಳವೆ ಬಾವಿ",
    total_area_acres=24,
    total_guntas=20,
    land_valuation_per_acre=560000,
    loan_amount=1500000,
    loan_duration_years=7,
)

FIXTURE_LAND_DEV_DETAILS = LandDevDetails(
    application_id=2,
    land_type="ತರಿ",
    pre_dev_crops=json.dumps(
        [
            {
                "crop_name": "ಹೈಬ್ರಿಡ್ ಹತ್ತಿ", "season": "ಮುಂ/ಹಿಂ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
                "cost_per_acre": 27500, "total_cost": 665500, "yield_per_acre": 6.5, "total_yield": 157,
                "rate": 7600, "total_income": 1193200, "other_cost": 665500, "annual_income": 527700,
            },
            {
                "crop_name": "ಸೂರ್ಯಕಾಂತಿ", "season": "ಮುಂ/ಹಿಂ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
                "cost_per_acre": 16700, "total_cost": 404140, "yield_per_acre": 7, "total_yield": 169,
                "rate": 4500, "total_income": 760500, "other_cost": 404140, "annual_income": 356360,
            },
        ]
    ),
    post_dev_crops=json.dumps(
        [
            {
                "crop_name": "ಕಬ್ಬು", "season": "ವಾ", "irrigated": "ನೀ", "acres": 24, "guntas": 20,
                "cost_per_acre": 54500, "total_cost": 1318900, "yield_per_acre": 500, "total_yield": 12100,
                "rate": 275, "total_income": 3327500, "other_cost": 1318900, "annual_income": 2008600,
            }
        ]
    ),
    dev_work_items=json.dumps(
        [
            {"description": "ಗಿಡಗಂಟೆ, ಕಲ್ಲು ಕಂಟಿಗಳನ್ನು ತೆಗೆದು ಜಮೀನು ಸ್ವಚ್ಛಗೊಳಿಸುವುದು ಮತ್ತು ಕೊರಕಲುಗಳನ್ನು ತುಂಬುವುದು", "rate_per_acre": 5336, "amount": 130732},
            {"description": "ಜಮೀನಿನ ವಿಂಗಡಣೆ, ಸಮತಳ ಮತ್ತು ಮಟ್ಟಿಗೊಳಿಸುವುದು", "rate_per_acre": 61714, "amount": 1511993},
            {"description": "ಮೇರೆ / ಅಂಚುಗಳಿಗೆ ಒಡ್ಡುಗಳನ್ನು ಹಾಕುವುದು", "rate_per_acre": 7807, "amount": 191272},
            {"description": "ಹೆಚ್ಚಿನ ನೀರು ಹೊರಹೋಗಲು ಒಳಗಟ್ಟಿ ನಿರ್ಮಿಸುವುದು", "rate_per_acre": 0, "amount": 0},
            {"description": "ಫಲವತ್ತಾದ ಕೆರೆ ಮಣ್ಣು ಮತ್ತು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಹರಡುವುದು", "rate_per_acre": 3429, "amount": 84011},
            {"description": "ಕಾಣಬರದ ಇತರ ಕಾರ್ಯಗಳು", "rate_per_acre": 1714, "amount": 41993},
        ]
    ),
)


def main():
    from services.render_service import SCHEMES, build_context, _jinja_env, render_html_to_pdf, OUTPUT_DIR

    args = sys.argv[1:]
    only = None
    if "--pages" in args:
        only = set(args[args.index("--pages") + 1].split(","))
    scheme_name = "TRACTOR"
    if "--scheme" in args:
        scheme_name = args[args.index("--scheme") + 1]
    scheme_type = SchemeType[scheme_name]

    spec = SCHEMES[scheme_type]
    if scheme_type == SchemeType.LAND_DEV:
        context = build_context(FIXTURE_LAND_DEV_APP, FIXTURE_LAND_DEV_DETAILS, spec)
    else:
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
