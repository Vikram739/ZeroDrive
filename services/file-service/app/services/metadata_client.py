from __future__ import annotations
import logging

import httpx

from app.core.config import get_settings
from app.core.http_client import get_http_client

logger = logging.getLogger(__name__)


class MetadataClient:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def _base(self) -> str:
        return self._settings.METADATA_SERVICE_URL

    @property
    def _client(self) -> httpx.AsyncClient:
        return get_http_client()

    def _auth_headers(self, auth_header: str) -> dict:
        return {"Authorization": auth_header}

    async def create_file(self, auth_header: str, file_data: dict) -> dict:
        response = await self._client.post(
            f"{self._base}/files",
            json=file_data,
            headers=self._auth_headers(auth_header),
        )
        response.raise_for_status()
        return response.json()

    async def get_file(self, auth_header: str, file_id: str) -> dict:
        response = await self._client.get(
            f"{self._base}/files/{file_id}",
            headers=self._auth_headers(auth_header),
        )
        if response.status_code == 404:
            return {}
        response.raise_for_status()
        return response.json()

    async def delete_file(
        self,
        auth_header: str,
        file_id: str,
        permanent: bool = False,
    ) -> dict:
        response = await self._client.delete(
            f"{self._base}/files/{file_id}",
            params={"permanent": str(permanent).lower()},
            headers=self._auth_headers(auth_header),
        )
        response.raise_for_status()
        if response.status_code == 204 or not response.content:
            return {}
        return response.json()
