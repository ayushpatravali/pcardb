from typing import Optional, List
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field, SQLModel, Relationship


def _enum_values(enum_cls):
    return [member.value for member in enum_cls]


class Role(str, Enum):
    MANAGER = "manager"
    FIELD_OFFICER = "field_officer"


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class SchemeType(str, Enum):
    TRACTOR = "TRACTOR"
    LAND_DEV = "LAND_DEV"
    BULLOCK = "BULLOCK"
    SHEEP_40 = "SHEEP_40"
    SHEEP_20 = "SHEEP_20"
    SHEEP_10 = "SHEEP_10"


# --- Users ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: Role = Field(
        default=Role.FIELD_OFFICER,
        sa_column=Column(SAEnum(Role, values_callable=_enum_values), nullable=False),
    )
    full_name: Optional[str] = None
    applications: List["Application"] = Relationship(back_populates="applicant")


# --- Applications (Header) ---
class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_no: Optional[str] = Field(default=None, index=True)  # e.g. "123/2025-26"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    application_date: Optional[datetime] = None  # user-chosen date printed on the forms; falls back to created_at
    status: ApplicationStatus = Field(
        default=ApplicationStatus.DRAFT,
        sa_column=Column(SAEnum(ApplicationStatus, values_callable=_enum_values), nullable=False),
    )

    # Applicant Details
    applicant_id: Optional[int] = Field(default=None, foreign_key="user.id")
    applicant: Optional[User] = Relationship(back_populates="applications")
    applicant_name_kn: str  # Kannada Name (first + middle + last, joined by the form)
    father_name_kn: str  # Father/Husband Name
    age: int
    gender: str
    mobile_no: str
    aadhaar_no: str
    caste: str
    farmer_type: str  # Small/Big
    borrower_type: Optional[str] = None  # New / Old
    occupation: Optional[str] = Field(default="Agriculture")
    dob: Optional[datetime] = None

    # Co-applicants: JSON array of {name, relation}
    co_applicants: Optional[str] = None

    # Bank Details
    account_no: str
    ifsc_code: str
    bank_name: str
    branch_name: str

    # Address
    village: str
    hobli: str
    taluk: str
    district: str

    # Agriculture (as sent by the form)
    current_crop: Optional[str] = None  # JSON: [{crop_name, acres, guntas, annual_income}]
    irrigation_source: Optional[str] = None  # display string, e.g. "Borewell (5 HP), Canal"
    annual_income: Optional[float] = None  # derived server-side: sum of current_crop annual_income

    # Land details stored as JSON string (array of parcels)
    land_parcels: Optional[str] = None  # JSON: [{sl, village, survey_no, acres, guntas, akaar, valuation}]
    total_area_acres: Optional[float] = None
    total_guntas: Optional[float] = None
    land_valuation_per_acre: Optional[float] = None  # TRACTOR: per-acre rate; parcel valuation = rate x extent

    # Loan / Scheme Meta
    loan_amount: Optional[float] = None
    scheme_type: SchemeType = Field(
        sa_column=Column(
            SAEnum(SchemeType, values_callable=_enum_values), nullable=False, index=True
        )
    )

    # Document generation cache
    generated_pdf_path: Optional[str] = None
    generated_at: Optional[datetime] = None


# --- Scheme Specifics ---
# Field names mirror exactly what the (frozen) frontend form POSTs.
class TractorDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    tractor_make: Optional[str] = None
    tractor_model: Optional[str] = None
    tractor_hp: Optional[str] = None
    tractor_dealer: Optional[str] = None
    tractor_quotation: Optional[float] = None
    tractor_down_payment: Optional[float] = None
    tractor_bank_loan: Optional[float] = None

    trailer_make: Optional[str] = None
    trailer_capacity: Optional[str] = None
    trailer_dealer: Optional[str] = None
    trailer_quotation: Optional[float] = None
    trailer_down_payment: Optional[float] = None
    trailer_bank_loan: Optional[float] = None

    implement_dealer: Optional[str] = None
    implement_quotation: Optional[float] = None
    implement_down_payment: Optional[float] = None
    implement_bank_loan: Optional[float] = None

    total_quotation: Optional[float] = None
    total_down_payment: Optional[float] = None
    total_loan_amount: Optional[float] = None


class LandDevDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    survey_no: Optional[str] = None
    area_acres: Optional[float] = None
    assessment: Optional[float] = None
    land_type: Optional[str] = None  # Dry/Wet

    pre_development_income: Optional[float] = None
    post_development_income: Optional[float] = None
    incremental_income: Optional[float] = None


class SheepDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    variant: Optional[str] = None  # 40+2, 20+1, 10+1
    animal_cost: Optional[float] = None
    shed_cost: Optional[float] = None
    feed_cost: Optional[float] = None
    insurance_amt: Optional[float] = None
    misc_cost: Optional[float] = None
    total_cost: Optional[float] = None


class BullockDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: Optional[int] = Field(default=None, foreign_key="application.id")

    bullock_cost: Optional[float] = None
    cart_cost: Optional[float] = None
    total_cost: Optional[float] = None
    loan_amount: Optional[float] = None
    margin_money: Optional[float] = None


# Exact scheme -> details-table routing (replaces substring matching).
DETAILS_MODEL = {
    SchemeType.TRACTOR: TractorDetails,
    SchemeType.LAND_DEV: LandDevDetails,
    SchemeType.BULLOCK: BullockDetails,
    SchemeType.SHEEP_40: SheepDetails,
    SchemeType.SHEEP_20: SheepDetails,
    SchemeType.SHEEP_10: SheepDetails,
}

SHEEP_VARIANT = {
    SchemeType.SHEEP_40: "40+2",
    SchemeType.SHEEP_20: "20+1",
    SchemeType.SHEEP_10: "10+1",
}
