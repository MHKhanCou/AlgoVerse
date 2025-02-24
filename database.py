# algoverse/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Database_Url = "sqlite:///./algoverse.db"  # Use relative path to local DB

engine = create_engine(Database_Url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
