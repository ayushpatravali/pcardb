"""LAND_DEV scheme spec.

Page inventory follows the Kallangouda V Patil reference
(legacy_assets/pdfss/Kallangouda Patil Land Development Scheme.pdf,
23 pages) and the sheet taxonomy of Kallangouda V Patil.xlsx.
"""
from schemas.common_fields import (
    ADDRESS_FIELDS,
    AGRICULTURE_FIELDS,
    APPLICANT_FIELDS,
    BANK_ACCOUNT_FIELDS,
    LAND_FIELDS,
    LOAN_FIELDS,
)

SCHEME_NAME_KN = "ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆ"
SCHEME_CODE = "LD"

DETAIL_FIELDS = [
    {"key": "land_type", "label_kn": "ಜಮೀನಿನ ವಿಧ (ಖುಷ್ಕಿ/ತರಿ)", "label_en": "Land Type", "tier": "collected", "source": "details.land_type"},
    {"key": "pre_dev_crops", "label_kn": "ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಬೆಳೆಗಳು", "label_en": "Pre-Development Crops", "tier": "collected", "source": "parsed.pre_dev_crops"},
    {"key": "post_dev_crops", "label_kn": "ಅಭಿವೃದ್ಧಿ ನಂತರದ ಬೆಳೆಗಳು", "label_en": "Post-Development Crops", "tier": "collected", "source": "parsed.post_dev_crops"},
    {"key": "dev_work_items", "label_kn": "ಭೂ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ವೆಚ್ಚ", "label_en": "Development Work Cost Items", "tier": "collected", "source": "parsed.dev_work_items"},
    {"key": "total_dev_cost", "label_kn": "ಒಟ್ಟು ಅಭಿವೃದ್ಧಿ ವೆಚ್ಚ", "label_en": "Total Development Cost", "tier": "computed", "source": "computed.total_dev_cost"},
]

# Print order of the 23-page packet. Pages 1-10 and the last 4 are the same
# shared templates Tractor uses; pages 11-19 are new (transcribed from the
# Kallangouda reference PDF).
PAGES = [
    ("a1", "A4"), ("a2", "A4"), ("a3", "A4"), ("a4", "A4"),
    ("ssm", "A4"), ("ssm2", "A4"),
    ("b1", "A4"), ("b2", "A4"), ("b3", "A4"), ("b4", "A4"),
    ("land_dev/ld1", "A4"), ("land_dev/ld2", "A4"), ("land_dev/ld3", "A4"),
    ("land_dev/ld4", "A4"), ("land_dev/ld5", "A4"), ("land_dev/ld6", "A4"),
    ("land_dev/ld7", "A4"), ("land_dev/ld8", "A4"), ("land_dev/ld9", "A4"),
    ("valuation", "A4"),
    ("inspection", "A4"),
    ("pp", "A4"),
    ("varadi", "A4"),
]

SPEC = {
    "scheme": "LAND_DEV",
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
