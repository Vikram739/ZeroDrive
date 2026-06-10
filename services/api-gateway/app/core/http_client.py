import httpx

from app.core.config import get_settings

_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("HTTP client has not been initialised. Call init_http_client() first.")
    return _client


async def init_http_client() -> None:
    global _client
    settings = get_settings()
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(settings.REQUEST_TIMEOUT_SECONDS),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )


async def close_http_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
