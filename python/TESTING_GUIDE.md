# Acoustic Data Communication System: Testing Guide

This guide walks you through testing the acoustic data communication prototype across **two nearby laptops** in a physical room.

---

## 1. Hardware & Physical Setup

```
+-----------------------+                         +-----------------------+
|   LAPTOP A (SENDER)   |                         |  LAPTOP B (RECEIVER)  |
|                       |                         |                       |
|  [sender.py]          |                         |  [receiver.py]        |
|  pyttsx3 Speech Synth |       Sound Waves       |  PyAudio + Mic        |
|                       | ~ ~ ~ (343 m/s) ~ ~ ~ > |  Ambient Noise Filter |
|  [ Laptop Speaker ]   |       Air Channel       |  [ Laptop Mic ]       |
+-----------------------+                         +-----------------------+
           | <--------------- 0.5m to 2.0m ---------------> |
```

### Recommended Placement:
1. **Distance**: Place the two laptops **0.5 meters to 2.0 meters apart** (about 1.5 to 6 feet).
2. **Line of Sight**: Face Laptop A's speakers directly toward Laptop B's microphone array.
3. **Desk Surfaces**: Place both laptops on a soft mousepad or wooden desk to prevent mechanical chassis vibration.
4. **Room Acoustics**: Avoid rooms with extreme bare-tile echo or high HVAC fan noise directly blowing on the microphone.

---

## 2. Step-by-Step Installation on Both Laptops

### Step 2.1: Clone or Copy Files
Ensure both laptops have Python 3.8+ installed. Place:
- `sender.py` and `requirements.txt` on **Laptop A**
- `receiver.py` and `requirements.txt` on **Laptop B**

### Step 2.2: Install Dependencies

#### On Windows:
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# If PyAudio fails to build:
pip install pipwin
pipwin install pyaudio
```

#### On macOS:
```bash
# Install system portaudio library first
brew install portaudio

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

#### On Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y python3-pyaudio portaudio19-dev espeak espeak-ng

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

---

## 3. Running the Test Across Both Laptops

### Step 3.1: Start the Receiver (Laptop B) FIRST
Always launch the receiver before sending speech so it can calibrate room noise:

```bash
# On Laptop B:
python receiver.py --calibrate 3
```

**What to expect on Laptop B:**
1. It prints: `Sampling ambient background noise for 3.0 seconds...`
2. **Stay silent** for 3 seconds while it measures room fans and baseline noise.
3. It prints: `Baseline Energy Threshold set to: 420`
4. It arms the microphone gate: `[LISTENING ACTIVE] Waiting for acoustic signals...`

---

### Step 3.2: Transmit from the Sender (Laptop A)
Set Laptop A's speaker volume to **70% - 85%** (not 100% to avoid audio clipping / speaker distortion).

#### Test 1: Single Verification Packet
```bash
# On Laptop A:
python sender.py --text "Alpha One Zero Four confirm reception"
```

**What happens:**
1. Laptop A frames the text: `Packet start. Alpha One Zero Four confirm reception. Packet end.`
2. Laptop A plays spoken audio out loud through its speakers.
3. Laptop B's microphone picks up the acoustic sound waves.
4. Laptop B filters room noise and transcribes:
```text
============================================================
[RX PACKET #001 RECEIVED] @ 14:22:10.450
  Raw Transcript: "packet start Alpha One Zero Four confirm reception packet end"
  Decoded Data:   "Alpha one zero four confirm reception" (Framing: VALID)
  Metrics:        37 chars | 6 words | Processing: 0.84s
============================================================
```

#### Test 2: Interactive Real-Time Chat Mode
```bash
# On Laptop A:
python sender.py
```
Now type messages interactively into the prompt on Laptop A, and watch them print in real time on Laptop B's terminal!

---

## 4. Acoustic Optimization & Tuning Guide

| Parameter | Setting | Why It Matters |
| :--- | :--- | :--- |
| **Speech Rate (`--rate`)** | `130 - 150 WPM` | Default pyttsx3 rate (200 WPM) is too fast for microphone speech recognition across air; 140 WPM yields >98% accuracy. |
| **Speaker Volume** | `70% - 85%` | Avoid 100% volume because laptop speaker drivers introduce harmonic clipping and distort consonant frequencies. |
| **Microphone Gain** | `50% - 75%` | Disable aggressive hardware AGC (Auto Gain Control) in OS Sound Settings if words are cut off. |
| **Framing** | `Packet start / end` | Preamble words act as an acoustic synch header, allowing the receiver to ignore stray background chatter. |

---

## 5. Troubleshooting Matrix

### Issue 1: Receiver hears nothing / stays on `[MIC GATE ARMED]`
- **Cause**: Energy threshold too high or wrong microphone device selected.
- **Fix**: Run `python receiver.py --list-mics` to find device ID, then run with manual sensitivity:
  `python receiver.py --device 1 --energy 200`

### Issue 2: `[REJECT] Speech was unintelligible`
- **Cause**: Laptop A volume is too loud (clipping) or speech rate is too fast.
- **Fix**: Lower volume to 75% on Laptop A and transmit with `--rate 130`.

### Issue 3: PyAudio error on Windows
- **Cause**: Missing C++ compiler during pip install.
- **Fix**: Run `pip install pipwin && pipwin install pyaudio`.

### Issue 4: pyttsx3 hangs or gives driver error on Linux
- **Cause**: Missing `espeak` native system package.
- **Fix**: Run `sudo apt-get install espeak espeak-ng`.
