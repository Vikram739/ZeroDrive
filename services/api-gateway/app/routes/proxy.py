import logging

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import Response

from app.core.config import get_settings
from app.services.proxy_service import ProxyService, HOP_BY_HOP_HEADERS

logger = logging.getLogger(__name__)

router = APIRouter()

ROUTE_MAP = {
    "auth": "AUTH_SERVICE_URL",
    "files": "FILE_SERVICE_URL",
    "folders": "METADATA_SERVICE_URL",
    "telegram": "TELEGRAM_SERVICE_URL",
    "ai": "AI_SERVICE_URL",
}


def _resolve_service_url(prefix: str) -> str:
    settings = get_settings()
    attr = ROUTE_MAP.get(prefix)
    if attr is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown service prefix: {prefix}",
        )
    return getattr(settings, attr)


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(path: str, request: Request) -> Response:
    parts = path.strip("/").split("/", 1)
    prefix = parts[0]
    remaining = parts[1] if len(parts) > 1 else ""

    service_url = _resolve_service_url(prefix)
    target_path = f"{prefix}/{remaining}" if remaining else prefix

    headers = dict(request.headers)
    params = dict(request.query_params)
    body = await request.body()

    svc = ProxyService()
    upstream = await svc.forward_request(
        service_url=service_url,
        path=target_path,
        method=request.method,
        headers=headers,
        params=params,
        body=body,
    )

    response_headers = {
        k: v
        for k, v in upstream.headers.items()
        if k.lower() not in HOP_BY_HOP_HEADERS
    }

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
