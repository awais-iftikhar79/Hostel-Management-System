from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.model import Account, StudentProfile, RoomAllocation, Room, Hostel, FeeRecord, Complaint, RoomChangeRequest
import shutil
import os
import uuid
import base64

router = APIRouter(prefix="/student", tags=["Student Operations"])

@router.get("/dashboard/{email}")
def get_student_dashboard(email: str, db: Session = Depends(get_db)):
    """
    Aggregates a comprehensive overview for the student portal homepage.
    Performs multi-table joins to retrieve current housing, roommate data, 
    pending financial liabilities, and recent system activities.
    """
    account = db.query(Account).filter(Account.email == email).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    # Phase 1: Aggregate housing allocation and roommate data
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == student.id, 
        RoomAllocation.is_active == True
    ).first()

    room_data = None
    if allocation and allocation.room:
        room = allocation.room
        hostel = db.query(Hostel).filter(Hostel.id == room.hostel_id).first()
        
        # Identify active roommates excluding the requesting student
        roommates_alloc = db.query(RoomAllocation).filter(
            RoomAllocation.room_id == room.id,
            RoomAllocation.is_active == True,
            RoomAllocation.student_id != student.id
        ).all()
        
        roommates = []
        for rm_alloc in roommates_alloc:
            rm_profile = db.query(StudentProfile).filter(StudentProfile.id == rm_alloc.student_id).first()
            if rm_profile:
                roommates.append(rm_profile.name)
                
        room_data = {
            "room_number": room.room_number,
            "hostel_name": hostel.name if hostel else "Campus Hostel",
            "roommates": roommates
        }

    # Phase 2: Compute outstanding financial liabilities
    fees = db.query(FeeRecord).filter(FeeRecord.student_id == student.id, FeeRecord.status == "Pending").all()
    total_balance = sum(f.amount for f in fees)
    fee_details = [{"type": f.fee_type, "amount": f.amount} for f in fees]

    # Phase 3: Compile recent ticketing and transfer activity
    complaints = db.query(Complaint).filter(Complaint.student_id == student.id).all()
    exchanges = db.query(RoomChangeRequest).filter(RoomChangeRequest.student_id == student.id).all()
    
    # Sort chronologically and limit payload size for dashboard performance
    complaints = sorted(complaints, key=lambda x: x.id, reverse=True)[:3]
    exchanges = sorted(exchanges, key=lambda x: x.id, reverse=True)[:2]

    activities = []
    for c in complaints:
        activities.append({
            "type": "Complaint",
            "title": c.category,
            "desc": c.description,
            "status": c.status,
            "icon": "plumbing" if c.category == 'Plumbing' else "electrical_services" if c.category == 'Electrical' else "report_problem"
        })
        
    for e in exchanges:
        activities.append({
            "type": "Exchange",
            "title": "Room Exchange Request",
            "desc": f"Requested Room ID: {e.requested_room_id}",
            "status": e.status,
            "icon": "swap_horiz"
        })

    return {
        "student_name": student.name,
        "room": room_data,
        "financials": {
            "total_balance": total_balance,
            "details": fee_details
        },
        "recent_activity": activities
    }

@router.get("/complaints/{email}")
def get_student_complaints(email: str, db: Session = Depends(get_db)):
    """
    Retrieves the complete maintenance ticketing history for a specific student.
    """
    account = db.query(Account).filter(Account.email == email).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    complaints = db.query(Complaint).filter(Complaint.student_id == student.id).order_by(Complaint.id.desc()).all()
    
    result = []
    for c in complaints:
        result.append({
            "id": c.id,
            "ticket_id": f"TK-{str(c.id).zfill(4)}",
            "category": c.category,
            "description": c.description,
            "status": c.status
        })
    return result

@router.post("/complaints")
def submit_complaint(data: dict, db: Session = Depends(get_db)):
    """
    Registers a new maintenance ticket. 
    Enforces a validation check to ensure the student has an active room assignment.
    """
    account = db.query(Account).filter(Account.email == data['email']).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    allocation = db.query(RoomAllocation).filter(RoomAllocation.student_id == student.id, RoomAllocation.is_active == True).first()
    
    if not allocation:
        raise HTTPException(status_code=400, detail="You must be assigned to a room to lodge a complaint.")
        
    new_complaint = Complaint(
        student_id=student.id,
        room_id=allocation.room_id,
        category=data['category'],
        description=data['description'],
        status="Pending",
        priority="Normal"
    )
    db.add(new_complaint)
    db.commit()
    return {"message": "Success"}

@router.get("/exchanges/{email}")
def get_student_exchanges(email: str, db: Session = Depends(get_db)):
    """
    Retrieves the chronological history of room transfer requests for a student.
    """
    account = db.query(Account).filter(Account.email == email).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    exchanges = db.query(RoomChangeRequest).filter(RoomChangeRequest.student_id == student.id).order_by(RoomChangeRequest.id.desc()).all()
    
    result = []
    for e in exchanges:
        result.append({
            "id": e.id,
            "target_room": e.requested_room_id,
            "reason": e.reason,
            "status": e.status
        })
    return result

@router.post("/exchange-request")
def submit_room_exchange(data: dict, db: Session = Depends(get_db)):
    """
    Initiates a workflow request for a room transfer.
    """
    account = db.query(Account).filter(Account.email == data['email']).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == student.id, 
        RoomAllocation.is_active == True
    ).first()
    
    if not allocation:
        raise HTTPException(status_code=400, detail="You must have an assigned room to request an exchange.")

    new_request = RoomChangeRequest(
        student_id=student.id,
        current_room_id=allocation.room_id,
        requested_room_id=int(data['requested_room_id']), 
        reason=data['reason'],
        status="Pending"
    )
    
    db.add(new_request)
    db.commit()
    return {"message": "Exchange request submitted successfully"}

@router.get("/payments/{email}")
def get_student_payments(email: str, db: Session = Depends(get_db)):
    """
    Compiles the student's personal financial ledger.
    Calculates total outstanding debts and breaks them down by fee categories (Rent, Mess, Electricity).
    """
    account = db.query(Account).filter(Account.email == email).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    fees = db.query(FeeRecord).filter(FeeRecord.student_id == student.id).order_by(FeeRecord.id.desc()).all()
    
    total_outstanding = sum(f.amount for f in fees if f.status in ["Pending", "Open", "Overdue"])
    
    breakdown = {
        "Electricity": sum(f.amount for f in fees if f.fee_type == "Electricity" and f.status in ["Pending", "Open"]),
        "Mess": sum(f.amount for f in fees if f.fee_type == "Mess" and f.status in ["Pending", "Open"]),
        "Rent": sum(f.amount for f in fees if f.fee_type == "Rent" and f.status in ["Pending", "Open"])
    }
    
    history = []
    for f in fees:
        history.append({
            "id": f.id,
            "invoice_id": f"#INV-{str(f.id).zfill(4)}",
            "fee_type": f.fee_type,
            "amount": f.amount,
            "status": f.status,
            "date": "Recent" 
        })
        
    return {
        "total_outstanding": total_outstanding,
        "breakdown": breakdown,
        "history": history
    }

@router.post("/pay-bill/{fee_id}")
async def pay_bill(fee_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Reads the uploaded image, encodes it securely into a Base64 string, 
    and stores the raw image data directly inside the PostgreSQL database 
    as per academic requirements.
    """
    fee = db.query(FeeRecord).filter(FeeRecord.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    
    try:
        # 1. Read the raw binary bytes of the image
        file_bytes = await file.read()
        
        # 2. Convert the binary into a Base64 text string
        encoded_string = base64.b64encode(file_bytes).decode('utf-8')
        
        # 3. Format it so HTML/React can read it natively
        mime_type = file.content_type or "image/jpeg"
        base64_image_data = f"data:{mime_type};base64,{encoded_string}"
        
        # 4. Save the massive text string directly into PostgreSQL
        fee.receipt_image_url = base64_image_data 
        fee.status = "Under Review" 
        db.commit()
        
        return {"message": "Image saved directly to database successfully!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")