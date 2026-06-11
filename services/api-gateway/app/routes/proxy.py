from __future__ import annotations
import logging
import re

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import Response

from app.core.config import get_settings
from app.services.proxy_service import ProxyService, HOP_BY_HOP_HEADERS

logger = logging.getLogger(__name__)

router = APIRouter()

# Matches: files/<uuid>/download
_DOWNLOAD_RE = re.compile(r"^files/[^/]+/download$")

# resolve_target_service routing rules (evaluated top-to-bottom, first match wins):
#
# path="files/upload",            method=POST,   params={}                  -> FILE_SERVICE_URL
# path="files/abc/download",      method=GET,    params={}                  -> FILE_SERVICE_URL
# path="files/abc",               method=DELETE, params={"permanent":"true"}-> FILE_SERVICE_URL
# path="files/upload",            method=GET,    params={}                  -> METADATA_SERVICE_URL (*)
# path="files",                   method=GET,    params={}                  -> METADATA_SERVICE_URL
# path="files/abc",               method=GET,    params={}                  -> METADATA_SERVICE_URL
# path="files/abc",               method=PATCH,  params={}                  -> METADATA_SERVICE_URL
# path="files/abc",               method=DELETE, params={"permanent":"false"}-> METADATA_SERVICE_URL
# path="folders",                 method=POST,   params={}                  -> METADATA_SERVICE_URL
# path="folders/abc",             method=PATCH,  params={}                  -> METADATA_SERVICE_URL
# path="views/trash",             method=GET,    params={}                  -> METADATA_SERVICE_URL
# path="auth/signup",             method=POST,   params={}                  -> AUTH_SERVICE_URL
# path="telegram/upload",         method=POST,   params={}                  -> TELEGRAM_SERVICE_URL
# path="ai/chat",                 method=POST,   params={}                  -> AI_SERVICE_URL
#
# (*) Unlikely call but falls through to metadata correctly.


def resolve_target_service(path: str, method: str, query_params: dict) -> str:
    settings = get_settings()
    m = method.upper()

    # --- /files/* split routing ---
    if path.startswith("files"):
        # POST /files/upload -> file-service
        if path == "files/upload":
            selected = settings.FILE_SERVICE_URL
            logger.debug("route: files/upload -> file-service")
            return selected

        # GET /files/{id}/download -> file-service
        if _DOWNLOAD_RE.match(path):
            selected = settings.FILE_SERVICE_URL
            logger.debug("route: %s (download) -> file-service", path)
            return selected

        # DELETE /files/{id}?permanent=true -> file-service
        if m == "DELETE" and query_params.get("permanent", "").lower() == "true":
            selected = settings.FILE_SERVICE_URL
            logger.debug("route: %s DELETE permanent=true -> file-service", path)
            return selected

        # Everything else (list, get, patch, soft-delete) -> metadata-service
        logger.debug("route: %s %s -> metadata-service", m, path)
        return settings.METADATA_SERVICE_URL

    # --- simple prefix routing for all other paths ---
    prefix = path.split("/")[0]

    prefix_map: dict[str, str] = {
        "auth": settings.AUTH_SERVICE_URL,
        "folders": settings.METADATA_SERVICE_URL,
        "views": settings.METADATA_SERVICE_URL,
        "telegram": settings.TELEGRAM_SERVICE_URL,
        "ai": settings.AI_SERVICE_URL,
    }

    url = prefix_map.get(prefix)
    if url is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown service prefix: {prefix!r}",
        )
    logger.debug("route: %s %s -> %s", m, path, url)
    return url


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(path: str, request: Request) -> Response:
    normalized = path.strip("/")
    params = dict(request.query_params)

    service_url = resolve_target_service(normalized, request.method, params)

    headers = dict(request.headers)
    body = await request.body()

    logger.info("proxy %s /%s -> %s", request.method, normalized, service_url)

    svc = ProxyService()
    upstream = await svc.forward_request(
        service_url=service_url,
        path=normalized,
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
