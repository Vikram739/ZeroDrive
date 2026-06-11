import logging

from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user
from app.models.schemas import ListResponse
from app.services.file_service import FileService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/views", tags=["Views"])


@router.get("/trash", response_model=ListResponse)
def list_trash(current_user: dict = Depends(get_current_user)):
    uid: str = current_user["uid"]
    return FileService().list_trash(uid)


@router.post("/trash/empty")
def empty_trash(current_user: dict = Depends(get_current_user)):
    uid: str = current_user["uid"]
    message_ids = FileService().empty_trash(uid)
    return {"telegram_message_ids": message_ids, "deleted_count": len(message_ids)}


@router.get("/starred", response_model=ListResponse)
def list_starred(current_user: dict = Depends(get_current_user)):
    uid: str = current_user["uid"]
    return FileService().get_starred(uid)


@router.get("/recent", response_model=ListResponse)
def list_recent(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FileService().get_recent(uid, limit=limit)
