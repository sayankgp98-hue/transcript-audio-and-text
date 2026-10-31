/**
 * Web Audio and Web Speech API utilities for browser-based acoustic communication simulation
 */

export class AcousticAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  /**
   * Initializes microphone capture and connects to Web Audio AnalyserNode
   */
  async initMicrophone(): Promise<{ success: boolean; error?: string; permissionDenied?: boolean }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'Your browser or environment does not support mediaDevices.getUserMedia. Please ensure you are on a secure (HTTPS) origin.',
        };
      }

      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // First attempt with raw acoustic settings; fall back to basic audio if driver rejects custom constraints
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isDenied =
        msg.includes('Permission denied') ||
        msg.includes('NotAllowedError') ||
        msg.includes('permission');
      return { success: false, error: msg, permissionDenied: isDenied };
    }
  }

  /**
   * Stop microphone input and release media stream
   */
  stopMicrophone() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }

  /**
   * Samples current audio energy level for calibration (0 to 100)
   */
  getInstantEnergy(): number {
    if (!this.analyser) return 0;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / bufferLength);
    return Math.min(100, Math.round(rms * 250));
  }

  /**
   * Renders real-time audio visualization to an HTML Canvas
   */
  startVisualizer(
    canvas: HTMLCanvasElement,
    mode: 'frequency' | 'waveform',
    onLevelUpdate?: (level: number) => void
  ) {
    if (!this.analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const freqArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);
      if (!this.analyser) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (mode === 'frequency') {
        this.analyser.getByteFrequencyData(freqArray);

        // Calculate average energy
        let sum = 0;
        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (freqArray[i] / 255) * height;
          sum += freqArray[i];

          // Dynamic cyan to emerald gradient
          const hue = 180 + (i / bufferLength) * 50;
          ctx.fillStyle = `hsl(${hue}, 85%, ${40 + (freqArray[i] / 255) * 30}%)`;
          ctx.fillRect(x, height - barHeight, Math.max(1, barWidth - 1), barHeight);

          x += barWidth;
        }

        const avg = sum / bufferLength;
        if (onLevelUpdate) {
          onLevelUpdate(Math.min(100, Math.round((avg / 128) * 100)));
        }
      } else {
        // Waveform / Oscilloscope
        this.analyser.getByteTimeDomainData(timeArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#06b6d4'; // Cyan-500
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;
        let sumSquare = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeArray[i] / 128.0;
          const y = (v * height) / 2;
          const delta = (timeArray[i] - 128) / 128;
          sumSquare += delta * delta;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();

        const rms = Math.sqrt(sumSquare / bufferLength);
        if (onLevelUpdate) {
          onLevelUpdate(Math.min(100, Math.round(rms * 250)));
        }
      }
    };

    render();
  }

  /**
   * Plays a distinct acoustic preamble sync tone (e.g. 1000 Hz beep) before speech transmission
   */
  async playPreambleChirp(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Chirp from 1000 Hz to 1800 Hz
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);

        setTimeout(() => {
          ctx.close();
          resolve();
        }, 220);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Synthesizes and plays speech using the browser's Web Speech API
   */
  speak(
    text: string,
    options: {
      rate?: number; // 0.1 to 10, default 0.95 (~140 WPM)
      pitch?: number; // 0 to 2
      volume?: number; // 0 to 1
      voice?: SpeechSynthesisVoice | null;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ) {
    if (!('speechSynthesis' in window)) {
      if (options.onError) {
        options.onError(new Error('Web Speech Synthesis API not supported in this browser.'));
      }
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    if (options.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      if (options.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
  }
}
