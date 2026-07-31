import os

from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import User, Role
from auth import get_password_hash

def init_db():
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if users exist
        if session.exec(select(User)).first():
            return
            
        # Create Manager
        manager = User(
            username="manager",
            hashed_password=get_password_hash(os.environ.get("MANAGER_PASSWORD", "manager123")),
            full_name="System Manager",
            role=Role.MANAGER
        )
        session.add(manager)
        
        # Create Field Officer
        officer = User(
            username="officer",
            hashed_password=get_password_hash(os.environ.get("OFFICER_PASSWORD", "officer123")),
            full_name="Field Officer 1",
            role=Role.FIELD_OFFICER
        )
        session.add(officer)
        
        session.commit()
        print("Database initialized with Manager and Field Officer.")

if __name__ == "__main__":
    init_db()
