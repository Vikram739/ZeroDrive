from __future__ import annotations
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from google.cloud.firestore_v1 import FieldFilter, Query

from app.core.firebase import get_firestore_client
from app.models.schemas import (
    FileCreate,
    FileResponse,
    FileUpdate,
    FolderResponse,
    ListResponse,
)

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _file_ref(db, user_id: str, file_id: str):
    return db.collection("users").document(user_id).collection("files").document(file_id)


def _folder_ref(db, user_id: str, folder_id: str):
    return db.collection("users").document(user_id).collection("folders").document(folder_id)


def _doc_to_file(doc) -> FileResponse:
    data = doc.to_dict()
    created_at = data["created_at"]
    updated_at = data["updated_at"]
    if hasattr(created_at, "timestamp"):
        created_at = datetime.fromtimestamp(created_at.timestamp(), tz=timezone.utc)
    if hasattr(updated_at, "timestamp"):
        updated_at = datetime.fromtimestamp(updated_at.timestamp(), tz=timezone.utc)
    return FileResponse(
        id=data["id"],
        user_id=data["user_id"],
        folder_id=data.get("folder_id"),
        name=data["name"],
        mime_type=data["mime_type"],
        size_bytes=data["size_bytes"],
        telegram_file_ids=data.get("telegram_file_ids", []),
        telegram_message_ids=data.get("telegram_message_ids", []),
        is_chunked=data.get("is_chunked", False),
        chunk_count=data.get("chunk_count", 1),
        created_at=created_at,
        updated_at=updated_at,
        is_trashed=data.get("is_trashed", False),
        is_starred=data.get("is_starred", False),
    )


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


class FileService:
    def __init__(self) -> None:
        self._db = get_firestore_client()

    def _collection(self, user_id: str):
        return self._db.collection("users").document(user_id).collection("files")

    def create(self, user_id: str, file_data: FileCreate) -> FileResponse:
        file_id = str(uuid.uuid4())
        now = _now()
        data = {
            "id": file_id,
            "user_id": user_id,
            "folder_id": file_data.folder_id,
            "name": file_data.name,
            "mime_type": file_data.mime_type,
            "size_bytes": file_data.size_bytes,
            "telegram_file_ids": file_data.telegram_file_ids,
            "telegram_message_ids": file_data.telegram_message_ids,
            "is_chunked": file_data.is_chunked,
            "chunk_count": file_data.chunk_count,
            "created_at": now,
            "updated_at": now,
            "is_trashed": False,
            "is_starred": False,
        }
        _file_ref(self._db, user_id, file_id).set(data)
        logger.info("Created file id=%s user=%s name=%s", file_id, user_id, file_data.name)
        return FileResponse(**data)

    def get(self, user_id: str, file_id: str) -> Optional[FileResponse]:
        doc = _file_ref(self._db, user_id, file_id).get()
        if not doc.exists:
            return None
        return _doc_to_file(doc)

    def list(
        self,
        user_id: str,
        folder_id: Optional[str] = None,
        include_trashed: bool = False,
    ) -> list[FileResponse]:
        query = self._collection(user_id).where(
            filter=FieldFilter("folder_id", "==", folder_id)
        )
        if not include_trashed:
            query = query.where(filter=FieldFilter("is_trashed", "==", False))
        return [_doc_to_file(doc) for doc in query.stream()]

    def update(self, user_id: str, file_id: str, updates: FileUpdate) -> FileResponse:
        ref = _file_ref(self._db, user_id, file_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        patch = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
        patch["updated_at"] = _now()
        ref.update(patch)
        return _doc_to_file(ref.get())

    def move_to_trash(self, user_id: str, file_id: str) -> None:
        ref = _file_ref(self._db, user_id, file_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        ref.update({"is_trashed": True, "updated_at": _now()})
        logger.info("Trashed file id=%s user=%s", file_id, user_id)

    def restore(self, user_id: str, file_id: str) -> None:
        ref = _file_ref(self._db, user_id, file_id)
        if not ref.get().exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        ref.update({"is_trashed": False, "updated_at": _now()})
        logger.info("Restored file id=%s user=%s", file_id, user_id)

    def delete_permanent(self, user_id: str, file_id: str) -> dict:
        ref = _file_ref(self._db, user_id, file_id)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        data = doc.to_dict()
        if not data.get("is_trashed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Move file to trash before permanently deleting",
            )
        message_ids = data.get("telegram_message_ids", [])
        ref.delete()
        logger.info("Permanently deleted file id=%s user=%s", file_id, user_id)
        return {"telegram_message_ids": message_ids}

    def list_trash(self, user_id: str) -> ListResponse:
        files_query = self._collection(user_id).where(
            filter=FieldFilter("is_trashed", "==", True)
        )
        files = [_doc_to_file(doc) for doc in files_query.stream()]

        folders_query = (
            self._db.collection("users")
            .document(user_id)
            .collection("folders")
            .where(filter=FieldFilter("is_trashed", "==", True))
        )
        folders = [_doc_to_folder(doc) for doc in folders_query.stream()]

        return ListResponse(folders=folders, files=files)

    def empty_trash(self, user_id: str) -> list[int]:
        all_message_ids: list[int] = []

        trashed_files = (
            self._collection(user_id)
            .where(filter=FieldFilter("is_trashed", "==", True))
            .stream()
        )
        for doc in trashed_files:
            data = doc.to_dict()
            all_message_ids.extend(data.get("telegram_message_ids", []))
            doc.reference.delete()

        trashed_folders = (
            self._db.collection("users")
            .document(user_id)
            .collection("folders")
            .where(filter=FieldFilter("is_trashed", "==", True))
            .stream()
        )
        for doc in trashed_folders:
            doc.reference.delete()

        logger.info(
            "Emptied trash for user=%s, %d telegram message(s) to clean up",
            user_id,
            len(all_message_ids),
        )
        return all_message_ids

    def get_starred(self, user_id: str) -> ListResponse:
        files = [
            _doc_to_file(doc)
            for doc in self._collection(user_id)
            .where(filter=FieldFilter("is_starred", "==", True))
            .where(filter=FieldFilter("is_trashed", "==", False))
            .stream()
        ]
        folders = [
            _doc_to_folder(doc)
            for doc in self._db.collection("users")
            .document(user_id)
            .collection("folders")
            .where(filter=FieldFilter("is_starred", "==", True))
            .where(filter=FieldFilter("is_trashed", "==", False))
            .stream()
        ]
        return ListResponse(folders=folders, files=files)

    def get_recent(self, user_id: str, limit: int = 20) -> ListResponse:
        files = [
            _doc_to_file(doc)
            for doc in self._collection(user_id)
            .where(filter=FieldFilter("is_trashed", "==", False))
            .order_by("updated_at", direction=Query.DESCENDING)
            .limit(limit)
            .stream()
        ]
        return ListResponse(folders=[], files=files)
