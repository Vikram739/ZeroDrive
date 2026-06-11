from __future__ import annotations
import httpx

from app.core.config import get_settings

_client: httpx.AsyncClient | None = None


async def init_http_client() -> None:
    global _client
    settings = get_settings()
    _client = httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS)


async def close_http_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def get_http_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("HTTP client not initialized")
    return _client
