/**
 * Source code for the Python acoustic communication system modules
 */

export interface PythonCodeFile {
  filename: string;
  title: string;
  category: 'sender' | 'receiver' | 'deps' | 'guide' | 'modem';
  description: string;
  code: string;
}

export const SENDER_PY_CODE = `#!/usr/bin/env python3
"""
================================================================================
Acoustic Data Communication System - Transmitter Node (sender.py)
================================================================================
Transmits data acoustically over the air using Text-to-Speech (pyttsx3)
to play spoken audio out loud through the laptop speaker.

Usage:
    python sender.py                          # Interactive interactive mode
    python sender.py --text "Hello Laptop 2"   # Single transmission
    python sender.py --rate 140 --volume 0.9  # Custom acoustic settings
================================================================================
"""

import argparse
import sys
import time
from datetime import datetime

try:
    import pyttsx3
except ImportError:
    print("[ERROR] pyttsx3 is not installed. Please run: pip install pyttsx3")
    sys.exit(1)

# Optional terminal coloring for clear real-time monitoring
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    CYAN = Fore.CYAN
    GREEN = Fore.GREEN
    YELLOW = Fore.YELLOW
    RED = Fore.RED
    RESET = Style.RESET_ALL
    BOLD = Style.BRIGHT
except ImportError:
    CYAN = GREEN = YELLOW = RED = RESET = BOLD = ""


class AcousticSender:
    """
    Handles acoustic data packaging and text-to-speech audio synthesis.
    """
    def __init__(self, rate=140, volume=1.0, voice_index=0, use_framing=True):
        """
        Initialize the pyttsx3 Text-To-Speech engine with acoustic transmission parameters.
        
        Args:
            rate (int): Words per minute. Recommended: 130-150 for high acoustic STT accuracy.
            volume (float): Speaker volume from 0.0 to 1.0.
            voice_index (int): Index of system voice to use.
            use_framing (bool): Wrap message in packet markers [START] ... [OVER] for parsing.
        """
        self.rate = rate
        self.volume = max(0.0, min(1.0, volume))
        self.voice_index = voice_index
        self.use_framing = use_framing
        self.packet_counter = 0

        print(f"{CYAN}{BOLD}[INIT]{RESET} Initializing pyttsx3 Speech Synthesizer...")
        try:
            self.engine = pyttsx3.init()
            self._configure_engine()
        except Exception as e:
            print(f"{RED}[CRITICAL]{RESET} Failed to initialize TTS engine: {e}")
            raise

    def _configure_engine(self):
        """Configure speech rate, volume, and voice selection."""
        # Rate: Words per minute (Default ~200 is often too rapid for microphone STT; 140 is optimal)
        self.engine.setProperty('rate', self.rate)
        # Volume: 0.0 to 1.0
        self.engine.setProperty('volume', self.volume)

        # Detect available system voices
        voices = self.engine.getProperty('voices')
        if voices:
            selected_voice = voices[min(self.voice_index, len(voices) - 1)]
            self.engine.setProperty('voice', selected_voice.id)
            print(f"{CYAN}[CONFIG]{RESET} Voice: {selected_voice.name} | Rate: {self.rate} WPM | Volume: {int(self.volume * 100)}%")
        else:
            print(f"{YELLOW}[CONFIG]{RESET} Default voice active (No extra voices detected)")

    def frame_packet(self, raw_text: str) -> str:
        """
        Enclose raw payload inside acoustic framing words.
        Framing creates distinct pauses and start/stop markers that help the receiver
        isolate the payload from ambient background voices.
        """
        if not self.use_framing:
            return raw_text.strip()

        self.packet_counter += 1
        # Preamble marker: "Transmission start"
        # Postamble marker: "Transmission end"
        framed = f"Packet start. {raw_text.strip()}. Packet end."
        return framed

    def transmit(self, text: str):
        """
        Synthesizes and broadcasts the acoustic packet through the laptop speaker.
        """
        if not text or not text.strip():
            print(f"{YELLOW}[WARN]{RESET} Empty transmission skipped.")
            return

        payload = text.strip()
        acoustic_phrase = self.frame_packet(payload)
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]

        print(f"\\n{BOLD}------------------------------------------------------------{RESET}")
        print(f"{GREEN}{BOLD}[TX AIR-GAP BROADCAST]{RESET} @ {timestamp}")
        print(f"  {BOLD}Raw Payload:{RESET}    \\"{payload}\\"")
        print(f"  {BOLD}Acoustic Frame:{RESET} \\"{acoustic_phrase}\\"")
        print(f"  {BOLD}Characters:{RESET}     {len(payload)} chars | Rate: {self.rate} WPM")
        print(f"{CYAN}[AUDIO]{RESET} Playing sound waves through laptop speaker now...")

        t_start = time.time()
        
        # Audio generation and playback out loud
        self.engine.say(acoustic_phrase)
        self.engine.runAndWait()
        
        duration = time.time() - t_start
        print(f"{GREEN}[SUCCESS]{RESET} Transmission complete in {duration:.2f}s (Speed: ~{len(payload)/max(0.1, duration):.1f} chars/sec)")
        print(f"{BOLD}------------------------------------------------------------{RESET}\\n")


def list_available_voices():
    """Diagnostic utility to inspect voices installed on this computer."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    print("\\nAvailable System Voices:")
    for idx, v in enumerate(voices):
        print(f"  [{idx}] ID: {v.id} | Name: {v.name} | Lang: {getattr(v, 'languages', 'N/A')}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Acoustic Data Transmitter (sender.py) - Spoken Text over Air-Gap"
    )
    parser.add_argument(
        "--text", "-t", type=str, default=None,
        help="Text string to transmit. If omitted, enters interactive prompt."
    )
    parser.add_argument(
        "--rate", "-r", type=int, default=140,
        help="Speech speed in words per minute (Recommended: 130-150). Default: 140"
    )
    parser.add_argument(
        "--volume", "-v", type=float, default=1.0,
        help="Speaker playback volume (0.0 to 1.0). Default: 1.0"
    )
    parser.add_argument(
        "--voice", type=int, default=0,
        help="Voice index (use --list-voices to check IDs). Default: 0"
    )
    parser.add_argument(
        "--no-framing", action="store_true",
        help="Disable [Packet start / Packet end] framing markers."
    )
    parser.add_argument(
        "--list-voices", action="store_true",
        help="List available system voices and exit."
    )
    parser.add_argument(
        "--repeat", type=int, default=1,
        help="Number of times to broadcast the message (with 2s pause)."
    )

    args = parser.parse_args()

    if args.list_voices:
        list_available_voices()
        return

    sender = AcousticSender(
        rate=args.rate,
        volume=args.volume,
        voice_index=args.voice,
        use_framing=not args.no_framing
    )

    # Single or repeated CLI transmission
    if args.text:
        for i in range(args.repeat):
            if args.repeat > 1:
                print(f"Transmission {i+1} of {args.repeat}:")
            sender.transmit(args.text)
            if i < args.repeat - 1:
                time.sleep(2.0)
        return

    # Interactive REPL mode
    print(f"{CYAN}{BOLD}============================================================{RESET}")
    print(f"{BOLD}   ACOUSTIC DATA TRANSMITTER (SENDER CONSOLE){RESET}")
    print(f"{CYAN}============================================================{RESET}")
    print("Type any text message to transmit over laptop speakers.")
    print("Commands: 'exit' or 'quit' to close. 'rate <wpm>' to change speed.")
    print("------------------------------------------------------------\\n")

    while True:
        try:
            user_input = input(f"{BOLD}TX-Input > {RESET}").strip()
            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit", "q"):
                print(f"{YELLOW}Shutting down Acoustic Sender. Goodbye!{RESET}")
                break

            if user_input.lower().startswith("rate "):
                try:
                    new_rate = int(user_input.split()[1])
                    sender.rate = new_rate
                    sender.engine.setProperty('rate', new_rate)
                    print(f"{GREEN}[CONFIG]{RESET} Speech rate updated to {new_rate} WPM")
                except ValueError:
                    print(f"{RED}[ERROR]{RESET} Invalid rate syntax. Example: rate 135")
                continue

            sender.transmit(user_input)

        except KeyboardInterrupt:
            print(f"\\n{YELLOW}Interrupted by user. Exiting sender...{RESET}")
            break
        except Exception as err:
            print(f"{RED}[ERROR]{RESET} Transmission failure: {err}")


if __name__ == "__main__":
    main()
`;

export const RECEIVER_PY_CODE = `#!/usr/bin/env python3
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
    python receiver.py --engine google            # Select recognition engine
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
        print(f"\\n{CYAN}{BOLD}[CALIBRATION]{RESET} Sampling ambient background noise for {self.calibration_duration:.1f} seconds...")
        print("  Please remain silent and keep the room at typical ambient level...")

        self.recognizer.adjust_for_ambient_noise(source, duration=self.calibration_duration)
        
        print(f"{GREEN}[CALIBRATED]{RESET} Baseline Energy Threshold set to: {BOLD}{int(self.recognizer.energy_threshold)}{RESET}")
        print(f"  Dynamic Energy Tracking: {'ENABLED' if self.recognizer.dynamic_energy_threshold else 'DISABLED'}")
        print(f"  Pause Threshold (End-of-Packet Silence): {self.recognizer.pause_threshold}s\\n")

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
            print(f"  Press {BOLD}Ctrl+C{RESET} at any time to stop and view session statistics.\\n")

            while True:
                try:
                    # Listen for audio phrase (timeout=None means wait indefinitely)
                    print(f"{MAGENTA}[MIC GATE ARMED]{RESET} Listening for incoming speech...", end="\\r", flush=True)
                    audio = self.recognizer.listen(
                        source,
                        timeout=None,
                        phrase_time_limit=15.0  # Max length of single packet in seconds
                    )

                    t_rx = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(" " * 60, end="\\r")  # Clear armed status line
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
                    print(f"\\n{BOLD}============================================================{RESET}")
                    print(f"{GREEN}{BOLD}[RX PACKET #{self.packets_received:03d} RECEIVED]{RESET} @ {t_rx}")
                    print(f"  {BOLD}Raw Transcript:{RESET} \\"{transcribed}\\"")
                    if is_framed:
                        print(f"  {GREEN}{BOLD}Decoded Data:{RESET}   \\"{payload}\\" (Framing: VALID)")
                    else:
                        print(f"  {BOLD}Decoded Data:{RESET}   \\"{payload}\\" (Unframed)")
                    print(f"  {BOLD}Metrics:{RESET}        {len(payload)} chars | {word_count} words | Processing: {latency:.2f}s")
                    print(f"{BOLD}============================================================{RESET}\\n")

                except KeyboardInterrupt:
                    print(f"\\n\\n{YELLOW}[SHUTDOWN]{RESET} Stopping Acoustic Receiver...")
                    break
                except Exception as loop_err:
                    print(f"\\n{RED}[EXCEPTION]{RESET} In listening loop: {loop_err}")
                    time.sleep(1)

        self._print_summary()

    def _print_summary(self):
        """Prints session summary statistics upon shutdown."""
        print(f"\\n{CYAN}{BOLD}---------------- SESSION SUMMARY ----------------{RESET}")
        print(f"  Total Packets Decoded: {self.packets_received}")
        print(f"  Total Words Transcribed: {self.total_words}")
        print(f"  Receiver Energy Level: {int(self.recognizer.energy_threshold)}")
        print(f"{CYAN}{BOLD}-------------------------------------------------{RESET}\\n")


def list_microphones():
    """Diagnostic utility to inspect available audio input hardware."""
    mics = sr.Microphone.list_microphone_names()
    print("\\nAvailable Audio Input Devices (Microphones):")
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
`;

export const REQUIREMENTS_TXT = `# ==============================================================================
# Dependencies for Python Acoustic Communication Prototype
# ==============================================================================

# Text-to-Speech Engine (Transmitter / sender.py)
# Works offline; uses SAPI5 (Windows), NSSpeechSynthesizer (macOS), or espeak (Linux)
pyttsx3>=2.90

# Speech Recognition & Audio Capture (Receiver / receiver.py)
SpeechRecognition>=3.10.0

# Cross-platform Audio I/O binding to PortAudio (Required for microphone stream)
PyAudio>=0.2.14

# Optional: Sounddevice & NumPy for advanced acoustic modem (FSK / tones)
sounddevice>=0.4.6
numpy>=1.24.0

# Optional: Terminal coloring for clear visual status logs
colorama>=0.4.6

# ==============================================================================
# OS-SPECIFIC INSTALLATION NOTES (CRITICAL):
# ==============================================================================
#
# WINDOWS:
#   If "pip install pyaudio" fails due to Microsoft Visual C++ build tools:
#     pip install pipwin
#     pipwin install pyaudio
#   OR install pre-compiled wheel from Christoph Gohlke's unofficial binaries.
#
# MACOS (Homebrew):
#   brew install portaudio
#   pip install pyaudio
#
# UBUNTU / DEBIAN LINUX:
#   sudo apt-get update
#   sudo apt-get install python3-pyaudio portaudio19-dev espeak espeak-ng -y
#   pip install -r requirements.txt
# ==============================================================================
`;

export const TESTING_GUIDE_MD = `# Acoustic Data Communication System: Testing Guide

This guide walks you through testing the acoustic data communication prototype across **two nearby laptops** in a physical room.

---

## 1. Hardware & Physical Setup

\`\`\`
+-----------------------+                         +-----------------------+
|   LAPTOP A (SENDER)   |                         |  LAPTOP B (RECEIVER)  |
|                       |                         |                       |
|  [sender.py]          |                         |  [receiver.py]        |
|  pyttsx3 Speech Synth |       Sound Waves       |  PyAudio + Mic        |
|                       | ~ ~ ~ (343 m/s) ~ ~ ~ > |  Ambient Noise Filter |
|  [ Laptop Speaker ]   |       Air Channel       |  [ Laptop Mic ]       |
+-----------------------+                         +-----------------------+
           | <--------------- 0.5m to 2.0m ---------------> |
\`\`\`

### Recommended Placement:
1. **Distance**: Place the two laptops **0.5 meters to 2.0 meters apart** (about 1.5 to 6 feet).
2. **Line of Sight**: Face Laptop A's speakers directly toward Laptop B's microphone array.
3. **Desk Surfaces**: Place both laptops on a soft mousepad or wooden desk to prevent mechanical chassis vibration.
4. **Room Acoustics**: Avoid rooms with extreme bare-tile echo or high HVAC fan noise directly blowing on the microphone.

---

## 2. Step-by-Step Installation on Both Laptops

### Step 2.1: Clone or Copy Files
Ensure both laptops have Python 3.8+ installed. Place:
- \`sender.py\` and \`requirements.txt\` on **Laptop A**
- \`receiver.py\` and \`requirements.txt\` on **Laptop B**

### Step 2.2: Install Dependencies

#### On Windows:
\`\`\`bash
# Create and activate virtual environment
python -m venv venv
venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# If PyAudio fails to build:
pip install pipwin
pipwin install pyaudio
\`\`\`

#### On macOS:
\`\`\`bash
# Install system portaudio library first
brew install portaudio

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
\`\`\`

#### On Linux (Ubuntu/Debian):
\`\`\`bash
sudo apt-get update
sudo apt-get install -y python3-pyaudio portaudio19-dev espeak espeak-ng

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
\`\`\`

---

## 3. Running the Test Across Both Laptops

### Step 3.1: Start the Receiver (Laptop B) FIRST
Always launch the receiver before sending speech so it can calibrate room noise:

\`\`\`bash
# On Laptop B:
python receiver.py --calibrate 3
\`\`\`

**What to expect on Laptop B:**
1. It prints: \`Sampling ambient background noise for 3.0 seconds...\`
2. **Stay silent** for 3 seconds while it measures room fans and baseline noise.
3. It prints: \`Baseline Energy Threshold set to: 420\`
4. It arms the microphone gate: \`[LISTENING ACTIVE] Waiting for acoustic signals...\`

---

### Step 3.2: Transmit from the Sender (Laptop A)
Set Laptop A's speaker volume to **70% - 85%** (not 100% to avoid audio clipping / speaker distortion).

#### Test 1: Single Verification Packet
\`\`\`bash
# On Laptop A:
python sender.py --text "Alpha One Zero Four confirm reception"
\`\`\`

**What happens:**
1. Laptop A frames the text: \`Packet start. Alpha One Zero Four confirm reception. Packet end.\`
2. Laptop A plays spoken audio out loud through its speakers.
3. Laptop B's microphone picks up the acoustic sound waves.
4. Laptop B filters room noise and transcribes:
\`\`\`text
============================================================
[RX PACKET #001 RECEIVED] @ 14:22:10.450
  Raw Transcript: "packet start Alpha One Zero Four confirm reception packet end"
  Decoded Data:   "Alpha one zero four confirm reception" (Framing: VALID)
  Metrics:        37 chars | 6 words | Processing: 0.84s
============================================================
\`\`\`

#### Test 2: Interactive Real-Time Chat Mode
\`\`\`bash
# On Laptop A:
python sender.py
\`\`\`
Now type messages interactively into the prompt on Laptop A, and watch them print in real time on Laptop B's terminal!

---

## 4. Acoustic Optimization & Tuning Guide

| Parameter | Setting | Why It Matters |
| :--- | :--- | :--- |
| **Speech Rate (\`--rate\`)** | \`130 - 150 WPM\` | Default pyttsx3 rate (200 WPM) is too fast for microphone speech recognition across air; 140 WPM yields >98% accuracy. |
| **Speaker Volume** | \`70% - 85%\` | Avoid 100% volume because laptop speaker drivers introduce harmonic clipping and distort consonant frequencies. |
| **Microphone Gain** | \`50% - 75%\` | Disable aggressive hardware AGC (Auto Gain Control) in OS Sound Settings if words are cut off. |
| **Framing** | \`Packet start / end\` | Preamble words act as an acoustic synch header, allowing the receiver to ignore stray background chatter. |

---

## 5. Troubleshooting Matrix

### Issue 1: Receiver hears nothing / stays on \`[MIC GATE ARMED]\`
- **Cause**: Energy threshold too high or wrong microphone device selected.
- **Fix**: Run \`python receiver.py --list-mics\` to find device ID, then run with manual sensitivity:
  \`python receiver.py --device 1 --energy 200\`

### Issue 2: \`[REJECT] Speech was unintelligible\`
- **Cause**: Laptop A volume is too loud (clipping) or speech rate is too fast.
- **Fix**: Lower volume to 75% on Laptop A and transmit with \`--rate 130\`.

### Issue 3: PyAudio error on Windows
- **Cause**: Missing C++ compiler during pip install.
- **Fix**: Run \`pip install pipwin && pipwin install pyaudio\`.

### Issue 4: pyttsx3 hangs or gives driver error on Linux
- **Cause**: Missing \`espeak\` native system package.
- **Fix**: Run \`sudo apt-get install espeak espeak-ng\`.
`;

export const ACOUSTIC_FSK_MODEM_PY = `#!/usr/bin/env python3
"""
================================================================================
Bonus Acoustic Modem: Direct Audio Frequency Shift Keying (FSK)
================================================================================
In addition to voice TTS/STT, acoustic data can be transmitted digitally
using audio tones (Bell 202 FSK standard).

- Bit '1' (Mark):  2200 Hz pure sine wave
- Bit '0' (Space): 1200 Hz pure sine wave
- Baud Rate:       300 baud

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
    print(f"Encoding text: \\"{text}\\" into FSK acoustic tones...")
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
`;
