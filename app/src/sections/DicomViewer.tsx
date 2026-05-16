import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Sun,
  Contrast,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Activity,
  Ruler,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScanData, type ScanData } from '@/lib/mockApi';

interface DicomViewerProps {
  caseId?: string;
  imageUrls?: string[];
}

// Fallback mock images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1615461066842-32561977e3d8?w=800&h=800&fit=crop',
];

export function DicomViewer({ caseId, imageUrls }: DicomViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<'pan' | 'zoom' | 'measure' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scanData, setScanData] = useState<ScanData | null>(null);

  const images = imageUrls?.length ? imageUrls : scanData?.imageUrls || FALLBACK_IMAGES;
  const currentImage = images[currentImageIndex];

  // Load scan data on mount
  useEffect(() => {
    if (caseId) {
      getScanData(caseId)
        .then(data => {
          setScanData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [caseId]);

  // Simulate per-image loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [currentImageIndex]);

  // Auto-play cine mode
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFlipH = () => setFlipH(prev => !prev);
  const handleFlipV = () => setFlipV(prev => !prev);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
  };

  const goToPrevious = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[80px] text-center">
              {currentImageIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === 'pan' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setActiveTool(activeTool === 'pan' ? null : 'pan')}
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'zoom' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setActiveTool(activeTool === 'zoom' ? null : 'zoom')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'measure' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setActiveTool(activeTool === 'measure' ? null : 'measure')}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Transform */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn('h-8 w-8', flipH && 'bg-slate-200')} 
              onClick={handleFlipH}
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn('h-8 w-8', flipV && 'bg-slate-200')} 
              onClick={handleFlipV}
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Reset */}
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset View
          </Button>
        </div>

        {/* Window/Level Controls */}
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-1">
            <Sun className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 min-w-[60px]">Brightness</span>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={0}
              max={200}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-slate-500 min-w-[40px]">{brightness}%</span>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <Contrast className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 min-w-[60px]">Contrast</span>
            <Slider
              value={[contrast]}
              onValueChange={([v]) => setContrast(v)}
              min={0}
              max={200}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-slate-500 min-w-[40px]">{contrast}%</span>
          </div>
        </div>
      </Card>

      {/* Image Viewer */}
      <Card className="relative overflow-hidden bg-black">
        <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <Activity className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          
          <img
            src={currentImage}
            alt={`DICOM slice ${currentImageIndex + 1}`}
            className={cn(
              'max-w-full max-h-full object-contain transition-all duration-200',
              activeTool === 'pan' && 'cursor-move',
              activeTool === 'zoom' && 'cursor-zoom-in',
              activeTool === 'measure' && 'cursor-crosshair'
            )}
            style={{
              transform: `
                scale(${zoom}) 
                rotate(${rotation}deg) 
                scaleX(${flipH ? -1 : 1}) 
                scaleY(${flipV ? -1 : 1})
              `,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            }}
          />

          {/* Overlay Info */}
          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs p-2 rounded space-y-1">
            <p>Patient: {scanData?.metadata.patientGender === 'male' ? 'M' : 'F'}/{scanData?.metadata.patientAge || 'N/A'}</p>
            <p>ID: {caseId || 'N/A'}</p>
            <p>Modality: {scanData?.metadata.modality || 'Medical Imaging'}</p>
            <p>Date: {scanData?.metadata.studyDate || new Date().toISOString().split('T')[0]}</p>
            <p>Slice: {currentImageIndex + 1}/{images.length}</p>
          </div>

          <div className="absolute top-4 right-4 bg-black/70 text-white text-xs p-2 rounded space-y-1 text-right">
            <p>Zoom: {Math.round(zoom * 100)}%</p>
            <p>W: {brightness} L: {contrast}</p>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="bg-slate-900 p-2 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all',
                currentImageIndex === idx
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-slate-500'
              )}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </Card>

      {/* Study Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Study Information</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-slate-400">Modality:</span> CT</p>
            <p><span className="text-slate-400">Body Part:</span> Chest</p>
            <p><span className="text-slate-400">Date:</span> {new Date().toLocaleDateString()}</p>
          </div>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Image Properties</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-slate-400">Matrix:</span> 512 x 512</p>
            <p><span className="text-slate-400">Slices:</span> {images.length}</p>
            <p><span className="text-slate-400">Spacing:</span> 1.0 mm</p>
          </div>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Window Settings</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-slate-400">Window:</span> {brightness}</p>
            <p><span className="text-slate-400">Level:</span> {contrast}</p>
            <p><span className="text-slate-400">Preset:</span> Soft Tissue</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
