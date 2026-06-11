import logging

from fastapi import APIRouter, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.telegram_client import get_telegram_client
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["Telegram"])


class UploadResponse(BaseModel):
    telegram_file_id: str
    telegram_message_id: int
    size: int
    file_unique_id: str


class DeleteRequest(BaseModel):
    telegram_message_id: int


class DeleteResponse(BaseModel):
    deleted: bool


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    user_uid: str = Form(...),
):
    file_bytes = await file.read()
    filename = file.filename or "untitled"

    svc = UploadService()
    result = await svc.upload_chunk(
        file_bytes=file_bytes,
        filename=filename,
        user_uid=user_uid,
    )

    return UploadResponse(
        telegram_file_id=result.telegram_file_id,
        telegram_message_id=result.telegram_message_id,
        size=result.size,
        file_unique_id=result.file_unique_id,
    )


@router.get("/download/{telegram_file_id}")
async def download_file(
    telegram_file_id: str,
    filename: str = "download",
):
    svc = UploadService()
    file_bytes = await svc.download_chunk(telegram_file_id)

    async def byte_generator():
        chunk_size = 65536
        for i in range(0, len(file_bytes), chunk_size):
            yield file_bytes[i : i + chunk_size]

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Length": str(len(file_bytes)),
    }
    return StreamingResponse(
        byte_generator(),
        media_type="application/octet-stream",
        headers=headers,
    )


@router.post("/delete", response_model=DeleteResponse)
async def delete_message(body: DeleteRequest):
    svc = UploadService()
    deleted = await svc.delete_chunk(body.telegram_message_id)
    return DeleteResponse(deleted=deleted)


@router.get("/info/{telegram_file_id}")
async def get_file_info(telegram_file_id: str):
    client = get_telegram_client()
    info = await client.get_file_info(telegram_file_id)
    return info
