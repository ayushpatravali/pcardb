"""PDF download endpoint — thin wrapper over the render service.

The old implementation built a large app_data dict by hand (and crashed on
TRACTOR reading nonexistent columns), then discarded it and called the
Excel/COM generator. Both paths are retired.
"""
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session

from database import get_session
from models import Application
from routers.applications import get_details

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.get("/download/{application_id}")
def download_pdf(application_id: int, session: Session = Depends(get_session)):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    filename = f"Application_{application.application_no or application.id}.pdf"

    # Serve the cached PDF if it is still fresh (cleared on every edit).
    if application.generated_pdf_path and os.path.exists(application.generated_pdf_path):
        return FileResponse(
            application.generated_pdf_path, media_type="application/pdf", filename=filename
        )

    details = get_details(session, application)

    from services.render_service import MissingFieldsError, render_packet

    try:
        output_path = render_packet(application, details)
    except MissingFieldsError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": "missing_fields", "missing": e.fields, "fields": e.labels},
        )

    application.generated_pdf_path = str(output_path)
    application.generated_at = datetime.utcnow()
    session.add(application)
    session.commit()

    return FileResponse(output_path, media_type="application/pdf", filename=filename)
