import os
import math
from .ffmpeg_utils import get_video_duration, extract_audio, cut_video, burn_subtitles
from .transcription import transcribe_audio

def generate_srt(segments, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            # Format time: 00:00:00,000
            def fmt_time(t):
                hours = int(t // 3600)
                minutes = int((t % 3600) // 60)
                seconds = int(t % 60)
                millis = int((t * 1000) % 1000)
                return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"
            
            start_str = fmt_time(seg['start'])
            end_str = fmt_time(seg['end'])
            f.write(f"{i}\n{start_str} --> {end_str}\n{seg['text'].strip()}\n\n")

def process_job(job_id: str, job_config: dict, jobs_store: dict):
    # jobs_store is passed by reference to update status
    # In a real app, use a database.
    
    try:
        jobs_store[job_id]["status"] = "processing"
        
        # We rely on the path provided by the frontend/upload endpoint
        video_path = job_config.get('video_path')
        
        if not video_path or not os.path.exists(video_path):
            jobs_store[job_id]["status"] = "failed"
            jobs_store[job_id]["error"] = "Video file not found"
            return

        duration = get_video_duration(video_path)
        clip_duration = job_config.get('duration', 60)
        mode = job_config.get('mode', 'auto')
        
        # Determine cuts
        cuts = []
        if mode == 'manual':
            start_str = job_config.get('manual_start', '00:00')
            end_str = job_config.get('manual_end', '00:10')
            
            def parse_time(t_str):
                parts = list(map(int, t_str.split(':')))
                if len(parts) == 2:
                    return parts[0] * 60 + parts[1]
                elif len(parts) == 3:
                    return parts[0] * 3600 + parts[1] * 60 + parts[2]
                return 0

            start_sec = parse_time(start_str)
            end_sec = parse_time(end_str)
            
            if end_sec > start_sec:
                cuts.append((start_sec, end_sec))
        else:
            # Fixed split
            num_clips = math.ceil(duration / clip_duration)
            for i in range(num_clips):
                start = i * clip_duration
                end = min((i + 1) * clip_duration, duration)
                if end - start > 5: # min 5 seconds
                    cuts.append((start, end))

        output_files = []
        
        for idx, (start, end) in enumerate(cuts):
            clip_name = f"clip_{idx+1}.mp4"
            clip_path = f"temp/output/{job_id}_{clip_name}"
            
            jobs_store[job_id]["status"] = f"cutting_{idx+1}/{len(cuts)}"
            cut_video(video_path, clip_path, start, end)
            
            final_clip_path = clip_path
            
            if job_config.get('captions'):
                jobs_store[job_id]["status"] = f"transcribing_{idx+1}"
                audio_path = clip_path.replace(".mp4", ".wav")
                extract_audio(clip_path, audio_path)
                
                segments, lang = transcribe_audio(audio_path)
                srt_path = clip_path.replace(".mp4", ".srt")
                generate_srt(segments, srt_path)
                
                # Burn captions
                burned_path = clip_path.replace(".mp4", "_burned.mp4")
                burn_subtitles(clip_path, srt_path, burned_path)
                final_clip_path = burned_path
                
                # Cleanup audio
                if os.path.exists(audio_path):
                    os.remove(audio_path)

            output_files.append(final_clip_path)

        jobs_store[job_id]["status"] = "completed"
        jobs_store[job_id]["output_files"] = output_files
        
    except Exception as e:
        jobs_store[job_id]["status"] = "failed"
        jobs_store[job_id]["error"] = str(e)
        print(f"Job {job_id} failed: {e}")
