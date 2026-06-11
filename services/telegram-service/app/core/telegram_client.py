import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client_instance: "TelegramClient | None" = None


class TelegramClient:
    def __init__(
        self,
        bot_token: str,
        channel_id: str,
        api_base: str,
        timeout: int,
    ) -> None:
        self._channel_id = channel_id
        self._bot_api_base = f"{api_base}/bot{bot_token}"
        self._file_api_base = f"{api_base}/file/bot{bot_token}"
        self._http = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=5),
        )

    async def close(self) -> None:
        await self._http.aclose()

    def _raise_for_telegram(self, data: dict, context: str) -> None:
        if not data.get("ok"):
            description = data.get("description", "unknown error")
            logger.error("Telegram API error during %s: %s", context, description)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Telegram error: {description}",
            )

    async def get_me(self) -> dict:
        try:
            resp = await self._http.get(f"{self._bot_api_base}/getMe")
            resp.raise_for_status()
            data = resp.json()
            self._raise_for_telegram(data, "getMe")
            return data["result"]
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Telegram timeout on getMe",
            ) from exc

    async def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        caption: str | None = None,
    ) -> dict:
        files = {"document": (filename, file_bytes, "application/octet-stream")}
        data: dict = {"chat_id": self._channel_id}
        if caption:
            data["caption"] = caption

        try:
            resp = await self._http.post(
                f"{self._bot_api_base}/sendDocument",
                data=data,
                files=files,
            )
            resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Telegram upload timed out",
            ) from exc

        result_data = resp.json()
        self._raise_for_telegram(result_data, "sendDocument")

        result = result_data["result"]
        doc = result["document"]
        return {
            "telegram_file_id": doc["file_id"],
            "telegram_message_id": result["message_id"],
            "file_size": doc.get("file_size", 0),
            "file_unique_id": doc["file_unique_id"],
        }

    async def get_file_info(self, telegram_file_id: str) -> dict:
        try:
            resp = await self._http.post(
                f"{self._bot_api_base}/getFile",
                json={"file_id": telegram_file_id},
            )
            resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Telegram timeout on getFile",
            ) from exc

        data = resp.json()
        self._raise_for_telegram(data, "getFile")

        result = data["result"]
        return {
            "file_path": result["file_path"],
            "file_size": result.get("file_size", 0),
            "file_unique_id": result["file_unique_id"],
        }

    async def download_file(self, telegram_file_id: str) -> bytes:
        info = await self.get_file_info(telegram_file_id)
        file_url = f"{self._file_api_base}/{info['file_path']}"

        try:
            chunks: list[bytes] = []
            async with self._http.stream("GET", file_url) as resp:
                resp.raise_for_status()
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    chunks.append(chunk)
            return b"".join(chunks)
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Telegram download timed out",
            ) from exc

    async def delete_message(self, telegram_message_id: int) -> bool:
        try:
            resp = await self._http.post(
                f"{self._bot_api_base}/deleteMessage",
                json={"chat_id": self._channel_id, "message_id": telegram_message_id},
            )
            resp.raise_for_status()
            data = resp.json()
            return bool(data.get("ok") and data.get("result"))
        except (httpx.HTTPStatusError, httpx.TimeoutException) as exc:
            logger.warning("Could not delete message %d: %s", telegram_message_id, exc)
            return False


def get_telegram_client() -> TelegramClient:
    if _client_instance is None:
        raise RuntimeError("TelegramClient has not been initialised")
    return _client_instance


def init_telegram_client() -> TelegramClient:
    global _client_instance
    settings = get_settings()
    _client_instance = TelegramClient(
        bot_token=settings.TELEGRAM_BOT_TOKEN,
        channel_id=settings.TELEGRAM_CHANNEL_ID,
        api_base=settings.TELEGRAM_API_BASE,
        timeout=settings.REQUEST_TIMEOUT_SECONDS,
    )
    return _client_instance


async def close_telegram_client() -> None:
    global _client_instance
    if _client_instance is not None:
        await _client_instance.close()
        _client_instance = None
