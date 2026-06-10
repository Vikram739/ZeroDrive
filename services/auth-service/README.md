# ZeroDrive Auth Service

FastAPI service handling Firebase Authentication and Firestore user profiles.

## Setup

### 1. Install Python 3.11

Download from https://www.python.org/downloads/

### 2. Create and activate a virtual environment

```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Add Firebase credentials

Place your Firebase Admin SDK service account key at:

```
services/auth-service/secrets/firebase-admin-key.json
```

Generate it from the Firebase console: Project Settings > Service Accounts > Generate new private key.

### 5. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your credentials path or ports differ.

### 6. Run the service

```bash
uvicorn app.main:app --reload --port 8001
```

### 7. Verify

- Health check: http://localhost:8001/health
- Interactive docs: http://localhost:8001/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Service info |
| GET | /health | Health check |
| POST | /auth/signup | Create user profile after Firebase signup |
| POST | /auth/verify | Verify Firebase ID token |
| GET | /auth/me | Get current user profile |
| DELETE | /auth/me | Delete current user profile |

All protected endpoints require `Authorization: Bearer <firebase_id_token>` header.

## Docker

```bash
docker build -t zerodrive-auth-service .
docker run -p 8001:8001 zerodrive-auth-service
```
