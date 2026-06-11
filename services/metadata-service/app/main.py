import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.firebase import initialize_firebase
from app.routes.files import router as files_router
from app.routes.folders import router as folders_router
from app.routes.views import router as views_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="ZeroDrive Metadata Service",
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

app.include_router(folders_router)
app.include_router(files_router)
app.include_router(views_router)


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
    initialize_firebase()
    logger.info(
        "Metadata service started (environment=%s)", settings.ENVIRONMENT
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "metadata-service"}


@app.get("/")
def root() -> dict:
    return {
        "service": "ZeroDrive Metadata Service",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
    }
