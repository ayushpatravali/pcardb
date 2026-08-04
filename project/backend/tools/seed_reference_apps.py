"""Seed the database with one realistic application per built scheme.

Data mirrors the real Vasant Malli tractor application (the ground-truth
reference PDF), inserted the same way the API would store it, so the
generated packet is directly comparable to the reference.

Usage (from backend/):  python tools/seed_reference_apps.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select  # noqa: E402

from database import engine, create_db_and_tables  # noqa: E402
from models import Application, TractorDetails, LandDevDetails, User  # noqa: E402
from tools.render_test import (  # noqa: E402
    FIXTURE_APP, FIXTURE_DETAILS, FIXTURE_LAND_DEV_APP, FIXTURE_LAND_DEV_DETAILS,
)


def _seed_one(session, manager, app_fixture, details_fixture, details_model, application_no, label):
    existing = session.exec(
        select(Application).where(Application.application_no == application_no)
    ).first()
    if existing:
        print(f"seed already present: {label} id={existing.id}")
        return

    app = Application(**app_fixture.model_dump(exclude={"id"}))
    app.applicant_id = manager.id if manager else None
    session.add(app)
    session.commit()
    session.refresh(app)

    details = details_model(**details_fixture.model_dump(exclude={"id", "application_id"}))
    details.application_id = app.id
    session.add(details)
    session.commit()
    print(f"seeded {label}: id={app.id}")


def main():
    create_db_and_tables()
    with Session(engine) as session:
        manager = session.exec(select(User)).first()
        _seed_one(
            session, manager, FIXTURE_APP, FIXTURE_DETAILS, TractorDetails,
            "1/2025-26", "Vasant Malli tractor application",
        )
        _seed_one(
            session, manager, FIXTURE_LAND_DEV_APP, FIXTURE_LAND_DEV_DETAILS, LandDevDetails,
            "LD-1/2025-26", "Kallangouda-pattern land dev application",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
