import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Radio,
  Volume2,
  Mic,
  Calculator,
  Zap,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  // Acoustic Calculator state
  const [calcChars, setCalcChars] = useState<number>(45);
  const [calcWpm, setCalcWpm] = useState<number>(140);
  const [calcDistanceMeters, setCalcDistanceMeters] = useState<number>(1.2);

  // Speed of sound at 20°C in air: 343 m/s
  const speedOfSound = 343;
  const timeOfFlightMs = Math.round((calcDistanceMeters / speedOfSound) * 1000 * 10) / 10;
  // Average English word length = 5 characters + 1 space = 6 chars
  const estimatedWords = Math.max(1, Math.round(calcChars / 6));
  const transmissionDurationSec = Math.round(((estimatedWords / calcWpm) * 60 + 0.8) * 10) / 10;
  const effectiveBps = Math.round(((calcChars * 8) / Math.max(0.1, transmissionDurationSec)) * 10) / 10;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Acoustic Communication Architecture &amp; Theory
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Signal Pipeline</span>
          <span aria-hidden="true">·</span>
          <span>Voice vs FSK Modulation Comparison</span>
          <span aria-hidden="true">·</span>
          <span>Acoustic Link Budget Calculator</span>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span>Full Acoustic Transmission Pipeline (Air-Gap Transduction)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 font-mono">
              <span>01. PACKET FRAMING</span>
            </div>
            <div className="text-xs text-white font-medium">Text Framing</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Raw string is enveloped in &quot;Packet start... Packet end&quot; markers to distinguish signal from background human conversation.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 font-mono">
              <span>02. SPEECH SYNTHESIS</span>
            </div>
            <div className="text-xs text-white font-medium">pyttsx3 Audio Engine</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Text is synthesized into vocal tract formants (vowels &amp; consonants) rendered at a stable ~140 WPM for microphone clarity.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 font-mono">
              <span>03. AIR CHANNEL</span>
            </div>
            <div className="text-xs text-white font-medium">Physical Sound Wave</div>
            <p className="text-[11px] text-cyan-200/80 leading-relaxed">
              Acoustic longitudinal pressure waves travel at 343 m/s. Channel subject to room echo, fan noise, and inverse-square attenuation.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
              <span>04. AMBIENT FILTERING</span>
            </div>
            <div className="text-xs text-white font-medium">Dynamic Energy Gate</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              PyAudio captures mic input. adjust_for_ambient_noise() measures room baseline and discards audio below the energy threshold.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
              <span>05. TRANSCRIPTION</span>
            </div>
            <div className="text-xs text-white font-medium">SpeechRecognition</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Acoustic waveform is decoded into words, framing markers are stripped, and the payload is output to the receiver terminal.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Voice TTS/STT vs Direct Audio FSK vs Ultrasound */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Acoustic Modulation Modalities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Modality 1 */}
          <div className="rounded-xl border border-cyan-500/40 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Spoken Voice (pyttsx3 / STT)</span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                This Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uses natural human speech synthesis and recognition. Human listeners in the room can hear and understand the data being sent.
            </p>
            <div className="space-y-1.5 border-t border-slate-800 pt-3 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Bandwidth:</span>
                <span className="font-mono text-white">~20 - 40 bps</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Human Intelligible:</span>
                <span className="font-mono text-emerald-400 font-semibold">Yes (Spoken English)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hardware Requirements:</span>
                <span className="font-mono text-white">Standard Laptop Mic/Speaker</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Best For:</span>
                <span className="font-mono text-cyan-300">Audible confirmation &amp; chat</span>
              </div>
            </div>
          </div>

          {/* Modality 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Acoustic FSK (Bell 202)</span>
              <span className="font-mono text-[10px] text-purple-400 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded">
                Bonus Script Included
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Frequency Shift Keying encodes binary bits as alternating audio tones (1200 Hz Space &amp; 2200 Hz Mark), similar to legacy dial-up acoustic couplers.
            </p>
            <div className="space-y-1.5 border-t border-slate-800 pt-3 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Bandwidth:</span>
                <span className="font-mono text-white">150 - 600 bps</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Human Intelligible:</span>
                <span className="font-mono text-amber-400">No (Chirps &amp; Beeps)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hardware Requirements:</span>
                <span className="font-mono text-white">Standard Laptop Soundcard</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Best For:</span>
                <span className="font-mono text-cyan-300">Arbitrary binary bytes / hex</span>
              </div>
            </div>
          </div>

          {/* Modality 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Near-Ultrasonic Acoustic Link</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                18 - 21 kHz
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transmits above normal adult human hearing limits. Silent in the room, but requires high sampling rates (&ge;44.1 kHz) and sensitive microphone diaphragms.
            </p>
            <div className="space-y-1.5 border-t border-slate-800 pt-3 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Bandwidth:</span>
                <span className="font-mono text-white">50 - 200 bps</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Human Intelligible:</span>
                <span className="font-mono text-slate-400">Silent / Inaudible</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hardware Requirements:</span>
                <span className="font-mono text-white">High-Frequency Mic Response</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Best For:</span>
                <span className="font-mono text-cyan-300">Covert / quiet air-gap links</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Acoustic Link Budget Calculator */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Calculator className="h-4 w-4 text-cyan-400" />
            <span>Acoustic Link Budget &amp; Latency Estimator</span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Speed of Sound: 343 m/s in air @ 20°C
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Message Payload Length</span>
                <span className="font-mono text-cyan-300">{calcChars} characters</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={calcChars}
                onChange={(e) => setCalcChars(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Transmitter Speech Rate</span>
                <span className="font-mono text-cyan-300">{calcWpm} WPM</span>
              </div>
              <input
                type="range"
                min={100}
                max={220}
                step={5}
                value={calcWpm}
                onChange={(e) => setCalcWpm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Distance Between Laptops</span>
                <span className="font-mono text-cyan-300">{calcDistanceMeters} meters</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={5.0}
                step={0.1}
                value={calcDistanceMeters}
                onChange={(e) => setCalcDistanceMeters(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-center space-y-1">
              <div className="text-[11px] text-slate-400">Air Time-of-Flight</div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {timeOfFlightMs} <span className="text-xs font-normal">ms</span>
              </div>
              <div className="text-[10px] text-slate-500">Propagation speed</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-center space-y-1">
              <div className="text-[11px] text-slate-400">Speech Duration</div>
              <div className="text-xl font-bold font-mono text-white">
                {transmissionDurationSec} <span className="text-xs font-normal">sec</span>
              </div>
              <div className="text-[10px] text-slate-500">At {calcWpm} WPM</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-center space-y-1">
              <div className="text-[11px] text-slate-400">Effective Bandwidth</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {effectiveBps} <span className="text-xs font-normal">bps</span>
              </div>
              <div className="text-[10px] text-slate-500">Air throughput</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-center space-y-1">
              <div className="text-[11px] text-slate-400">Signal-to-Noise</div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {calcDistanceMeters <= 1.5 ? '> 18 dB' : '< 12 dB'}
              </div>
              <div className="text-[10px] text-slate-500">
                {calcDistanceMeters <= 1.5 ? 'Nominal Link' : 'Requires Quiet Room'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
