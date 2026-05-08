import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Securely initialize environment configuration
load_dotenv()

# Retrieve the centralized database connection string
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("🚨 ERROR: DATABASE_URL is missing from the environment variables!")

# Core SQLAlchemy engine bridging the Python application to the PostgreSQL instance
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Factory for generating thread-safe, isolated database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class mapping for all SQLAlchemy ORM models
Base = declarative_base()

def get_db():
    """
    FastAPI Dependency Injection for robust database session management.
    Yields a dedicated database session per HTTP request and guarantees 
    safe closure and connection pool return after the request cycle completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()