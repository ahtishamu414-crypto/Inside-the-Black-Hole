from kokoro_onnx import Kokoro
from scipy.io import wavfile
import numpy as np
from pathlib import Path

kokoro_path = Path("C:/Users/BN Com/.mfm-faceless-shorts/kokoro/kokoro-v1.0.onnx")
voices_path = Path("C:/Users/BN Com/.mfm-faceless-shorts/kokoro/voices-v1.0.bin")

kokoro = Kokoro(str(kokoro_path), str(voices_path))

# Deep, professional cinematic English narrator
# Scene 2 (5-10s): "What if humanity could explore the edge of a black hole?"
# Scene 4 (15-21s): "Where gravity bends space... and time itself slows down."

samples1, sr1 = kokoro.create(
    "What if humanity could explore the edge of a black hole?",
    voice="am_onyx",
    speed=0.90,
    lang="en-us"
)
wavfile.write("e:/Black Hole/trailer_narrator_line1.wav", sr1, (samples1 * 32767).astype(np.int16))
print(f"Narrator 1: {len(samples1)/sr1:.2f}s")

samples2, sr2 = kokoro.create(
    "Where gravity bends space... and time itself slows down.",
    voice="am_onyx",
    speed=0.88,
    lang="en-us"
)
wavfile.write("e:/Black Hole/trailer_narrator_line2.wav", sr2, (samples2 * 32767).astype(np.int16))
print(f"Narrator 2: {len(samples2)/sr2:.2f}s")
