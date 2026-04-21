from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base

# 1. Create an 'Account' model: id, email, password_hash, role (String: admin or student).
class Account(Base):
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'student'
    
    # Relationship to Student (one-to-one)
    student_profile = relationship("StudentProfile", back_populates="account")    
# 2. Create a 'StudentProfile' model: id, account_id (ForeignKey to Account), name, phone. Add a relationship back to Account.
class StudentProfile(Base):
    __tablename__ = 'student_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), unique=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Relationship back to Account
    fees = relationship("FeeRecord", back_populates="student")
    allocations = relationship("RoomAllocation", back_populates="student")
    account = relationship("Account", back_populates="student_profile")    
    complaints = relationship("Complaint", back_populates="student")
    room_change_requests = relationship("RoomChangeRequest", back_populates="student")  
# 3. Create a 'Hostel' model: id, name, total_rooms.
class Hostel(Base):
    __tablename__ = 'hostels'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    total_rooms = Column(Integer, nullable=False)
    
    # Relationship to Room (one-to-many)
    rooms = relationship("Room", back_populates="hostel")
    
# 4. Create a 'Room' model: id, hostel_id (ForeignKey to Hostel), room_number, capacity, current_occupancy. Add a relationship to Hostel.
class Room(Base):
    __tablename__ = 'rooms'
    
    id = Column(Integer, primary_key=True, index=True)
    hostel_id = Column(Integer, ForeignKey('hostels.id'), nullable=False)
    room_number = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    
    # Relationship to Hostel
    hostel = relationship("Hostel", back_populates="rooms")
    
    # Relationship to Booking (one-to-many)
    allocations = relationship("RoomAllocation", back_populates="room")    
    complaints = relationship("Complaint", back_populates="room")
    current_room_requests = relationship("RoomChangeRequest", foreign_keys="RoomChangeRequest.current_room_id", back_populates="current_room")
    requested_room_requests = relationship("RoomChangeRequest", foreign_keys="RoomChangeRequest.requested_room_id", back_populates="requested_room")
# 5. Create a 'RoomAllocation' model (For History): id, student_id (ForeignKey to StudentProfile), room_id (ForeignKey to Room), start_date, end_date (nullable), is_active (boolean default True).
class RoomAllocation(Base):
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
# 6. Create a 'FeeRecord' model: id, student_id (ForeignKey to StudentProfile), amount, fee_type (String: Electricity, Rent), status (String: Pending, Approved, Rejected), receipt_image_url (String nullable).
class FeeRecord(Base):
    __tablename__ = 'fee_records'
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    amount = Column(Integer, nullable=False)
    fee_type = Column(String, nullable=False)  # 'Electricity' or 'Rent'
    status = Column(String, nullable=False)  # 'Pending', 'Approved', 'Rejected'
    receipt_image_url = Column(String, nullable=True)
    
    # Relationship to StudentProfile
    student = relationship("StudentProfile", back_populates="fees")
    
    
# 7. Create a 'Complaint' model: id, room_id (ForeignKey to Room), student_id (ForeignKey to StudentProfile), category, description, status, priority.
class Complaint(Base):
    __tablename__ = 'complaints'
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'Open', 'In Progress', 'Resolved'
    priority = Column(String, nullable=False)  # 'Low', 'Medium', 'High'
    
    # Relationships
    room = relationship("Room", back_populates="complaints")
    student = relationship("StudentProfile", back_populates="complaints")
    
# 8. Create a 'RoomChangeRequest' model: id, student_id (ForeignKey to StudentProfile), current_room_id (ForeignKey to Room), requested_room_id (ForeignKey to Room), reason, status (String: Pending, Approved).
class RoomChangeRequest(Base):
    __tablename__ = 'room_change_requests'
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('student_profiles.id'), nullable=False)
    current_room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    requested_room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'Pending', 'Approved'
    
    # Relationships
    student = relationship("StudentProfile", back_populates="room_change_requests")
    current_room = relationship("Room", foreign_keys=[current_room_id], back_populates="current_room_requests")
    requested_room = relationship("Room", foreign_keys=[requested_room_id], back_populates="requested_room_requests")