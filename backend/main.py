from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Windows console encoding fix
sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI(title="Local Shorts Generator")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.endpoints import router as api_router
app.include_router(api_router, prefix="/api")

# Ensure temp directories exist
os.makedirs("temp/uploads", exist_ok=True)
os.makedirs("temp/output", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Local Shorts Generator API is running"}

# Mount static directory for downloads
app.mount("/static", StaticFiles(directory="temp/output"), name="static")

# We will mount the frontend build later, or just run them separately for dev.
# app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
