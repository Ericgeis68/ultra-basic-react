import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (result: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: window.innerWidth }, // Use window size for ideal resolution
          height: { ideal: window.innerHeight }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning after camera is initialized
        videoRef.current.onloadedmetadata = () => {
          startScanning();
          setIsInitializing(false);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez vos autorisations.');
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Start scanning
    scanIntervalRef.current = window.setInterval(() => {
      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt to detect QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          console.log("QR code detected:", code.data);
          
          // If QR code detected, call the callback
          onDetected(code.data);
          
          // Stop scanning
          onClose();
        }
      }
    }, 150); // Scan every 150ms
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      {/* DialogContent for full screen - Added translate-x-0 translate-y-0 */}
      <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-0 overflow-hidden bg-black translate-x-0 translate-y-0">
        <div className="relative w-full h-full"> {/* Container for video and overlay */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="ml-2 text-white">Démarrage de la caméra...</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center p-4 z-10">
              <div>
                <p className="text-red-400 mb-2">{error}</p>
                <Button variant="secondary" onClick={startCamera}>Réessayer</Button>
              </div>
            </div>
          )}
          
          {/* Video element takes full container size using absolute positioning */}
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" // Use absolute inset-0 and w/h-full
            autoPlay 
            playsInline
            muted
          />
          
          {/* Canvas for processing, hidden */}
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full opacity-0"
          />
          
          {/* Overlay for the scanning frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="border-2 border-white/70 rounded-md w-64 h-64 flex items-center justify-center">
              <div className="w-48 h-48 border border-white/30"></div>
            </div>
          </div>

          {/* Close button overlay */}
          <div className="absolute top-4 right-4 z-10">
             <Button variant="destructive" size="icon" onClick={onClose}>
                X {/* Or an icon like <X className="h-4 w-4" /> if you have lucide-react */}
             </Button>
          </div>
        </div>
        
        {/* Removed the explanation window div */}
        
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;
