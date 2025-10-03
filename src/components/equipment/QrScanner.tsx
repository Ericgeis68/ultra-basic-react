// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Flashlight, FlashlightOff } from 'lucide-react';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isFlashlightAvailable, setIsFlashlightAvailable] = useState(false);
  const [isFlashlightToggleInProgress, setIsFlashlightToggleInProgress] = useState(false);
  const [cameraConstraints, setCameraConstraints] = useState<MediaTrackConstraints>({});
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      // S'assurer que la lampe torche est éteinte au démarrage
      setIsFlashlightOn(false);
      startCamera();
      checkFlashlightAvailability();
      
      // Initialiser la lampe torche après un court délai pour s'assurer qu'elle est prête
      setTimeout(() => {
        console.log('Initializing flashlight availability...');
        // Forcer une vérification de la disponibilité de la lampe torche
        if (isFlashlightAvailable) {
          console.log('Flashlight is available and ready to use');
        }
      }, 1000);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const checkFlashlightAvailability = async () => {
    try {
      console.log('Checking flashlight availability...');
      console.log('Is native platform:', Capacitor.getPlatform());
      console.log('Capacitor version:', Capacitor.getVersion());
      
      if (Capacitor.isNativePlatform()) {
        console.log('Checking Camera API for flash support...');
        
        try {
          // Vérifier les permissions de la caméra
          const permissions = await Camera.checkPermissions();
          console.log('Camera permissions:', permissions);
          
          if (permissions.camera === 'granted') {
            console.log('Camera permission granted, assuming flash available');
            setIsFlashlightAvailable(true);
          } else {
            console.log('Camera permission not granted');
            setIsFlashlightAvailable(false);
          }
        } catch (cameraError) {
          console.error('Camera permission check failed:', cameraError);
          // Assume available for debugging
          setIsFlashlightAvailable(true);
        }
      } else {
        // Sur web, on assume que la lampe torche est disponible si MediaStream le supporte
        console.log('Web platform - assuming flashlight available');
        setIsFlashlightAvailable(true);
      }
    } catch (error) {
      console.error('Error checking flashlight availability:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Assume available for debugging
      setIsFlashlightAvailable(true);
    }
  };

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight },
          // Utiliser l'état actuel de la lampe torche
          torch: isFlashlightOn
        }
      };

      console.log('Starting camera with constraints:', constraints);
      console.log('Flashlight state when starting camera:', isFlashlightOn);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Stocker les contraintes pour les réutiliser
      setCameraConstraints(constraints.video);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning after camera is initialized
        videoRef.current.onloadedmetadata = () => {
          startScanning();
          setIsInitializing(false);
          console.log('Camera started successfully with flashlight:', isFlashlightOn);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez vos autorisations.');
      setIsInitializing(false);
    }
  };

  const startCameraWithFlash = async (flashState: boolean) => {
    setIsInitializing(true);
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight },
          // Utiliser l'état spécifié de la lampe torche
          torch: flashState
        }
      };

      console.log('Starting camera with flash constraints:', constraints);
      console.log('Flashlight state when starting camera:', flashState);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Stocker les contraintes pour les réutiliser
      setCameraConstraints(constraints.video);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning after camera is initialized
        videoRef.current.onloadedmetadata = () => {
          startScanning();
          setIsInitializing(false);
          // Mettre à jour l'état de la torche APRÈS que la caméra soit démarrée
          setIsFlashlightOn(flashState);
          console.log('Camera started successfully with flashlight:', flashState);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez vos autorisations.');
      setIsInitializing(false);
    }
  };

  const stopCamera = async () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset flashlight state
    setIsFlashlightOn(false);
    streamRef.current = null;
  };

  const toggleFlashlight = async () => {
    if (isFlashlightToggleInProgress) {
      console.log('Flashlight toggle already in progress, ignoring...');
      return;
    }

    setIsFlashlightToggleInProgress(true);
    
    try {
      console.log('Toggling flashlight...');
      console.log('Current state:', isFlashlightOn);
      console.log('Is native platform:', Capacitor.getPlatform());
      console.log('Flashlight available:', isFlashlightAvailable);
      
      // Nouvelle approche : redémarrer la caméra avec les nouvelles contraintes de flash
      const newFlashlightState = !isFlashlightOn;
      console.log('Setting flashlight to:', newFlashlightState);
      
      // Arrêter la caméra actuelle
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Attendre un peu pour que la caméra se libère
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // NE PAS mettre à jour l'état du flash ici - on le fait après le redémarrage
      
      // Redémarrer la caméra avec les nouvelles contraintes
      await startCameraWithFlash(newFlashlightState);
      
      // Attendre un peu pour que la caméra se stabilise avec le nouveau flash
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Flashlight toggled successfully to:', newFlashlightState);
      
    } catch (error) {
      console.error('Error toggling flashlight:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Revenir à l'état précédent en cas d'erreur
      setIsFlashlightOn(!isFlashlightOn);
      
      // Messages d'erreur plus spécifiques
      if (error.message.includes('CAMERA_IN_USE')) {
        setError('La lampe torche ne peut pas être activée car la caméra est en cours d\'utilisation.');
      } else if (error.message.includes('not available')) {
        setError('La lampe torche n\'est pas disponible sur cet appareil.');
      } else {
        setError(`Erreur lors du contrôle de la lampe torche: ${error.message}`);
      }
    } finally {
      setIsFlashlightToggleInProgress(false);
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

          {/* Flashlight toggle button - always show for debugging */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex flex-col items-center space-y-2">
              <Button 
                variant={isFlashlightOn ? "default" : "secondary"} 
                size="icon" 
                onClick={toggleFlashlight}
                className={`bg-black/50 hover:bg-black/70 text-white border-white/20 ${
                  isFlashlightOn ? 'bg-yellow-500/80 hover:bg-yellow-500' : ''
                }`}
                disabled={!isFlashlightAvailable || isFlashlightToggleInProgress}
                title={isFlashlightOn ? 'Éteindre la lampe torche' : 'Allumer la lampe torche'}
              >
              {isFlashlightToggleInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFlashlightOn ? (
                <Flashlight className="h-4 w-4" />
              ) : (
                <FlashlightOff className="h-4 w-4" />
              )}
              </Button>
              
              {/* Debug info */}
              <div className="text-xs text-white/70 text-center">
                {isFlashlightToggleInProgress ? 'Changement...' : isFlashlightOn ? 'Allumée' : 'Éteinte'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Removed the explanation window div */}
        
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;
