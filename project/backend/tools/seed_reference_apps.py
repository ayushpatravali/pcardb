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
from models import Application, TractorDetails, User  # noqa: E402
from tools.render_test import FIXTURE_APP, FIXTURE_DETAILS  # noqa: E402


def main():
    create_db_and_tables()
    with Session(engine) as session:
        existing = session.exec(
            select(Application).where(Application.application_no == "1/2025-26")
        ).first()
        if existing:
            print(f"seed already present: application id={existing.id}")
            return 0

        manager = session.exec(select(User)).first()
        app = Application(**FIXTURE_APP.model_dump(exclude={"id"}))
        app.applicant_id = manager.id if manager else None
        session.add(app)
        session.commit()
        session.refresh(app)

        details = TractorDetails(**FIXTURE_DETAILS.model_dump(exclude={"id"}))
        details.application_id = app.id
        session.add(details)
        session.commit()
        print(f"seeded Vasant Malli tractor application: id={app.id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
