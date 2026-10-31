#!/usr/bin/env python3
"""
================================================================================
Bonus Acoustic Modem: Direct Audio Frequency Shift Keying (FSK)
================================================================================
In addition to voice TTS/STT, acoustic data can be transmitted digitally
using audio tones (Bell 202 FSK standard).

- Bit '1' (Mark):  2200 Hz pure sine wave
- Bit '0' (Space): 1200 Hz pure sine wave
- Baud Rate:       150 baud

This script demonstrates digital binary data transmission over air-gap audio!
Requires: pip install numpy sounddevice
================================================================================
"""

import argparse
import sys
import time
import numpy as np

try:
    import sounddevice as sd
except ImportError:
    print("[ERROR] sounddevice is required for acoustic FSK modem: pip install sounddevice numpy")
    sys.exit(1)


# FSK Modem Parameters (Bell 202 Standard)
SAMPLE_RATE = 44100
MARK_FREQ = 2200.0    # Hz for binary '1'
SPACE_FREQ = 1200.0   # Hz for binary '0'
BAUD_RATE = 150       # Bits per second (acoustic air-gap friendly)
BIT_DURATION = 1.0 / BAUD_RATE
SAMPLES_PER_BIT = int(SAMPLE_RATE * BIT_DURATION)


def text_to_bits(text: str) -> list:
    """Convert ASCII text string into a list of binary bits (0 or 1)."""
    bits = []
    # Preamble training sequence (alternating 10101010 for receiver synchronization)
    bits.extend([1, 0, 1, 0, 1, 0, 1, 0])
    
    for char in text:
        byte_val = ord(char)
        # 1 start bit (0), 8 data bits (LSB first), 1 stop bit (1)
        bits.append(0)  # Start bit
        for i in range(8):
            bits.append((byte_val >> i) & 1)
        bits.append(1)  # Stop bit
        
    return bits


def synthesize_fsk(bits: list) -> np.ndarray:
    """Generate audio waveform corresponding to the FSK bitstream."""
    total_samples = len(bits) * SAMPLES_PER_BIT
    audio_signal = np.zeros(total_samples, dtype=np.float32)
    phase = 0.0

    for idx, bit in enumerate(bits):
        freq = MARK_FREQ if bit == 1 else SPACE_FREQ
        start_idx = idx * SAMPLES_PER_BIT
        end_idx = start_idx + SAMPLES_PER_BIT
        
        # Continuous phase frequency synthesis
        t = np.arange(SAMPLES_PER_BIT) / SAMPLE_RATE
        audio_chunk = 0.5 * np.sin(2 * np.pi * freq * t + phase)
        phase = (phase + 2 * np.pi * freq * BIT_DURATION) % (2 * np.pi)
        audio_signal[start_idx:end_idx] = audio_chunk

    return audio_signal


def transmit_fsk(text: str):
    """Broadcasts digital bits as audible acoustic tones."""
    print(f"Encoding text: \"{text}\" into FSK acoustic tones...")
    bits = text_to_bits(text)
    print(f"Bitstream length: {len(bits)} bits @ {BAUD_RATE} baud (~{len(bits)*BIT_DURATION:.2f} seconds)")
    
    waveform = synthesize_fsk(bits)
    print("Playing FSK audio over laptop speakers now...")
    sd.play(waveform, SAMPLE_RATE)
    sd.wait()
    print("FSK acoustic transmission complete!")


def main():
    parser = argparse.ArgumentParser(description="Acoustic FSK Modem (Direct Audio Tone Data Link)")
    parser.add_argument("--send", "-s", type=str, default="PING", help="Text payload to send via FSK tones")
    args = parser.parse_args()

    transmit_fsk(args.send)


if __name__ == "__main__":
    main()
