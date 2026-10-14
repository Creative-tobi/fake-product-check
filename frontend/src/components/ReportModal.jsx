import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Flag, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { submitCounterfeitReport } from '../services/api';
import { sounds } from '../utils/audio';

export default function ReportModal({
  isOpen,
  onClose,
  initialBarcode = '',
  initialName = '',
  initialBrand = '',
  initialFlagType = 'SUSPECTED_COUNTERFEIT',
  onReportSubmitted
}) {
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [flagType, setFlagType] = useState('SUSPECTED_COUNTERFEIT');
  const [reason, setReason] = useState('');
  const [reportedExpiryDate, setReportedExpiryDate] = useState('');
  const [reportedProductionDate, setReportedProductionDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBarcode(initialBarcode || '');
      setProductName(initialName || '');
      setBrand(initialBrand || '');
      setFlagType(initialFlagType || 'SUSPECTED_COUNTERFEIT');
      setIsSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, initialBarcode, initialName, initialBrand, initialFlagType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) {
      setErrorMsg('Barcode is required');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please specify the reason or observed violation');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await submitCounterfeitReport({
        barcode: barcode.trim(),
        productName: productName.trim() || 'Reported Item',
        brand: brand.trim() || 'Unspecified Brand',
        flagType,
        reason: reason.trim(),
        reportedExpiryDate: reportedExpiryDate || null,
        reportedProductionDate: reportedProductionDate || null,
        batchNumber: batchNumber.trim() || null,
        storeLocation: storeLocation.trim() || 'Not specified',
        notes: notes.trim() || ''
      });

      sounds.playAlertTone();
      setIsSuccess(true);
      if (onReportSubmitted) {
        onReportSubmitted();
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to file report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Report Counterfeit or Tampered Product
              </h3>
              <p className="text-xs text-slate-400">
                Log suspected illegal copies, altered expiration dates, or harmful batches
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {isSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Report Filed Successfully</h4>
            <p className="text-xs text-emerald-200">
              This product has been added to the public counterfeit registry to alert other consumers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Barcode *
                </label>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 5449000000996"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Violation / Flag Category
                </label>
                <select
                  value={flagType}
                  onChange={(e) => setFlagType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                >
                  <option value="SUSPECTED_COUNTERFEIT">Suspected Counterfeit</option>
                  <option value="TAMPERED_DETAILS">Tampered Expiry / Forged Sticker</option>
                  <option value="INVALID_CHECKSUM">Invalid / Fabricated Barcode</option>
                  <option value="UNREGISTERED_IN_GLOBAL_REGISTRY">Unregistered Toxic / Banned Item</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Infant Milk Formula"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Nestlé (Suspected Fake)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batch / Lot Code
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BCH-9942"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Store / Vendor Location
                </label>
                <input
                  type="text"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  placeholder="e.g. Central Market, Stall 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reported Expiry Date (EXP)
                </label>
                <input
                  type="date"
                  value={reportedExpiryDate}
                  onChange={(e) => setReportedExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reported Production Date (MFD)
                </label>
                <input
                  type="date"
                  value={reportedProductionDate}
                  onChange={(e) => setReportedProductionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Reporting & Evidence Description *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe how the label was tampered, altered print font, abnormal smell/taste, past expiration date sticker, etc."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-rose-500 outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    Submit Counterfeit Report
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
