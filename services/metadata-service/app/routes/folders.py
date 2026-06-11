import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth_dependency import get_current_user
from app.models.schemas import FolderCreate, FolderResponse, FolderUpdate
from app.services.folder_service import FolderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/folders", tags=["Folders"])


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    body: FolderCreate,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FolderService().create(uid, body)


@router.get("", response_model=list[FolderResponse])
def list_folders(
    parent_id: Optional[str] = None,
    include_trashed: bool = False,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FolderService().list(uid, parent_id=parent_id, include_trashed=include_trashed)


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    folder = FolderService().get(uid, folder_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    return folder


@router.patch("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    body: FolderUpdate,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FolderService().update(uid, folder_id, body)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    permanent: bool = False,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    svc = FolderService()
    if permanent:
        svc.delete_permanent(uid, folder_id)
    else:
        svc.move_to_trash(uid, folder_id)


@router.post("/{folder_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    FolderService().restore(uid, folder_id)
