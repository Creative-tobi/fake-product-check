import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  ExternalLink, 
  Package, 
  HeartCrack, 
  Flame, 
  ArrowLeft,
  Sparkles,
  Award,
  Globe,
  Tag
} from 'lucide-react';

export default function ProductVerificationResult({
  result,
  onResetScan,
  onOpenReportModal,
  onOpenTamperStudio,
  userAllergies
}) {
  if (!result) return null;

  const {
    product = {},
    barcodeInfo = {},
    authenticityAssessment = {},
    safetyAssessment = {},
    shelfLife = {},
    batchAnalysis = {},
    flaggedRecord = null,
    isRegisteredInGlobalDB = false,
    message = ''
  } = result;

  const score = authenticityAssessment.score ?? 50;
  const classification = authenticityAssessment.classification || 'SUSPECTED_COUNTERFEIT';
  const isAuthentic = classification === 'VERIFIED_AUTHENTIC';
  const isCriticalCounterfeit = classification === 'HIGH_RISK_COUNTERFEIT' || !barcodeInfo.isValidChecksum || flaggedRecord;

  // Nutriscore badge colors
  const nutriScoreColors = {
    A: 'bg-emerald-600 text-white',
    B: 'bg-lime-500 text-white',
    C: 'bg-amber-400 text-slate-900',
    D: 'bg-orange-500 text-white',
    E: 'bg-rose-600 text-white',
    'N/A': 'bg-slate-700 text-slate-300'
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={onResetScan}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          Scan Another Product
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReportModal(product.barcode, product.name, product.brand)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            Report Counterfeit / Tampered
          </button>

          <button
            onClick={() => onOpenTamperStudio(result)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Deep Tamper Studio
          </button>
        </div>
      </div>

      {/* 1. HERO AUTHENTICITY ASSESSMENT BANNER */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
        isAuthentic
          ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/30'
          : isCriticalCounterfeit
          ? 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/30'
          : 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/30'
      }`}>
        
        {/* Glow ambient background lights */}
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isAuthentic ? 'bg-emerald-500' : isCriticalCounterfeit ? 'bg-rose-600' : 'bg-amber-500'
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Product Identity info */}
          <div className="flex items-start gap-4 sm:gap-6 flex-1">
            {/* Product image thumbnail or fallback */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Package className="w-10 h-10 text-slate-600" />
              )}
              {isAuthentic ? (
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500 text-white shadow">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  isAuthentic
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : isCriticalCounterfeit
                    ? 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  {isAuthentic ? 'VERIFIED AUTHENTIC' : isCriticalCounterfeit ? 'COUNTERFEIT RISK / UNVERIFIED' : 'CAUTION ADVISED'}
                </span>
                
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {barcodeInfo.detectedFormat || 'BARCODE'}
                </span>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  {barcodeInfo.originCountry || 'International'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Brand: <span className="text-white font-semibold">{product.brand}</span>
                {product.categories && (
                  <span className="text-slate-400 font-normal"> • {product.categories.split(',')[0]}</span>
                )}
              </p>

              <p className="text-xs text-slate-400 font-mono">
                Barcode: <span className="text-emerald-400 font-bold">{product.barcode}</span>
              </p>
            </div>
          </div>

          {/* Authenticity Score Dial */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Authenticity Score
              </p>
              <p className={`text-2xl sm:text-3xl font-black font-mono ${
                score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {score}<span className="text-sm text-slate-500 font-normal">/100</span>
              </p>
              <p className="text-[10px] text-slate-400 max-w-[130px]">
                {classification.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Circular score gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-500'}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {score >= 80 ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Advisory Recommendation Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-3 text-xs sm:text-sm text-slate-300">
          <InfoIcon classification={classification} />
          <div>
            <span className="font-bold text-white">Verification Finding: </span>
            <span>{message || authenticityAssessment.recommendation}</span>
          </div>
        </div>

      </div>

      {/* 2. CRITICAL PERSONAL ALLERGY ALERT BANNER (If matched!) */}
      {safetyAssessment.hasPersonalAllergyConflict && (
        <div className="p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-xl shadow-rose-950/50 flex items-start gap-4 animate-bounce">
          <div className="p-2.5 rounded-xl bg-rose-900 border border-rose-400 shrink-0">
            <HeartCrack className="w-6 h-6 text-rose-200" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-rose-200">
              CRITICAL ALLERGY ALERT: Conflict with your Allergy Profile!
            </h3>
            <p className="text-xs sm:text-sm text-rose-100">
              This product contains ingredients that you flagged as hazardous to your health:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {safetyAssessment.personalAlerts.map((allergy, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-900 text-white border border-rose-400">
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SHELF-LIFE & EXPIRATION DATE TRACKER */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Expiration & Shelf-Life Tracker
              </h3>
              <p className="text-xs text-slate-400">
                Monitors freshness lifecycle and flags expired or tampered dates
              </p>
            </div>
          </div>

          {/* Shelf Life Status Badge */}
          <div className="flex items-center gap-2">
            {shelfLife.status === 'EXPIRED' && (
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-950 text-rose-300 border border-rose-500 animate-pulse">
                EXPIRED PRODUCT
              </span>
            )}
            {shelfLife.status === 'EXPIRING_URGENT' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500">
                EXPIRING WITHIN 7 DAYS
              </span>
            )}
            {shelfLife.status === 'EXPIRING_SOON' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-950/70 text-amber-400 border border-amber-500/40">
                EXPIRING SOON (&lt; 30 DAYS)
              </span>
            )}
            {shelfLife.status === 'FRESH_AND_VALID' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
                FRESH & VALID SHELF-LIFE
              </span>
            )}
            {shelfLife.status === 'TAMPERED_ANOMALY' && (
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-950 text-rose-300 border border-rose-500">
                TAMPERED / INVERTED DATES
              </span>
            )}
            {shelfLife.status === 'NOT_PROVIDED' && (
              <span className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                No Expiry Stated (Scan / Enter EXP)
              </span>
            )}
          </div>
        </div>

        {/* Shelf-Life Timeline Progress Bar */}
        {shelfLife.isCalculated ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Production Date (MFD)</span>
                <span className="text-sm font-bold font-mono text-white">
                  {shelfLife.productionDate || 'Not specified'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Expiration Date (EXP)</span>
                <span className={`text-sm font-bold font-mono ${
                  shelfLife.isExpired ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {shelfLife.expiryDate}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Days Remaining</span>
                <span className={`text-sm font-bold font-mono ${
                  shelfLife.isExpired ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {shelfLife.isExpired 
                    ? `Expired ${Math.abs(shelfLife.daysRemaining)} days ago`
                    : `${shelfLife.daysRemaining} days left`
                  }
                </span>
              </div>
            </div>

            {/* Freshness progress meter */}
            {shelfLife.freshnessPercentage !== null && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Freshness Remaining</span>
                  <span className={shelfLife.isExpired ? 'text-rose-400' : 'text-emerald-400'}>
                    {shelfLife.freshnessPercentage}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      shelfLife.isExpired
                        ? 'bg-rose-600'
                        : shelfLife.freshnessPercentage > 50
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(5, shelfLife.freshnessPercentage)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tamper Alerts within shelf life */}
            {shelfLife.tamperAlerts && shelfLife.tamperAlerts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 space-y-1">
                {shelfLife.tamperAlerts.map((alert, idx) => (
                  <p key={idx} className="text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{alert.type}: </span> {alert.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Physical stamped expiry date was not attached to this scan. You can enter or adjust the stamped EXP date in the Scanner or Tamper Studio.
            </span>
          </div>
        )}
      </div>

      {/* 4. FORENSIC TAMPER & AUTHENTICITY AUDIT CHECKLIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Verification Check Matrix */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Multi-Factor Tamper Audit
            </h3>
          </div>

          <div className="space-y-3">
            {/* GS1 Checksum */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">GS1 Modulo-10 Barcode Checksum</p>
                <p className="text-[11px] text-slate-400">
                  {barcodeInfo.isValidChecksum 
                    ? `Mathematical check digit verified (${barcodeInfo.calculatedCheckDigit} matches ${barcodeInfo.providedCheckDigit})`
                    : `Checksum mismatch! Calculated ${barcodeInfo.calculatedCheckDigit}, found ${barcodeInfo.providedCheckDigit}`}
                </p>
              </div>
              {barcodeInfo.isValidChecksum ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PASS
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> FAIL
                </span>
              )}
            </div>

            {/* Global Registry Presence */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Global Database Verification</p>
                <p className="text-[11px] text-slate-400">
                  {isRegisteredInGlobalDB 
                    ? `Verified in ${product.sourceRegistry || 'Global Consumer Database'}`
                    : 'Unregistered in official repositories (Open Food / Beauty Facts)'}
                </p>
              </div>
              {isRegisteredInGlobalDB ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> LISTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> UNLISTED
                </span>
              )}
            </div>

            {/* Batch Code Audit */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Industrial Batch / Lot Validation</p>
                <p className="text-[11px] text-slate-400">
                  {batchAnalysis.notes || 'Batch code structure validated against industrial norms'}
                </p>
              </div>
              {batchAnalysis.isSuspicious ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> SUSPICIOUS
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> CLEAN
                </span>
              )}
            </div>

            {/* Counterfeit Blacklist Check */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Counterfeit Registry Cross-Check</p>
                <p className="text-[11px] text-slate-400">
                  {flaggedRecord 
                    ? `Matches reported counterfeit: ${flaggedRecord.reason}`
                    : 'No complaints or counterfeit flags logged for this barcode'}
                </p>
              </div>
              {flaggedRecord ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> FLAGGED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> CLEAR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Nutrition & Food Safety Grades */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Health, Additives & Nutrition
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Nutri-Score */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Nutri-Score Grade</span>
              <span className={`inline-block px-3 py-1 rounded-lg text-lg font-black ${
                nutriScoreColors[safetyAssessment.nutriScore] || nutriScoreColors['N/A']
              }`}>
                {safetyAssessment.nutriScore || 'N/A'}
              </span>
            </div>

            {/* Nova Group */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">NOVA Food Group</span>
              <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-slate-800 text-cyan-300">
                {safetyAssessment.novaGroup ? `Group ${safetyAssessment.novaGroup} (Processed)` : 'Unclassified'}
              </span>
            </div>
          </div>

          {/* Additives Summary */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Total Additives Detected:</span>
              <span className="text-white font-mono font-bold">{safetyAssessment.totalAdditivesCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Hazardous Preservatives / Dyes:</span>
              <span className={`font-mono font-bold ${
                safetyAssessment.flaggedHarmfulAdditives.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {safetyAssessment.flaggedHarmfulAdditives.length} flagged
              </span>
            </div>
          </div>

          {/* Stated Packaging Details */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p><span className="text-slate-300 font-medium">Packaging:</span> {product.packaging || 'Commercial container'}</p>
            <p><span className="text-slate-300 font-medium">Origin:</span> {product.manufacturingPlaces || barcodeInfo.originCountry || 'Standard distribution'}</p>
          </div>
        </div>

      </div>

      {/* 5. ALLERGENS DETECTION & HARMFUL ADDITIVES TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        
        {/* Allergens Header */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Detected Product Allergens
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-referenced with international allergens directives and ingredients tags
          </p>
        </div>

        {safetyAssessment.allergens && safetyAssessment.allergens.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {safetyAssessment.allergens.map((allergen, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm"
              >
                ⚠️ {allergen}
              </span>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            No standard major allergens declared for this product. Always check physical packaging for cross-contamination warnings.
          </div>
        )}

        {/* Flagged Harmful Additives List */}
        {safetyAssessment.flaggedHarmfulAdditives && safetyAssessment.flaggedHarmfulAdditives.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Flagged Chemical Preservatives & Additives
            </h4>
            <div className="space-y-2">
              {safetyAssessment.flaggedHarmfulAdditives.map((add, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-rose-300 font-mono">[{add.code}] </span>
                    <span className="font-semibold text-white">{add.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{add.reason}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    add.risk === 'HIGH' || add.risk === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {add.risk} RISK
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Ingredients Breakdown */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Declared Ingredients
          </h4>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
            {product.ingredients || 'No ingredients listed in global registry.'}
          </div>
        </div>

      </div>

    </div>
  );
}

function InfoIcon({ classification }) {
  if (classification === 'VERIFIED_AUTHENTIC') {
    return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  if (classification === 'HIGH_RISK_COUNTERFEIT') {
    return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
  }
  return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
}
