from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ==========================================
# AUTHENTICATION & IDENTITY SCHEMAS
# ==========================================

class Token(BaseModel):
    """Data Transfer Object (DTO) for standard OAuth2 JWT payloads."""
    access_token: str
    token_type: str
    
class AccountLogin(BaseModel):
    """Validates incoming login credentials from the client."""
    email: EmailStr
    password: str
    
class AccountCreate(BaseModel):
    """Validates payload for registering new identities via the Admin portal."""
    email: EmailStr
    password: str
    role: str
    
class AccountResponse(BaseModel):
    """Serializes the Account ORM model for client-side consumption."""
    id: int
    email: EmailStr
    role: str
    
    # Allows Pydantic to read directly from SQLAlchemy ORM objects
    model_config = {"from_attributes": True}
        

# ==========================================
# HOSTEL & ROOM MANAGEMENT SCHEMAS
# ==========================================

class HostelCreate(BaseModel):
    """Validates required initialization parameters for generating a new hostel."""
    name: str
    total_rooms: int
    total_floors: int

class RoomResponse(BaseModel):
    """Serializes specific physical room metrics and capacity states."""
    id: int
    room_number: str
    capacity: int
    current_occupancy: int
    
    model_config = {"from_attributes": True}
    
class HostelResponse(BaseModel):
    """
    Nested serialization model. 
    Returns a hostel alongside a list of its dependent rooms.
    """
    id: int
    name: str
    total_rooms: int
    rooms: List[RoomResponse] = []
    
    model_config = {"from_attributes": True}
    

# ==========================================
# ROOM ALLOCATION SCHEMAS
# ==========================================

class RoomAllocationCreate(BaseModel):
    """Validates incoming requests to map a student to a physical room."""
    student_id: int
    room_id: int
    start_date: datetime
    
class RoomAllocationResponse(BaseModel):
    """Serializes historical and active temporal allocation records."""
    id: int
    student_id: int
    room_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    
    model_config = {"from_attributes": True}
    

# ==========================================
# FINANCIAL & FEE SCHEMAS
# ==========================================

class FeeRecordCreate(BaseModel):
    """Validates incoming ledger generation payloads (e.g., dynamic billing)."""
    student_id: int
    amount: float
    fee_type: str 
    
class FeeRecordResponse(BaseModel):
    """Serializes financial ledgers, including static asset URLs for receipts."""
    id: int
    student_id: int
    amount: float
    fee_type: str
    status: str 
    receipt_image_url: Optional[str] = None
    
    model_config = {"from_attributes": True}
    

# ==========================================
# MAINTENANCE & COMPLAINT SCHEMAS
# ==========================================

class ComplaintCreate(BaseModel):
    """Validates incoming student maintenance tickets."""
    room_id: int
    category: str
    description: str
    priority: str 
    
class ComplaintResponse(BaseModel):
    """Serializes the ticketing queue for both student and admin dashboards."""
    id: int
    room_id: int
    student_id: int
    category: str
    description: str
    status: str 
    priority: str
    
    model_config = {"from_attributes": True}