from faster_whisper import WhisperModel
import os

# Initialize model (lazy loading or global)
# Using 'small' or 'base' for CPU usage as requested. 'int8' quantization.
MODEL_SIZE = "small"
DEVICE = "cpu"
COMPUTE_TYPE = "int8"

def transcribe_audio(audio_path: str):
    """
    Transcribes the audio file and returns segments.
    """
    print(f"Loading Whisper Model: {MODEL_SIZE} on {DEVICE}...")
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    
    print(f"Transcribing {audio_path}...")
    # Request word timestamps
    segments, info = model.transcribe(audio_path, beam_size=5, word_timestamps=True)
    
    result = []
    
    # Custom segmentation: simpler, shorter phrases (karaoke style)
    # Group words into chunks of max 4 words or max 2 seconds
    
    current_chunk = []
    chunk_start = 0.0
    
    for segment in segments:
        words = segment.words
        if not words:
            continue
            
        for word in words:
            if not current_chunk:
                chunk_start = word.start
                current_chunk.append(word)
                continue
            
            # Conditions to break chunk:
            # 1. Chunk has 4 words
            # 2. Duration > 2.0s
            # 3. Gap > 0.5s
            duration = word.end - chunk_start
            gap = word.start - current_chunk[-1].end
            
            if len(current_chunk) >= 4 or duration > 2.0 or gap > 0.5:
                # Flush current chunk
                result.append({
                    "start": chunk_start,
                    "end": current_chunk[-1].end,
                    "text": " ".join([w.word for w in current_chunk]).strip()
                })
                current_chunk = [word]
                chunk_start = word.start
            else:
                current_chunk.append(word)
                
    # Flush remaining
    if current_chunk:
        result.append({
            "start": chunk_start,
            "end": current_chunk[-1].end,
            "text": " ".join([w.word for w in current_chunk]).strip()
        })
    
    return result, info.language
