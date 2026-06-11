from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None
    is_starred: Optional[bool] = None


class FolderResponse(BaseModel):
    id: str
    user_id: str
    parent_id: Optional[str]
    name: str
    created_at: datetime
    updated_at: datetime
    is_trashed: bool
    is_starred: bool


class FileCreate(BaseModel):
    name: str
    mime_type: str
    size_bytes: int
    folder_id: Optional[str] = None
    telegram_file_ids: list[str]
    telegram_message_ids: list[int]
    is_chunked: bool
    chunk_count: int


class FileUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[str] = None
    is_starred: Optional[bool] = None


class FileResponse(BaseModel):
    id: str
    user_id: str
    folder_id: Optional[str]
    name: str
    mime_type: str
    size_bytes: int
    telegram_file_ids: list[str]
    telegram_message_ids: list[int]
    is_chunked: bool
    chunk_count: int
    created_at: datetime
    updated_at: datetime
    is_trashed: bool
    is_starred: bool


class ListResponse(BaseModel):
    folders: list[FolderResponse]
    files: list[FileResponse]
