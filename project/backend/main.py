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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("VALIDATION ERROR!")
    print(exc.errors())
    try:
        print("BODY:", str(exc.body).encode('utf-8', errors='replace'))
    except Exception:
        pass
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.get("/")
def read_root():
    return {"message": "Welcome to PCARDB Loan Automation System"}

app.include_router(auth.router, prefix="", tags=["Auth"])
app.include_router(applications.router, tags=["Applications"])
app.include_router(pdf.router, tags=["PDF"])
