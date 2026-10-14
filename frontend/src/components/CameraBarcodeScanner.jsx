import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  UploadCloud, 
  Keyboard, 
  Calendar, 
  Tag, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FlipHorizontal,
  Info
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function CameraBarcodeScanner({
  onScanComplete,
  isLoading,
  demoProducts,
  onSelectDemo
}) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualExpiryDate, setManualExpiryDate] = useState('');
  const [manualProductionDate, setManualProductionDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [showDateInputs, setShowDateInputs] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'reader-viewport';

  // Discover connected cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(cameras => {
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          // Prefer back/environment camera if available
          const backCam = cameras.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : cameras[0].id);
        }
      })
      .catch(err => {
        console.warn('Could not list cameras:', err.message);
      });

    return () => {
      stopCamera();
    };
  }, []);

  // Start live webcam scanning
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current && isCameraActive) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      };

      const cameraIdOrFacing = selectedCameraId 
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraIdOrFacing,
        config,
        (decodedText, decodedResult) => {
          // Barcode recognized!
          sounds.playScanBeep();
          stopCamera();
          triggerScan(decodedText);
        },
        (errorMessage) => {
          // Scanning frame without barcode - normal in continuous scanning
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to access camera. Please check browser camera permissions or try Manual Input / Image Upload.');
      setIsCameraActive(false);
    }
  };

  // Stop live camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err.message);
      }
    }
    setIsCameraActive(false);
  };

  // Switch camera toggle
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamId = availableCameras[nextIndex].id;
    setSelectedCameraId(nextCamId);

    if (isCameraActive) {
      await stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  // Trigger main analysis in parent component
  const triggerScan = (barcodeToScan) => {
    const clean = barcodeToScan.trim();
    if (!clean) return;

    onScanComplete({
      barcode: clean,
      manualExpiryDate: manualExpiryDate || null,
      manualProductionDate: manualProductionDate || null,
      batchNumber: batchNumber || null
    });
  };

  // Handle image upload and scan barcode from file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCameraError(null);
    setUploadPreview(URL.createObjectURL(file));

    try {
      const html5QrCode = new Html5Qrcode('reader-viewport-file');
      const decodedResult = await html5QrCode.scanFile(file, true);
      sounds.playScanBeep();
      triggerScan(decodedResult);
    } catch (err) {
      console.error('File scan error:', err);
      setCameraError('No readable barcode detected in this image. Please ensure the barcode is sharp, well-lit, and un-cropped.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Scanner Mode Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Product Scanner Hub
            </h2>
            <p className="text-xs text-slate-400">
              Point camera at barcode or upload packaging photo for instant verification
            </p>
          </div>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setScanMode('camera');
              setCameraError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scanMode === 'camera'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('upload');
              setCameraError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scanMode === 'upload'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Photo
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('manual');
              setCameraError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scanMode === 'manual'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Manual Input
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        
        {/* MODE 1: LIVE WEBCAM SCANNER */}
        {scanMode === 'camera' && (
          <div className="flex flex-col items-center">
            
            {/* Viewport Box */}
            <div className="relative w-full max-w-lg aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700/80 flex flex-col items-center justify-center shadow-inner">
              
              {/* HTML5 QR/Barcode Video Container */}
              <div id={scannerContainerId} className="w-full h-full object-cover"></div>

              {/* Aiming Reticle & Animated Laser (shown when camera is active) */}
              {isCameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative w-72 h-44 border-2 border-emerald-400/60 rounded-xl bg-emerald-500/5 backdrop-blur-[1px] shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                    
                    {/* 4 Corner Targeting Crosshairs */}
                    <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br" />

                    {/* Sweeping Laser Beam */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-laser" />
                    
                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/80 text-emerald-400 border border-emerald-500/30">
                        Align Barcode Inside Box
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Idle State Prompt when camera is OFF */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Camera Scanner Ready
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-6">
                    Activate camera to scan grocery, cosmetic, or pharmaceutical barcodes in real-time.
                  </p>
                  <button
                    onClick={startCamera}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition"
                  >
                    <Camera className="w-4 h-4" />
                    Launch Live Camera
                  </button>
                </div>
              )}
            </div>

            {/* Camera Control Bar */}
            {isCameraActive && (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900/60 transition"
                >
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </button>

                {availableCameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition"
                    title="Switch camera device"
                  >
                    <FlipHorizontal className="w-4 h-4 text-teal-400" />
                    Flip Camera ({availableCameras.length})
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {/* MODE 2: UPLOAD IMAGE SCANNER */}
        {scanMode === 'upload' && (
          <div className="flex flex-col items-center">
            <div id="reader-viewport-file" className="hidden"></div>
            
            <div className="w-full max-w-lg p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 flex flex-col items-center justify-center text-center transition group">
              <div className="w-16 h-16 rounded-2xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-center mb-4 text-teal-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                Upload Barcode or Label Photo
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5">
                Take a clear snapshot of the product packaging or barcode and upload it here for automated barcode extraction.
              </p>

              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition">
                <UploadCloud className="w-4 h-4" />
                Select Photo from Device
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              {uploadPreview && (
                <div className="mt-4 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <img src={uploadPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  <span className="text-xs text-slate-400">Processing image...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 3: MANUAL BARCODE ENTRY */}
        {scanMode === 'manual' && (
          <div className="w-full max-w-lg mx-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Enter Product Barcode (EAN-13, UPC, or GTIN)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 3017620422003 (Nutella) or 5449000000996 (Coke)"
                  className="w-full pl-4 pr-24 py-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-sm placeholder-slate-500 outline-none transition"
                  onKeyDown={(e) => e.key === 'Enter' && triggerScan(manualBarcode)}
                />
                <button
                  onClick={() => triggerScan(manualBarcode)}
                  disabled={!manualBarcode.trim() || isLoading}
                  className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Verify
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Standard international barcodes have 12 digits (UPC-A) or 13 digits (EAN-13). Our system will automatically calculate GS1 checksum parity.
              </span>
            </div>
          </div>
        )}

        {/* Camera or scanning error display */}
        {cameraError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">Scanner Notice</p>
              <p>{cameraError}</p>
            </div>
          </div>
        )}

        {/* Optional Forensic Date & Batch Code Inputs Drawer */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={() => setShowDateInputs(!showDateInputs)}
            className="flex items-center justify-between w-full text-left py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Attach Stamped Package Dates & Batch Code (Optional Forensic Checks)</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              {showDateInputs ? '[- Hide Details]' : '[+ Expand Dates]'}
            </span>
          </button>

          {showDateInputs && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in duration-200">
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Stated Expiry Date (EXP)
                </label>
                <input
                  type="date"
                  value={manualExpiryDate}
                  onChange={(e) => setManualExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Production Date (MFD)
                </label>
                <input
                  type="date"
                  value={manualProductionDate}
                  onChange={(e) => setManualProductionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  Batch / Lot Code (LOT)
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. L9382B / LOT-4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Quick 1-Click Test Barcode Presets */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quick Test Samples (No Camera Needed)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any sample to test detection engine
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {demoProducts.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => onSelectDemo(demo)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition group"
            >
              <span className={`w-2 h-2 rounded-full ${
                demo.type.includes('AUTHENTIC') ? 'bg-emerald-400' :
                demo.type.includes('COUNTERFEIT') ? 'bg-rose-500' : 'bg-amber-400'
              }`} />
              <span>{demo.name.split('(')[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono group-hover:text-emerald-400">
                [{demo.barcode}]
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
