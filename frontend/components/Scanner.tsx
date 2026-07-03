import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Check, AlertCircle, Sparkles, BoxSelect, X, Zap, HelpCircle } from 'lucide-react';
import { analyzeInventoryImage } from '../services/geminiService';
import { ScanResult, DetectedItem } from '../types';

interface ScannerProps {
  onScanCompleted: (scan: ScanResult) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanCompleted }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryHint, setCategoryHint] = useState('');
  const [scanTitle, setScanTitle] = useState('');
  
  const [scanResult, setScanResult] = useState<{
    sceneDescription: string;
    detectedCategory: string;
    totalCount: number;
    items: DetectedItem[];
  } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      setError("Camera access denied. Please check browser permissions or upload an image.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setImageSrc(canvas.toDataURL('image/jpeg', 0.95));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setScanResult(null);
      const reader = new FileReader();
      reader.onloadend = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerScan = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeInventoryImage(imageSrc, categoryHint);
      setScanResult(result);
    } catch (err: any) {
      setError("AI Analysis failed. Please ensure the image is clear and well-lit.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveScan = () => {
    if (!imageSrc || !scanResult) return;

    const finalTitle = scanTitle.trim() || `${scanResult.detectedCategory} Batch`;
    const newScan: ScanResult = {
      id: `scan-${Date.now()}`,
      title: finalTitle,
      timestamp: Date.now(),
      imageUrl: imageSrc,
      detectedCategory: scanResult.detectedCategory,
      totalCount: scanResult.totalCount,
      items: scanResult.items,
      sceneDescription: scanResult.sceneDescription,
      notes: categoryHint ? `Hint: ${categoryHint}` : undefined
    };

    onScanCompleted(newScan);
    resetScanner();
  };

  const resetScanner = () => {
    setImageSrc(null);
    setScanResult(null);
    setError(null);
    setScanTitle('');
    setCategoryHint('');
    stopCamera();
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      
      {/* Main Viewport Area (Enlarged for better visibility) */}
      <div className="relative bg-white border border-brand-100 rounded-3xl overflow-hidden min-h-[450px] flex flex-col items-center justify-center shadow-xl">
        
        {/* Live Camera Stream */}
        {isCameraActive && (
          <div className="absolute inset-0 w-full h-full bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline 
              muted
            />
            {/* Professional Camera Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              <div className="flex-1 bg-black/40"></div>
              <div className="flex justify-between">
                <div className="w-6 bg-black/40"></div>
                <div className="w-full max-w-md aspect-square relative">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-brand-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-brand-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-brand-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-brand-500 rounded-br-lg"></div>
                  {/* Center Crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-60">
                    <div className="w-full h-[2px] bg-brand-500"></div>
                    <div className="absolute h-full w-[2px] bg-brand-500"></div>
                  </div>
                </div>
                <div className="w-6 bg-black/40"></div>
              </div>
              <div className="flex-1 bg-black/40 flex items-end justify-center pb-24">
                <span className="bg-black/70 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                  Align tray or box from directly above
                </span>
              </div>
            </div>
            
            {/* Camera Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 px-6">
              <button 
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-surface-800/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-brand-500 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-brand-500/30"
              >
                <div className="w-16 h-14 rounded-full border-2 border-black bg-white"></div>
              </button>
              <div className="w-12"></div>
            </div>
          </div>
        )}

        {/* Captured / Uploaded Image with Interactive Bounding Boxes */}
        {imageSrc && !isCameraActive && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-surface-50">
            <div className="relative w-full max-h-[500px] overflow-hidden">
              <img 
                src={imageSrc} 
                alt="Scan source" 
                className="w-full h-full object-contain"
              />
              
              {/* Bounding Box Overlays */}
              {scanResult && scanResult.items.map((item) => {
                if (!item.box_2d) return null;
                const [ymin, xmin, ymax, xmax] = item.box_2d;
                const isHovered = hoveredItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`absolute border-2 transition-all duration-200 cursor-pointer ${
                      isHovered 
                        ? 'border-brand-500 bg-brand-500/30 z-30 shadow-[0_0_15px_rgba(0,194,168,0.6)] scale-[1.02]' 
                        : 'border-brand-500/80 bg-brand-500/10 z-20 hover:border-brand-500'
                    }`}
                    style={{
                      top: `${ymin}%`,
                      left: `${xmin}%`,
                      width: `${xmax - xmin}%`,
                      height: `${ymax - ymin}%`,
                    }}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    {isHovered && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] font-bold rounded bg-brand-950 text-white whitespace-nowrap shadow-xl border border-white/10">
                        {item.label} (x{item.count})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Loading Overlay with Laser Scan Animation */}
            {isLoading && (
              <div className="absolute inset-0 bg-surface-50/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                <div className="relative w-full h-full overflow-hidden">
                  <div className="absolute left-0 right-0 h-[3px] bg-brand-500 shadow-[0_0_15px_#00c2a8] animate-scan-line"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="bg-white border border-brand-100 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl max-w-xs text-center">
                      <RefreshCw className="animate-spin text-brand-500 w-8 h-8" />
                      <span className="text-sm font-semibold text-brand-950">AI is counting overlapping items...</span>
                      <p className="text-xs text-brand-600">Analyzing tray layers and packaging boundaries</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!imageSrc && !isCameraActive && (
          <div className="p-8 text-center space-y-6 w-full max-w-sm">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-50 flex items-center justify-center text-brand-500 border border-brand-100 shadow-inner">
              <BoxSelect className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-950">Start Counting</h3>
              <p className="text-sm text-brand-600 mt-1.5 leading-relaxed">
                Take a top-down photo of your milk trays, curd packets, chocolates, or vegetables.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20"
              >
                <Camera className="w-5 h-5" />
                Open Live Camera
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-white hover:bg-brand-50 text-brand-500 font-semibold rounded-xl border border-brand-100 transition-all"
              >
                <Upload className="w-5 h-5" />
                Upload from Gallery
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-red-600 animate-slide-up">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Pre-Scan Configuration */}
      {imageSrc && !isCameraActive && !scanResult && !isLoading && (
        <div className="bg-white border border-brand-100 rounded-2xl p-5 space-y-5 animate-slide-up shadow-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-950 mb-2">
              Target Item / Category Hint (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g., Milk Packets 500ml, Curd, Chocolates"
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value)}
              className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5 text-sm text-brand-950 placeholder-brand-600/50 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <p className="text-[11px] text-brand-600 mt-2 leading-relaxed">
              Providing a hint helps the AI focus on specific items and ignore background clutter.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetScanner}
              className="px-5 py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-950 font-medium rounded-xl border border-brand-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={triggerScan}
              className="flex-1 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Analyze & Count
            </button>
          </div>
        </div>
      )}

      {/* Scan Results & Save Form */}
      {scanResult && !isLoading && (
        <div className="space-y-4 animate-slide-up">
          {/* Result Summary */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Detected Category</p>
              <h3 className="text-xl font-bold text-brand-950">{scanResult.detectedCategory}</h3>
              {scanResult.sceneDescription && (
                <p className="text-xs text-brand-600 mt-1 italic">{scanResult.sceneDescription}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-accent-500">{scanResult.totalCount}</span>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Total Items</p>
            </div>
          </div>

          {/* Interactive Bounding Box Guide */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
            <HelpCircle className="text-brand-500 w-5 h-5 shrink-0" />
            <p className="text-xs text-brand-600 leading-relaxed">
              Hover or tap on the bounding boxes in the image above to see individual item labels.
            </p>
          </div>

          {/* Save Form */}
          <div className="bg-white border border-brand-100 rounded-2xl p-5 space-y-5 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-950 mb-2">
                Save Record As
              </label>
              <input 
                type="text"
                placeholder="e.g., Morning Delivery Tray 1"
                value={scanTitle}
                onChange={(e) => setScanTitle(e.target.value)}
                className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5 text-sm text-brand-950 placeholder-brand-600/50 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetScanner}
                className="px-5 py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-950 font-medium rounded-xl border border-brand-100 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={saveScan}
                className="flex-1 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
              >
                <Check className="w-5 h-5" />
                Save to History
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden Canvas for Image Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
