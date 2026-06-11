from __future__ import annotations
import logging
from typing import AsyncGenerator

from fastapi import UploadFile

logger = logging.getLogger(__name__)


class Chunker:
    @staticmethod
    async def stream_chunks(
        upload_file: UploadFile,
        chunk_size: int,
    ) -> AsyncGenerator[tuple[int, bytes], None]:
        chunk_index = 0
        while True:
            data = await upload_file.read(chunk_size)
            if not data:
                break
            yield chunk_index, data
            chunk_index += 1
        logger.debug("Finished reading %d chunk(s) from %s", chunk_index, upload_file.filename)
