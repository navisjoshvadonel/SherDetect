import os
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.logger import setup_logger

logger = setup_logger("SherDetect.Auth")

security = HTTPBearer()

# By default Supabase uses HS256 to sign JWTs, using the JWT Secret you get from your dashboard settings.
# Ensure this is set in your .env file or deployment environment.
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")

def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Decodes and validates a Supabase JWT from the Authorization header.
    """
    token = credentials.credentials
    try:
        # verify_aud=False because Supabase sometimes sets 'aud' to 'authenticated' but we just want to verify signature
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Authentication failed: Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Authentication failed: Invalid token - {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def get_current_user(payload: dict = Depends(verify_jwt)):
    """
    FastAPI Dependency to get the current authenticated user's payload.
    """
    return payload

def require_officer_role(user: dict = Depends(get_current_user)):
    """
    FastAPI Dependency to enforce Role-Based Access Control (RBAC).
    Checks if the user's Supabase app_metadata contains role = 'officer'.
    """
    # Check for custom claims (role) inside app_metadata
    # This is typically set via a Supabase Edge Function or direct SQL UPDATE on auth.users
    app_metadata = user.get("app_metadata", {})
    role = app_metadata.get("role", "customer")
    
    if role != "officer":
        logger.warning(f"Access denied for user {user.get('sub')} - insufficient role: {role}")
        raise HTTPException(status_code=403, detail="u dont have access towards this page")
    
    return user
