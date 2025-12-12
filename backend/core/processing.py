import os
import math
from .ffmpeg_utils import get_video_duration, extract_audio, cut_video, burn_subtitles, concat_videos, upscale_video
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
        

        # Prepare base filename
        base_name = os.path.splitext(job_config.get('filename', 'video.mp4'))[0]
        # Clean filename
        base_name = "".join([c if c.isalnum() else "_" for c in base_name])

        output_files = []

        # Determine clips to process
        clips_to_process = [] # list of (start, end, suffix_index)
        
        if mode == "auto":
            duration_per_clip = int(job_config.get('duration', 60))
            video_duration = get_video_duration(video_path)
            for i, start in enumerate(range(0, int(video_duration), duration_per_clip)):
                end = min(start + duration_per_clip, video_duration)
                if start >= video_duration: break
                if end - start > 5: # min 5 seconds
                    clips_to_process.append((start, end, i + 1))
                
        elif mode == "manual":
            # Parse MM:SS to seconds
            def parse_time(t_str):
                if not t_str: return 0
                parts = t_str.split(":")
                return int(parts[0]) * 60 + int(parts[1])
                
            start = parse_time(job_config.get('manual_start', "00:00"))
            end = parse_time(job_config.get('manual_end', "00:30"))
            if end > start:
                clips_to_process.append((start, end, 1))

        elif mode == "merge":
            # Special handling for merge: we create ONE final clip from multiple segments
            
            def parse_time(t_str):
                if not t_str: return 0
                parts = t_str.split(":")
                return int(parts[0]) * 60 + int(parts[1])

            segments = job_config.get('merge_segments', [])
            temp_segment_files = []
            
            jobs_store[job_id]["status"] = "cutting_segments"
            
            for i, seg in enumerate(segments):
                start = parse_time(seg['start'])
                end = parse_time(seg['end'])
                seg_path = os.path.join("temp/output", f"{job_id}_seg_{i}.mp4")
                cut_video(video_path, seg_path, start, end)
                temp_segment_files.append(seg_path)
                
            # Merge them
            jobs_store[job_id]["status"] = "merging"
            merged_filename = f"{base_name}_Merged.mp4"
            merged_path = os.path.join("temp/output", merged_filename)
            concat_videos(temp_segment_files, merged_path)
            
            # Cleanup segments
            for p in temp_segment_files:
                if os.path.exists(p): os.remove(p)
                
            # Now we have a single "clip" that is the merged video. 
            # We treat it as if it was the result of the cutting phase, 
            # so the rest of the pipeline (Upscale -> Transcribe) works on it.
            # We'll just define one item in clips_to_process but bypass the cut_video step?
            # Actually easier to just restructure the loop below. 
            # But to minimize code change, let's just make clips_to_process empty 
            # and handle the rest here? Or trick the loop?
            # Let's handle the post-processing here and return, or adapt the loop.
            
            # We'll bypass the loop for merge mode because the loop assumes cutting from original.
            # So we process the merged_path directly below.
            
            final_clip_path = merged_path
            current_font_size = 26
            
            if job_config.get('enhance_4k'):
                jobs_store[job_id]["status"] = "upscaling"
                upscaled_path = merged_path.replace(".mp4", "_4k.mp4")
                upscale_video(merged_path, upscaled_path)
                final_clip_path = upscaled_path
                current_font_size = 52

            if job_config.get('captions'):
                jobs_store[job_id]["status"] = "transcribing"
                audio_path = final_clip_path.replace(".mp4", ".wav")
                extract_audio(final_clip_path, audio_path)
                
                segments, lang = transcribe_audio(audio_path)
                srt_path = final_clip_path.replace(".mp4", ".srt")
                generate_srt(segments, srt_path)
                
                burned_path = final_clip_path.replace(".mp4", "_burned.mp4")
                burn_subtitles(final_clip_path, srt_path, burned_path, font_size=current_font_size)
                final_clip_path = burned_path
                
                if os.path.exists(audio_path): os.remove(audio_path)

            output_files.append(final_clip_path)
            jobs_store[job_id]["output_files"] = output_files
            jobs_store[job_id]["status"] = "completed"
            return # Exit function, we are done for merge mode


        for idx, (start, end, suffix_idx) in enumerate(clips_to_process):
            clip_name = f"{base_name}_Part_{suffix_idx}.mp4"
            clip_path = os.path.join("temp/output", f"{job_id}_{clip_name}")
            
            jobs_store[job_id]["status"] = f"cutting_{idx+1}/{len(clips_to_process)}"
            cut_video(video_path, clip_path, start, end)
            
            final_clip_path = clip_path
            current_font_size = 26 # default for 1080p typically
            
            if job_config.get('enhance_4k'):
                jobs_store[job_id]["status"] = f"upscaling_{idx+1}"
                upscaled_path = clip_path.replace(".mp4", "_4k.mp4")
                upscale_video(clip_path, upscaled_path)
                final_clip_path = upscaled_path
                current_font_size = 52 # Scale font for 4k

            if job_config.get('captions'):
                jobs_store[job_id]["status"] = f"transcribing_{idx+1}"
                # Audio extraction needs to happen from the clip (upscaled or not, audio is same/copied)
                audio_path = clip_path.replace(".mp4", ".wav") # Use original cut for audio speed if wanted, or final
                extract_audio(final_clip_path, audio_path)
                
                segments, lang = transcribe_audio(audio_path)
                srt_path = final_clip_path.replace(".mp4", ".srt")
                generate_srt(segments, srt_path)
                
                # Burn captions
                burned_path = final_clip_path.replace(".mp4", "_burned.mp4")
                burn_subtitles(final_clip_path, srt_path, burned_path, font_size=current_font_size)
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
