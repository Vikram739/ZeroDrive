# ZeroDrive API Gateway

Single entry point for the ZeroDrive frontend. Routes all `/api/*` requests to the appropriate microservice.

## Routing

| Path prefix | Target service |
|-------------|---------------|
| `/api/auth/*` | Auth Service (port 8001) |
| `/api/files/*` | File Service (port 8002) |
| `/api/folders/*` | Metadata Service (port 8003) |
| `/api/telegram/*` | Telegram Service (port 8004) |
| `/api/ai/*` | AI Service (port 8005) |

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

Edit `.env` if any service URLs or ports differ from defaults.

### 4. Run

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Verify

- Health check: http://localhost:8000/health
- Service info: http://localhost:8000/
- Interactive docs: http://localhost:8000/docs

## Docker

```bash
docker build -t zerodrive-api-gateway .
docker run -p 8000:8000 zerodrive-api-gateway
```

## Notes

- Authorization headers are forwarded transparently to downstream services.
- CORS is handled centrally here; downstream services do not need their own CORS config.
- On downstream connection failure, returns 503. On timeout, returns 504.
