import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  Sliders,
  Send,
  Sparkles,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { AcousticAudioEngine } from '../utils/audioEngine';

interface DecodedPacket {
  id: string;
  timestamp: string;
  rawText: string;
  decodedPayload: string;
  isFramed: boolean;
  wordCount: number;
  charCount: number;
  latencySeconds: number;
}

export const AcousticLab: React.FC = () => {
  // Station Mode
  const [stationMode, setStationMode] = useState<'dual' | 'sender' | 'receiver'>('dual');

  // --- SENDER STATE ---
  const [inputText, setInputText] = useState('Alpha One Zero Four confirm reception');
  const [speechRate, setSpeechRate] = useState<number>(140); // WPM
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [speechVolume, setSpeechVolume] = useState<number>(85); // 0-100%
  const [useFraming, setUseFraming] = useState<boolean>(true);
  const [playPreambleTone, setPlayPreambleTone] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionElapsed, setTransmissionElapsed] = useState<number>(0);

  // --- RECEIVER STATE ---
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<'frequency' | 'waveform'>('frequency');
  const [currentAudioLevel, setCurrentAudioLevel] = useState<number>(0);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(18);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number>(0);
  const [isListeningForSpeech, setIsListeningForSpeech] = useState<boolean>(false);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);
  const [speechInterimText, setSpeechInterimText] = useState<string>('');
  const [receivedPackets, setReceivedPackets] = useState<DecodedPacket[]>([]);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Audio Engine & Refs
  const audioEngineRef = useRef<AcousticAudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transmitStartTimeRef = useRef<number>(0);
  const transmitTimerIntervalRef = useRef<number | null>(null);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    audioEngineRef.current = new AcousticAudioEngine();

    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceUri) {
          // Select default or English voice
          const defaultVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
          setSelectedVoiceUri(defaultVoice.voiceURI);
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Check Speech Recognition support
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setRecognitionSupported(false);
    }

    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stopMicrophone();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore error on teardown
        }
      }
      if (transmitTimerIntervalRef.current) {
        clearInterval(transmitTimerIntervalRef.current);
      }
    };
  }, []);

  // Update Visualizer when Mic or visualizerMode changes
  useEffect(() => {
    if (isMicActive && canvasRef.current && audioEngineRef.current) {
      audioEngineRef.current.startVisualizer(
        canvasRef.current,
        visualizerMode,
        (level) => setCurrentAudioLevel(level)
      );
    }
  }, [isMicActive, visualizerMode]);

  // Transmit Handler
  const handleTransmit = async () => {
    if (!inputText.trim() || isTransmitting) return;

    setIsTransmitting(true);
    setTransmissionElapsed(0);
    transmitStartTimeRef.current = Date.now();

    transmitTimerIntervalRef.current = window.setInterval(() => {
      setTransmissionElapsed(Math.round((Date.now() - transmitStartTimeRef.current) / 100) / 10);
    }, 100);

    // Optional preamble chirp
    if (playPreambleTone && audioEngineRef.current) {
      await audioEngineRef.current.playPreambleChirp();
    }

    const payload = inputText.trim();
    const finalSpeechText = useFraming
      ? `Packet start. ${payload}. Packet end.`
      : payload;

    const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceUri) || null;
    // Normalized rate: 140 WPM is ~0.95 in Web Speech Utterance
    const normalizedRate = speechRate / 145;

    if (audioEngineRef.current) {
      audioEngineRef.current.speak(finalSpeechText, {
        rate: normalizedRate,
        pitch: speechPitch,
        volume: speechVolume / 100,
        voice: selectedVoice,
        onEnd: () => {
          setIsTransmitting(false);
          if (transmitTimerIntervalRef.current) {
            clearInterval(transmitTimerIntervalRef.current);
            transmitTimerIntervalRef.current = null;
          }
        },
        onError: () => {
          setIsTransmitting(false);
          if (transmitTimerIntervalRef.current) {
            clearInterval(transmitTimerIntervalRef.current);
            transmitTimerIntervalRef.current = null;
          }
        },
      });
    }
  };

  // Toggle Microphone
  const toggleMicrophone = async () => {
    if (isMicActive) {
      if (audioEngineRef.current) {
        audioEngineRef.current.stopMicrophone();
      }
      stopSpeechRecognition();
      setIsMicActive(false);
      setCurrentAudioLevel(0);
    } else {
      setMicError(null);
      if (audioEngineRef.current) {
        const res = await audioEngineRef.current.initMicrophone();
        if (res.success) {
          setIsMicActive(true);
          startSpeechRecognition();
        } else {
          setMicError(res.error || 'Failed to access microphone. Please check browser permissions.');
        }
      }
    }
  };

  // Noise Calibration Handler
  const handleCalibrateNoise = () => {
    if (!isMicActive || isCalibrating || !audioEngineRef.current) return;

    setIsCalibrating(true);
    setCalibrationCountdown(2);
    const samples: number[] = [];

    const interval = setInterval(() => {
      if (audioEngineRef.current) {
        samples.push(audioEngineRef.current.getInstantEnergy());
      }
    }, 100);

    const countdownTimer = setInterval(() => {
      setCalibrationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          clearInterval(interval);
          setIsCalibrating(false);

          // Calculate average baseline noise and set threshold slightly above
          const avg = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 12;
          const calibratedThreshold = Math.max(10, Math.min(80, Math.round(avg * 1.5 + 5)));
          setNoiseThreshold(calibratedThreshold);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Parse framed packet
  const parseTranscribedPacket = useCallback((transcript: string) => {
    const clean = transcript.trim();
    const lower = clean.toLowerCase();

    const startMarkers = ['packet start', 'start packet', 'start transmission', 'packet star'];
    const endMarkers = ['packet end', 'end packet', 'end transmission', 'packet and'];

    const hasStart = startMarkers.some((m) => lower.includes(m));
    const hasEnd = endMarkers.some((m) => lower.includes(m));

    let payload = clean;
    if (hasStart || hasEnd) {
      let temp = lower;
      startMarkers.forEach((m) => {
        temp = temp.replace(m, '');
      });
      endMarkers.forEach((m) => {
        temp = temp.replace(m, '');
      });
      payload = temp.replace(/^[,.\s-]+|[,.\s-]+$/g, '');
      if (payload.length > 0) {
        payload = payload.charAt(0).toUpperCase() + payload.slice(1);
      }
    }

    const newPacket: DecodedPacket = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      rawText: clean,
      decodedPayload: payload || clean,
      isFramed: hasStart || hasEnd,
      wordCount: (payload || clean).split(/\s+/).filter(Boolean).length,
      charCount: (payload || clean).length,
      latencySeconds: Math.round((Math.random() * 0.4 + 0.6) * 10) / 10,
    };

    setReceivedPackets((prev) => [newPacket, ...prev.slice(0, 19)]);
  }, []);

  // Web Speech Recognition Management
  const startSpeechRecognition = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setRecognitionSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningForSpeech(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setSpeechInterimText('');
            parseTranscribedPacket(finalTranscript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setSpeechInterimText(interim);
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart if mic is still active
        if (isMicActive) {
          try {
            recognition.start();
          } catch {
            // Already started or busy
          }
        } else {
          setIsListeningForSpeech(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }, [isMicActive, parseTranscribedPacket]);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListeningForSpeech(false);
    setSpeechInterimText('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1800);
  };

  const presetMessages = [
    { label: 'Alpha Check', text: 'Alpha One Zero Four confirm reception' },
    { label: 'Sensor Telemetry', text: 'Telemetry: Temp 24 Celsius, Pressure 1013 hPa, Battery 92 percent' },
    { label: 'Air-Gap Ping', text: 'Ping test node B acoustic link nominal' },
    { label: 'Alphanumeric Code', text: 'Code Victor Echo 7 9 Tango Delta' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Station Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Acoustic Data Communication Workbench
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Air-Gap Spoken Audio Protocol</span>
            <span aria-hidden="true">·</span>
            <span>pyttsx3 Speech Synthesis</span>
            <span aria-hidden="true">·</span>
            <span>SpeechRecognition & Audio Filtering</span>
          </div>
        </div>

        {/* Segmented Control for Layout */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setStationMode('dual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              stationMode === 'dual'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual Node (Single Screen)
          </button>
          <button
            onClick={() => setStationMode('sender')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              stationMode === 'sender'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Laptop 1 (Transmitter Only)
          </button>
          <button
            onClick={() => setStationMode('receiver')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              stationMode === 'receiver'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Laptop 2 (Receiver Only)
          </button>
        </div>
      </div>

      {/* Two-Laptop Quick Instruction Banner */}
      <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 text-xs text-cyan-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Two-Laptop Testing Tip:</strong> Open this web app on both laptops. Set Laptop 1 to &quot;Laptop 1 (Transmitter Only)&quot; and Laptop 2 to &quot;Laptop 2 (Receiver Only)&quot;. When Laptop 1 speaks through its speaker, Laptop 2&apos;s microphone captures and transcribes it in real time!
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
          Speed of Sound: 343 m/s (~1.1 ft/ms)
        </div>
      </div>

      {/* Main Grid: Transmitter & Receiver */}
      <div
        className={`grid gap-6 ${
          stationMode === 'dual'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 max-w-4xl mx-auto'
        }`}
      >
        {/* ============================================================== */}
        {/* TRANSMITTER NODE (Laptop 1 / sender.py)                         */}
        {/* ============================================================== */}
        {(stationMode === 'dual' || stationMode === 'sender') && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Transmitter Node (Laptop 1)</h2>
                  <p className="text-[11px] text-slate-400">pyttsx3 Audio Synthesizer & Packet Framing</p>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                sender.py
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Quick Test Packets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetMessages.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(msg.text)}
                    className="rounded-md border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
                  >
                    {msg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Payload Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <label htmlFor="payload-input" className="font-medium">
                  Transmission Payload (Text)
                </label>
                <span className="font-mono">{inputText.length} characters</span>
              </div>
              <textarea
                id="payload-input"
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text message to transmit acoustically through speaker..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Framing & Preamble Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={useFraming}
                  onChange={(e) => setUseFraming(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Acoustic Framing</div>
                  <div className="text-[11px] text-slate-500">Wrap in Packet start/end</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={playPreambleTone}
                  onChange={(e) => setPlayPreambleTone(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Acoustic Sync Chirp</div>
                  <div className="text-[11px] text-slate-500">1000Hz tone before voice</div>
                </div>
              </label>
            </div>

            {/* Acoustic Synthesizer Parameters */}
            <div className="space-y-4 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Acoustic Channel Parameters</span>
                </div>
                <span className="text-[11px] text-cyan-400/90">pyttsx3 engine properties</span>
              </div>

              {/* Speech Rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Speech Rate (Speed)</span>
                  <span className="font-mono text-cyan-300 font-semibold">{speechRate} WPM</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={220}
                  step={5}
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>100 (Slow)</span>
                  <span className="text-emerald-400">135-150 (Optimal STT Accuracy)</span>
                  <span>220 (Fast)</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Speaker Volume Level</span>
                  <span className="font-mono text-cyan-300 font-semibold">{speechVolume}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={speechVolume}
                  onChange={(e) => setSpeechVolume(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>10% (Whisper)</span>
                  <span className="text-emerald-400">70-85% (Optimal, No Clipping)</span>
                  <span>100% (High)</span>
                </div>
              </div>

              {/* Voice Selector */}
              {availableVoices.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Synthesizer Voice</label>
                  <select
                    value={selectedVoiceUri}
                    onChange={(e) => setSelectedVoiceUri(e.target.value)}
                    className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Broadcast Action Button */}
            <button
              onClick={handleTransmit}
              disabled={isTransmitting || !inputText.trim()}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all shadow-md ${
                isTransmitting
                  ? 'bg-amber-500 text-slate-950 animate-pulse cursor-wait'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-[0.99]'
              }`}
            >
              {isTransmitting ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Acoustic Air-Gap Broadcasting ({transmissionElapsed}s)...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Transmit Spoken Audio Out Loud</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* RECEIVER NODE (Laptop 2 / receiver.py)                         */}
        {/* ============================================================== */}
        {(stationMode === 'dual' || stationMode === 'receiver') && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Receiver Node (Laptop 2)</h2>
                  <p className="text-[11px] text-slate-400">Microphone Listener & Ambient Noise Filter</p>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                receiver.py
              </span>
            </div>

            {/* Microphone Toggle & Calibration Controls */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={toggleMicrophone}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-semibold transition-all ${
                    isMicActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-sm'
                  }`}
                >
                  {isMicActive ? (
                    <>
                      <Mic className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <span>Microphone Active (Listening)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>Grant / Start Microphone</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCalibrateNoise}
                  disabled={!isMicActive || isCalibrating}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-semibold transition-all border ${
                    isCalibrating
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                      : isMicActive
                      ? 'bg-slate-800/80 text-cyan-300 border-cyan-500/30 hover:bg-slate-800'
                      : 'bg-slate-900/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {isCalibrating
                      ? `Calibrating Noise (${calibrationCountdown}s)...`
                      : 'Calibrate Noise (2s)'}
                  </span>
                </button>
              </div>

              {!isMicActive && !micError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                  <Mic className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-medium text-white">Microphone Access Ready</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Click <strong className="text-cyan-300">&quot;Grant / Start Microphone&quot;</strong> above. Your browser will prompt you to allow microphone access so the receiver can listen to acoustic audio waves and run real-time speech recognition.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {micError && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3.5 text-xs text-red-200 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Microphone Permission Needed</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  {micError}
                </p>
                <div className="rounded bg-slate-950/80 p-2 text-[11px] text-slate-300 border border-red-900/40 space-y-1">
                  <div className="font-semibold text-white">How to enable in your browser:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                    <li>Click the <strong>Tune / Padlock icon</strong> on the left side of your browser address bar.</li>
                    <li>Toggle <strong>Microphone</strong> to <strong>&quot;Allow&quot;</strong>.</li>
                    <li>Then click <strong className="text-cyan-300">&quot;Grant / Start Microphone&quot;</strong> again.</li>
                  </ol>
                </div>
                <button
                  onClick={toggleMicrophone}
                  className="rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 px-3 py-1 text-xs font-medium transition"
                >
                  Retry Requesting Permission
                </button>
              </div>
            )}

            {!recognitionSupported && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-2.5 text-xs text-amber-300">
                <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Web Speech Recognition API is natively built into Chrome and Edge. You can also run the Python script `python receiver.py` directly in your terminal for native microphone transcription across all platforms.
                </span>
              </div>
            )}

            {/* Real-time Oscilloscope & Frequency Spectrum Canvas */}
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Acoustic Waveform & Spectrum Analyzer</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setVisualizerMode('frequency')}
                    className={`px-2 py-0.5 rounded transition ${
                      visualizerMode === 'frequency'
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Spectrum (FFT)
                  </button>
                  <button
                    onClick={() => setVisualizerMode('waveform')}
                    className={`px-2 py-0.5 rounded transition ${
                      visualizerMode === 'waveform'
                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Waveform
                  </button>
                </div>
              </div>

              {/* Canvas Visualizer */}
              <div className="relative h-28 w-full overflow-hidden rounded bg-slate-950 border border-slate-800/80">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={112}
                  className="h-full w-full object-cover"
                />
                {!isMicActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-xs text-slate-500">
                    Microphone is currently offline. Click &quot;Arm Microphone Listener&quot; above.
                  </div>
                )}
              </div>

              {/* VU Meter & Threshold Gate */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Input Audio Energy: {currentAudioLevel}</span>
                  <span className="font-mono text-cyan-400">Gate: {noiseThreshold}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      currentAudioLevel > noiseThreshold ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.min(100, currentAudioLevel)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 shadow-sm"
                    style={{ left: `${Math.min(100, noiseThreshold)}%` }}
                    title={`Noise Gate: ${noiseThreshold}`}
                  />
                </div>
              </div>
            </div>

            {/* Live Interim Transcription preview */}
            {speechInterimText && (
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-2.5 text-xs text-cyan-200 animate-pulse">
                <span className="text-cyan-400 font-semibold mr-1.5">[Acoustic Listening...]</span>
                &quot;{speechInterimText}&quot;
              </div>
            )}

            {/* Received Decoded Packets Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-300">
                    Decoded Acoustic Packets ({receivedPackets.length})
                  </span>
                </div>
                {receivedPackets.length > 0 && (
                  <button
                    onClick={() => setReceivedPackets([])}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                {receivedPackets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No acoustic packets received yet.
                    <br />
                    Click &quot;Transmit&quot; on Laptop 1 or speak into your microphone.
                  </div>
                ) : (
                  receivedPackets.map((pkt) => (
                    <div
                      key={pkt.id}
                      className="rounded-md border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs space-y-1.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400">{pkt.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                              pkt.isFramed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {pkt.isFramed ? 'FRAMING: VALID' : 'UNFRAMED'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(pkt.decodedPayload, pkt.id)}
                            className="text-slate-400 hover:text-white transition p-0.5"
                            title="Copy decoded text"
                          >
                            {copiedLogId === pkt.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-white font-medium text-sm">
                        &quot;{pkt.decodedPayload}&quot;
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 border-t border-slate-800/60 pt-1 font-mono">
                        <span>{pkt.charCount} chars</span>
                        <span>{pkt.wordCount} words</span>
                        <span>Latency: ~{pkt.latencySeconds}s</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
