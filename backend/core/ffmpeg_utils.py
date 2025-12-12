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

def burn_subtitles(video_path: str, srt_path: str, output_path: str, font_size: int = 26):
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
        "-vf", f"subtitles='{srt_arg}':force_style='Alignment=10,Fontsize={font_size},MarginV=70,Outline=2,Shadow=1'",
        "-c:a", "copy",
        output_path
    ]
    subprocess.run(cmd, check=True)

def upscale_video(input_path: str, output_path: str):
    # Upscale to 4k (3840x2160) using Lanczos and Unsharp Mask
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", "scale=3840:2160:flags=lanczos,unsharp=5:5:1.0:5:5:0.0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", # slightly better quality for 4k
        "-c:a", "copy",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def concat_videos(video_paths: list[str], output_path: str):
    # Create a temporary file list for ffmpeg concat demuxer
    list_path = output_path.replace(".mp4", ".txt")
    # ffmpeg requires forward slashes and escaped paths in the list file
    with open(list_path, "w", encoding="utf-8") as f:
        for path in video_paths:
            # Absolute path with forward slashes is safest for ffmpeg on windows
            safe_path = os.path.abspath(path).replace("\\", "/")
            f.write(f"file '{safe_path}'\n")
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_path,
        "-c", "copy",
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    finally:
        if os.path.exists(list_path):
            os.remove(list_path)
