import logging
import time

import httpx
from fastapi import HTTPException, status

from app.core.http_client import get_http_client

logger = logging.getLogger(__name__)

HOP_BY_HOP_HEADERS = frozenset(
    {
        "host",
        "content-length",
        "connection",
        "keep-alive",
        "transfer-encoding",
        "te",
        "trailer",
        "proxy-authorization",
        "proxy-authenticate",
        "upgrade",
    }
)


class ProxyService:
    async def forward_request(
        self,
        service_url: str,
        path: str,
        method: str,
        headers: dict,
        params: dict,
        body: bytes,
    ) -> httpx.Response:
        target_url = f"{service_url.rstrip('/')}/{path.lstrip('/')}"

        filtered_headers = {
            k: v
            for k, v in headers.items()
            if k.lower() not in HOP_BY_HOP_HEADERS
        }

        start = time.monotonic()
        try:
            client = get_http_client()
            response = await client.request(
                method=method,
                url=target_url,
                headers=filtered_headers,
                params=params,
                content=body,
            )
        except httpx.ConnectError as exc:
            logger.error("Connection error forwarding to %s: %s", target_url, exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service unavailable",
            )
        except httpx.TimeoutException as exc:
            logger.error("Timeout forwarding to %s: %s", target_url, exc)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Service timeout",
            )

        duration_ms = round((time.monotonic() - start) * 1000)
        logger.info(
            "%s %s -> %d (%dms)",
            method.upper(),
            target_url,
            response.status_code,
            duration_ms,
        )
        return response
