# ZeroDrive Telegram Service

Handles all communication with the Telegram Bot API.
Accepts file uploads from the file-service, stores them in a private Telegram channel,
and serves downloads by fetching from Telegram on demand.

## Requirements

- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A private Telegram channel where the bot is an admin with post permissions
- The channel's numeric ID (starts with -100...)

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

### 3. Configure environment

```bash
copy .env.example .env
```

Edit `.env` and set your real values:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
TELEGRAM_CHANNEL_ID=-1001234567890
```

### 4. Run

```bash
uvicorn app.main:app --reload --port 8004
```

On startup the service calls `getMe` to verify the bot token is valid and logs the bot username.

### 5. Verify

- Health check: http://localhost:8004/health
- Interactive docs: http://localhost:8004/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Service info |
| GET | /health | Health check |
| POST | /telegram/upload | Upload a file chunk to Telegram |
| GET | /telegram/download/{file_id} | Download a file chunk from Telegram |
| POST | /telegram/delete | Delete a Telegram message (removes the stored file) |
| GET | /telegram/info/{file_id} | Get Telegram file metadata |

## File size limit

The Telegram Bot API enforces a 50 MB per-document limit.
This service rejects uploads larger than `MAX_FILE_SIZE_BYTES` (default 52428800).
Chunking of larger files is the responsibility of the file-service.

## Docker

```bash
docker build -t zerodrive-telegram-service .
docker run -p 8004:8004 --env-file .env zerodrive-telegram-service
```
