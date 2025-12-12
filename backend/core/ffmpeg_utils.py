import subprocess
import json
import os

def get_video_duration(path: str) -> float:
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0

def extract_audio(video_path: str, audio_path: str):
    # Extract audio at 16k for Whisper
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn", "-ac", "1", "-ar", "16000",
        audio_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def cut_video(input_path: str, output_path: str, start: float, end: float):
    # Fast cut with re-encoding to ensure compatibility (or copy if precise enough? safe to re-encode for shorts)
    # Using 'veryfast' preset for speed.
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-to", str(end),
        "-i", input_path,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def burn_subtitles(video_path: str, srt_path: str, output_path: str):
    # Hard burn subtitles
    # Note: path escaping for filters can be tricky on Windows.
    # Using forward slashes and escaping colon might be needed.
    # A simple way is to use relative paths if possible, or correct escaping.
    
    # helper to fix path for ffmpeg filter
    def ffmpeg_path(p):
        return p.replace("\\", "/").replace(":", "\\:")

    srt_arg = ffmpeg_path(srt_path)
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"subtitles='{srt_arg}'",
        "-c:a", "copy",
        output_path
    ]
    subprocess.run(cmd, check=True)
