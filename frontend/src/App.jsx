import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import CameraBarcodeScanner from './components/CameraBarcodeScanner';
import ProductVerificationResult from './components/ProductVerificationResult';
import LabelTamperStudio from './components/LabelTamperStudio';
import CounterfeitRegistry from './components/CounterfeitRegistry';
import AllergyModal from './components/AllergyModal';
import ReportModal from './components/ReportModal';
import { 
  checkServerHealth, 
  scanProductBarcode, 
  getFlaggedProductsList, 
  getDemoProductsList 
} from './services/api';
import { sounds } from './utils/audio';
import { 
  ShieldCheck, 
  History, 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

const LOCAL_STORAGE_ALLERGIES_KEY = 'safescan_user_allergies_v1';
const LOCAL_STORAGE_HISTORY_KEY = 'safescan_scan_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'results' | 'tamper-studio' | 'flagged-db'
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  // User Allergies Sensitivity List
  const [userAllergies, setUserAllergies] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ALLERGIES_KEY);
      return stored ? JSON.parse(stored) : ['Gluten / Wheat', 'Peanuts'];
    } catch {
      return ['Gluten / Wheat', 'Peanuts'];
    }
  });

  // Flagged and Demo Products
  const [flaggedProducts, setFlaggedProducts] = useState([]);
  const [demoProducts, setDemoProducts] = useState([]);

  // Scan History
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState({
    barcode: '',
    name: '',
    brand: '',
    flagType: 'SUSPECTED_COUNTERFEIT'
  });
  const [tamperStudioPreload, setTamperStudioPreload] = useState(null);

  // Check backend server health and load presets on mount
  useEffect(() => {
    const initData = async () => {
      // 1. Health check
      const health = await checkServerHealth();
      setBackendOnline(health.status === 'ONLINE');

      // 2. Load flagged reports
      try {
        const flagged = await getFlaggedProductsList();
        setFlaggedProducts(flagged);
      } catch (e) {
        console.warn('Could not load flagged list:', e.message);
      }

      // 3. Load demo test products
      try {
        const demos = await getDemoProductsList();
        setDemoProducts(demos);
      } catch (e) {
        console.warn('Could not load demos:', e.message);
      }
    };

    initData();

    // Periodic ping to backend
    const interval = setInterval(async () => {
      const h = await checkServerHealth();
      setBackendOnline(h.status === 'ONLINE');
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Save allergies to localStorage
  const handleToggleAllergy = (allergenName) => {
    setUserAllergies(prev => {
      const updated = prev.includes(allergenName)
        ? prev.filter(a => a !== allergenName)
        : [...prev, allergenName];
      try {
        localStorage.setItem(LOCAL_STORAGE_ALLERGIES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleClearAllergies = () => {
    setUserAllergies([]);
    try {
      localStorage.setItem(LOCAL_STORAGE_ALLERGIES_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn(e);
    }
  };

  // Main scan execution
  const handleScanSubmit = async (scanParams) => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await scanProductBarcode({
        ...scanParams,
        userAllergies
      });

      setScanResult(response);
      setActiveTab('results');

      // Audio & Confetti feedback
      if (response.authenticityAssessment?.classification === 'VERIFIED_AUTHENTIC') {
        sounds.playScanBeep();
        // Trigger subtle celebration confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#14b8a6', '#06b6d4']
          });
        } catch (e) {}
      } else {
        sounds.playAlertTone();
      }

      // Save to scan history
      const historyItem = {
        id: `scan-${Date.now()}`,
        barcode: response.product.barcode,
        name: response.product.name,
        brand: response.product.brand,
        score: response.authenticityAssessment?.score ?? 50,
        classification: response.authenticityAssessment?.classification || 'SUSPECTED_COUNTERFEIT',
        expiryDate: response.shelfLife?.expiryDate || null,
        isExpired: response.shelfLife?.isExpired || false,
        timestamp: new Date().toISOString(),
        fullData: response
      };

      setScanHistory(prev => {
        const next = [historyItem, ...prev.slice(0, 19)];
        try {
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

    } catch (err) {
      console.error('Scan error:', err);
      setErrorBanner(err.message || 'Failed to scan product. Please check network connection.');
      sounds.playAlertTone();
    } finally {
      setIsLoading(false);
    }
  };

  // Demo selection handler
  const handleSelectDemo = (demo) => {
    handleScanSubmit({
      barcode: demo.barcode,
      manualExpiryDate: demo.manualExpiryDate || null,
      manualProductionDate: demo.manualProductionDate || null
    });
  };

  // Open report modal helper
  const handleOpenReportModal = (barcode = '', name = '', brand = '', flagType = 'SUSPECTED_COUNTERFEIT') => {
    setReportModalData({ barcode, name, brand, flagType });
    setIsReportModalOpen(true);
  };

  // Open Tamper Studio preloaded with result
  const handleOpenTamperStudio = (resultData) => {
    setTamperStudioPreload(resultData);
    setActiveTab('tamper-studio');
  };

  // Refresh flagged list
  const refreshFlagged = async () => {
    try {
      const data = await getFlaggedProductsList();
      setFlaggedProducts(data);
    } catch (e) {}
  };

  // Clear history
  const clearHistory = () => {
    if (confirm('Clear your scanned products history?')) {
      setScanHistory([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        userAllergies={userAllergies}
        setIsAllergyModalOpen={setIsAllergyModalOpen}
        demoProducts={demoProducts}
        onSelectDemo={handleSelectDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* Error notification banner */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs sm:text-sm flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="px-3 py-1 rounded-lg bg-rose-900 text-rose-100 text-xs font-semibold hover:bg-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700 text-center shadow-2xl space-y-4 max-w-sm">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Auditing Product Integrity...</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Querying Open Food Facts, validating GS1 checksums, and analyzing expiration dates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-8">
            <CameraBarcodeScanner
              onScanComplete={handleScanSubmit}
              isLoading={isLoading}
              demoProducts={demoProducts}
              onSelectDemo={handleSelectDemo}
            />

            {/* Recent Scan History Quick Cards */}
            {scanHistory.length > 0 && (
              <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Recent Verification History ({scanHistory.length})
                    </h3>
                  </div>

                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {scanHistory.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setScanResult(item.fullData);
                        setActiveTab('results');
                      }}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.barcode}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                            item.score >= 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {item.score}/100
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{item.brand}</p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-emerald-400 font-semibold group-hover:underline">View Report &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFICATION RESULTS */}
        {activeTab === 'results' && (
          <div>
            {scanResult ? (
              <ProductVerificationResult
                result={scanResult}
                onResetScan={() => setActiveTab('scanner')}
                onOpenReportModal={handleOpenReportModal}
                onOpenTamperStudio={handleOpenTamperStudio}
                userAllergies={userAllergies}
              />
            ) : (
              <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
                <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Product Scanned Yet</h3>
                <p className="text-xs text-slate-400">
                  Scan a barcode with your camera or select an instant test preset to view the full verification report.
                </p>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition"
                >
                  Open Camera Scanner
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LABEL TAMPER STUDIO */}
        {activeTab === 'tamper-studio' && (
          <LabelTamperStudio
            preloadedData={tamperStudioPreload}
            onReportTamper={handleOpenReportModal}
          />
        )}

        {/* TAB 4: COUNTERFEIT REGISTRY */}
        {activeTab === 'flagged-db' && (
          <CounterfeitRegistry
            flaggedProducts={flaggedProducts}
            onRefresh={refreshFlagged}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-400">SafeScan AI • Consumer Safety Platform</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Powered by GS1 Modulo-10 Checksums, Open Food Facts API & Open Beauty Facts API.
          </p>
        </div>
      </footer>

      {/* Personal Allergy Settings Modal */}
      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        userAllergies={userAllergies}
        onToggleAllergy={handleToggleAllergy}
        onClearAllergies={handleClearAllergies}
      />

      {/* Report Counterfeit / Tampered Product Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialBarcode={reportModalData.barcode}
        initialName={reportModalData.name}
        initialBrand={reportModalData.brand}
        initialFlagType={reportModalData.flagType}
        onReportSubmitted={refreshFlagged}
      />

    </div>
  );
}
