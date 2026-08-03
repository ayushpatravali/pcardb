import os
from datetime import timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database import get_session
from models import User, Role
from auth import authenticate_user, create_access_token, get_current_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel

router = APIRouter(tags=["auth"])

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: Role = Role.FIELD_OFFICER # Default to Field Officer
    region: Optional[str] = None  # operator's zone (Kannada); defaults to ಗೋಕಾಕ


class UserPublic(BaseModel):
    """User response without the password hash."""
    id: Optional[int] = None
    username: str
    full_name: Optional[str] = None
    role: Role
    region: Optional[str] = None

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session)
):
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

def signup_enabled() -> bool:
    """Self-signup is DISABLED unless explicitly opted in (trusted intranet only).
    The local run scripts set ALLOW_SIGNUP=1; public demo hosting must not."""
    return os.environ.get("ALLOW_SIGNUP", "").strip().lower() in ("1", "true", "yes")


@router.post("/register", response_model=UserPublic)
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    if not signup_enabled():
        raise HTTPException(status_code=403, detail="Signup is disabled on this deployment")

    # Check if user exists
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        region=user_in.region or "ಗೋಕಾಕ",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
