# ZeroDrive

Unlimited free cloud storage powered by Telegram storage as the storage backend. Upload any file up to 5 GB, organize with folders, search, star, and share -- all stored on Telegram's infrastructure at zero cost.

## How It Works

ZeroDrive uses a private Telegram bot and channel as a storage layer. When you upload a file, the backend splits it into chunks (up to 49 MB each), sends each chunk to a Telegram channel via the Bot API, and saves the resulting message IDs to Firestore. When you download, the backend fetches the chunks from Telegram and streams them back. Firestore only stores metadata -- names, sizes, folder structure, timestamps -- so it stays well within free-tier limits.

## Features

- Unlimited storage (Telegram has no storage quota)
- Upload files up to 5 GB (auto-chunked into 49 MB pieces)
- Folder creation and nested folder navigation
- Folder upload via directory picker
- Folder download as ZIP (assembled in-browser with JSZip)
- Drag-and-drop file and folder moves
- Starred items
- Recent items
- Trash with restore and permanent delete
- Empty trash
- Real-time search across file and folder names
- Real storage usage meter in the sidebar
- Dark mode
- Google Sign-In and email/password auth
- Fully responsive from 375 px to 1920 px

## Architecture

```
Browser (React 19 + Vite)
        |
   :8000 api-gateway  (FastAPI -- routes all requests)
   /     |     \     \        \
:8001  :8002  :8003  :8004  :8005
auth  file   meta  telegram   ai
svc   svc    svc    svc       svc
        |           |
    Firestore   Telegram Bot API
    (metadata)  (file storage)
```

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 8000 | Single entry point, proxies to downstream services |
| auth-service | 8001 | Firebase Admin token verification, user profile |
| file-service | 8002 | Chunked upload/download, coordinates with telegram-service and metadata-service |
| metadata-service | 8003 | Firestore CRUD for files, folders, views (recent, starred, trash, search) |
| telegram-service | 8004 | Sends/receives file chunks via Telegram Bot API |
| ai-service | 8005 | AI chat assistant (optional) |

## Tech Stack

**Frontend**
- React 19, Vite 8, Tailwind CSS v3
- React Router DOM v7
- Firebase JS SDK (auth only)
- Axios
- JSZip (lazy-loaded for folder download)
- Lucide React

**Backend**
- FastAPI, Uvicorn
- Pydantic v2
- Firebase Admin SDK (Firestore + token verification)
- httpx (async inter-service calls)
- Telegram Bot API

## Local Development

### Prerequisites

- Node 20+
- Python 3.11+
- A Firebase project with Firestore enabled and a service account key JSON
- A Telegram bot token and a private Telegram channel ID

### 1. Clone the repo

```bash
git clone https://github.com/Vikram739/ZeroDrive.git
cd ZeroDrive
```

### 2. Configure environment variables

**Frontend** -- copy `frontend/.env.example` to `frontend/.env` and fill in your Firebase web app config values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Backend services** -- each service under `services/<name>/` has a `.env.example`. Copy it to `.env` in the same directory. The key values you must set are:

| Variable | Where | What |
|---|---|---|
| `FIREBASE_CREDENTIALS_PATH` | auth, file, metadata services | Path to your Firebase Admin SDK JSON key |
| `TELEGRAM_BOT_TOKEN` | telegram-service | Bot token from @BotFather |
| `TELEGRAM_CHANNEL_ID` | telegram-service | Numeric ID of your private channel (e.g. `-100xxxxxxxxx`) |

Place your Firebase Admin SDK key at `services/<service-name>/secrets/firebase-admin-key.json` (or update the path in each `.env`).

### 3. Start the backend services

Open a terminal for each service, activate a Python virtual environment, install dependencies, and run:

```bash
# Example for auth-service -- repeat for each service
cd services/auth-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Service ports: api-gateway 8000, auth 8001, file 8002, metadata 8003, telegram 8004, ai 8005.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Getting a Telegram Bot and Channel

1. Message [@BotFather](https://t.me/BotFather) on Telegram and use `/newbot` to create a bot. Copy the token.
2. Create a new private Telegram channel.
3. Add your bot to the channel as an **Administrator** with permission to post messages.
4. To get the numeric channel ID, forward any message from the channel to [@userinfobot](https://t.me/userinfobot) or use the Telegram API -- it will look like `-1001234567890`.
5. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID` in `services/telegram-service/.env`.

## Free Always-On Deployment

The stack has two parts: a static frontend and six backend services. Both can be hosted at zero cost with no sleep or cold starts.

### Frontend -- Vercel (free tier, CDN, always on)

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com), import the repo, set the **root directory** to `frontend`.
3. Add all `VITE_FIREBASE_*` variables in the Vercel dashboard under **Environment Variables**.
4. Deploy. Vercel serves the built static files from a global CDN -- no server, never sleeps.

After deploy you'll get a URL like `https://zerodrive.vercel.app`. Set that as an allowed origin in `services/api-gateway/.env` (`ALLOWED_ORIGINS`).

### Backend -- Oracle Cloud Always Free (truly always on, no sleep)

Oracle Cloud's Always Free tier includes 2 AMD micro VMs (or 4 OCPU / 24 GB RAM on Ampere A1 ARM) that never spin down and never expire.

**Steps:**

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) -- requires a credit card for identity verification, but Always Free resources have a hard cap and will never be charged.

2. Create an **Ampere A1 ARM** instance (4 OCPU, 24 GB RAM, Ubuntu 22.04). This single VM can run all six services.

3. SSH into the instance and install Docker:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

4. Clone the repo onto the VM and create all `.env` files (same values as local setup). Place the Firebase Admin SDK JSON key in each service's `secrets/` directory.

5. Write a `docker-compose.yml` at the repo root. A minimal example:

```yaml
services:
  api-gateway:
    build: ./services/api-gateway
    ports: ["8000:8000"]
    env_file: ./services/api-gateway/.env
  auth-service:
    build: ./services/auth-service
    env_file: ./services/auth-service/.env
  file-service:
    build: ./services/file-service
    env_file: ./services/file-service/.env
  metadata-service:
    build: ./services/metadata-service
    env_file: ./services/metadata-service/.env
  telegram-service:
    build: ./services/telegram-service
    env_file: ./services/telegram-service/.env
  ai-service:
    build: ./services/ai-service
    env_file: ./services/ai-service/.env
```

Each service needs a `Dockerfile` using `FROM python:3.11-slim`, installing requirements, and running `uvicorn app.main:app --host 0.0.0.0 --port <PORT>`.

6. Start everything:

```bash
docker compose up -d
```

7. Open port 8000 in the Oracle Cloud **Security List**: Networking > VCN > Security Lists > add ingress rule for TCP 8000 from `0.0.0.0/0`.

8. Update the Vercel environment variable for the API base URL to `http://<oracle-public-ip>:8000`.

For HTTPS (recommended), install **Caddy** on the VM and point a domain at it:

```
zerodrive.yourdomain.com {
  reverse_proxy localhost:8000
}
```

Caddy auto-provisions a free Let's Encrypt certificate. The Oracle VM runs 24/7. Combined with Vercel's CDN frontend, the full stack is always on with zero cold starts and zero monthly bill.

## Repository Structure

```
ZeroDrive/
  frontend/              React + Vite app
    src/
      components/        Layout, auth, upload, UI components
      config/            content.json (all UI strings)
      context/           AuthContext
      pages/             Dashboard, SignIn, SignUp
      services/          api.js, fileService.js
  services/
    api-gateway/         FastAPI reverse proxy
    auth-service/        Firebase token verification
    file-service/        Chunked upload/download
    metadata-service/    Firestore metadata CRUD
    telegram-service/    Telegram Bot API integration
    ai-service/          AI chat assistant
  docker-compose.yml     Orchestration
```

## License

MIT
