from __future__ import annotations
import logging
from typing import AsyncIterator

from fastapi import HTTPException, status

from app.services.metadata_client import MetadataClient
from app.services.telegram_client import TelegramClient

logger = logging.getLogger(__name__)


class DownloadOrchestrator:
    def __init__(self, telegram_client: TelegramClient, metadata_client: MetadataClient) -> None:
        self._telegram = telegram_client
        self._metadata = metadata_client

    async def stream_file(
        self,
        file_id: str,
        user: dict,
        auth_header: str,
    ) -> tuple[AsyncIterator[bytes], dict]:
        file_meta = await self._metadata.get_file(auth_header, file_id)
        if not file_meta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        uid: str = user["uid"]
        if file_meta.get("user_id") != uid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        telegram_file_ids: list[str] = file_meta.get("telegram_file_ids", [])
        if not telegram_file_ids:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File has no stored chunks",
            )

        logger.info(
            "Streaming file id=%s (%d chunk(s)) for user %s",
            file_id,
            len(telegram_file_ids),
            uid,
        )

        async def _generate() -> AsyncIterator[bytes]:
            for idx, tg_file_id in enumerate(telegram_file_ids):
                logger.debug("Streaming chunk %d of file id=%s", idx, file_id)
                async for data in self._telegram.download_chunk(tg_file_id):
                    yield data

        return _generate(), file_meta
