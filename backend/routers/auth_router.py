from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.model import Account
from auth.security import get_password_hash, verify_password, create_access_token

router = APIRouter(tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 login endpoint. 
    Accepts form data (username/password), validates credentials, and issues a stateless JWT access token.
    Note: OAuth2 specification requires the email field to be passed as 'username'.
    """
    
    # Step 1: Query the database for the user identity
    account = db.query(Account).filter(Account.email == form_data.username).first()
    
    # Step 2: Validate identity and cryptographic password hash
    if not account or not verify_password(form_data.password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Step 3: Construct the JWT payload and issue the token
    # We embed the role in the token payload to allow the frontend to perform local RBAC routing
    access_token = create_access_token(
        data={"sub": account.email, "role": account.role, "id": account.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/setup-master-admin")
def setup_master_admin(db: Session = Depends(get_db)):
    """
    One-off database seeding utility.
    Safely initializes the master administrator account if no admin currently exists in the system.
    """
    
    # Check for existing admin to prevent duplicate seeding or unauthorized overwrites
    existing_admin = db.query(Account).filter(Account.role == "admin").first()
    if existing_admin:
        return {"message": "Master admin already exists. Seed operation aborted."}
    
    # Generate the initial master admin with securely hashed default credentials
    hashed_password = get_password_hash("admin123") 
    master_admin = Account(
        email="admin@giki.edu.pk", 
        password_hash=hashed_password, 
        role="admin"
    ) 
    
    db.add(master_admin)
    db.commit()
    
    return {"message": "Master admin initialized successfully."}