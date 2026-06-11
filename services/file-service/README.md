# ZeroDrive File Service

Orchestrates file uploads and downloads between the frontend, telegram-service, and metadata-service.

## Setup

```bash
cd services/file-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Place your Firebase Admin SDK key at `secrets/firebase-admin-key.json`.

Copy `.env.example` to `.env` (already done in this repo). No values need to change for local development unless your service ports differ.

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

Health check: `GET http://localhost:8002/health`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /files/upload | Upload a file (multipart) |
| GET | /files/{id}/download | Stream file bytes back |
| DELETE | /files/{id} | Trash or permanently delete |
| GET | /files/{id} | Get file metadata |

All endpoints require a Firebase ID token in `Authorization: Bearer <token>`.

### Upload

```
POST /files/upload
Content-Type: multipart/form-data

Fields:
  file      - the file to upload (required)
  folder_id - target folder UUID (optional)
```

Files larger than 49MB are split into chunks automatically. Each chunk is uploaded to telegram-service separately. The final record in metadata-service contains all chunk IDs in order.

### Permanent delete

```
DELETE /files/{id}?permanent=true
```

This requires the file to already be in the trash (call without `permanent=true` first to move it there).

## Dependencies

- telegram-service running on port 8004
- metadata-service running on port 8003
- Firebase project with Admin SDK credentials
