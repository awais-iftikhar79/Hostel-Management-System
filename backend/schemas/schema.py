from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---
# 1. Create a 'Token' schema: access_token (str), token_type (str).
class Token(BaseModel):
    access_token: str
    token_type: str
    
# 2. Create an 'AccountLogin' schema: email (EmailStr), password (str).
class AccountLogin(BaseModel):
    email: EmailStr
    password: str
    
# 3. Create an 'AccountCreate' schema (For Admin use only): email (EmailStr), password (str), role (str).
class AccountCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # 'admin' or 'student'
    
# 4. Create an 'AccountResponse' schema: id (int), email (EmailStr), role (str). 
# Add model_config = {"from_attributes": True} inside the class.
class AccountResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    
    model_config = {"from_attributes": True}
        
# --- HOSTEL & ROOM SCHEMAS ---
# 5. Create a 'RoomResponse' schema: id, room_number, capacity, current_occupancy. (Add from_attributes config)
class RoomResponse(BaseModel):
    id: int
    room_number: str
    capacity: int
    current_occupancy: int
    
    model_config = {"from_attributes": True}
    
# 6. Create a 'HostelResponse' schema: id, name, total_rooms, rooms (List[RoomResponse] default []). (Add from_attributes config)
class HostelResponse(BaseModel):
    id: int
    name: str
    total_rooms: int
    rooms: List[RoomResponse] = []
    
    model_config = {"from_attributes": True}
    

# --- ALLOCATION SCHEMAS ---
# 7. Create a 'RoomAllocationCreate' schema: student_id, room_id, start_date.
class RoomAllocationCreate(BaseModel):
    student_id: int
    room_id: int
    start_date: datetime
    
# 8. Create a 'RoomAllocationResponse' schema: id, student_id, room_id, start_date, end_date (Optional), is_active. (Add from_attributes config)
class RoomAllocationResponse(BaseModel):
    id: int
    student_id: int
    room_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    
    model_config = {"from_attributes": True}
    

# --- FEE SCHEMAS ---
# 9. Create a 'FeeRecordCreate' schema: student_id, amount, fee_type.
class FeeRecordCreate(BaseModel):
    student_id: int
    amount: float
    fee_type: str  # 'hostel_fee', 'late_fee', etc.
    
# 10. Create a 'FeeRecordResponse' schema: id, student_id, amount, fee_type, status, receipt_image_url (Optional). (Add from_attributes config)
class FeeRecordResponse(BaseModel):
    id: int
    student_id: int
    amount: float
    fee_type: str
    status: str  # 'pending', 'approved', 'rejected'
    receipt_image_url: Optional[str] = None
    
    model_config = {"from_attributes": True}
    

# --- COMPLAINT SCHEMAS ---
# 11. Create a 'ComplaintCreate' schema: room_id, category, description, priority.
class ComplaintCreate(BaseModel):
    room_id: int
    category: str
    description: str
    priority: str  # 'low', 'medium', 'high'
    
# 12. Create a 'ComplaintResponse' schema: id, room_id, student_id, category, description, status, priority. (Add from_attributes config)
class ComplaintResponse(BaseModel):
    id: int
    room_id: int
    student_id: int
    category: str
    description: str
    status: str  # 'open', 'in_progress', 'resolved'
    priority: str
    
    model_config = {"from_attributes": True}
    

class HostelCreate(BaseModel):
    name: str
    total_rooms: int