"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { createWorker } from 'tesseract.js';

// Simple translation function using MyMemory Translation API (free, no API key needed)
async function translateText(text: string, targetLang: string = 'ru'): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

interface TranslationOverlayProps {
  onClose?: () => void;
  isClosing?: boolean;
}

interface CircleData {
  centerX: number;
  centerY: number;
  radius: number;
}

export default function TranslationOverlay({
  onClose,
  isClosing: externalIsClosing = false,
}: TranslationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRadius, setCurrentRadius] = useState(0);
  const [screenShareElement, setScreenShareElement] = useState<HTMLVideoElement | null>(null);
  const [internalIsClosing, setInternalIsClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    originalText: string;
    translatedText: string;
    position: { x: number; y: number };
  } | null>(null);
  const [circles, setCircles] = useState<CircleData[]>([]);
  
  const isClosing = externalIsClosing || internalIsClosing;

  // Find and attach to screen share video
  useEffect(() => {
    const findScreenShareVideo = () => {
      const videos = document.querySelectorAll('video');
      let largestVideo: HTMLVideoElement | null = null;
      let largestArea = 0;
      
      videos.forEach((video) => {
        const source = video.getAttribute('data-lk-source');
        if (source === 'screen_share' || source === 'screen_share_audio') {
          const area = video.videoWidth * video.videoHeight;
          if (area > largestArea) {
            largestArea = area;
            largestVideo = video;
          }
        }
      });
      
      if (largestVideo) {
        setScreenShareElement(largestVideo);
      }
      
      return largestVideo;
    };

    const video = findScreenShareVideo();
    
    if (!video) {
      const interval = setInterval(() => {
        const found = findScreenShareVideo();
        if (found) {
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, []);

  // Setup canvas to match screen share video
  useEffect(() => {
    if (!screenShareElement || !canvasRef.current || !containerRef.current) return;

    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = screenShareElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Redraw existing circles
      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [screenShareElement, circles]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all circles
    circles.forEach((circle) => {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw current circle being drawn
    if (isDrawing && startPoint && currentRadius > 0) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, currentRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [circles, isDrawing, startPoint, currentRadius]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isProcessing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setIsDrawing(true);
    setCurrentRadius(0);
    setTranslationResult(null); // Clear previous result
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
    setCurrentRadius(radius);
  };

  const captureAndTranslate = async (circle: CircleData) => {
    if (!screenShareElement || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      // Create a temporary canvas to capture the video frame
      const tempCanvas = document.createElement('canvas');
      const videoRect = screenShareElement.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate scale factor between canvas and video
      const scaleX = screenShareElement.videoWidth / canvasRect.width;
      const scaleY = screenShareElement.videoHeight / canvasRect.height;
      
      // Calculate the region to capture (with some padding)
      const padding = 20; // pixels of padding around the circle
      const x = Math.max(0, (circle.centerX - circle.radius - padding) * scaleX);
      const y = Math.max(0, (circle.centerY - circle.radius - padding) * scaleY);
      const width = Math.min(screenShareElement.videoWidth - x, (circle.radius * 2 + padding * 2) * scaleX);
      const height = Math.min(screenShareElement.videoHeight - y, (circle.radius * 2 + padding * 2) * scaleY);
      
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Could not get canvas context');
      }

      // Draw the video frame region to the canvas
      tempCtx.drawImage(
        screenShareElement,
        x, y, width, height,
        0, 0, width, height
      );

      // Convert canvas to image data URL
      const imageDataUrl = tempCanvas.toDataURL('image/png');

      // Perform OCR using Tesseract.js
      console.log('🔍 Starting OCR...');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageDataUrl);
      await worker.terminate();
      
      console.log('📝 OCR Result:', text);

      if (!text.trim()) {
        setTranslationResult({
          originalText: 'No text detected',
          translatedText: 'Текст не обнаружен',
          position: { x: circle.centerX, y: circle.centerY },
        });
        setIsProcessing(false);
        return;
      }

      // Translate to Russian using MyMemory Translation API
      console.log('🌐 Translating...');
      const translatedText = await translateText(text.trim(), 'ru');
      
      console.log('✅ Translation:', translatedText);

      setTranslationResult({
        originalText: text.trim(),
        translatedText: translatedText,
        position: { x: circle.centerX, y: circle.centerY },
      });

    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResult({
        originalText: 'Error',
        translatedText: 'Ошибка перевода. Попробуйте снова.',
        position: { x: circle.centerX, y: circle.centerY },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !startPoint || currentRadius < 10) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRadius(0);
      return;
    }

    const circle: CircleData = {
      centerX: startPoint.x,
      centerY: startPoint.y,
      radius: currentRadius,
    };

    // Add circle to the list
    setCircles((prev) => [...prev, circle]);
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRadius(0);

    // Capture and translate
    await captureAndTranslate(circle);
  };

  const handleClose = () => {
    setInternalIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleClearAll = () => {
    setCircles([]);
    setTranslationResult(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300",
        isClosing ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Canvas for drawing circles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          touchAction: 'none',
        }}
      />

      {/* Translation Result Popup */}
      {translationResult && (
        <div
          className={cn(
            "absolute bg-white rounded-lg shadow-2xl p-4 max-w-md z-[60] border-2 border-blue-400",
            "animate-fade-in"
          )}
          style={{
            left: `${Math.min(translationResult.position.x + 50, window.innerWidth - 400)}px`,
            top: `${Math.min(translationResult.position.y + 50, window.innerHeight - 200)}px`,
          }}
        >
          <div className="flex items-start gap-3">
            <Languages className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="mb-2">
                <p className="text-xs text-gray-500 font-medium mb-1">Original:</p>
                <p className="text-sm text-gray-800">{translationResult.originalText}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-gray-500 font-medium mb-1">Russian:</p>
                <p className="text-lg font-semibold text-blue-600">{translationResult.translatedText}</p>
              </div>
            </div>
            <button
              onClick={() => setTranslationResult(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500/90 text-white px-6 py-4 rounded-lg shadow-2xl z-[70] flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div>
            <p className="font-semibold">Processing...</p>
            <p className="text-sm text-blue-100">Extracting and translating text</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-[60] text-sm font-medium">
        🎯 Click and drag to circle a word or phrase
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-[60]">
        {circles.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300 text-gray-700"
          >
            Clear All Circles
          </Button>
        )}
        
        <Button
          onClick={handleClose}
          variant="outline"
          className="bg-white/90 hover:bg-white border-gray-300 text-gray-700"
        >
          <X className="w-4 h-4 mr-2" />
          Close Translation Tool
        </Button>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
