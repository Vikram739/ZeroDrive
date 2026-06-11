import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.telegram_client import (
    close_telegram_client,
    get_telegram_client,
    init_telegram_client,
)
from app.routes.telegram import router as telegram_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="ZeroDrive Telegram Service",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telegram_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
async def startup_event() -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")
    if not settings.TELEGRAM_CHANNEL_ID:
        raise RuntimeError("TELEGRAM_CHANNEL_ID is not set")

    client = init_telegram_client()
    bot_info = await client.get_me()
    username = bot_info.get("username", "unknown")
    logger.info(
        "Telegram service started, bot username: @%s (environment=%s)",
        username,
        settings.ENVIRONMENT,
    )


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_telegram_client()
    logger.info("Telegram service shutdown complete")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "telegram-service"}


@app.get("/")
def root() -> dict:
    return {
        "service": "ZeroDrive Telegram Service",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "max_file_size_bytes": settings.MAX_FILE_SIZE_BYTES,
    }
