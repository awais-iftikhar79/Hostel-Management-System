from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Account(Base):
    """
    Core authentication table. 
    Handles identity and Role-Based Access Control (RBAC) mapping.
    """
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Configured for 'admin' or 'student'
    
    # Relationships
    student_profile = relationship("StudentProfile", back_populates="account")    

class StudentProfile(Base):
    """
    Central hub for student metadata. 
    Linked 1-to-1 with the authentication Account entity.
    """
    __tablename__ = 'student_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), unique=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Relationships
    account = relationship("Account", back_populates="student_profile")    
    fees = relationship("FeeRecord", back_populates="student")
    allocations = relationship("RoomAllocation", back_populates="student")
    complaints = relationship("Complaint", back_populates="student")
    room_change_requests = relationship("RoomChangeRequest", back_populates="student")  

class Hostel(Base):
    """
    Top-level geographical entity representing a physical building on campus.
    """
    __tablename__ = 'hostels'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    total_rooms = Column(Integer, nullable=False)
    total_floors = Column(Integer, default=1)
    
    # Relationships
    rooms = relationship("Room", back_populates="hostel")
    
class Room(Base):
    """
    Physical living space entity. 
    Tracks dynamic capacity constraints to prevent overbooking.
    """
    __tablename__ = 'rooms'
    
    id = Column(Integer, primary_key=True, index=True)
    hostel_id = Column(Integer, ForeignKey('hostels.id'), nullable=False)
    room_number = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    floor = Column(String, default="Ground Floor")
    
    # Relationships
    hostel = relationship("Hostel", back_populates="rooms")
    allocations = relationship("RoomAllocation", back_populates="room")    
    complaints = relationship("Complaint", back_populates="room")
    current_room_requests = relationship("RoomChangeRequest", foreign_keys="RoomChangeRequest.current_room_id", back_populates="current_room")
    requested_room_requests = relationship("RoomChangeRequest", foreign_keys="RoomChangeRequest.requested_room_id", back_populates="requested_room")

class RoomAllocation(Base):
    """
    Temporal junction table mapping students to rooms. 
    Preserves historical allocation records using start/end dates.
    """
    __tablename__ = 'room_allocations'
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="allocations")
    room = relationship("Room", back_populates="allocations")    

class FeeRecord(Base):
    """
    Financial ledger tracking individual student payments and receipt verifications.
    """
    __tablename__ = 'fee_records'
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    amount = Column(Integer, nullable=False)
    fee_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    receipt_image_url = Column(Text, nullable=True)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="fees")
    
class Complaint(Base):
    """
    Maintenance ticketing system linking specific room issues to the reporting student.
    """
    __tablename__ = 'complaints'
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="complaints")
    student = relationship("StudentProfile", back_populates="complaints")
    
class RoomChangeRequest(Base):
    """
    Approval workflow entity managing student transfer requests between rooms.
    """
    __tablename__ = 'room_change_requests'
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    current_room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    requested_room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="room_change_requests")
    current_room = relationship("Room", foreign_keys=[current_room_id], back_populates="current_room_requests")
    requested_room = relationship("Room", foreign_keys=[requested_room_id], back_populates="requested_room_requests")