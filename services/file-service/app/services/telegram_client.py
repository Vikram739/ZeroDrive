from __future__ import annotations
import logging
from typing import AsyncIterator

import httpx

from app.core.config import get_settings
from app.core.http_client import get_http_client

logger = logging.getLogger(__name__)


class TelegramClient:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def _base(self) -> str:
        return self._settings.TELEGRAM_SERVICE_URL

    @property
    def _client(self) -> httpx.AsyncClient:
        return get_http_client()

    async def upload_chunk(
        self,
        chunk_bytes: bytes,
        filename: str,
        user_uid: str,
        chunk_index: int = 0,
    ) -> dict:
        chunk_name = f"{filename}.part{chunk_index}" if chunk_index > 0 else filename
        files = {"file": (chunk_name, chunk_bytes, "application/octet-stream")}
        data = {"user_uid": user_uid}
        response = await self._client.post(
            f"{self._base}/telegram/upload",
            files=files,
            data=data,
        )
        response.raise_for_status()
        return response.json()

    async def download_chunk(self, telegram_file_id: str) -> AsyncIterator[bytes]:
        async with self._client.stream(
            "GET",
            f"{self._base}/telegram/download/{telegram_file_id}",
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(65536):
                yield chunk

    async def delete_chunk(self, telegram_message_id: int) -> bool:
        try:
            response = await self._client.post(
                f"{self._base}/telegram/delete",
                json={"message_id": telegram_message_id},
            )
            return response.status_code == 200
        except Exception as exc:
            logger.warning("Failed to delete Telegram message %d: %s", telegram_message_id, exc)
            return False
