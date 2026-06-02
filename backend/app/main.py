from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import audit as audit_router
from app.routers import auth as auth_router
from app.routers import expenses as expenses_router
from app.routers import maintenance as maintenance_router
from app.routers import members as members_router


settings = get_settings()

app = FastAPI(
    title="Arihant CardMaster Enclave - Society Maintenance Portal API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(members_router.router)
app.include_router(maintenance_router.router)
app.include_router(expenses_router.router)
app.include_router(audit_router.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
