import os
import firebase_admin
from firebase_admin import credentials, firestore
from sqlalchemy.orm import Session

from models.model import (
    Hostel, Room, StudentProfile, FeeRecord, 
    Account, RoomAllocation, Complaint, RoomChangeRequest, BackupLog
)

# Safely initialize the Firebase Admin SDK as a singleton instance
if not firebase_admin._apps:
    cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Instantiate the global NoSQL client
db_firestore = firestore.client()

def sync_collection(collection_name: str, pg_records: list, data_mapper: callable):
    """
    Helper function to perform a differential sync on a specific collection.
    1. Fetches only the document IDs from Firestore (optimized bandwidth).
    2. Compares Firestore IDs with PostgreSQL IDs using O(1) set operations.
    3. Deletes orphaned documents in Firestore.
    4. Upserts current PostgreSQL records.
    """
    # 1. Extract PostgreSQL IDs as a fast lookup set of strings
    pg_ids = {str(record.id) for record in pg_records}

    # 2. Fetch existing Firestore IDs (using select([]) avoids downloading document bodies)
    fs_docs = db_firestore.collection(collection_name).select([]).stream()
    fs_ids = {doc.id for doc in fs_docs}

    # 3. Find and delete orphaned Firestore documents (records deleted in PostgreSQL)
    orphans = fs_ids - pg_ids
    for orphan_id in orphans:
        db_firestore.collection(collection_name).document(orphan_id).delete()

    # 4. Upsert (Insert or Update) the current PostgreSQL records
    for record in pg_records:
        db_firestore.collection(collection_name).document(str(record.id)).set(data_mapper(record))


def backup_postgres_to_firebase(db_sql: Session):
    """
    Executes an optimized differential ETL synchronization pipeline.
    Ensures Firestore becomes an exact 1-to-1 real-time mirror of the PostgreSQL state.
    """
    try:
        # ---------------------------------------------------------
        # IDENTITY & METADATA
        # ---------------------------------------------------------
        sync_collection('accounts', db_sql.query(Account).all(), lambda a: {
            "email": a.email,
            "role": a.role
            # Explicit omission of password_hash to comply with security protocols.
        })

        sync_collection('student_profiles', db_sql.query(StudentProfile).all(), lambda s: {
            "name": s.name, 
            "phone": s.phone, 
            "account_id": s.account_id
        })

        # ---------------------------------------------------------
        # CAMPUS TOPOLOGY
        # ---------------------------------------------------------
        sync_collection('hostels', db_sql.query(Hostel).all(), lambda h: {
            "name": h.name, 
            "total_rooms": h.total_rooms, 
            "total_floors": h.total_floors
        })

        sync_collection('rooms', db_sql.query(Room).all(), lambda r: {
            "room_number": r.room_number, 
            "capacity": r.capacity,
            "current_occupancy": r.current_occupancy, 
            "hostel_id": r.hostel_id
        })

        # ---------------------------------------------------------
        # ALLOCATIONS & WORKFLOWS
        # ---------------------------------------------------------
        sync_collection('room_allocations', db_sql.query(RoomAllocation).all(), lambda alloc: {
            "student_id": alloc.student_id, 
            "room_id": alloc.room_id,
            "is_active": alloc.is_active, 
            "start_date": alloc.start_date.isoformat() if alloc.start_date else None
        })

        sync_collection('complaints', db_sql.query(Complaint).all(), lambda c: {
            "student_id": c.student_id, 
            "room_id": c.room_id,
            "category": c.category, 
            "description": c.description,
            "status": c.status, 
            "priority": c.priority
        })

        sync_collection('room_change_requests', db_sql.query(RoomChangeRequest).all(), lambda req: {
            "student_id": req.student_id, 
            "current_room_id": req.current_room_id,
            "requested_room_id": req.requested_room_id, 
            "reason": req.reason,
            "status": req.status
        })

        # ---------------------------------------------------------
        # FINANCIALS & AUDIT LOGS
        # ---------------------------------------------------------
        sync_collection('fee_records', db_sql.query(FeeRecord).all(), lambda f: {
            "student_id": f.student_id, 
            "amount": f.amount,
            "fee_type": f.fee_type, 
            "status": f.status,
            "receipt_image_url": f.receipt_image_url
        })
        
        sync_collection('backup_logs', db_sql.query(BackupLog).all(), lambda log: {
            "snapshot_id": log.snapshot_id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "trigger_type": log.trigger_type,
            "status": log.status
        })

        return {"status": "success", "message": "Differential synchronization complete. Firestore is an exact mirror."}
    
    except Exception as e:
        
        return {"status": "error", "message": f"Cloud Sync Failure: {str(e)}"}