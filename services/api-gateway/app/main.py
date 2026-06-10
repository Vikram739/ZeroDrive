import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.http_client import close_http_client, init_http_client
from app.routes.proxy import router as proxy_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="ZeroDrive API Gateway",
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

app.include_router(proxy_router, prefix="/api")


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
    await init_http_client()
    logger.info("API Gateway started on port %d (environment=%s)", settings.PORT, settings.ENVIRONMENT)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_http_client()
    logger.info("API Gateway shutdown complete")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "api-gateway"}


@app.get("/")
def root() -> dict:
    return {
        "service": "ZeroDrive API Gateway",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "routes": {
            "/api/auth/*": "Auth Service",
            "/api/files/*": "File Service",
            "/api/folders/*": "Metadata Service",
            "/api/telegram/*": "Telegram Service",
            "/api/ai/*": "AI Service",
        },
    }
