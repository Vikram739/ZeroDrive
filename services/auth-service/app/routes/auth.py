import logging
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from app.core.firebase import verify_firebase_token
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    id_token: str
    name: str


class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    created_at: Optional[Any] = None
    storage_used_bytes: int = 0


def get_current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is missing",
        )
    return verify_firebase_token(token)


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest):
    decoded = verify_firebase_token(body.id_token)
    uid: str = decoded["uid"]
    email: str = decoded.get("email", "")

    svc = UserService()
    existing = svc.get_user_profile(uid)
    if existing:
        logger.info("Signup called for existing user uid=%s", uid)
        return UserResponse(**existing)

    profile = svc.create_user_profile(uid=uid, email=email, name=body.name)
    return UserResponse(**profile)


@router.post("/verify")
def verify_token(authorization: str = Header(...)):
    decoded = get_current_user(authorization)
    return {
        "uid": decoded.get("uid"),
        "email": decoded.get("email"),
        "valid": True,
    }


@router.get("/me", response_model=UserResponse)
def get_me(authorization: str = Header(...)):
    decoded = get_current_user(authorization)
    uid: str = decoded["uid"]

    svc = UserService()
    profile = svc.get_user_profile(uid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return UserResponse(**profile)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(authorization: str = Header(...)):
    decoded = get_current_user(authorization)
    uid: str = decoded["uid"]

    svc = UserService()
    if not svc.get_user_profile(uid):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    svc.delete_user_profile(uid)
