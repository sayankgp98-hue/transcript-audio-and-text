#!/usr/bin/env python3
"""
================================================================================
Acoustic Data Communication System - Receiver Node (receiver.py)
================================================================================
Continuously listens to the laptop microphone using PyAudio (or sounddevice)
and SpeechRecognition, filters ambient background noise, transcribes the incoming
spoken audio into text, and logs decoded packets to the console in real time.

Usage:
    python receiver.py                            # Start continuous listening
    python receiver.py --calibrate 3              # Calibrate noise for 3 seconds
    python receiver.py --energy 400               # Manual energy threshold
================================================================================
"""

import argparse
import re
import sys
import time
from datetime import datetime

try:
    import speech_recognition as sr
except ImportError:
    print("[ERROR] SpeechRecognition is not installed. Please run: pip install SpeechRecognition")
    sys.exit(1)

# Check for PyAudio
try:
    import pyaudio
except ImportError:
    print("[WARN] PyAudio not found. SpeechRecognition will attempt to use default system sound input.")
    print("       If microphone access fails, install PyAudio: pip install pyaudio")

# Optional terminal coloring
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    CYAN = Fore.CYAN
    GREEN = Fore.GREEN
    YELLOW = Fore.YELLOW
    RED = Fore.RED
    MAGENTA = Fore.MAGENTA
    RESET = Style.RESET_ALL
    BOLD = Style.BRIGHT
except ImportError:
    CYAN = GREEN = YELLOW = RED = MAGENTA = RESET = BOLD = ""


class AcousticReceiver:
    """
    Manages continuous microphone listening, ambient noise suppression,
    speech transcription, and acoustic packet framing extraction.
    """
    def __init__(self, calibration_duration=2.0, energy_threshold=None, dynamic_energy=True):
        """
        Initialize the acoustic receiver.
        
        Args:
            calibration_duration (float): Seconds to sample background noise on startup.
            energy_threshold (int): Fixed mic sensitivity. If None, auto-calculated.
            dynamic_energy (bool): Continuously adjust threshold to shifting room noise.
        """
        self.recognizer = sr.Recognizer()
        self.calibration_duration = calibration_duration
        self.dynamic_energy = dynamic_energy
        self.packets_received = 0
        self.total_words = 0

        # Fine-tune Recognizer acoustics for machine-to-machine spoken text
        self.recognizer.dynamic_energy_threshold = dynamic_energy
        self.recognizer.dynamic_energy_adjustment_damping = 0.15
        self.recognizer.dynamic_energy_ratio = 1.5
        # Pause threshold: Silence duration (seconds) before audio chunk is considered complete
        self.recognizer.pause_threshold = 0.8
        # Non-speaking duration: buffer around phrase
        self.recognizer.non_speaking_duration = 0.4

        if energy_threshold:
            self.recognizer.energy_threshold = energy_threshold

    def calibrate_ambient_noise(self, source):
        """
        Measures baseline ambient room noise (fans, air conditioning, room echo)
        and sets the microphone energy gate accordingly.
        """
        print(f"\n{CYAN}{BOLD}[CALIBRATION]{RESET} Sampling ambient background noise for {self.calibration_duration:.1f} seconds...")
        print("  Please remain silent and keep the room at typical ambient level...")

        self.recognizer.adjust_for_ambient_noise(source, duration=self.calibration_duration)
        
        print(f"{GREEN}[CALIBRATED]{RESET} Baseline Energy Threshold set to: {BOLD}{int(self.recognizer.energy_threshold)}{RESET}")
        print(f"  Dynamic Energy Tracking: {'ENABLED' if self.recognizer.dynamic_energy_threshold else 'DISABLED'}")
        print(f"  Pause Threshold (End-of-Packet Silence): {self.recognizer.pause_threshold}s\n")

    def parse_packet(self, transcribed_text: str):
        """
        Extracts payload if transmission was framed with [Packet start] ... [Packet end].
        Returns (is_framed, payload).
        """
        clean_text = transcribed_text.strip()
        lower = clean_text.lower()
        
        # Look for packet framing markers
        start_pattern = r"(packet start|start transmission|message start)"
        end_pattern = r"(packet end|end transmission|message end)"

        has_start = bool(re.search(start_pattern, lower))
        has_end = bool(re.search(end_pattern, lower))

        if has_start or has_end:
            # Strip out marker words to isolate the core data payload
            filtered = re.sub(start_pattern, "", lower)
            filtered = re.sub(end_pattern, "", filtered)
            payload = filtered.strip(" .,-!").capitalize()
            return True, payload
        
        return False, clean_text

    def start_listening(self, device_index=None):
        """
        Enters continuous listening loop on the laptop microphone.
        """
        print(f"{CYAN}{BOLD}============================================================{RESET}")
        print(f"{BOLD}   ACOUSTIC DATA RECEIVER (LISTENING CONSOLE){RESET}")
        print(f"{CYAN}============================================================{RESET}")
        
        try:
            mic = sr.Microphone(device_index=device_index)
        except Exception as e:
            print(f"{RED}[CRITICAL]{RESET} Could not initialize microphone: {e}")
            print("Verify microphone permissions or specify device with --list-mics.")
            sys.exit(1)

        with mic as source:
            # 1. Noise calibration
            self.calibrate_ambient_noise(source)

            print(f"{GREEN}{BOLD}[LISTENING ACTIVE]{RESET} Waiting for acoustic signals from nearby laptop...")
            print(f"  Hold sender laptop speaker 0.5m - 2.0m away.")
            print(f"  Press {BOLD}Ctrl+C{RESET} at any time to stop and view session statistics.\n")

            while True:
                try:
                    # Listen for audio phrase (timeout=None means wait indefinitely)
                    print(f"{MAGENTA}[MIC GATE ARMED]{RESET} Listening for incoming speech...", end="\r", flush=True)
                    audio = self.recognizer.listen(
                        source,
                        timeout=None,
                        phrase_time_limit=15.0  # Max length of single packet in seconds
                    )

                    t_rx = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(" " * 60, end="\r")  # Clear armed status line
                    print(f"{CYAN}[AUDIO CAPTURED]{RESET} Transcribing acoustic signal @ {t_rx}...")

                    # 2. Transcribe using SpeechRecognition
                    t_start_transcribe = time.time()
                    try:
                        transcribed = self.recognizer.recognize_google(audio)
                        latency = time.time() - t_start_transcribe
                    except sr.UnknownValueError:
                        print(f"{YELLOW}[REJECT]{RESET} Acoustic signal detected but speech was unintelligible (Low SNR or distortion).")
                        continue
                    except sr.RequestError as req_err:
                        print(f"{RED}[ERROR]{RESET} Recognition service request error: {req_err}")
                        continue

                    # 3. Packet extraction
                    is_framed, payload = self.parse_packet(transcribed)
                    self.packets_received += 1
                    word_count = len(payload.split())
                    self.total_words += word_count

                    # 4. Display received data
                    print(f"\n{BOLD}============================================================{RESET}")
                    print(f"{GREEN}{BOLD}[RX PACKET #{self.packets_received:03d} RECEIVED]{RESET} @ {t_rx}")
                    print(f"  {BOLD}Raw Transcript:{RESET} \"{transcribed}\"")
                    if is_framed:
                        print(f"  {GREEN}{BOLD}Decoded Data:{RESET}   \"{payload}\" (Framing: VALID)")
                    else:
                        print(f"  {BOLD}Decoded Data:{RESET}   \"{payload}\" (Unframed)")
                    print(f"  {BOLD}Metrics:{RESET}        {len(payload)} chars | {word_count} words | Processing: {latency:.2f}s")
                    print(f"{BOLD}============================================================{RESET}\n")

                except KeyboardInterrupt:
                    print(f"\n\n{YELLOW}[SHUTDOWN]{RESET} Stopping Acoustic Receiver...")
                    break
                except Exception as loop_err:
                    print(f"\n{RED}[EXCEPTION]{RESET} In listening loop: {loop_err}")
                    time.sleep(1)

        self._print_summary()

    def _print_summary(self):
        """Prints session summary statistics upon shutdown."""
        print(f"\n{CYAN}{BOLD}---------------- SESSION SUMMARY ----------------{RESET}")
        print(f"  Total Packets Decoded: {self.packets_received}")
        print(f"  Total Words Transcribed: {self.total_words}")
        print(f"  Receiver Energy Level: {int(self.recognizer.energy_threshold)}")
        print(f"{CYAN}{BOLD}-------------------------------------------------{RESET}\n")


def list_microphones():
    """Diagnostic utility to inspect available audio input hardware."""
    mics = sr.Microphone.list_microphone_names()
    print("\nAvailable Audio Input Devices (Microphones):")
    for idx, name in enumerate(mics):
        print(f"  [{idx}] {name}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Acoustic Data Receiver (receiver.py) - Real-Time Microphone STT Listener"
    )
    parser.add_argument(
        "--calibrate", "-c", type=float, default=2.0,
        help="Duration in seconds to sample ambient background noise. Default: 2.0"
    )
    parser.add_argument(
        "--energy", "-e", type=int, default=None,
        help="Manual audio energy threshold (e.g. 300-1000). Default: Auto-calibrated"
    )
    parser.add_argument(
        "--device", "-d", type=int, default=None,
        help="Microphone device index (use --list-mics to view). Default: System default"
    )
    parser.add_argument(
        "--no-dynamic", action="store_true",
        help="Disable automatic continuous dynamic energy threshold tracking."
    )
    parser.add_argument(
        "--list-mics", action="store_true",
        help="List available microphone devices and exit."
    )

    args = parser.parse_args()

    if args.list_mics:
        list_microphones()
        return

    receiver = AcousticReceiver(
        calibration_duration=args.calibrate,
        energy_threshold=args.energy,
        dynamic_energy=not args.no_dynamic
    )

    receiver.start_listening(device_index=args.device)


if __name__ == "__main__":
    main()
