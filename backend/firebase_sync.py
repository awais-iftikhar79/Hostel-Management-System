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

def backup_postgres_to_firebase(db_sql: Session):
    """
    Executes a unidirectional ETL (Extract, Transform, Load) pipeline.
    Reads current relational state from PostgreSQL and mirrors it to Google Cloud Firestore 
    as a 1-to-1 document-based snapshot for disaster recovery.
    """
    try:
        # ---------------------------------------------------------
        # IDENTITY & METADATA
        # ---------------------------------------------------------
        for a in db_sql.query(Account).all():
            db_firestore.collection('accounts').document(str(a.id)).set({
                "email": a.email,
                "role": a.role
                # Explicit omission of password_hash to comply with zero-trust 
                # security protocols for external cloud backups.
            })

        for s in db_sql.query(StudentProfile).all():
            db_firestore.collection('student_profiles').document(str(s.id)).set({
                "name": s.name, 
                "phone": s.phone, 
                "account_id": s.account_id
            })

        # ---------------------------------------------------------
        # CAMPUS TOPOLOGY
        # ---------------------------------------------------------
        for h in db_sql.query(Hostel).all():
            db_firestore.collection('hostels').document(str(h.id)).set({
                "name": h.name, 
                "total_rooms": h.total_rooms, 
                "total_floors": h.total_floors
            })

        for r in db_sql.query(Room).all():
            db_firestore.collection('rooms').document(str(r.id)).set({
                "room_number": r.room_number, 
                "capacity": r.capacity,
                "current_occupancy": r.current_occupancy, 
                "hostel_id": r.hostel_id
            })

        # ---------------------------------------------------------
        # ALLOCATIONS & WORKFLOWS
        # ---------------------------------------------------------
        for alloc in db_sql.query(RoomAllocation).all():
            db_firestore.collection('room_allocations').document(str(alloc.id)).set({
                "student_id": alloc.student_id, 
                "room_id": alloc.room_id,
                "is_active": alloc.is_active, 
                "start_date": alloc.start_date.isoformat() if alloc.start_date else None
            })

        for c in db_sql.query(Complaint).all():
            db_firestore.collection('complaints').document(str(c.id)).set({
                "student_id": c.student_id, 
                "room_id": c.room_id,
                "category": c.category, 
                "description": c.description,
                "status": c.status, 
                "priority": c.priority
            })

        for req in db_sql.query(RoomChangeRequest).all():
            db_firestore.collection('room_change_requests').document(str(req.id)).set({
                "student_id": req.student_id, 
                "current_room_id": req.current_room_id,
                "requested_room_id": req.requested_room_id, 
                "reason": req.reason,
                "status": req.status
            })

        # ---------------------------------------------------------
        # FINANCIALS & AUDIT LOGS
        # ---------------------------------------------------------
        for f in db_sql.query(FeeRecord).all():
            db_firestore.collection('fee_records').document(str(f.id)).set({
                "student_id": f.student_id, 
                "amount": f.amount,
                "fee_type": f.fee_type, 
                "status": f.status,
                "receipt_image_url": f.receipt_image_url
            })
            
        for log in db_sql.query(BackupLog).all():
            db_firestore.collection('backup_logs').document(str(log.id)).set({
                "snapshot_id": log.snapshot_id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "trigger_type": log.trigger_type,
                "status": log.status
            })

        return {"status": "success", "message": "Complete database snapshot successfully pushed to Firebase Cloud Firestore."}
    
    except Exception as e:
        # In a strict production environment, this would route to a logging service (e.g., Sentry, Datadog)
        return {"status": "error", "message": f"Cloud Sync Failure: {str(e)}"}