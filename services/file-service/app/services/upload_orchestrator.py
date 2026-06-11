from __future__ import annotations
import logging

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings
from app.services.chunker import Chunker
from app.services.metadata_client import MetadataClient
from app.services.telegram_client import TelegramClient

logger = logging.getLogger(__name__)


class UploadOrchestrator:
    def __init__(self, telegram_client: TelegramClient, metadata_client: MetadataClient) -> None:
        self._telegram = telegram_client
        self._metadata = metadata_client
        self._settings = get_settings()

    async def upload(
        self,
        upload_file: UploadFile,
        folder_id: str | None,
        user: dict,
        auth_header: str,
    ) -> dict:
        content_length = upload_file.size
        if content_length is not None and content_length > self._settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {self._settings.MAX_FILE_SIZE_BYTES} bytes",
            )

        uid: str = user["uid"]
        filename: str = upload_file.filename or "upload"
        uploaded_chunks: list[dict] = []
        total_size: int = 0

        async for chunk_index, chunk_bytes in Chunker.stream_chunks(
            upload_file, self._settings.CHUNK_SIZE_BYTES
        ):
            logger.info(
                "Uploading chunk %d of '%s' for user %s (%d bytes)",
                chunk_index,
                filename,
                uid,
                len(chunk_bytes),
            )
            try:
                result = await self._telegram.upload_chunk(
                    chunk_bytes=chunk_bytes,
                    filename=filename,
                    user_uid=uid,
                    chunk_index=chunk_index,
                )
                uploaded_chunks.append(result)
                total_size += len(chunk_bytes)
            except Exception as exc:
                logger.error(
                    "Chunk %d upload failed for '%s' (user %s): %s",
                    chunk_index,
                    filename,
                    uid,
                    exc,
                )
                await self._cleanup(uploaded_chunks)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Chunk {chunk_index} upload to Telegram failed: {exc}",
                ) from exc

        if total_size > self._settings.MAX_FILE_SIZE_BYTES:
            await self._cleanup(uploaded_chunks)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {self._settings.MAX_FILE_SIZE_BYTES} bytes",
            )

        file_data = {
            "name": filename,
            "mime_type": upload_file.content_type or "application/octet-stream",
            "size_bytes": total_size,
            "folder_id": folder_id,
            "telegram_file_ids": [c["telegram_file_id"] for c in uploaded_chunks],
            "telegram_message_ids": [c["telegram_message_id"] for c in uploaded_chunks],
            "is_chunked": len(uploaded_chunks) > 1,
            "chunk_count": len(uploaded_chunks),
        }

        try:
            created = await self._metadata.create_file(auth_header, file_data)
        except Exception as exc:
            logger.error("Metadata save failed for '%s' (user %s): %s", filename, uid, exc)
            await self._cleanup(uploaded_chunks)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file metadata",
            ) from exc

        logger.info(
            "Upload complete: '%s' for user %s, %d chunk(s), %d bytes",
            filename,
            uid,
            len(uploaded_chunks),
            total_size,
        )
        return created

    async def _cleanup(self, uploaded_chunks: list[dict]) -> None:
        for chunk in uploaded_chunks:
            msg_id = chunk.get("telegram_message_id")
            if msg_id is not None:
                deleted = await self._telegram.delete_chunk(msg_id)
                if not deleted:
                    logger.warning("Cleanup: failed to delete Telegram message %d", msg_id)
