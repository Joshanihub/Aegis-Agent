"""Aegis Agent — FastAPI application entry point."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

load_dotenv(_BACKEND_DIR / ".env")

from api.routes import router  # noqa: E402
from config import get_settings  # noqa: E402
from models.schemas import ErrorResponse  # noqa: E402
from services.event_logger import EventLogger, event_logger  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    global event_logger
    from services import event_logger as el_module

    el_module.event_logger = EventLogger(logs_dir=settings.logs_dir)
    logger.info(
        "Aegis backend starting on port %d (band_mock=%s)",
        settings.port,
        settings.band_mock_mode,
    )
    yield
    logger.info("Aegis backend shutting down")


app = FastAPI(
    title="Aegis Agent API",
    description="Multi-agent investment analysis orchestration backend",
    version="1.0.0",
    lifespan=lifespan,
)

# TODO(production): restrict allow_origins to frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error=str(exc.errors()[0]["msg"]) if exc.errors() else "Validation error",
            code="VALIDATION_ERROR",
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error", code="INTERNAL_ERROR"
        ).model_dump(),
    )


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
    )
