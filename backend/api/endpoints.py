from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional
import shutil
import uuid
import os
from pydantic import BaseModel

router = APIRouter()

class JobRequest(BaseModel):
    video_path: str
    mode: str = "auto" # auto, manual, fixed
    duration: int = 60
    captions: bool = False
    manual_start: Optional[str] = None
    manual_end: Optional[str] = None

jobs = {}

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        file_path = f"temp/uploads/{file_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"id": file_id, "path": file_path, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from core.processing import process_job
from core.metadata import generate_viral_metadata

class ShareRequest(BaseModel):
    clip_path: str

@router.post("/share")
async def share_clip(req: ShareRequest):
    try:
        # Resolve SRT path
        # clip path: temp/output/id_clip_1.mp4 or ..._burned.mp4
        srt_path = req.clip_path.replace("_burned.mp4", ".srt").replace(".mp4", ".srt")
        
        if not os.path.exists(srt_path):
            return {
                "title": "My New Short",
                "description": "Watch this video!",
                "hashtags": "#shorts"
            }
            
        with open(srt_path, "r", encoding="utf-8") as f:
            transcript_text = f.read()

        data = generate_viral_metadata(transcript_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/job")
async def create_job(job: JobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    # We need to ensure we have the correct path. 
    # In endpoints, we are just receiving the path from the frontend (which got it from upload response).
    
    # Store job
    jobs[job_id] = {"status": "queued", "config": job.dict()}
    
    # Add background task
    background_tasks.add_task(process_job, job_id, job.dict(), jobs)
    
    return {"job_id": job_id, "status": "queued"}

@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]
