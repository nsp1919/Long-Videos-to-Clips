@echo off
echo Starting Local Shorts Generator...

:: Start Backend
echo Starting Backend...
start "Shorts Backend" cmd /k "cd backend && python -m uvicorn main:app --reload"

:: Start Frontend
echo Starting Frontend...
start "Shorts Frontend" cmd /k "cd frontend && npm run dev"

echo Services started!
echo You can close this window, the servers will keep running.
pause
