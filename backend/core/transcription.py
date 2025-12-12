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
    segments, info = model.transcribe(audio_path, beam_size=5)
    
    # helper to convert generator to list if needed, or process directly
    result = []
    for segment in segments:
        result.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text
        })
    
    return result, info.language
