from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.model import Account, StudentProfile, RoomAllocation, Room, Hostel, FeeRecord, Complaint, RoomChangeRequest

router = APIRouter(prefix="/student", tags=["Student Operations"])

@router.get("/dashboard/{email}")
def get_student_dashboard(email: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.email == email).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    # 1. Get Room Info
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == student.id, 
        RoomAllocation.is_active == True
    ).first()

    room_data = None
    if allocation and allocation.room:
        room = allocation.room
        hostel = db.query(Hostel).filter(Hostel.id == room.hostel_id).first()
        
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

    # 2. Get Financials
    fees = db.query(FeeRecord).filter(FeeRecord.student_id == student.id, FeeRecord.status == "Pending").all()
    total_balance = sum(f.amount for f in fees)
    fee_details = [{"type": f.fee_type, "amount": f.amount} for f in fees]

    # 3. Get Recent Activity
    complaints = db.query(Complaint).filter(Complaint.student_id == student.id).all()
    exchanges = db.query(RoomChangeRequest).filter(RoomChangeRequest.student_id == student.id).all()
    
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

# Get All Complaints
@router.get("/complaints/{email}")
def get_student_complaints(email: str, db: Session = Depends(get_db)):
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

# Lodge Complaint
@router.post("/complaints")
def submit_complaint(data: dict, db: Session = Depends(get_db)):
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

# --- NEW ROUTE: Get Student Exchange History ---
@router.get("/exchanges/{email}")
def get_student_exchanges(email: str, db: Session = Depends(get_db)):
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

# Submit Exchange
@router.post("/exchange-request")
def submit_room_exchange(data: dict, db: Session = Depends(get_db)):
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

# --- NEW ROUTE: Get Student Payment History ---
@router.get("/payments/{email}")
def get_student_payments(email: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.email == email).first()
    student = db.query(StudentProfile).filter(StudentProfile.account_id == account.id).first()
    
    # Fetch all fee records for this student
    fees = db.query(FeeRecord).filter(FeeRecord.student_id == student.id).order_by(FeeRecord.id.desc()).all()
    
    # Calculate outstanding balance (only Open or Pending fees)
    total_outstanding = sum(f.amount for f in fees if f.status in ["Pending", "Open", "Overdue"])
    
    # Group pending fees for the breakdown cards
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
            "date": "Recent" # Placeholder since we didn't add timestamps to the FeeRecord model
        })
        
    return {
        "total_outstanding": total_outstanding,
        "breakdown": breakdown,
        "history": history
    }