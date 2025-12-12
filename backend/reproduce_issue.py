import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Add current directory to path so we can import core
sys.path.append(os.getcwd())

from core.ffmpeg_utils import burn_subtitles

# Create a dummy video and srt if they don't exist, or use one of the existing ones
# We'll try to use the existing one but we need a corresponding SRT.
# Processing loop creates SRT.
# Let's just create a dummy video and SRT with the complex name to test path handling.

complex_name = "test 😓 complex name (1).mp4"
video_path = f"temp/repro_{complex_name}"
srt_path = video_path.replace(".mp4", ".srt")
output_path = video_path.replace(".mp4", "_out.mp4")

# Ensure temp dir exists
os.makedirs("temp", exist_ok=True)

# Create dummy video using ffmpeg
import subprocess
print(f"Creating dummy video at {video_path}")
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=duration=5:size=1280x720:rate=30", 
    "-f", "lavfi", "-i", "sine=frequency=1000:duration=5", 
    "-c:v", "libx264", "-c:a", "aac", video_path
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Create dummy SRT
print(f"Creating dummy SRT at {srt_path}")
with open(srt_path, "w", encoding="utf-8") as f:
    f.write("1\n00:00:01,000 --> 00:00:04,000\nThis is a test subtitle.\n\n")

print("Attempting to burn subtitles...")
try:
    burn_subtitles(video_path, srt_path, output_path)
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
    # Inspect the error
    import traceback
    traceback.print_exc()

print("Cleaning up...")
if os.path.exists(video_path): os.remove(video_path)
if os.path.exists(srt_path): os.remove(srt_path)
if os.path.exists(output_path): os.remove(output_path)
