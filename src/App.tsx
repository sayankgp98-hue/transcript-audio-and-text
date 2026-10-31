/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { AcousticLab } from './components/AcousticLab';
import { CodeViewer } from './components/CodeViewer';
import { TestingGuideView } from './components/TestingGuideView';
import { ArchitectureView } from './components/ArchitectureView';
import {
  SENDER_PY_CODE,
  RECEIVER_PY_CODE,
  REQUIREMENTS_TXT,
  TESTING_GUIDE_MD,
  ACOUSTIC_FSK_MODEM_PY,
} from './data/pythonFiles';
import { Check, Download, Radio, Shield, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lab' | 'code' | 'guide' | 'architecture'>('lab');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Download sender.py, receiver.py, requirements.txt, and TESTING_GUIDE.md
    downloadFile(SENDER_PY_CODE, 'sender.py');
    setTimeout(() => downloadFile(RECEIVER_PY_CODE, 'receiver.py'), 200);
    setTimeout(() => downloadFile(REQUIREMENTS_TXT, 'requirements.txt'), 400);
    setTimeout(() => downloadFile(TESTING_GUIDE_MD, 'TESTING_GUIDE.md'), 600);
    setTimeout(() => downloadFile(ACOUSTIC_FSK_MODEM_PY, 'acoustic_fsk_modem.py'), 800);

    setDownloadToast('Downloaded all 5 Python prototype & documentation files!');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAll={handleDownloadAll}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16">
        {activeTab === 'lab' && <AcousticLab />}
        {activeTab === 'code' && <CodeViewer />}
        {activeTab === 'guide' && <TestingGuideView />}
        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">AcousticComms</span>
            <span aria-hidden="true">·</span>
            <span>Air-Gap Python Acoustic Data Communication Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('code')}
              className="hover:text-white transition-colors"
            >
              sender.py &amp; receiver.py
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-white transition-colors"
            >
              Two-Laptop Protocol
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleDownloadAll}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Export Scripts
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
