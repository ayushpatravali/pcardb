from sqlmodel import SQLModel
from database import engine
from models import User, Application, TractorDetails, LandDevDetails, SheepDetails, BullockDetails
from init_db import init_db

def reset_db():
    print("Dropping all tables...")
    SQLModel.metadata.drop_all(engine)
    print("Tables dropped.")
    
    print("Re-initializing database...")
    init_db()
    print("Reset Complete.")

if __name__ == "__main__":
    reset_db()
