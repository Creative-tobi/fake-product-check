import React, { useState } from 'react';
import { 
  Flame, 
  Calendar, 
  Tag, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Sparkles,
  Camera,
  FileCheck2
} from 'lucide-react';
import { inspectLabelDetails } from '../services/api';
import { sounds } from '../utils/audio';

export default function LabelTamperStudio({ preloadedData, onReportTamper }) {
  const [barcode, setBarcode] = useState(preloadedData?.product?.barcode || '');
  const [productionDate, setProductionDate] = useState(preloadedData?.shelfLife?.productionDate || '');
  const [expiryDate, setExpiryDate] = useState(preloadedData?.shelfLife?.expiryDate || '');
  const [batchNumber, setBatchNumber] = useState(preloadedData?.batchAnalysis?.batchCode || '');
  const [claimedBrand, setClaimedBrand] = useState(preloadedData?.product?.brand || '');
  const [claimedCountry, setClaimedCountry] = useState(preloadedData?.product?.originCountry || '');
  const [userNotes, setUserNotes] = useState('');
  
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInspect = async (e) => {
    e.preventDefault();
    if (!barcode && !productionDate && !expiryDate) {
      setErrorMsg('Please provide at least a barcode or package date to inspect.');
      return;
    }

    setErrorMsg('');
    setIsInspecting(true);
    setInspectionResult(null);

    try {
      const data = await inspectLabelDetails({
        barcode: barcode.trim(),
        productionDate: productionDate || null,
        expiryDate: expiryDate || null,
        batchNumber: batchNumber.trim() || null,
        claimedBrand: claimedBrand.trim() || null,
        claimedCountry: claimedCountry.trim() || null,
        userNotes: userNotes.trim() || null
      });

      if (data.tamperRisk === 'CRITICAL') {
        sounds.playAlertTone();
      } else {
        sounds.playScanBeep();
      }

      setInspectionResult(data);
    } catch (err) {
      setErrorMsg(err.message || 'Inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  const loadTamperPreset = (presetType) => {
    if (presetType === 'forged-dates') {
      setBarcode('5449000000996');
      setProductionDate('2025-06-10');
      setExpiryDate('2024-02-15'); // Expiry BEFORE Production
      setBatchNumber('LOT-RELBL-001');
      setUserNotes('Found sticker pasted over original expiry stamp');
    } else if (presetType === 'future-mfd') {
      setBarcode('3017620422003');
      setProductionDate('2028-11-20'); // Future MFD
      setExpiryDate('2029-11-20');
      setBatchNumber('BCH-TEST-99');
      setUserNotes('Manufacture date stamped 2 years in the future');
    } else if (presetType === 'valid-sample') {
      setBarcode('3017620422003');
      setProductionDate('2024-05-01');
      setExpiryDate('2025-05-01');
      setBatchNumber('L4122TF8');
      setUserNotes('Standard authentic commercial package');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Studio Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Packaging & Label Tamper Studio
            </h2>
            <p className="text-xs text-slate-400">
              Forensic inspection tool for altered date stamps, forged labels, and batch anomalies
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden lg:inline">Test Scenarios:</span>
          <button
            type="button"
            onClick={() => loadTamperPreset('forged-dates')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition"
          >
            Forged Dates
          </button>
          <button
            type="button"
            onClick={() => loadTamperPreset('future-mfd')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition"
          >
            Future MFD
          </button>
          <button
            type="button"
            onClick={() => loadTamperPreset('valid-sample')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition"
          >
            Clean Label
          </button>
        </div>
      </div>

      {/* Inspection Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <form onSubmit={handleInspect} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Barcode input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Product Barcode *
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 5449000000996"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Production Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Manufacture Date (MFD / PRD)
              </label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Expiration Date (EXP / BBD)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Batch number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                Batch / Lot Number (LOT)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. L94381-B"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Claimed Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Claimed Brand
              </label>
              <input
                type="text"
                value={claimedBrand}
                onChange={(e) => setClaimedBrand(e.target.value)}
                placeholder="e.g. Ferrero or Coca-Cola"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Claimed Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Declared Country of Origin
              </label>
              <input
                type="text"
                value={claimedCountry}
                onChange={(e) => setClaimedCountry(e.target.value)}
                placeholder="e.g. France, USA, Germany"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

          </div>

          {/* User inspection observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Visual Packaging Notes & Suspicious Indicators
            </label>
            <textarea
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Blurry font, misaligned expiry sticker, broken safety seal, odd chemical odor..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isInspecting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-orange-600/30 active:scale-95 transition"
            >
              {isInspecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Forensic Evidence...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  Run Forensic Tamper Analysis
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Forensic Inspection Result Display */}
      {inspectionResult && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 ${
          inspectionResult.tamperRisk === 'CRITICAL'
            ? 'bg-rose-950/40 border-rose-500/50'
            : inspectionResult.tamperRisk === 'MODERATE'
            ? 'bg-amber-950/40 border-amber-500/50'
            : 'bg-emerald-950/40 border-emerald-500/50'
        }`}>
          
          {/* Header result chip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                inspectionResult.tamperRisk === 'CRITICAL'
                  ? 'bg-rose-900 text-rose-200 border border-rose-400'
                  : inspectionResult.tamperRisk === 'MODERATE'
                  ? 'bg-amber-900 text-amber-200 border border-amber-400'
                  : 'bg-emerald-900 text-emerald-200 border border-emerald-400'
              }`}>
                {inspectionResult.tamperRisk} TAMPER RISK IDENTIFIED
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Forensic Diagnostics Report
              </h3>
            </div>

            <p className="text-xs text-slate-300 max-w-md">
              {inspectionResult.recommendation}
            </p>
          </div>

          {/* Diagnostic Checks Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Diagnostic Integrity Checklist
            </h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {inspectionResult.diagnosticChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{item.check}</p>
                      <p className="text-[11px] text-slate-400">{item.detail}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono shrink-0 ${
                    item.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* If Critical Tamper, provide 1-click report button */}
          {inspectionResult.tamperRisk === 'CRITICAL' && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onReportTamper(barcode, claimedBrand, 'TAMPERED_DETAILS')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Submit to Counterfeit Database
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
