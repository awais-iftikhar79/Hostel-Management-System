# clean_db.py
from database import SessionLocal
from models.model import (
    Account, 
    StudentProfile, 
    RoomAllocation, 
    FeeRecord, 
    Complaint, 
    RoomChangeRequest, 
    Room, 
    Hostel
)

def reset_database():
    db = SessionLocal()
    try:
        print("🧹 Starting database cleanup...")

        # 1. Delete all dependent child records first
        print("Deleting allocations, fees, complaints, and requests...")
        db.query(RoomAllocation).delete()
        db.query(FeeRecord).delete()
        db.query(Complaint).delete()
        db.query(RoomChangeRequest).delete()

        # 2. Delete rooms and hostels
        print("Deleting rooms and hostels...")
        db.query(Room).delete()
        db.query(Hostel).delete()

        # 3. Delete student profiles
        print("Deleting student profiles...")
        db.query(StudentProfile).delete()

        # 4. Delete all accounts EXCEPT the admin
        print("Deleting non-admin accounts...")
        db.query(Account).filter(Account.role != 'admin').delete()

        # Commit the massive delete operation!
        db.commit()
        print("✅ Database cleaned successfully! Only Admin credentials remain.")

    except Exception as e:
        db.rollback()
        print(f"❌ An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("⚠️ WARNING: This will delete ALL students, hostels, and records. Type 'YES' to continue: ")
    if confirm == 'YES':
        reset_database()
    else:
        print("Cleanup aborted.")