from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db

# Cleaned up imports!
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
    db.refresh(new_hostel) # Refresh to load the newly created rooms!
    return new_hostel

# 2. Register a Student
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

# 3. Allot a Room to a Student
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

# 4. The "Hostel Map" Data
@router.get("/hostel-map/{hostel_id}", response_model=HostelResponse)
def get_hostel_map(hostel_id: int, db: Session = Depends(get_db)):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    
    for room in hostel.rooms:
        room.allocations = db.query(RoomAllocation).filter(RoomAllocation.room_id == room.id, RoomAllocation.is_active == True).all()
        # FIXED: Changed is_resolved to status != 'Resolved'
        room.complaints = db.query(Complaint).filter(Complaint.room_id == room.id, Complaint.status != 'Resolved').all()
    
    return hostel

# 5. Electricity Bill Splitter
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
        # FIXED: Casted amount to int, added status!
        fee_record = FeeRecord(
            student_id=allocation.student_id, 
            amount=int(amount_per_student), 
            fee_type="Electricity",
            status="Pending" 
        )
        db.add(fee_record)
    
    db.commit()
    return {"message": f"Electricity bill of {total_amount} split among {len(active_allocations)} students. Each student charged {int(amount_per_student)}."}