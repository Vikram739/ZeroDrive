import logging
from typing import Optional

from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from app.core.firebase import get_firestore_client

logger = logging.getLogger(__name__)

USERS_COLLECTION = "users"


class UserService:
    def __init__(self):
        self.db = get_firestore_client()

    def _collection(self):
        return self.db.collection(USERS_COLLECTION)

    def create_user_profile(self, uid: str, email: str, name: str) -> dict:
        doc_ref = self._collection().document(uid)
        data = {
            "uid": uid,
            "email": email,
            "name": name,
            "created_at": SERVER_TIMESTAMP,
            "telegram_channel_id": None,
            "storage_used_bytes": 0,
        }
        doc_ref.set(data)
        logger.info("Created user profile for uid=%s", uid)
        snapshot = doc_ref.get()
        return snapshot.to_dict()

    def get_user_profile(self, uid: str) -> Optional[dict]:
        snapshot = self._collection().document(uid).get()
        if not snapshot.exists:
            return None
        return snapshot.to_dict()

    def update_user_profile(self, uid: str, updates: dict) -> dict:
        doc_ref = self._collection().document(uid)
        doc_ref.update(updates)
        logger.info("Updated user profile for uid=%s fields=%s", uid, list(updates.keys()))
        return doc_ref.get().to_dict()

    def delete_user_profile(self, uid: str) -> None:
        self._collection().document(uid).delete()
        logger.info("Deleted user profile for uid=%s", uid)
