import os
import firebase_admin
from firebase_admin import credentials, firestore
from sqlalchemy.orm import Session
from datetime import datetime

# Import models to repopulate PostgreSQL (BackupLog removed)
from models.model import (
    Hostel, Room, StudentProfile, FeeRecord, 
    Account, RoomAllocation, Complaint, RoomChangeRequest
)

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db_firestore = firestore.client()

# --- HELPER FOR DIFFERENTIAL BACKUP ---
def sync_collection(collection_name: str, pg_records: list, data_mapper: callable):
    """
    Ensures Firestore is an exact mirror of PostgreSQL for a specific collection.
    """
    pg_ids = {str(record.id) for record in pg_records}
    fs_docs = db_firestore.collection(collection_name).select([]).stream()
    fs_ids = {doc.id for doc in fs_docs}

    # Delete records in Firestore that no longer exist in Postgres
    orphans = fs_ids - pg_ids
    for orphan_id in orphans:
        db_firestore.collection(collection_name).document(orphan_id).delete()

    # Update or Insert current records
    for record in pg_records:
        db_firestore.collection(collection_name).document(str(record.id)).set(data_mapper(record))

def backup_postgres_to_firebase(db_sql: Session):
    """
    Triggers a full differential sync from local PostgreSQL to Cloud Firestore.
    """
    try:
        # Identity
        sync_collection('accounts', db_sql.query(Account).all(), lambda a: {
            "email": a.email, "role": a.role
        })
        sync_collection('student_profiles', db_sql.query(StudentProfile).all(), lambda s: {
            "name": s.name, "phone": s.phone, "account_id": s.account_id
        })
        # Topology
        sync_collection('hostels', db_sql.query(Hostel).all(), lambda h: {
            "name": h.name, "total_rooms": h.total_rooms, "total_floors": h.total_floors
        })
        sync_collection('rooms', db_sql.query(Room).all(), lambda r: {
            "room_number": r.room_number, "capacity": r.capacity, 
            "current_occupancy": r.current_occupancy, "hostel_id": r.hostel_id
        })
        # Operations
        sync_collection('room_allocations', db_sql.query(RoomAllocation).all(), lambda alloc: {
            "student_id": alloc.student_id, "room_id": alloc.room_id,
            "is_active": alloc.is_active, "start_date": alloc.start_date.isoformat() if alloc.start_date else None
        })
        sync_collection('complaints', db_sql.query(Complaint).all(), lambda c: {
            "student_id": c.student_id, "room_id": c.room_id, "category": c.category,
            "description": c.description, "status": c.status, "priority": c.priority
        })
        sync_collection('room_change_requests', db_sql.query(RoomChangeRequest).all(), lambda req: {
            "student_id": req.student_id, "current_room_id": req.current_room_id,
            "requested_room_id": req.requested_room_id, "reason": req.reason, "status": req.status
        })
        sync_collection('fee_records', db_sql.query(FeeRecord).all(), lambda f: {
            "student_id": f.student_id, "amount": f.amount, "fee_type": f.fee_type,
            "status": f.status, "receipt_image_url": f.receipt_image_url
        })
        
        return {"status": "success", "message": "PostgreSQL data successfully mirrored to Firebase NoSQL."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- DISASTER RECOVERY RESTORE LOGIC ---
def restore_firebase_to_postgres(db_sql: Session):
    """
    Pulls data from Firebase and repopulates PostgreSQL.
    Follows strict order of operations to satisfy Foreign Key constraints.
    """
    try:
        print("Starting Disaster Recovery: Cloud to Local...")

        # 1. Restore Accounts (Parents)
        for doc in db_firestore.collection('accounts').stream():
            data = doc.to_dict()
            if not db_sql.query(Account).filter(Account.id == int(doc.id)).first():
                db_sql.add(Account(id=int(doc.id), email=data['email'], role=data['role'], password_hash="RECOVERED_ACCOUNT"))

        # 2. Restore Hostels (Parents)
        for doc in db_firestore.collection('hostels').stream():
            data = doc.to_dict()
            if not db_sql.query(Hostel).filter(Hostel.id == int(doc.id)).first():
                db_sql.add(Hostel(id=int(doc.id), name=data['name'], total_rooms=data['total_rooms'], total_floors=data.get('total_floors', 1)))

        db_sql.flush() # Ensure parents exist before child records are added

        # 3. Restore Rooms
        for doc in db_firestore.collection('rooms').stream():
            data = doc.to_dict()
            if not db_sql.query(Room).filter(Room.id == int(doc.id)).first():
                db_sql.add(Room(id=int(doc.id), hostel_id=data['hostel_id'], room_number=data['room_number'], capacity=data['capacity'], current_occupancy=data['current_occupancy']))

        # 4. Restore Student Profiles
        for doc in db_firestore.collection('student_profiles').stream():
            data = doc.to_dict()
            if not db_sql.query(StudentProfile).filter(StudentProfile.id == int(doc.id)).first():
                db_sql.add(StudentProfile(id=int(doc.id), account_id=data['account_id'], name=data['name'], phone=data.get('phone')))

        db_sql.flush()

        # 5. Restore Transactional Data
        for doc in db_firestore.collection('room_allocations').stream():
            data = doc.to_dict()
            if not db_sql.query(RoomAllocation).filter(RoomAllocation.id == int(doc.id)).first():
                start_dt = datetime.fromisoformat(data['start_date']) if data.get('start_date') else None
                db_sql.add(RoomAllocation(id=int(doc.id), student_id=data['student_id'], room_id=data['room_id'], is_active=data['is_active'], start_date=start_dt))

        for doc in db_firestore.collection('fee_records').stream():
            data = doc.to_dict()
            if not db_sql.query(FeeRecord).filter(FeeRecord.id == int(doc.id)).first():
                db_sql.add(FeeRecord(id=int(doc.id), student_id=data['student_id'], amount=data['amount'], fee_type=data['fee_type'], status=data['status'], receipt_image_url=data.get('receipt_image_url')))

        db_sql.commit()
        return {"status": "success", "message": "Relational data successfully restored from cloud snapshot."}

    except Exception as e:
        db_sql.rollback()
        print(f"Restore Error: {e}")
        return {"status": "error", "message": str(e)}