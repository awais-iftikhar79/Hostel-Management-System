import os
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Import Base and ALL models so Alembic can read the complete schema structure
from database import Base
from models.model import (
    Account, 
    StudentProfile, 
    Hostel, 
    Room, 
    RoomAllocation, 
    FeeRecord, 
    Complaint, 
    RoomChangeRequest,
    BackupLog 
)

# Initialize Alembic configuration object
config = context.config

# Setup standard Python logging based on the alembic.ini configuration
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2. Securely load environment variables to prevent hardcoding credentials in alembic.ini
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("🚨 ERROR: DATABASE_URL is missing or .env file wasn't found!")

# Override the sqlalchemy.url dynamically using our secure environment variable
config.set_main_option("sqlalchemy.url", db_url)

# 3. Bind the SQLAlchemy models metadata to Alembic's autogenerate feature
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """
    Executes migrations in 'offline' mode.
    Outputs the raw SQL strings to the terminal instead of executing them against the database.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """
    Executes migrations in 'online' mode.
    Spins up a direct SQLAlchemy engine connection and executes the schema changes live on PostgreSQL.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

# Route execution to the correct migration mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()