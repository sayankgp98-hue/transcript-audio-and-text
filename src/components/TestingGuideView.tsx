import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle,
  Copy,
  Check,
  Terminal,
  Volume2,
  Mic,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const TestingGuideView: React.FC = () => {
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepIdx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const copyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const osInstallCommands = {
    windows: `# 1. Create and activate a clean virtual environment
python -m venv venv
venv\\Scripts\\activate

# 2. Install primary acoustic dependencies
pip install pyttsx3 SpeechRecognition colorama

# 3. Install PyAudio (If standard pip fails on Windows, use pipwin):
pip install pyaudio
# If Microsoft Visual C++ is missing, run:
# pip install pipwin
# pipwin install pyaudio`,

    mac: `# 1. Install portaudio system audio library via Homebrew first
brew install portaudio

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install Python acoustic packages
pip install pyttsx3 SpeechRecognition pyaudio colorama`,

    linux: `# 1. Install native audio and TTS packages (Ubuntu / Debian)
sudo apt-get update
sudo apt-get install -y python3-pyaudio portaudio19-dev espeak espeak-ng

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install Python acoustic packages
pip install pyttsx3 SpeechRecognition pyaudio colorama`,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Two-Laptop Air-Gap Testing Protocol
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Physical Setup</span>
          <span aria-hidden="true">·</span>
          <span>Ambient Noise Calibration</span>
          <span aria-hidden="true">·</span>
          <span>Troubleshooting Matrix</span>
        </div>
      </div>

      {/* Physical Setup Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span>Physical Environment &amp; Positioning Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950 p-6 rounded-lg border border-slate-800/80">
          {/* Laptop 1 */}
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-2">
              <Laptop className="h-6 w-6" />
            </div>
            <div className="font-semibold text-white text-sm">Laptop 1: Transmitter</div>
            <div className="font-mono text-xs text-cyan-400 mt-0.5">sender.py</div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-cyan-400" />
              <span>Speaker Volume: 70% – 85%</span>
            </div>
          </div>

          {/* Air Channel */}
          <div className="flex flex-col items-center text-center px-2 py-4">
            <div className="flex items-center gap-1 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1 rounded-full mb-2">
              <span>Acoustic Air Channel</span>
            </div>
            <div className="w-full flex items-center justify-center gap-2 text-slate-500">
              <div className="h-0.5 w-12 bg-cyan-500/30" />
              <ArrowRight className="h-4 w-4 text-cyan-400 animate-pulse" />
              <div className="h-0.5 w-12 bg-cyan-500/30" />
            </div>
            <div className="text-xs text-slate-300 font-medium mt-2">
              Optimal Distance: 0.5m – 2.0m (1.5 – 6 ft)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Speed: 343 m/s · Free Air Propagation
            </div>
          </div>

          {/* Laptop 2 */}
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
              <Laptop className="h-6 w-6" />
            </div>
            <div className="font-semibold text-white text-sm">Laptop 2: Receiver</div>
            <div className="font-mono text-xs text-emerald-400 mt-0.5">receiver.py</div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Mic className="h-3 w-3 text-emerald-400" />
              <span>Mic Noise Gate: Auto-Calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* OS Installation Instructions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>Library Installation (pip install)</span>
          </div>

          {/* OS Selector Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setSelectedOS('windows')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                selectedOS === 'windows'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows
            </button>
            <button
              onClick={() => setSelectedOS('mac')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                selectedOS === 'mac'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              macOS
            </button>
            <button
              onClick={() => setSelectedOS('linux')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                selectedOS === 'linux'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ubuntu / Linux
            </button>
          </div>
        </div>

        {/* Command Box */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
          <button
            onClick={() => copyCommand(osInstallCommands[selectedOS], 99)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition"
          >
            {copiedIndex === 99 ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Commands</span>
              </>
            )}
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed pr-24">
            {osInstallCommands[selectedOS]}
          </pre>
        </div>
      </div>

      {/* 5-Step Execution Sequence */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Step-by-Step Test Procedure
        </h2>

        <div className="space-y-3">
          {[
            {
              title: 'Step 1: Place Files on Both Laptops',
              desc: 'Copy sender.py to Laptop 1, and receiver.py to Laptop 2. Install requirements.txt inside a Python virtual environment on both machines.',
              code: 'pip install -r requirements.txt',
            },
            {
              title: 'Step 2: Launch the Receiver (Laptop 2) FIRST',
              desc: 'Always start receiver.py before Laptop 1 speaks. Maintain silence in the room for 3 seconds while it measures background noise (fans, air conditioning) and establishes the dynamic energy threshold.',
              code: 'python receiver.py --calibrate 3',
            },
            {
              title: 'Step 3: Level Laptop 1 Speaker Volume (75%)',
              desc: 'Set Laptop 1 speaker volume to 75%. Avoid 100% volume because laptop speaker drivers introduce harmonic clipping and distort vowel formant frequencies.',
              code: 'python sender.py --rate 140 --volume 0.85',
            },
            {
              title: 'Step 4: Transmit Initial Acoustic Verification Packet',
              desc: 'On Laptop 1, send a standard test packet. Laptop 1 speaks the framed phrase aloud, and Laptop 2 transcribes it to console in real time.',
              code: 'python sender.py --text "Alpha One Zero Four confirm reception"',
            },
            {
              title: 'Step 5: Run Real-Time Interactive Chat',
              desc: 'Run sender.py with no arguments to enter interactive REPL mode. Type continuous sentences on Laptop 1 and watch them print on Laptop 2.',
              code: 'python sender.py',
            },
          ].map((step, idx) => {
            const isDone = completedSteps[idx];
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStep(idx)}
                      className="mt-0.5 rounded text-slate-400 hover:text-emerald-400 transition"
                    >
                      <CheckCircle
                        className={`h-5 w-5 ${
                          isDone ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-600'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="font-semibold text-white text-sm">{step.title}</div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyCommand(step.code, idx)}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition whitespace-nowrap shrink-0"
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>

                <div className="mt-3 rounded bg-slate-950 p-2 font-mono text-xs text-cyan-300 border border-slate-800/80">
                  $ {step.code}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Troubleshooting Matrix */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Acoustic Link Troubleshooting &amp; Pitfalls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>Receiver ignores speech / stuck on [MIC GATE ARMED]</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Cause:</strong> The baseline energy threshold was calibrated during a noisy moment, setting the gate too high.
              <br />
              <strong>Remedy:</strong> Re-run with manual sensitivity: <code className="font-mono text-cyan-300">python receiver.py --energy 250</code>, or run calibration in absolute room silence.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>Transcribed text says [REJECT] Unintelligible</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Cause:</strong> Audio clipping caused by Laptop 1 volume at 100%, or speech speed is too fast for microphone STT.
              <br />
              <strong>Remedy:</strong> Lower Laptop 1 volume to 75% and transmit at 135–140 WPM: <code className="font-mono text-cyan-300">python sender.py --rate 135 --volume 0.8</code>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>PyAudio compilation error during `pip install`</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Cause:</strong> Missing PortAudio C-header files.
              <br />
              <strong>Remedy:</strong> On Windows, run <code className="font-mono text-cyan-300">pip install pipwin &amp;&amp; pipwin install pyaudio</code>. On macOS, run <code className="font-mono text-cyan-300">brew install portaudio</code> first.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>Microphone device index mismatch</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Cause:</strong> System defaulting to disconnected headset mic or virtual audio loopback.
              <br />
              <strong>Remedy:</strong> Inspect available inputs with <code className="font-mono text-cyan-300">python receiver.py --list-mics</code> and specify device index directly: <code className="font-mono text-cyan-300">--device 1</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
