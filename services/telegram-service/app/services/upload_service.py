import logging
import time
from dataclasses import dataclass

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.telegram_client import get_telegram_client

logger = logging.getLogger(__name__)


@dataclass
class UploadResult:
    telegram_file_id: str
    telegram_message_id: int
    size: int
    file_unique_id: str


class UploadService:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._client = get_telegram_client()

    async def upload_chunk(
        self,
        file_bytes: bytes,
        filename: str,
        user_uid: str,
    ) -> UploadResult:
        size = len(file_bytes)
        if size > self._settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    f"File exceeds 50 MB limit "
                    f"({size} bytes > {self._settings.MAX_FILE_SIZE_BYTES} bytes)"
                ),
            )

        timestamp = int(time.time())
        caption = f"uid:{user_uid}|name:{filename}|ts:{timestamp}"

        result = await self._client.upload_file(
            file_bytes=file_bytes,
            filename=filename,
            caption=caption,
        )

        logger.info(
            "Uploaded chunk uid=%s filename=%s size=%d msg_id=%d",
            user_uid,
            filename,
            size,
            result["telegram_message_id"],
        )

        return UploadResult(
            telegram_file_id=result["telegram_file_id"],
            telegram_message_id=result["telegram_message_id"],
            size=result["file_size"],
            file_unique_id=result["file_unique_id"],
        )

    async def download_chunk(self, telegram_file_id: str) -> bytes:
        return await self._client.download_file(telegram_file_id)

    async def delete_chunk(self, telegram_message_id: int) -> bool:
        return await self._client.delete_message(telegram_message_id)
