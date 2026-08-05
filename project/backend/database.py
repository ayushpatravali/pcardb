import os
from sqlmodel import SQLModel, create_engine, Session
import models  # noqa: F401

# Database path: absolute, next to this file. Configurable via DATABASE_URL env var.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "database.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _migrate_land_dev_schema()


def _migrate_land_dev_schema():
    """One-time fix for any deployment whose landdevdetails table predates
    the 2026-08-04 LandDevDetails rewrite (old columns: survey_no/
    area_acres/assessment/pre_development_income/...). create_all() only
    creates tables that don't exist yet — it never alters an existing
    table's columns — so a deployed volume DB keeps the old shape forever
    without this, and every Land Dev application fails to load (missing
    columns like pre_dev_crops). Safe to run on every boot: no-ops once the
    table is already on the new schema. Drops old landdevdetails rows —
    pre-launch demo data only, never real applicant data at this stage."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    if "landdevdetails" not in inspector.get_table_names():
        return
    columns = {c["name"] for c in inspector.get_columns("landdevdetails")}
    if "pre_dev_crops" in columns:
        return  # already migrated
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE landdevdetails"))
    SQLModel.metadata.create_all(engine)
    print("migrated landdevdetails table to the new LAND_DEV schema")


def get_session():
    with Session(engine) as session:
        yield session
