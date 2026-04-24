from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db

from models.model import Account, StudentProfile, Hostel, Room, RoomAllocation, FeeRecord, Complaint, RoomChangeRequest
from schemas.schema import AccountCreate, AccountResponse, HostelCreate, HostelResponse, RoomAllocationCreate, RoomAllocationResponse, ComplaintResponse
from auth.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

# 1. Create a Hostel and its Rooms
# 1. Create a Hostel and its Rooms (With F1, F2 Naming Logic)
@router.post("/hostels", response_model=HostelResponse)
def create_hostel(hostel: HostelCreate, db: Session = Depends(get_db)):
    existing_hostel = db.query(Hostel).filter(Hostel.name == hostel.name).first()
    if existing_hostel:
        raise HTTPException(status_code=400, detail="Hostel with this name already exists.")
    
    new_hostel = Hostel(name=hostel.name, total_rooms=hostel.total_rooms, total_floors=hostel.total_floors)
    db.add(new_hostel)
    db.commit()
    db.refresh(new_hostel)
    
    rooms_per_floor = hostel.total_rooms // hostel.total_floors
    remainder = hostel.total_rooms % hostel.total_floors
    
    for floor_idx in range(hostel.total_floors):
        # Determine Prefix and Floor Name
        if floor_idx == 0:
            floor_name = "Ground Floor"
            prefix = "G"
        else:
            floor_name = f"{floor_idx}st Floor" if floor_idx == 1 else f"{floor_idx}nd Floor" if floor_idx == 2 else f"{floor_idx}rd Floor" if floor_idx == 3 else f"{floor_idx}th Floor"
            prefix = f"F{floor_idx}"
        
        rooms_this_floor = rooms_per_floor + (1 if floor_idx < remainder else 0)
        
        for i in range(1, rooms_this_floor + 1):
            room_number = f"{prefix}-{str(i).zfill(2)}" # Creates G-01, F1-01, etc.
            new_room = Room(hostel_id=new_hostel.id, room_number=room_number, capacity=4, floor=floor_name)
            db.add(new_room)
    
    db.commit()
    db.refresh(new_hostel)
    return new_hostel

# 2. Get All Hostels
@router.get("/hostels", response_model=List[HostelResponse])
def get_all_hostels(db: Session = Depends(get_db)):
    hostels = db.query(Hostel).all()
    return hostels

# --- NEW: Delete a Hostel ---
@router.delete("/hostels/{hostel_id}")
def delete_hostel(hostel_id: int, db: Session = Depends(get_db)):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")

    # Find all rooms for this hostel
    rooms = db.query(Room).filter(Room.hostel_id == hostel_id).all()
    room_ids = [r.id for r in rooms]

    # Clean up associated records so the database doesn't crash from foreign key constraints
    if room_ids:
        db.query(RoomAllocation).filter(RoomAllocation.room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(Complaint).filter(Complaint.room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(RoomChangeRequest).filter(RoomChangeRequest.current_room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(RoomChangeRequest).filter(RoomChangeRequest.requested_room_id.in_(room_ids)).delete(synchronize_session=False)
        db.query(Room).filter(Room.hostel_id == hostel_id).delete(synchronize_session=False)

    db.delete(hostel)
    db.commit()
    return {"message": "Hostel and all associated rooms deleted successfully."}

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

# 6. Get Hostel Map
@router.get("/hostel-map/{hostel_id}")
def get_hostel_map(hostel_id: int, db: Session = Depends(get_db)):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    
    rooms_data = []
    for room in hostel.rooms:
        # Fetch active allocations and unresolved complaints for this specific room
        allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        complaints = db.query(Complaint).filter(Complaint.room_id == room.id, Complaint.status != 'Resolved').all()
        
        # Manually construct the dictionary so FastAPI doesn't strip the data out
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

# 7. Dynamic Bill Generator (Rent, Mess, Electricity) - NEW!
@router.post("/generate-bills")
def generate_bills(data: dict, db: Session = Depends(get_db)):
    fee_type = data.get("fee_type") 
    total_amount = float(data.get("total_amount"))
    room_id = data.get("room_id") 

    rooms_to_bill = []
    if room_id == "all":
        rooms_to_bill = db.query(Room).all()
    else:
        room = db.query(Room).filter(Room.id == int(room_id)).first()
        if room:
            rooms_to_bill.append(room)

    for room in rooms_to_bill:
        # Find active members in the room
        active_allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        
        if active_allocations:
            # DIVIDE BILL EQUALLY AMONG MEMBERS
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
    return {"message": f"{fee_type} bills generated successfully."}

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

# 11. Update Room Exchange Status
@router.put("/room-exchanges/{exchange_id}")
def update_exchange_status(exchange_id: int, status_update: dict, db: Session = Depends(get_db)):
    exchange = db.query(RoomChangeRequest).filter(RoomChangeRequest.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Request not found")
    
    new_status = status_update.get("status")
    exchange.status = new_status
    
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
    return {"message": f"Status updated to {exchange.status}"}

# 12. Get All Payments - NEW! (Now includes your receipt_image_url)
@router.get("/payments")
def get_all_payments(db: Session = Depends(get_db)):
    payments = db.query(FeeRecord).order_by(FeeRecord.id.desc()).all()
    result = []
    for p in payments:
        student = db.query(StudentProfile).filter(StudentProfile.id == p.student_id).first()
        result.append({
            "id": p.id,
            "student_id_str": f"STU-{2026}-{str(p.student_id).zfill(4)}" if p.student_id else "N/A",
            "student_name": student.name if student else "Unknown",
            "fee_type": p.fee_type,
            "amount": p.amount,
            "status": p.status,
            "receipt_url": p.receipt_image_url  # Using your exact column name!
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