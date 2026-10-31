import React from 'react';
import { Download, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'lab' | 'code' | 'guide' | 'architecture';
  setActiveTab: (tab: 'lab' | 'code' | 'guide' | 'architecture') => void;
  onDownloadAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onDownloadAll }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
            <Radio className="h-4 w-4" />
          </div>
          <button
            onClick={() => setActiveTab('lab')}
            className="text-left font-bold tracking-tight text-white hover:text-cyan-400 transition-colors"
          >
            <span className="text-base sm:text-lg">AcousticComms</span>
          </button>
        </div>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('lab')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'lab' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Interactive Lab
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'code' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Python Source Code
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'guide' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Two-Laptop Test Guide
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'architecture' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Acoustic Architecture
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-95 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Python Scripts</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row if on narrow screens */}
      <div className="flex md:hidden border-t border-slate-800/80 px-4 py-2 overflow-x-auto gap-3 text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('lab')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeTab === 'lab' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Interactive Lab
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeTab === 'code' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Python Code
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeTab === 'guide' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          2-Laptop Guide
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeTab === 'architecture' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Architecture
        </button>
      </div>
    </header>
  );
};
