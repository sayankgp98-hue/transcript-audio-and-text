import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  BookOpen,
  Info,
  Radio,
} from 'lucide-react';
import {
  SENDER_PY_CODE,
  RECEIVER_PY_CODE,
  REQUIREMENTS_TXT,
  TESTING_GUIDE_MD,
  ACOUSTIC_FSK_MODEM_PY,
  PythonCodeFile,
} from '../data/pythonFiles';

const FILES: PythonCodeFile[] = [
  {
    filename: 'sender.py',
    title: 'Transmitter Node (pyttsx3 TTS)',
    category: 'sender',
    description:
      'Transmitter script that accepts text from CLI or interactive prompt, packages data with packet framing, configures speech rate/volume, and plays spoken audio via laptop speakers.',
    code: SENDER_PY_CODE,
  },
  {
    filename: 'receiver.py',
    title: 'Receiver Node (SpeechRecognition + Noise Filter)',
    category: 'receiver',
    description:
      'Continuous microphone listener that measures baseline room noise, sets dynamic energy thresholds, transcribes incoming spoken audio, and extracts payload from packet framing.',
    code: RECEIVER_PY_CODE,
  },
  {
    filename: 'requirements.txt',
    title: 'Dependencies & OS Build Guide',
    category: 'deps',
    description:
      'Pinned Python dependencies (pyttsx3, SpeechRecognition, pyaudio, sounddevice) along with OS-specific instructions for Windows, macOS, and Ubuntu/Debian.',
    code: REQUIREMENTS_TXT,
  },
  {
    filename: 'TESTING_GUIDE.md',
    title: 'Two-Laptop Air-Gap Testing Guide',
    category: 'guide',
    description:
      'Comprehensive physical setup and testing protocol for 2 nearby laptops (distance, speaker volume, mic gain, noise calibration, and troubleshooting).',
    code: TESTING_GUIDE_MD,
  },
  {
    filename: 'acoustic_fsk_modem.py',
    title: 'Bonus: Binary FSK Audio Modem',
    category: 'modem',
    description:
      'Direct frequency shift keying (Bell 202 standard: 1200Hz / 2200Hz) audio modem demonstrating raw digital data transmission over air-gap sound waves.',
    code: ACOUSTIC_FSK_MODEM_PY,
  },
];

export const CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonCodeFile>(FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (file: PythonCodeFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = selectedFile.code.trim().split('\n');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Python Source Code Repository
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Production-Grade Code</span>
            <span aria-hidden="true">·</span>
            <span>CLI Arguments &amp; Interactive REPL</span>
            <span aria-hidden="true">·</span>
            <span>Cross-Platform (Windows, Mac, Linux)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:text-white transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy File Code</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleDownload(selectedFile)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download {selectedFile.filename}</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {FILES.map((file) => {
          const isSelected = selectedFile.filename === file.filename;
          return (
            <button
              key={file.filename}
              onClick={() => setSelectedFile(file)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {file.category === 'sender' && <Radio className="h-3.5 w-3.5 text-cyan-400" />}
              {file.category === 'receiver' && <Terminal className="h-3.5 w-3.5 text-emerald-400" />}
              {file.category === 'deps' && <FileCode className="h-3.5 w-3.5 text-amber-400" />}
              {file.category === 'guide' && <BookOpen className="h-3.5 w-3.5 text-blue-400" />}
              {file.category === 'modem' && <FileCode className="h-3.5 w-3.5 text-purple-400" />}
              <span className="font-mono font-semibold">{file.filename}</span>
            </button>
          );
        })}
      </div>

      {/* File Description Header */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 text-xs">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-white">{selectedFile.title}</div>
          <p className="text-slate-400 mt-0.5 leading-relaxed">{selectedFile.description}</p>
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="font-mono text-xs text-slate-300 ml-2 font-medium">
              {selectedFile.filename}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>{lines.length} lines</span>
            <span>{new Blob([selectedFile.code]).size} bytes</span>
          </div>
        </div>

        {/* Code Content with Line Numbers */}
        <div className="overflow-x-auto p-4 max-h-[620px] overflow-y-auto">
          <pre className="font-mono text-xs leading-relaxed text-slate-300 flex">
            {/* Line numbers column */}
            <div
              className="select-none pr-4 text-right text-slate-600 font-mono"
              aria-hidden="true"
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code text column */}
            <div className="flex-1 overflow-x-auto pl-2">
              {lines.map((line, i) => {
                // Lightweight syntax styling simulation for readability
                const isComment = line.trim().startsWith('#') || line.trim().startsWith('"""');
                const isImport = line.trim().startsWith('import ') || line.trim().startsWith('from ');
                const isDef = line.trim().startsWith('def ') || line.trim().startsWith('class ');
                const isDecorator = line.trim().startsWith('@');

                return (
                  <div
                    key={i}
                    className={`${
                      isComment
                        ? 'text-slate-500 italic'
                        : isImport
                        ? 'text-cyan-400'
                        : isDef
                        ? 'text-emerald-300 font-semibold'
                        : isDecorator
                        ? 'text-amber-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {line || '\u00A0'}
                  </div>
                );
              })}
            </div>
          </pre>
        </div>
      </div>
    </div>
  );
};
