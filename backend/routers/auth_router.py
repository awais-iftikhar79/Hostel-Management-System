from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.model import Account
from auth.security import get_password_hash, verify_password, create_access_token

router = APIRouter(tags=["Authentication"])

# Copilot Prompts:
# 1. Create a POST route at "/login".
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 3. Inside the route: Query the 'Account' table for an account where email == form_data.username. (OAuth2 uses 'username' for the email field).
    account = db.query(Account).filter(Account.email == form_data.username).first()
    
    # 4. If account doesn't exist, OR if verify_password(form_data.password, account.password_hash) is False, raise HTTPException 401 (Invalid credentials).
    if not account or not verify_password(form_data.password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 5. If successful, generate an access_token containing {"sub": account.email, "role": account.role, "id": account.id}.
    access_token = create_access_token(data={"sub": account.email, "role": account.role, "id": account.id})
    
    # 6. Return a dictionary: {"access_token": access_token, "token_type": "bearer"}.
    return {"access_token": access_token, "token_type": "bearer"}

# Create a POST route at "/setup-master-admin". It should check if an admin exists in the database. If not, hash the password "admin123" and create an Account with email "admin@giki.edu.pk" and role "admin". Return a success message.
@router.post("/setup-master-admin")
def setup_master_admin(db: Session = Depends(get_db)):
    existing_admin = db.query(Account).filter(Account.role == "admin").first()
    if existing_admin:
        return {"message": "Master admin already exists."}
    
    
    # ... inside the function ...
    hashed_password = get_password_hash("admin123") # ✅ RIGHT: This hashes the string
    master_admin = Account(email="admin@giki.edu.pk", password_hash=hashed_password, role="admin") 
    db.add(master_admin)
    db.commit()
    return {"message": "Master admin created successfully."}
