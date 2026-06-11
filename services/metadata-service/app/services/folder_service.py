import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from google.cloud.firestore_v1 import FieldFilter

from app.core.firebase import get_firestore_client
from app.models.schemas import FolderCreate, FolderResponse, FolderUpdate

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _folder_ref(db, user_id: str, folder_id: str):
    return db.collection("users").document(user_id).collection("folders").document(folder_id)


def _doc_to_folder(doc) -> FolderResponse:
    data = doc.to_dict()
    created_at = data["created_at"]
    updated_at = data["updated_at"]
    if hasattr(created_at, "timestamp"):
        created_at = datetime.fromtimestamp(created_at.timestamp(), tz=timezone.utc)
    if hasattr(updated_at, "timestamp"):
        updated_at = datetime.fromtimestamp(updated_at.timestamp(), tz=timezone.utc)
    return FolderResponse(
        id=data["id"],
        user_id=data["user_id"],
        parent_id=data.get("parent_id"),
        name=data["name"],
        created_at=created_at,
        updated_at=updated_at,
        is_trashed=data.get("is_trashed", False),
        is_starred=data.get("is_starred", False),
    )


class FolderService:
    def __init__(self) -> None:
        self._db = get_firestore_client()

    def _collection(self, user_id: str):
        return self._db.collection("users").document(user_id).collection("folders")

    def create(self, user_id: str, folder_data: FolderCreate) -> FolderResponse:
        folder_id = str(uuid.uuid4())
        now = _now()
        data = {
            "id": folder_id,
            "user_id": user_id,
            "parent_id": folder_data.parent_id,
            "name": folder_data.name,
            "created_at": now,
            "updated_at": now,
            "is_trashed": False,
            "is_starred": False,
        }
        _folder_ref(self._db, user_id, folder_id).set(data)
        logger.info("Created folder id=%s user=%s name=%s", folder_id, user_id, folder_data.name)
        return FolderResponse(**{**data, "parent_id": data.get("parent_id")})

    def get(self, user_id: str, folder_id: str) -> Optional[FolderResponse]:
        doc = _folder_ref(self._db, user_id, folder_id).get()
        if not doc.exists:
            return None
        return _doc_to_folder(doc)

    def list(
        self,
        user_id: str,
        parent_id: Optional[str] = None,
        include_trashed: bool = False,
    ) -> list[FolderResponse]:
        query = self._collection(user_id).where(
            filter=FieldFilter("parent_id", "==", parent_id)
        )
        if not include_trashed:
            query = query.where(filter=FieldFilter("is_trashed", "==", False))
        return [_doc_to_folder(doc) for doc in query.stream()]

    def update(self, user_id: str, folder_id: str, updates: FolderUpdate) -> FolderResponse:
        ref = _folder_ref(self._db, user_id, folder_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        patch = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
        patch["updated_at"] = _now()
        ref.update(patch)
        return _doc_to_folder(ref.get())

    def move_to_trash(self, user_id: str, folder_id: str) -> None:
        ref = _folder_ref(self._db, user_id, folder_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        now = _now()
        ref.update({"is_trashed": True, "updated_at": now})
        self._trash_children(user_id, folder_id, now)
        logger.info("Trashed folder id=%s user=%s", folder_id, user_id)

    def _trash_children(self, user_id: str, parent_id: str, now: datetime) -> None:
        child_folders = (
            self._collection(user_id)
            .where(filter=FieldFilter("parent_id", "==", parent_id))
            .stream()
        )
        for doc in child_folders:
            doc.reference.update({"is_trashed": True, "updated_at": now})
            self._trash_children(user_id, doc.id, now)

        files_col = self._db.collection("users").document(user_id).collection("files")
        child_files = files_col.where(filter=FieldFilter("folder_id", "==", parent_id)).stream()
        for doc in child_files:
            doc.reference.update({"is_trashed": True, "updated_at": now})

    def restore(self, user_id: str, folder_id: str) -> None:
        ref = _folder_ref(self._db, user_id, folder_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        ref.update({"is_trashed": False, "updated_at": _now()})
        logger.info("Restored folder id=%s user=%s", folder_id, user_id)

    def delete_permanent(self, user_id: str, folder_id: str) -> None:
        ref = _folder_ref(self._db, user_id, folder_id)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        if not doc.to_dict().get("is_trashed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Move folder to trash before permanently deleting",
            )
        ref.delete()
        logger.info("Permanently deleted folder id=%s user=%s", folder_id, user_id)
