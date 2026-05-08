import sys
from database import SessionLocal
from models.model import (
    Account, 
    StudentProfile, 
    RoomAllocation, 
    FeeRecord, 
    Complaint, 
    RoomChangeRequest, 
    Room, 
    Hostel,
    BackupLog
)

def reset_database():
    """
    Executes a comprehensive, cascading truncation of the relational database.
    Maintains referential integrity by purging child dependency tables before parents.
    Preserves master administrative credentials.
    """
    db = SessionLocal()
    try:
        print("INFO: Initializing database purge sequence...")

        # Phase 1: Purge transactional, financial, and temporal dependency tables
        print("INFO: Purging transaction ledgers, allocations, and user requests...")
        db.query(RoomAllocation).delete(synchronize_session=False)
        db.query(FeeRecord).delete(synchronize_session=False)
        db.query(Complaint).delete(synchronize_session=False)
        db.query(RoomChangeRequest).delete(synchronize_session=False)
        db.query(BackupLog).delete(synchronize_session=False)

        # Phase 2: Purge physical campus infrastructure
        print("INFO: Deconstructing physical campus topology (Rooms & Hostels)...")
        db.query(Room).delete(synchronize_session=False)
        db.query(Hostel).delete(synchronize_session=False)

        # Phase 3: Purge user metadata
        print("INFO: Purging student metadata profiles...")
        db.query(StudentProfile).delete(synchronize_session=False)

        # Phase 4: Purge core authentication credentials (excluding Master Admin)
        print("INFO: Purging standard authentication credentials...")
        db.query(Account).filter(Account.role != 'admin').delete(synchronize_session=False)

        # Execute transaction
        db.commit()
        print("SUCCESS: Database schema successfully reset. Master admin identity preserved.")

    except Exception as e:
        # Failsafe rollback to prevent database corruption
        db.rollback()
        print(f"CRITICAL ERROR: Transaction failed. Changes rolled back. Details: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    # Enterprise-grade CLI warning block
    print("\n" + "="*55)
    print(" 🚨 WARNING: CRITICAL SYSTEM OPERATION 🚨")
    print("="*55)
    print("This operation will permanently destroy all relational data:")
    print("  - Student Profiles, Assignments, and Accounts")
    print("  - Financial Ledgers and Payment History")
    print("  - Campus Infrastructure (Hostels & Rooms)")
    print("  - Cloud Synchronization Audit Logs")
    print("="*55)
    
    confirm = input("To proceed with the purge, type 'CONFIRM_PURGE': ")
    
    if confirm == 'CONFIRM_PURGE':
        reset_database()
    else:
        print("ABORTED: Operation cancelled. No data was modified.")