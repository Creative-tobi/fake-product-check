import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scan, 
  FileSearch, 
  AlertTriangle, 
  SlidersHorizontal, 
  Flame, 
  Sparkles,
  ChevronDown,
  Activity
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  backendOnline,
  userAllergies,
  setIsAllergyModalOpen,
  demoProducts,
  onSelectDemo
}) {
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => setActiveTab('scanner')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SafeScan<span className="text-emerald-400 font-bold">.AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  v2.0 Guard
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Authenticity, Expiry & Tamper Verification
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scan className="w-4 h-4" />
              Live Scanner
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              Verification Report
            </button>

            <button
              onClick={() => setActiveTab('tamper-studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tamper-studio'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              Tamper Studio
            </button>

            <button
              onClick={() => setActiveTab('flagged-db')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'flagged-db'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Counterfeit DB
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Demo Test Presets */}
            <div className="relative">
              <button
                onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 hover:text-white transition-all shadow-sm"
                title="Instant test barcodes without webcam"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Test Demos</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDemoDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setIsDemoDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Instant Test Presets
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {demoProducts.map((demo, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectDemo(demo);
                          setIsDemoDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex flex-col gap-0.5 group"
                      >
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                          {demo.name}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{demo.brand}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono ${
                            demo.type.includes('AUTHENTIC') 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' 
                              : demo.type.includes('COUNTERFEIT')
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          }`}>
                            {demo.barcode}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Allergy Guardian Trigger */}
            <button
              onClick={() => setIsAllergyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 transition-all relative"
              title="Configure personal allergens"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Allergens</span>
              {userAllergies.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full">
                  {userAllergies.length}
                </span>
              )}
            </button>

            {/* Backend Server Status Indicator */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border ${
                backendOnline
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                  : 'bg-rose-950/50 text-rose-300 border-rose-800/40'
              }`}
              title={backendOnline ? 'Backend Express API is Online (Port 5000)' : 'Backend API Offline'}
            >
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="hidden xl:inline">{backendOnline ? 'API Active' : 'Offline'}</span>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <Scan className="w-3.5 h-3.5" /> Scanner
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'results' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" /> Report
          </button>
          <button
            onClick={() => setActiveTab('tamper-studio')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'tamper-studio' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Tamper
          </button>
          <button
            onClick={() => setActiveTab('flagged-db')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'flagged-db' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Blacklist
          </button>
        </div>

      </div>
    </header>
  );
}
