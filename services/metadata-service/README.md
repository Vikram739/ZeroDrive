# ZeroDrive Metadata Service

Manages the file system metadata in Firestore.
Tracks folders, files, their Telegram chunk IDs, and state (starred, trashed).
Does not handle actual file bytes - that is the telegram-service's job.

## Setup

### 1. Create and activate a virtual environment

```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Add Firebase credentials

Place the Firebase Admin SDK key at:

```
services/metadata-service/secrets/firebase-admin-key.json
```

### 4. Configure environment

```bash
copy .env.example .env
```

### 5. Run

```bash
uvicorn app.main:app --reload --port 8003
```

### 6. Verify

- Health check: http://localhost:8003/health
- Interactive docs: http://localhost:8003/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Service info |
| GET | /health | Health check |
| POST | /folders | Create folder |
| GET | /folders | List folders (query: parent_id, include_trashed) |
| GET | /folders/{id} | Get folder |
| PATCH | /folders/{id} | Update folder |
| DELETE | /folders/{id} | Trash or permanently delete (?permanent=true) |
| POST | /folders/{id}/restore | Restore from trash |
| POST | /files | Create file metadata |
| GET | /files | List files (query: folder_id, include_trashed) |
| GET | /files/{id} | Get file |
| PATCH | /files/{id} | Update file |
| DELETE | /files/{id} | Trash or permanently delete (?permanent=true) |
| POST | /files/{id}/restore | Restore from trash |
| GET | /views/trash | List all trashed items |
| POST | /views/trash/empty | Empty trash, returns telegram_message_ids to clean up |
| GET | /views/starred | List starred items |
| GET | /views/recent | Most recently updated files |

All endpoints require `Authorization: Bearer <firebase_id_token>` header.
Queries are automatically scoped to the authenticated user.

## Docker

```bash
docker build -t zerodrive-metadata-service .
docker run -p 8003:8003 zerodrive-metadata-service
```
