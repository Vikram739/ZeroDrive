from __future__ import annotations
import json
import logging
import os

import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None


def initialize_firebase() -> None:
    global _app
    if _app is not None:
        return
    settings = get_settings()
    json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON", "").strip()
    if json_str:
        cred = credentials.Certificate(json.loads(json_str))
    else:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    _app = firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialized (file-service)")


def verify_firebase_token(id_token: str) -> dict:
    try:
        return auth.verify_id_token(id_token)
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_firestore_client():
    return firestore.client()
