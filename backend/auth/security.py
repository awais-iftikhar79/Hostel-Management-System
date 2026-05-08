import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from dotenv import load_dotenv

# Load environment variables for cryptographic secrets
load_dotenv()

# Cryptographic configuration
SECRET_KEY = os.getenv("SECRET_KEY", "my_super_secret_key_for_giki_hostel_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt hash for new user passwords.
    Automatically incorporates a cryptographic salt to defend against rainbow table attacks.
    """
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Validates a plaintext password against the stored bcrypt hash during the authentication flow.
    """
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_enc = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(password_byte_enc, hashed_password_enc)

def create_access_token(data: dict):
    """
    Generates a stateless JSON Web Token (JWT) encapsulating user data (payload).
    Used for authorization on protected API routes.
    """
    to_encode = data.copy()
    
    # Define token validity window
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Cryptographically sign the token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt