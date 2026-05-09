from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import uuid
from datetime import datetime

from database import get_db
from firebase_sync import backup_postgres_to_firebase, restore_firebase_to_postgres
from models.model import (
    Account, StudentProfile, Hostel, Room, RoomAllocation, 
    FeeRecord, Complaint, RoomChangeRequest
)
from schemas.schema import (
    AccountCreate, AccountResponse, HostelCreate, HostelResponse, 
    RoomAllocationCreate, RoomAllocationResponse, ComplaintResponse
)
from auth.security import get_password_hash
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.post("/hostels", response_model=HostelResponse)
def create_hostel(hostel: HostelCreate, db: Session = Depends(get_db)):
    """
    Provisions a new hostel entity and autonomously generates its internal room hierarchy.
    Applies standard campus naming conventions (e.g., G-01, F1-01) based on floor distribution.
    """
    existing_hostel = db.query(Hostel).filter(Hostel.name == hostel.name).first()
    if existing_hostel:
        raise HTTPException(status_code=400, detail="Hostel with this name already exists.")
    
    new_hostel = Hostel(name=hostel.name, total_rooms=hostel.total_rooms, total_floors=hostel.total_floors)
    db.add(new_hostel)
    db.commit()
    db.refresh(new_hostel)
    
    # Calculate room distribution algorithmically
    rooms_per_floor = hostel.total_rooms // hostel.total_floors
    remainder = hostel.total_rooms % hostel.total_floors
    
    for floor_idx in range(hostel.total_floors):
        # Establish prefix nomenclature per floor level
        if floor_idx == 0:
            floor_name = "Ground Floor"
            prefix = "G"
        else:
            floor_name = f"{floor_idx}st Floor" if floor_idx == 1 else f"{floor_idx}nd Floor" if floor_idx == 2 else f"{floor_idx}rd Floor" if floor_idx == 3 else f"{floor_idx}th Floor"
            prefix = f"F{floor_idx}"
        
        rooms_this_floor = rooms_per_floor + (1 if floor_idx < remainder else 0)
        
        # Batch construct room entities
        for i in range(1, rooms_this_floor + 1):
            room_number = f"{prefix}-{str(i).zfill(2)}"
            new_room = Room(hostel_id=new_hostel.id, room_number=room_number, capacity=4, floor=floor_name)
            db.add(new_room)
    
    db.commit()
    db.refresh(new_hostel)
    return new_hostel

@router.get("/hostels", response_model=List[HostelResponse])
def get_all_hostels(db: Session = Depends(get_db)):
    """
    Retrieves the global campus overview of all registered hostels.
    """
    return db.query(Hostel).all()

@router.delete("/hostels/{hostel_id}")
def delete_hostel(hostel_id: int, db: Session = Depends(get_db)):
    """
    Executes a hard-delete on a hostel.
    Manages cascade deletion manually to prevent foreign key constraint violations 
    across allocations, complaints, and requests.
    """
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")

    # Isolate all child room IDs for bulk operation targeting
    rooms = db.query(Room).filter(Room.hostel_id == hostel_id).all()
    room_ids = [r.id for r in rooms]

    # Execute synchronized cascade deletions
    if room_ids:
        db.query(RoomAllocation).filter(RoomAllocation.room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(Complaint).filter(Complaint.room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(RoomChangeRequest).filter(RoomChangeRequest.current_room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(RoomChangeRequest).filter(RoomChangeRequest.requested_room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(Room).filter(Room.hostel_id == hostel_id).delete(synchronize_session=False)

    db.delete(hostel)
    db.commit()
    return {"message": "Hostel and all associated hierarchical data deleted successfully."}

@router.post("/students", response_model=AccountResponse)
def register_student(student: AccountCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_account = db.query(Account).filter(Account.email == student.email).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = get_password_hash(student.password)
    
    try:
        # 2. Create the Login Account
        new_account = Account(
            email=student.email, 
            password_hash=hashed_password, 
            role="student"
        )
        db.add(new_account)
        
        # We 'flush' to get the new_account.id without finishing the transaction yet
        db.flush() 
        
        # 3. Create the Student Profile (Linking to the account we just made)
        full_name = f"{student.first_name} {student.last_name}"
        new_profile = StudentProfile(
            account_id=new_account.id, 
            name=full_name,
            phone=None # Can be updated later
        )
        db.add(new_profile)
        
        # 4. Commit both at once
        db.commit()
        db.refresh(new_account)
        
        return new_account

    except Exception as e:
        db.rollback() # If anything fails, undo everything!
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/students")
def get_all_students(db: Session = Depends(get_db)):
    """
    Compiles a comprehensive directory of all students.
    Performs data aggregation across profiles, accounts, and active room allocations.
    """
    students = db.query(StudentProfile).all()
    result = []
    
    for student in students:
        allocation = db.query(RoomAllocation).filter(
            RoomAllocation.student_id == student.id, 
            RoomAllocation.is_active == True
        ).first()
        
        room_number = "Pending Allotment"
        hostel_id = "none"
        
        if allocation and allocation.room:
            room_number = allocation.room.room_number
            hostel_id = str(allocation.room.hostel_id)
            
        account = db.query(Account).filter(Account.id == student.account_id).first()
        
        result.append({
            "id": student.id,
            "student_id_str": f"STU-{2026}-{str(student.id).zfill(4)}",
            "name": student.name,
            "email": account.email if account else "No Email",
            "assigned_room": room_number,
            "hostel_id": hostel_id
        })
        
    return result

@router.post("/allot", response_model=RoomAllocationResponse)
def allot_room(allocation: RoomAllocationCreate, db: Session = Depends(get_db)):
    """
    Processes a room assignment request.
    Validates physical room capacity constraints before confirming the allocation.
    """
    student = db.query(StudentProfile).filter(StudentProfile.id == allocation.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    room = db.query(Room).filter(Room.id == allocation.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
    # Enforce strict capacity limits
    if room.current_occupancy >= room.capacity:
        raise HTTPException(status_code=400, detail="Room is already at full capacity.")
    
    new_allocation = RoomAllocation(
        student_id=allocation.student_id, 
        room_id=allocation.room_id, 
        start_date=allocation.start_date, 
        is_active=True
    )
    db.add(new_allocation)
    room.current_occupancy += 1
    db.commit()
    db.refresh(new_allocation)
    return new_allocation

@router.get("/hostel-map/{hostel_id}")
def get_hostel_map(hostel_id: int, db: Session = Depends(get_db)):
    """
    Generates a live topological map of a specific hostel.
    Aggregates room structures, current occupancy details, and active maintenance issues.
    """
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    
    rooms_data = []
    for room in hostel.rooms:
        allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        complaints = db.query(Complaint).filter(Complaint.room_id == room.id, Complaint.status != 'Resolved').all()
        
        rooms_data.append({
            "id": room.id,
            "room_number": room.room_number,
            "capacity": room.capacity,
            "current_occupancy": len(allocations), 
            "floor": getattr(room, "floor", "Ground Floor"),
            "allocations": [{"id": a.id, "student_id": a.student_id} for a in allocations],
            "complaints": [{"id": c.id, "category": c.category, "description": c.description, "status": c.status} for c in complaints]
        })
    
    return {
        "id": hostel.id,
        "name": hostel.name,
        "total_rooms": hostel.total_rooms,
        "total_floors": getattr(hostel, "total_floors", 1),
        "rooms": rooms_data
    }

@router.post("/generate-bills")
def generate_bills(data: dict, db: Session = Depends(get_db)):
    """
    Executes dynamic financial ledger distribution.
    Allows targeted billing (Global, Campus-wide, or Single Room) and computes equitable splits based on active occupancy.
    """
    fee_type = data.get("fee_type") 
    total_amount = float(data.get("total_amount"))
    target_type = data.get("target_type")
    hostel_id = data.get("hostel_id")
    room_number = data.get("room_number")

    rooms_to_bill = []
    
    # Establish billing target scope
    if target_type == "all":
        rooms_to_bill = db.query(Room).all()
    elif target_type == "hostel" and hostel_id:
        rooms_to_bill = db.query(Room).filter(Room.hostel_id == int(hostel_id)).all()
    elif target_type == "room" and room_number and hostel_id:
        room = db.query(Room).filter(Room.room_number == room_number, Room.hostel_id == int(hostel_id)).first()
        if room:
            rooms_to_bill.append(room)

    if not rooms_to_bill:
        raise HTTPException(status_code=404, detail="No rooms found matching the target criteria.")

    for room in rooms_to_bill:
        active_allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        
        if active_allocations:
            # Calculate equitable split logic
            amount_per_student = total_amount / len(active_allocations)
            
            for alloc in active_allocations:
                new_fee = FeeRecord(
                    student_id=alloc.student_id, 
                    amount=int(amount_per_student), 
                    fee_type=fee_type,
                    status="Pending" 
                )
                db.add(new_fee)
    
    db.commit()
    return {"message": f"{fee_type} billing cycle generated successfully."}

@router.get("/complaints")
def get_all_complaints(db: Session = Depends(get_db)):
    """
    Retrieves the global maintenance ticketing queue.
    """
    complaints = db.query(Complaint).all()
    result = []
    for c in complaints:
        student = db.query(StudentProfile).filter(StudentProfile.id == c.student_id).first()
        room = db.query(Room).filter(Room.id == c.room_id).first()
        initials = "U"
        if student and student.name:
            initials = "".join([p[0].upper() for p in student.name.split()[:2]])
            
        result.append({
            "id": c.id,
            "student_name": student.name if student else "Unknown",
            "student_initials": initials,
            "room_number": room.room_number if room else "N/A",
            "hostel_id": str(room.hostel_id) if room else "none",
            "category": c.category,
            "description": c.description,
            "status": c.status,
            "priority": c.priority
        })
    return result

@router.put("/complaints/{complaint_id}")
def update_complaint_status(complaint_id: int, status_update: dict, db: Session = Depends(get_db)):
    """
    Updates the resolution status of a specific maintenance ticket.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = status_update.get("status")
    db.commit()
    return {"message": f"Status successfully updated to {complaint.status}"}

@router.get("/room-exchanges")
def get_room_exchanges(db: Session = Depends(get_db)):
    """
    Fetches the queue of pending and processed student room transfer requests.
    """
    exchanges = db.query(RoomChangeRequest).all()
    result = []
    for req in exchanges:
        student = db.query(StudentProfile).filter(StudentProfile.id == req.student_id).first()
        current_room = db.query(Room).filter(Room.id == req.current_room_id).first()
        target_room = db.query(Room).filter(Room.id == req.requested_room_id).first()
        
        initials = "U"
        if student and student.name:
            initials = "".join([p[0].upper() for p in student.name.split()[:2]])
            
        result.append({
            "id": req.id,
            "student_id_str": f"STU-{2026}-{str(req.student_id).zfill(4)}",
            "student_name": student.name if student else "Unknown",
            "student_initials": initials,
            "current_room_number": current_room.room_number if current_room else "N/A",
            "target_room_number": target_room.room_number if target_room else "N/A",
            "hostel_id": str(current_room.hostel_id) if current_room else "none",
            "reason": req.reason,
            "status": req.status
        })
    return result

@router.put("/room-exchanges/{exchange_id}")
def update_exchange_status(exchange_id: int, status_update: dict, db: Session = Depends(get_db)):
    """
    Processes room transfer requests.
    If approved, automatically adjusts capacity metrics (decrementing origin, incrementing destination) 
    to maintain system data integrity.
    """
    exchange = db.query(RoomChangeRequest).filter(RoomChangeRequest.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Request not found")
    
    new_status = status_update.get("status")
    exchange.status = new_status
    
    # Execute allocation shift upon approval
    if new_status == 'Approved':
        allocation = db.query(RoomAllocation).filter(RoomAllocation.student_id == exchange.student_id, RoomAllocation.is_active == True).first()
        if allocation:
            old_room = db.query(Room).filter(Room.id == allocation.room_id).first()
            if old_room and old_room.current_occupancy > 0:
                old_room.current_occupancy -= 1
            
            new_room = db.query(Room).filter(Room.id == exchange.requested_room_id).first()
            if new_room:
                new_room.current_occupancy += 1
                
            allocation.room_id = exchange.requested_room_id

    db.commit()
    return {"message": f"Transfer status resolved as {exchange.status}"}

@router.get("/payments")
def get_all_payments(db: Session = Depends(get_db)):
    """
    Aggregates the global financial ledger, ordered chronologically.
    Includes relational data (Hostel/Floor) to support frontend dashboard filtering.
    """
    payments = db.query(FeeRecord).order_by(FeeRecord.id.desc()).all()
    result = []
    for p in payments:
        student = db.query(StudentProfile).filter(StudentProfile.id == p.student_id).first()
        allocation = db.query(RoomAllocation).filter(RoomAllocation.student_id == p.student_id, RoomAllocation.is_active == True).first()
        
        hostel_id = "none"
        floor = "Unassigned"
        if allocation and allocation.room:
            hostel_id = str(allocation.room.hostel_id)
            floor = getattr(allocation.room, "floor", "Ground Floor")
            
        result.append({
            "id": p.id,
            "student_id_str": f"STU-{2026}-{str(p.student_id).zfill(4)}" if p.student_id else "N/A",
            "student_name": student.name if student else "Unknown",
            "fee_type": p.fee_type,
            "amount": p.amount,
            "status": p.status,
            "receipt_url": p.receipt_image_url,
            "hostel_id": hostel_id,
            "floor": floor
        })
    return result

@router.put("/payments/{payment_id}")
def update_payment_status(payment_id: int, status_update: dict, db: Session = Depends(get_db)):
    """
    Processes manual admin verification of uploaded payment receipts.
    """
    payment = db.query(FeeRecord).filter(FeeRecord.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    payment.status = status_update.get("status")
    db.commit()
    return {"message": f"Ledger record status updated to {payment.status}"}

class StudentUpdate(BaseModel):
    name: str

@router.put("/students/{student_id}")
def update_student(student_id: int, student_data: StudentUpdate, db: Session = Depends(get_db)):
    """
    Updates mutable metadata on a student's profile.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")
        
    profile.name = student_data.name
    db.commit()
    return {"message": "Profile updated successfully."}

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """
    Executes a complete system purge of a student identity.
    Employs strict transaction rollbacks and manual cascade deletions to ensure 
    no orphaned financial, maintenance, or auth records are left behind.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")

    target_account_id = profile.account_id

    try:
        # Phase 1: Purge relational activity history
        db.query(RoomAllocation).filter(RoomAllocation.student_id == student_id).delete(synchronize_session=False)
        db.query(FeeRecord).filter(FeeRecord.student_id == student_id).delete(synchronize_session=False)
        db.query(Complaint).filter(Complaint.student_id == student_id).delete(synchronize_session=False)
        db.query(RoomChangeRequest).filter(RoomChangeRequest.student_id == student_id).delete(synchronize_session=False)

        # Phase 2: Purge core profile
        db.delete(profile)
        db.flush() 

        # Phase 3: Purge underlying authentication credentials
        db.query(Account).filter(Account.id == target_account_id).delete(synchronize_session=False)
            
        db.commit()
        return {"message": "Identity and comprehensive audit history purged successfully."}
        
    except Exception as e:
        # Failsafe transaction rollback
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Transaction Failed. Database Error: {str(e)}")

@router.post("/database/backup")
def trigger_cloud_backup(db: Session = Depends(get_db)):
    """
    Initiates a 1-to-1 data synchronization bridge between local PostgreSQL and Firebase NoSQL.
    """
    result = backup_postgres_to_firebase(db)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    
    return {"message": result["message"]}

@router.post("/database/restore")
def trigger_database_restore(db: Session = Depends(get_db)):
    """
    DISASTER RECOVERY: Triggers a pull from Firebase to repopulate the local database.
    This endpoint connects the frontend 'Restore' button to the cloud recovery logic.
    """
    # Execute the recovery logic from firebase_sync
    result = restore_firebase_to_postgres(db)
    
    # If the logic returns an error status, raise a 500 exception for the frontend
    if result["status"] == "error":
        raise HTTPException(
            status_code=500, 
            detail=f"Cloud Recovery Failed: {result['message']}"
        )
    
    return {"message": "Success: Local PostgreSQL has been synchronized with the latest cloud snapshot."}