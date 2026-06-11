import logging

import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def initialize_firebase() -> None:
    if firebase_admin._apps:
        return
    settings = get_settings()
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialized")


def get_firestore_client():
    return firestore.client()


def verify_firebase_token(id_token: str) -> dict:
    try:
        return auth.verify_id_token(id_token)
    except auth.ExpiredIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc
    except auth.InvalidIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
    except Exception as exc:
        logger.error("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
        ) from exc
