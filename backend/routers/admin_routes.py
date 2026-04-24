from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db

from models.model import Account, StudentProfile, Hostel, Room, RoomAllocation, FeeRecord, Complaint, RoomChangeRequest
from schemas.schema import AccountCreate, AccountResponse, HostelCreate, HostelResponse, RoomAllocationCreate, RoomAllocationResponse, ComplaintResponse
from auth.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

# 1. Create a Hostel and its Rooms
@router.post("/hostels", response_model=HostelResponse)
def create_hostel(hostel: HostelCreate, db: Session = Depends(get_db)):
    existing_hostel = db.query(Hostel).filter(Hostel.name == hostel.name).first()
    if existing_hostel:
        raise HTTPException(status_code=400, detail="Hostel with this name already exists.")
    
    new_hostel = Hostel(name=hostel.name, total_rooms=hostel.total_rooms)
    db.add(new_hostel)
    db.commit()
    db.refresh(new_hostel)
    
    for i in range(1, hostel.total_rooms + 1):
        room_number = f"{new_hostel.id}{str(i).zfill(2)}"
        new_room = Room(hostel_id=new_hostel.id, room_number=room_number, capacity=4)
        db.add(new_room)
    
    db.commit()
    db.refresh(new_hostel)
    return new_hostel

# 2. Get All Hostels (For Dropdowns)
@router.get("/hostels", response_model=List[HostelResponse])
def get_all_hostels(db: Session = Depends(get_db)):
    hostels = db.query(Hostel).all()
    return hostels

# 3. Register a Student
@router.post("/students", response_model=AccountResponse)
def register_student(student: AccountCreate, db: Session = Depends(get_db)):
    existing_account = db.query(Account).filter(Account.email == student.email).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = get_password_hash(student.password)
    
    new_account = Account(email=student.email, password_hash=hashed_password, role="student")
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    name = student.email.split("@")[0]
    student_profile = StudentProfile(account_id=new_account.id, name=name)
    db.add(student_profile)
    db.commit()
    
    return new_account

# 4. Get All Students
@router.get("/students")
def get_all_students(db: Session = Depends(get_db)):
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

# 5. Allot a Room to a Student
@router.post("/allot", response_model=RoomAllocationResponse)
def allot_room(allocation: RoomAllocationCreate, db: Session = Depends(get_db)):    
    student = db.query(StudentProfile).filter(StudentProfile.id == allocation.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    room = db.query(Room).filter(Room.id == allocation.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
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

# 6. The "Hostel Map" Data
@router.get("/hostel-map/{hostel_id}", response_model=HostelResponse)
def get_hostel_map(hostel_id: int, db: Session = Depends(get_db)):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    
    for room in hostel.rooms:
        room.allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        room.complaints = db.query(Complaint).filter(Complaint.room_id == room.id, Complaint.status != 'Resolved').all()
    
    return hostel

# 7. Electricity Bill Splitter
@router.post("/split-bill")
def split_bill(room_id: int, total_amount: float, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
    active_allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room_id, RoomAllocation.is_active == True).all()
    if not active_allocations:
        raise HTTPException(status_code=400, detail="No active allocations for this room.")
    
    amount_per_student = total_amount / len(active_allocations)
    
    for allocation in active_allocations:
        fee_record = FeeRecord(
            student_id=allocation.student_id, 
            amount=int(amount_per_student), 
            fee_type="Electricity",
            status="Pending" 
        )
        db.add(fee_record)
    
    db.commit()
    return {"message": f"Electricity bill split successfully."}

# 8. Get All Complaints
@router.get("/complaints")
def get_all_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).all()
    result = []
    for c in complaints:
        student = db.query(StudentProfile).filter(StudentProfile.id == c.student_id).first()
        room = db.query(Room).filter(Room.id == c.room_id).first()
        initials = "U"
        if student and student.name:
            parts = student.name.split()
            initials = "".join([p[0].upper() for p in parts[:2]])
            
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

# 9. Update Complaint Status
@router.put("/complaints/{complaint_id}")
def update_complaint_status(complaint_id: int, status_update: dict, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = status_update.get("status")
    db.commit()
    return {"message": f"Status updated to {complaint.status}"}

# 10. Get All Room Exchanges
@router.get("/room-exchanges")
def get_room_exchanges(db: Session = Depends(get_db)):
    exchanges = db.query(RoomChangeRequest).all()
    result = []
    for req in exchanges:
        student = db.query(StudentProfile).filter(StudentProfile.id == req.student_id).first()
        current_room = db.query(Room).filter(Room.id == req.current_room_id).first()
        target_room = db.query(Room).filter(Room.id == req.target_room_id).first()
        
        initials = "U"
        if student and student.name:
            parts = student.name.split()
            initials = "".join([p[0].upper() for p in parts[:2]])
            
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

# 11. Update Room Exchange Status
@router.put("/room-exchanges/{exchange_id}")
def update_exchange_status(exchange_id: int, status_update: dict, db: Session = Depends(get_db)):
    exchange = db.query(RoomChangeRequest).filter(RoomChangeRequest.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Request not found")
    
    new_status = status_update.get("status")
    exchange.status = new_status
    
    if new_status == 'Approved':
        allocation = db.query(RoomAllocation).filter(
            RoomAllocation.student_id == exchange.student_id, 
            RoomAllocation.is_active == True
        ).first()
        
        if allocation:
            old_room = db.query(Room).filter(Room.id == allocation.room_id).first()
            if old_room and old_room.current_occupancy > 0:
                old_room.current_occupancy -= 1
            
            new_room = db.query(Room).filter(Room.id == exchange.target_room_id).first()
            if new_room:
                new_room.current_occupancy += 1
            
            allocation.room_id = exchange.target_room_id

    db.commit()
    return {"message": f"Status updated to {exchange.status}"}

# --- NEW ROUTES FOR PAYMENTS ---

# 12. Get All Payments (Fee Records)
@router.get("/payments")
def get_all_payments(db: Session = Depends(get_db)):
    payments = db.query(FeeRecord).all()
    result = []
    for p in payments:
        student = db.query(StudentProfile).filter(StudentProfile.id == p.student_id).first()
        result.append({
            "id": p.id,
            "student_id_str": f"STU-{2026}-{str(p.student_id).zfill(4)}" if p.student_id else "N/A",
            "student_name": student.name if student else "Unknown",
            "fee_type": p.fee_type,
            "amount": p.amount,
            "status": p.status
        })
    return result

# 13. Update Payment Status
@router.put("/payments/{payment_id}")
def update_payment_status(payment_id: int, status_update: dict, db: Session = Depends(get_db)):
    payment = db.query(FeeRecord).filter(FeeRecord.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    payment.status = status_update.get("status")
    db.commit()
    return {"message": f"Payment status updated to {payment.status}"}