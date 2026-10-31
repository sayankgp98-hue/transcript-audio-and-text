#!/usr/bin/env python3
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
        # Preamble marker: "Packet start"
        # Postamble marker: "Packet end"
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

        print(f"\n{BOLD}------------------------------------------------------------{RESET}")
        print(f"{GREEN}{BOLD}[TX AIR-GAP BROADCAST]{RESET} @ {timestamp}")
        print(f"  {BOLD}Raw Payload:{RESET}    \"{payload}\"")
        print(f"  {BOLD}Acoustic Frame:{RESET} \"{acoustic_phrase}\"")
        print(f"  {BOLD}Characters:{RESET}     {len(payload)} chars | Rate: {self.rate} WPM")
        print(f"{CYAN}[AUDIO]{RESET} Playing sound waves through laptop speaker now...")

        t_start = time.time()
        
        # Audio generation and playback out loud
        self.engine.say(acoustic_phrase)
        self.engine.runAndWait()
        
        duration = time.time() - t_start
        print(f"{GREEN}[SUCCESS]{RESET} Transmission complete in {duration:.2f}s (Speed: ~{len(payload)/max(0.1, duration):.1f} chars/sec)")
        print(f"{BOLD}------------------------------------------------------------{RESET}\n")


def list_available_voices():
    """Diagnostic utility to inspect voices installed on this computer."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    print("\nAvailable System Voices:")
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
    print("------------------------------------------------------------\n")

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
            print(f"\n{YELLOW}Interrupted by user. Exiting sender...{RESET}")
            break
        except Exception as err:
            print(f"{RED}[ERROR]{RESET} Transmission failure: {err}")


if __name__ == "__main__":
    main()
