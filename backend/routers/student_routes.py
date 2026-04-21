from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.model import StudentProfile, RoomAllocation, FeeRecord, Complaint, RoomChangeRequest
from schemas.schema import ComplaintResponse # We will use simple inputs for the POST routes

router = APIRouter(prefix="/student", tags=["Student Panel"])

# --- 1. VIEW MY ROOM ---
@router.get("/my-room/{student_id}")
def get_my_room(student_id: int, db: Session = Depends(get_db)):
    """
    Finds the active RoomAllocation for the student and returns the room details.
    """
    # PROMPT FOR COPILOT: 
    # Query RoomAllocation where student_id == student_id and is_active == True. 
    # Include the related room data. If none, return 404 "No active room allocated."
    allocation = db.query(RoomAllocation).filter(RoomAllocation.student_id == student_id, RoomAllocation.is_active == True).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="No active room allocated.")
    
    return allocation.room

# --- 2. SUBMIT A COMPLAINT ---
@router.post("/complaint")
def submit_complaint(student_id: int, room_id: int, category: str, description: str, db: Session = Depends(get_db)):
    """
    Allows a student to report an issue (e.g., "Plumbing", "Broken Fan").
    """
    # PROMPT FOR COPILOT:
    # Create a new Complaint with the provided data. 
    # Set status="Open" and priority="Medium". Save to db and return the complaint.
    new_complaint = Complaint(
        student_id=student_id,
        room_id=room_id,
        category=category,
        description=description,
        status="Open",
        priority="Medium"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint    

# --- 3. REQUEST A ROOM CHANGE ---
@router.post("/room-change")
def request_room_change(student_id: int, current_room_id: int, requested_room_id: int, reason: str, db: Session = Depends(get_db)):
    """
    Student requests to move to a different room.
    """
    # PROMPT FOR COPILOT:
    # Create a RoomChangeRequest with status="Pending". Save and return it.
    new_request = RoomChangeRequest(
        student_id=student_id,
        current_room_id=current_room_id,
        requested_room_id=requested_room_id,
        reason=reason,
        status="Pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

# --- 4. VIEW MY FEES ---
@router.get("/my-fees/{student_id}")
def get_my_fees(student_id: int, db: Session = Depends(get_db)):
    """
    Returns all fee records (Electricity, Rent) for the student.
    """
    # PROMPT FOR COPILOT:
    # Query all FeeRecords where student_id == student_id. Return the list.
    fee_records = db.query(FeeRecord).filter(FeeRecord.student_id == student_id).all()
    return fee_records