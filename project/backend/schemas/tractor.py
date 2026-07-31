"""TRACTOR scheme spec — pilot.

Page inventory follows the Vasant Malli reference
(legacy_assets/pdfss/Vasant Malli Tractor Scheme.pdf, 21 pages) and the
sheet taxonomy of Vasant Malli.xlsx.
"""
from schemas.common_fields import (
    ADDRESS_FIELDS,
    AGRICULTURE_FIELDS,
    APPLICANT_FIELDS,
    BANK_ACCOUNT_FIELDS,
    LAND_FIELDS,
    LOAN_FIELDS,
)

SCHEME_NAME_KN = "ಟ್ರ್ಯಾಕ್ಟರ ಟ್ರೇಲರ ಯೋಜನೆ"
SCHEME_CODE = "5210"

DETAIL_FIELDS = [
    {"key": "tractor_make", "label_kn": "ಟ್ರ್ಯಾಕ್ಟರ್ ತಯಾರಿಕೆ", "label_en": "Tractor Make", "tier": "collected", "source": "details.tractor_make"},
    {"key": "tractor_model", "label_kn": "ಮಾದರಿ", "label_en": "Model", "tier": "collected", "source": "details.tractor_model", "required": False},
    {"key": "tractor_hp", "label_kn": "ಅಶ್ವ ಶಕ್ತಿ (ಎಚ್‌ಪಿ)", "label_en": "HP", "tier": "collected", "source": "details.tractor_hp"},
    {"key": "tractor_dealer", "label_kn": "ವಿತರಕರು", "label_en": "Tractor Dealer", "tier": "collected", "source": "details.tractor_dealer", "required": False},
    {"key": "tractor_quotation", "label_kn": "ಟ್ರ್ಯಾಕ್ಟರ್ ವೆಚ್ಚ", "label_en": "Tractor Quotation", "tier": "collected", "source": "details.tractor_quotation"},
    {"key": "tractor_down_payment", "label_kn": "ಸ್ವಂತ ಕೊಡುಗೆ (ಟ್ರ್ಯಾಕ್ಟರ್)", "label_en": "Tractor Down Payment", "tier": "collected", "source": "details.tractor_down_payment", "required": False},
    {"key": "tractor_bank_loan", "label_kn": "ಬ್ಯಾಂಕ ಸಾಲ (ಟ್ರ್ಯಾಕ್ಟರ್)", "label_en": "Tractor Bank Loan", "tier": "collected", "source": "details.tractor_bank_loan", "required": False},
    {"key": "trailer_make", "label_kn": "ಟ್ರೈಲರ್ ತಯಾರಿಕೆ", "label_en": "Trailer Make", "tier": "collected", "source": "details.trailer_make", "required": False},
    {"key": "trailer_capacity", "label_kn": "ಸಾಮರ್ಥ್ಯ (ಟನ್)", "label_en": "Trailer Capacity", "tier": "collected", "source": "details.trailer_capacity", "required": False},
    {"key": "trailer_dealer", "label_kn": "ಟ್ರೈಲರ್ ವಿತರಕರು", "label_en": "Trailer Dealer", "tier": "collected", "source": "details.trailer_dealer", "required": False},
    {"key": "trailer_quotation", "label_kn": "ಟ್ರೈಲರ್ ವೆಚ್ಚ", "label_en": "Trailer Quotation", "tier": "collected", "source": "details.trailer_quotation", "required": False},
    {"key": "trailer_down_payment", "label_kn": "ಸ್ವಂತ ಕೊಡುಗೆ (ಟ್ರೈಲರ್)", "label_en": "Trailer Down Payment", "tier": "collected", "source": "details.trailer_down_payment", "required": False},
    {"key": "trailer_bank_loan", "label_kn": "ಬ್ಯಾಂಕ ಸಾಲ (ಟ್ರೈಲರ್)", "label_en": "Trailer Bank Loan", "tier": "collected", "source": "details.trailer_bank_loan", "required": False},
    {"key": "implement_dealer", "label_kn": "ಸಲಕರಣೆ ವಿತರಕರು", "label_en": "Implement Dealer", "tier": "collected", "source": "details.implement_dealer", "required": False},
    {"key": "implement_quotation", "label_kn": "ಸಲಕರಣೆ ವೆಚ್ಚ", "label_en": "Implement Quotation", "tier": "collected", "source": "details.implement_quotation", "required": False},
    {"key": "implement_down_payment", "label_kn": "ಸ್ವಂತ ಕೊಡುಗೆ (ಸಲಕರಣೆ)", "label_en": "Implement Down Payment", "tier": "collected", "source": "details.implement_down_payment", "required": False},
    {"key": "implement_bank_loan", "label_kn": "ಬ್ಯಾಂಕ ಸಾಲ (ಸಲಕರಣೆ)", "label_en": "Implement Bank Loan", "tier": "collected", "source": "details.implement_bank_loan", "required": False},
    {"key": "total_quotation", "label_kn": "ಒಟ್ಟು ವೆಚ್ಚ", "label_en": "Total Quotation", "tier": "collected", "source": "details.total_quotation"},
    {"key": "total_down_payment", "label_kn": "ಸ್ವಂತ ಕೊಡುಗೆ", "label_en": "Total Down Payment", "tier": "collected", "source": "details.total_down_payment"},
    {"key": "total_loan_amount", "label_kn": "ಸಾಲದ ಮೊತ್ತ", "label_en": "Total Loan", "tier": "collected", "source": "details.total_loan_amount"},
    # Document-only figures derived from the above (legacy columns dropped):
    {"key": "total_project_cost", "label_kn": "ಯೋಜನಾ ವೆಚ್ಚ", "label_en": "Project Cost", "tier": "computed", "source": "computed.total_project_cost"},
    {"key": "margin_money", "label_kn": "ಸ್ವಂತ ಕೊಡುಗೆ (ಮಾರ್ಜಿನ್)", "label_en": "Margin Money", "tier": "computed", "source": "computed.margin_money"},
]

# Print order of the 21-page packet (template name, page size).
# Derived from the Vasant Malli reference PDF; every entry maps to
# templates/pages/<name>.html or templates/pages/tractor/<name>.html.
PAGES = [
    ("a1", "A4"), ("a2", "A4"), ("a3", "A4"), ("a4", "A4"),
    ("ssm", "A4"), ("ssm2", "A4"),
    ("b1", "A4"), ("b2", "A4"), ("b3", "A4"), ("b4", "A4"),
    ("tractor/t1", "A4"), ("tractor/t2", "A4"), ("tractor/t3", "A4"),
    ("tractor/t4", "A4"), ("tractor/t5", "A4"), ("tractor/t6", "A4"),
    ("tractor/t7", "A4"),
    ("valuation", "A4"),
    ("inspection", "A4"),
    # Workbook print-setup marks PP/Varadi as Legal, but the bank's actual
    # exported reference PDFs are one size throughout — match the reference.
    ("pp", "A4"),
    ("varadi", "A4"),
]

SPEC = {
    "scheme": "TRACTOR",
    "scheme_name_kn": SCHEME_NAME_KN,
    "scheme_code": SCHEME_CODE,
    "pages": PAGES,
    "fields": (
        APPLICANT_FIELDS
        + ADDRESS_FIELDS
        + BANK_ACCOUNT_FIELDS
        + LAND_FIELDS
        + AGRICULTURE_FIELDS
        + LOAN_FIELDS
        + DETAIL_FIELDS
    ),
}
