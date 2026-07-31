import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import applications, auth, pdf

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    from init_db import init_db
    init_db()  # idempotent: seeds default users only if none exist
    if os.environ.get("DEMO_SEED") == "1":
        # Demo hosting: always have the sample application available,
        # even on a fresh (wiped) database. Idempotent.
        from tools.seed_reference_apps import main as seed_demo
        seed_demo()

@app.get("/healthz", include_in_schema=False)
def healthz():
    """Presence booleans only — never values. Confirms env delivery on hosts."""
    from routers.auth import signup_enabled
    return {
        "status": "ok",
        "signup_enabled": signup_enabled(),
        "custom_manager_password": bool(os.environ.get("MANAGER_PASSWORD")),
        "custom_officer_password": bool(os.environ.get("OFFICER_PASSWORD")),
    }

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("VALIDATION ERROR!")
    print(exc.errors())
    try:
        print("BODY:", str(exc.body).encode('utf-8', errors='replace'))
    except Exception:
        pass
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.include_router(auth.router, prefix="", tags=["Auth"])
app.include_router(applications.router, tags=["Applications"])
app.include_router(pdf.router, tags=["PDF"])

# In dev, Vite proxies /api/* -> backend (stripping /api) and /token directly.
# In single-container deployments there is no proxy, so also accept the
# /api-prefixed paths the built frontend actually requests.
app.include_router(auth.router, prefix="/api", include_in_schema=False)
app.include_router(applications.router, prefix="/api", include_in_schema=False)
app.include_router(pdf.router, prefix="/api", include_in_schema=False)

# Serve the built frontend (single-container deployment). No-op in dev.
FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"
)
if os.path.isdir(FRONTEND_DIST):
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        candidate = os.path.normpath(os.path.join(FRONTEND_DIST, full_path))
        if full_path and candidate.startswith(os.path.normpath(FRONTEND_DIST)) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to PCARDB Loan Automation System"}
