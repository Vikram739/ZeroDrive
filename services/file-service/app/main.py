from __future__ import annotations
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.firebase import initialize_firebase
from app.core.http_client import close_http_client, init_http_client
from app.routes.files import router as files_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_firebase()
    await init_http_client()
    logger.info("File service started")
    yield
    await close_http_client()
    logger.info("File service stopped")


settings = get_settings()

app = FastAPI(
    title="ZeroDrive File Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "file-service"}


@app.get("/")
async def root():
    return {
        "service": "ZeroDrive File Service",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
    }
