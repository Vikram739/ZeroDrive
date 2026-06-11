import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth_dependency import get_current_user
from app.models.schemas import FileCreate, FileResponse, FileUpdate
from app.services.file_service import FileService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_file(
    body: FileCreate,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FileService().create(uid, body)


@router.get("", response_model=list[FileResponse])
def list_files(
    folder_id: Optional[str] = None,
    include_trashed: bool = False,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FileService().list(uid, folder_id=folder_id, include_trashed=include_trashed)


@router.get("/{file_id}", response_model=FileResponse)
def get_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    file = FileService().get(uid, file_id)
    if file is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file


@router.patch("/{file_id}", response_model=FileResponse)
def update_file(
    file_id: str,
    body: FileUpdate,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    return FileService().update(uid, file_id, body)


@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    permanent: bool = False,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    svc = FileService()
    if permanent:
        result = svc.delete_permanent(uid, file_id)
        return result
    svc.move_to_trash(uid, file_id)
    return {"detail": "Moved to trash"}


@router.post("/{file_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid: str = current_user["uid"]
    FileService().restore(uid, file_id)
