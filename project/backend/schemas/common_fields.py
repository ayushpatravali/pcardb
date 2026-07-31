"""Field blocks shared by every scheme's spec.

Each field: {key, label_kn, label_en, tier, source}
  tier:
    collected   -> stored value from the (frozen) form payload; required unless noted
    computed    -> derived server-side in render_service (see COMPUTED_FIELDS there)
    constant    -> fixed bank/scheme text defined in the spec
    handwritten -> printed as a blank line/box for manual filling
  source: dotted path resolved against the render context
          (app.<column>, details.<column>, parsed.<json-derived>)
"""

BANK = {
    "name_line1": "ದಿ ಗೋಕಾಕ ತಾಲೂಕಾ ಪ್ರಾಥಮಿಕ ಸಹಕಾರಿ ಕೃಷಿ ಮತ್ತು ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿ",
    "name_line2": "ಬ್ಯಾಂಕ ನಿಯಮಿತ, ಗೋಕಾಕ. ಜಿಲ್ಲಾ : ಬೆಳಗಾವಿ",
    "name_short": "ಪ್ರಾ.ಸ.ಕೃ.ಗ್ರಾ.ಅ.ಬ್ಯಾಂಕ ನಿ.",
    "place": "ಗೋಕಾಕ",
    "state_bank_header": "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಸಹಕಾರ ಕೃಷಿ ಮತ್ತು ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿ ಬ್ಯಾಂಕ್ ನಿ., ಬೆಂಗಳೂರು – 18",
}

APPLICANT_FIELDS = [
    {"key": "application_no", "label_kn": "ಸಾಲದ ಅರ್ಜಿ ಸಂಖ್ಯೆ", "label_en": "Application No", "tier": "collected", "source": "app.application_no", "required": False},
    {"key": "application_date", "label_kn": "ದಿನಾಂಕ", "label_en": "Date", "tier": "computed", "source": "computed.application_date"},
    {"key": "applicant_name", "label_kn": "ಹೆಸರು", "label_en": "Applicant Name", "tier": "collected", "source": "app.applicant_name_kn"},
    {"key": "father_name", "label_kn": "ತಂದೆ / ಗಂಡ", "label_en": "Father/Husband", "tier": "collected", "source": "app.father_name_kn"},
    {"key": "age", "label_kn": "ವಯಸ್ಸು", "label_en": "Age", "tier": "collected", "source": "app.age"},
    {"key": "mobile_no", "label_kn": "ಮೊಬೈಲ್ ಸಂ", "label_en": "Mobile", "tier": "collected", "source": "app.mobile_no"},
    {"key": "aadhaar_no", "label_kn": "ಆಧಾರ ಸಂಖ್ಯೆ", "label_en": "Aadhaar", "tier": "collected", "source": "app.aadhaar_no"},
    {"key": "caste", "label_kn": "ಜಾತಿ", "label_en": "Caste", "tier": "collected", "source": "app.caste"},
    {"key": "farmer_type", "label_kn": "ರೈತರ ವರ್ಗೀಕರಣ", "label_en": "Farmer Type", "tier": "computed", "source": "computed.farmer_type_kn"},
    {"key": "borrower_type", "label_kn": "ಹೊಸ/ಹಳೇ ಸಾಲಗಾರ", "label_en": "Borrower Type", "tier": "computed", "source": "computed.borrower_type_kn", "required": False},
    {"key": "dob", "label_kn": "ಹುಟ್ಟಿದ ದಿನಾಂಕ", "label_en": "Date of Birth", "tier": "computed", "source": "computed.dob", "required": False},
    {"key": "co_applicants", "label_kn": "ಸಹ ಅರ್ಜಿದಾರ", "label_en": "Co-applicants", "tier": "computed", "source": "parsed.co_applicants", "required": False},
]

ADDRESS_FIELDS = [
    {"key": "village", "label_kn": "ಗ್ರಾಮ", "label_en": "Village", "tier": "collected", "source": "app.village"},
    {"key": "hobli", "label_kn": "ಹೋಬಳಿ / ಅಂಚೆ", "label_en": "Hobli/Post", "tier": "collected", "source": "app.hobli"},
    {"key": "taluk", "label_kn": "ತಾಲೂಕಾ", "label_en": "Taluk", "tier": "collected", "source": "app.taluk"},
    {"key": "district", "label_kn": "ಜಿಲ್ಲೆ", "label_en": "District", "tier": "collected", "source": "app.district"},
]

BANK_ACCOUNT_FIELDS = [
    {"key": "account_no", "label_kn": "ಖಾತೆ ಸಂಖ್ಯೆ", "label_en": "Account No", "tier": "collected", "source": "app.account_no"},
    {"key": "ifsc_code", "label_kn": "IFSC", "label_en": "IFSC", "tier": "collected", "source": "app.ifsc_code"},
    {"key": "bank_name", "label_kn": "ಬ್ಯಾಂಕ", "label_en": "Bank", "tier": "collected", "source": "app.bank_name"},
    {"key": "branch_name", "label_kn": "ಶಾಖೆ", "label_en": "Branch", "tier": "collected", "source": "app.branch_name"},
]

LAND_FIELDS = [
    {"key": "land_parcels", "label_kn": "ಆಧಾರಕ್ಕೊಳಪಡುವ ಆಸ್ತಿಯ ವಿವರ", "label_en": "Land Parcels", "tier": "computed", "source": "parsed.land_parcels"},
    {"key": "total_area_acres", "label_kn": "ಒಟ್ಟು ಹಿಡುವಳಿ (ಎಕರೆ)", "label_en": "Total Holding (acres)", "tier": "collected", "source": "app.total_area_acres"},
    {"key": "total_akaar", "label_kn": "ಒಟ್ಟು ಆಕಾರ", "label_en": "Total Akaar", "tier": "computed", "source": "computed.total_akaar", "required": False},
]

AGRICULTURE_FIELDS = [
    {"key": "crops", "label_kn": "ಬೆಳೆಯ ವಿವರ", "label_en": "Crops", "tier": "computed", "source": "parsed.crops", "required": False},
    {"key": "irrigation_source", "label_kn": "ನೀರಾವರಿ ಸೌಲಭ್ಯ", "label_en": "Irrigation", "tier": "collected", "source": "app.irrigation_source", "required": False},
    {"key": "annual_income", "label_kn": "ವಾರ್ಷಿಕ ಆದಾಯ", "label_en": "Annual Income", "tier": "computed", "source": "computed.annual_income", "required": False},
]

LOAN_FIELDS = [
    {"key": "loan_amount", "label_kn": "ಅಪೇಕ್ಷಿಸಿರುವ ಸಾಲದ ಮೊತ್ತ", "label_en": "Loan Amount", "tier": "collected", "source": "app.loan_amount"},
    {"key": "loan_amount_words", "label_kn": "ಮೊತ್ತ (ಅಕ್ಷರಗಳಲ್ಲಿ)", "label_en": "Amount in Words", "tier": "computed", "source": "computed.loan_amount_words", "required": False},
]

# Field groups the printed documents contain but the form does not collect.
# Rendered as blank lines/boxes for handwriting (bank current practice).
# Promote a group by changing its tier and adding a form field + source.
HANDWRITTEN_GROUPS = [
    "member_no", "membership_fee_receipt", "photo",
    "guarantors", "family_size", "existing_loans_table",
    "other_income", "farming_experience", "assets_by_land_class",
    "security_valuation", "document_checklist", "genealogy_tree",
    "inspection_remarks", "recommendation", "sanction_details",
    "repayment_kist_table", "pan_ration_voter_ids",
    "door_no_post_pin", "khata_mutation_boundaries",
    "signatures", "place_and_date_of_signing",
]
