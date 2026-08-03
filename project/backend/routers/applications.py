import json
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import (
    DETAILS_MODEL,
    SHEEP_VARIANT,
    Application,
    ApplicationStatus,
    BullockDetails,
    LandDevDetails,
    Role,
    SchemeType,
    SheepDetails,
    TractorDetails,
    User,
)
from auth import get_current_user

router = APIRouter(
    prefix="/applications",
    tags=["applications"],
    responses={404: {"description": "Not found"}},
)


def get_details(session: Session, application: Application):
    """Fetch the scheme-specific details row for an application (exact routing)."""
    model = DETAILS_MODEL.get(SchemeType(application.scheme_type))
    if model is None:
        return None
    return session.exec(
        select(model).where(model.application_id == application.id)
    ).first()


def derive_server_fields(application: Application) -> None:
    """Compute fields the form does not send from what it does send."""
    # annual_income = sum of per-crop annual_income inside the current_crop JSON
    if application.current_crop:
        try:
            crops = json.loads(application.current_crop)
            incomes = [
                float(c.get("annual_income") or 0)
                for c in crops
                if isinstance(c, dict)
            ]
            if incomes:
                application.annual_income = round(sum(incomes), 2)
        except (ValueError, TypeError):
            pass  # malformed crop JSON: leave annual_income as sent (or None)


# Kannada-text fields that must arrive as Unicode, not Nudi-ASCII glyph codes.
KANNADA_FIELDS = ("applicant_name_kn", "father_name_kn", "village", "hobli", "taluk", "district")
# Characters Nudi's legacy (non-Unicode) mode emits for Kannada glyphs.
_NUDI_ASCII_CHARS = set("ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ¸¹º»¼½¾¿¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·ðñòóôõö÷øùúûüýþÿ")


def reject_nudi_ascii(app_data: dict) -> None:
    """Nudi keyboard in legacy (ASCII) mode produces glyph bytes that only look
    like Kannada in a Nudi font — stored as-is they print as garbage. Detect and
    reject with an actionable message instead of silently corrupting data."""
    for field in KANNADA_FIELDS:
        value = app_data.get(field) or ""
        if sum(1 for ch in value if ch in _NUDI_ASCII_CHARS) >= 2 and not any(
            "ಀ" <= ch <= "೿" for ch in value
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"'{field}' looks like Nudi legacy (ASCII) input, not Unicode Kannada. "
                    "Please set the Nudi software to UNICODE mode (Nudi 6: "
                    "ಆಯ್ಕೆಗಳು → Unicode/KGP) and re-type the Kannada text."
                ),
            )


def validate_identifiers(mobile_no: str, aadhaar_no: str) -> None:
    m = re.sub(r"\D", "", mobile_no or "")
    a = re.sub(r"\D", "", aadhaar_no or "")
    if len(m) != 10:
        raise HTTPException(status_code=400, detail="mobile_no must be 10 digits")
    if len(a) != 12:
        raise HTTPException(status_code=400, detail="aadhaar_no must be 12 digits")


# Response Models
class DashboardStats(BaseModel):
    total_applications: int
    pending_applications: int
    recent_applications: List[Application]


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Application)
    if current_user.role != Role.MANAGER:
        query = query.where(Application.applicant_id == current_user.id)

    total = len(session.exec(query).all())
    pending = len(
        session.exec(
            query.where(Application.status == ApplicationStatus.SUBMITTED)
        ).all()
    )

    from sqlalchemy.orm import joinedload

    recent = session.exec(
        query.options(joinedload(Application.applicant))
        .order_by(Application.created_at.desc())
        .limit(5)
    ).all()

    return DashboardStats(
        total_applications=total,
        pending_applications=pending,
        recent_applications=recent,
    )


# Request Model combining Header + Details.
# Field names mirror exactly what the (frozen) frontend form POSTs — do not rename.
class ApplicationCreate(BaseModel):
    # Header Fields
    applicant_name_kn: str
    father_name_kn: str
    age: int
    gender: str
    mobile_no: str
    aadhaar_no: str
    caste: str
    farmer_type: str

    occupation: Optional[str] = "Agriculture"
    dob: Optional[datetime] = None
    application_date: Optional[datetime] = None
    current_crop: Optional[str] = None
    irrigation_source: Optional[str] = None
    annual_income: Optional[float] = None

    loan_amount: Optional[float] = None
    loan_duration_years: Optional[int] = None
    borrower_type: Optional[str] = None
    co_applicants: Optional[str] = None  # JSON string
    previous_loans: Optional[str] = None  # JSON string

    land_parcels: Optional[str] = None  # JSON string
    total_area_acres: Optional[float] = None
    total_guntas: Optional[float] = None
    land_valuation_per_acre: Optional[float] = None

    # Bank Details
    account_no: str
    ifsc_code: str
    bank_name: str
    branch_name: str
    village: str
    hobli: str
    taluk: str
    district: str
    scheme_type: SchemeType

    # Optional Details
    tractor_details: Optional[TractorDetails] = None
    land_details: Optional[LandDevDetails] = None
    sheep_details: Optional[SheepDetails] = None
    bullock_details: Optional[BullockDetails] = None

    def details_for_scheme(self):
        """Pick the details object matching scheme_type (exact, not substring)."""
        by_scheme = {
            SchemeType.TRACTOR: self.tractor_details,
            SchemeType.LAND_DEV: self.land_details,
            SchemeType.BULLOCK: self.bullock_details,
            SchemeType.SHEEP_40: self.sheep_details,
            SchemeType.SHEEP_20: self.sheep_details,
            SchemeType.SHEEP_10: self.sheep_details,
        }
        details = by_scheme.get(self.scheme_type)
        if isinstance(details, SheepDetails) and not details.variant:
            details.variant = SHEEP_VARIANT[self.scheme_type]
        return details


DETAIL_PAYLOAD_KEYS = {"tractor_details", "land_details", "sheep_details", "bullock_details"}


@router.post("/", response_model=Application)
def create_application(
    payload: ApplicationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    app_data = payload.dict(exclude=DETAIL_PAYLOAD_KEYS)
    validate_identifiers(app_data.get("mobile_no"), app_data.get("aadhaar_no"))
    reject_nudi_ascii(app_data)

    application = Application(**app_data)
    application.applicant_id = current_user.id
    application.status = (
        ApplicationStatus.APPROVED
        if current_user.role == Role.MANAGER
        else ApplicationStatus.SUBMITTED
    )
    derive_server_fields(application)

    session.add(application)
    session.commit()
    session.refresh(application)

    details = payload.details_for_scheme()
    if details:
        details.application_id = application.id
        session.add(details)
        session.commit()
        session.refresh(application)  # re-load: commit expires the instance pre-serialization

    return application


@router.get("/", response_model=List[Application])
def read_applications(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload

    query = (
        select(Application)
        .options(joinedload(Application.applicant))
        .offset(skip)
        .limit(limit)
    )
    if current_user.role != Role.MANAGER:
        query = query.where(Application.applicant_id == current_user.id)

    return session.exec(query).all()


@router.get("/{application_id}")
def read_application(application_id: int, session: Session = Depends(get_session)):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    details = get_details(session, application)

    # Local index: 1-based rank among this user's applications
    local_index = session.exec(
        select(Application)
        .where(Application.applicant_id == application.applicant_id)
        .where(Application.id <= application.id)
    ).all()

    return {
        "application": application,
        "details": details,
        "local_index": len(local_index),
    }


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role != Role.MANAGER:
        raise HTTPException(status_code=403, detail="Only Managers can approve applications")

    application.status = payload.status
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.put("/{application_id}")
def update_application(
    application_id: int,
    payload: ApplicationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role != Role.MANAGER and application.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this application")

    app_data = payload.dict(exclude=DETAIL_PAYLOAD_KEYS)
    validate_identifiers(app_data.get("mobile_no"), app_data.get("aadhaar_no"))
    reject_nudi_ascii(app_data)

    # Delete old details BEFORE applying the (possibly changed) scheme_type,
    # so the lookup targets the previous scheme's table.
    old_details = get_details(session, application)
    if old_details:
        session.delete(old_details)
        session.commit()

    for key, value in app_data.items():
        setattr(application, key, value)
    derive_server_fields(application)
    application.generated_pdf_path = None  # stale after edit
    application.generated_at = None
    session.add(application)

    new_details = payload.details_for_scheme()
    if new_details:
        new_details.application_id = application.id
        session.add(new_details)

    session.commit()
    session.refresh(application)
    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role != Role.MANAGER and application.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this application")

    details = get_details(session, application)
    if details:
        session.delete(details)

    session.delete(application)
    session.commit()
    return {"ok": True}


@router.post("/{application_id}/generate")
def generate_application_document(
    application_id: int, session: Session = Depends(get_session)
):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    details = get_details(session, application)

    from services.render_service import MissingFieldsError, render_packet

    try:
        output_path = render_packet(application, details)
    except MissingFieldsError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": "missing_fields", "missing": e.fields},
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    application.generated_pdf_path = str(output_path)
    application.generated_at = datetime.utcnow()
    session.add(application)
    session.commit()

    filename = f"Application_{application.application_no or application.id}.pdf"
    return FileResponse(output_path, media_type="application/pdf", filename=filename)
