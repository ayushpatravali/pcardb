import sys, os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
sys.path.append(os.path.join(BASE_DIR, "backend"))

from backend.services.pdf_service import generate_tractor_pdf

app_data = {
    "applicant_name_kn": "ರಮೇಶ ಕುಮಾರ ಪಾಟೀಲ",
    "father_name_kn": "ಸುರೇಶ ಪಾಟೀಲ",
    "age": "35",
    "caste": "ಲಿಂಗಾಯತ",
    "village": "ಬೆಳಗಾವಿ",
    "mobile_no": "9876543210",
    "loan_amount": "500000",
    "application_no": "PCARDB-2026-001",
    "account_no": "1234567890",
    "ifsc_code": "SBIN0001234",
}

print("Generating PDF...")
pdf_buffer = generate_tractor_pdf(app_data)
with open("TEST_OUTPUT.pdf", "wb") as f:
    f.write(pdf_buffer.getvalue())
print(f"Done! Saved: {os.path.join(BASE_DIR, 'TEST_OUTPUT.pdf')}")
