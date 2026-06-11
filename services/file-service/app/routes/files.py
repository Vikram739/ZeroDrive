from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.auth_dependency import get_current_user
from app.core.config import get_settings
from app.services.download_orchestrator import DownloadOrchestrator
from app.services.metadata_client import MetadataClient
from app.services.telegram_client import TelegramClient
from app.services.upload_orchestrator import UploadOrchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["Files"])


def _get_orchestrators() -> tuple[TelegramClient, MetadataClient]:
    return TelegramClient(), MetadataClient()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
    file: UploadFile,
    folder_id: Optional[str] = Form(default=None),
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES} bytes",
        )

    auth_header = request.headers.get("Authorization", "")
    tg, meta = _get_orchestrators()
    orchestrator = UploadOrchestrator(tg, meta)
    return await orchestrator.upload(
        upload_file=file,
        folder_id=folder_id,
        user=current_user,
        auth_header=auth_header,
    )


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    auth_header = request.headers.get("Authorization", "")
    tg, meta = _get_orchestrators()
    orchestrator = DownloadOrchestrator(tg, meta)
    stream, file_meta = await orchestrator.stream_file(file_id, current_user, auth_header)

    filename = file_meta.get("name", "download")
    mime_type = file_meta.get("mime_type", "application/octet-stream")

    safe_filename = filename.replace('"', '\\"')
    return StreamingResponse(
        stream,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )


@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
async def delete_file(
    file_id: str,
    request: Request,
    permanent: bool = False,
    current_user: dict = Depends(get_current_user),
):
    auth_header = request.headers.get("Authorization", "")
    tg, meta = _get_orchestrators()

    result = await meta.delete_file(auth_header, file_id, permanent=permanent)

    if permanent:
        message_ids: list[int] = result.get("telegram_message_ids", [])
        failed: list[int] = []
        for msg_id in message_ids:
            deleted = await tg.delete_chunk(msg_id)
            if not deleted:
                failed.append(msg_id)
        if failed:
            logger.warning(
                "Could not delete %d Telegram message(s) for file %s: %s",
                len(failed),
                file_id,
                failed,
            )
        return {"deleted": True, "permanent": True, "failed_telegram_ids": failed}

    return {"deleted": True, "permanent": False}


@router.get("/{file_id}")
async def get_file(
    file_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    auth_header = request.headers.get("Authorization", "")
    _, meta = _get_orchestrators()
    file_meta = await meta.get_file(auth_header, file_id)
    if not file_meta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    uid: str = current_user["uid"]
    if file_meta.get("user_id") != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return file_meta
