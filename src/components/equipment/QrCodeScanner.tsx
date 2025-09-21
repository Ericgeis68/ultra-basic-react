import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScanQrCode, X, Camera, CameraOff, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

interface QrCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [manualQrCode, setManualQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanAttempts, setScanAttempts] = useState(0);

  // Réinitialiser les états quand le dialog s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsScanning(false);
      setManualQrCode('');
      setScanResult(null);
      setScanAttempts(0);
      
      // Démarrer le scan automatiquement à l'ouverture si on est sur l'onglet scan
      if (activeTab === 'scan') {
        startScanning();
      }
    }
  }, [isOpen]);
  
  // Démarrer le scan quand on change d'onglet pour aller sur "scan"
  useEffect(() => {
    if (isOpen && activeTab === 'scan' && !isScanning) {
      startScanning();
    }
  }, [activeTab, isOpen]);

  // Si un résultat de scan est trouvé, appeler onScan et fermer la modal
  useEffect(() => {
    if (scanResult) {
      onScan(scanResult);
      onClose();
    }
  }, [scanResult, onScan, onClose]);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      // Vérifier et demander les permissions de caméra
      const permissionStatus = await CapacitorCamera.checkPermissions();
      
      if (permissionStatus.camera === 'granted') {
        return true;
      } else if (permissionStatus.camera === 'prompt') {
        const requested = await CapacitorCamera.requestPermissions();
        return requested.camera === 'granted';
      } else {
        setErrorMessage("L'accès à la caméra a été refusé. Veuillez l'autoriser dans les paramètres de votre appareil.");
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des permissions:", error);
      setErrorMessage("Erreur lors de la vérification des permissions de caméra.");
      return false;
    }
  };

  const processImage = async (base64Image: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) {
          resolve(null);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Adapter les dimensions du canvas à l'image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Dessiner l'image sur le canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Récupérer les données de l'image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyser l'image pour détecter un QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          console.log("QR Code détecté:", code.data);
          resolve(code.data);
        } else {
          console.log("Aucun QR code détecté");
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error("Erreur lors du chargement de l'image");
        resolve(null);
      };
      
      // Charger l'image depuis la chaîne base64
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setErrorMessage('');
      
      // Vérifier les permissions
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setActiveTab('manual');
        return;
      }
      
      // Configurer les options de la caméra
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scanner un QR code',
        promptLabelCancel: 'Annuler',
        correctOrientation: true,
      });
      
      if (!image.base64String) {
        throw new Error("Impossible de récupérer l'image");
      }
      
      // Traiter l'image pour détecter un QR code
      const qrData = await processImage(image.base64String);
      
      if (qrData) {
        // QR code détecté
        toast({
          title: "QR Code détecté",
          description: "Redirection en cours...",
        });
        setScanResult(qrData);
      } else {
        // Aucun QR code détecté, proposer de réessayer ou d'utiliser la saisie manuelle
        toast({
          title: "Aucun QR code détecté",
          description: "Veuillez réessayer ou utiliser la saisie manuelle",
          variant: "destructive",
        });
        
        // Augmenter le compteur de tentatives
        setScanAttempts(prev => prev + 1);
        
        // Si trop de tentatives échouées, suggérer la saisie manuelle
        if (scanAttempts >= 2) {
          setActiveTab('manual');
        } else {
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors du scan:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue lors du scan");
      setIsScanning(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'scan' | 'manual');
    if (value === 'scan') {
      setIsScanning(false);  // Réinitialiser pour permettre un nouveau scan
    }
  };

  const handleManualSubmit = () => {
    if (!manualQrCode) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un code QR valide",
        variant: "destructive",
      });
      return;
    }
    
    onScan(manualQrCode);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner un QR code</DialogTitle>
          <DialogDescription>
            Scannez un QR code d'équipement ou saisissez-le manuellement
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Saisie manuelle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden flex items-center justify-center">
                {errorMessage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                    <CameraOff className="h-12 w-12 mb-4 text-gray-400" />
                    <p>{errorMessage}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center text-white">
                      <ScanQrCode className="h-16 w-16 mb-4 text-primary" />
                      <p className="text-center px-4">
                        {isScanning 
                          ? "En cours de scan..." 
                          : "Appuyez sur le bouton pour scanner un QR code"}
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-primary rounded-md"></div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Canvas caché pour le traitement des images */}
              <canvas ref={canvasRef} className="hidden" />
              
              <p className="text-sm text-center text-muted-foreground">
                Positionnez le QR code au centre de la caméra
              </p>
              
              <Button 
                onClick={startScanning} 
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? "En cours..." : "Scanner un QR code"}
              </Button>
              
              {scanAttempts > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Si vous rencontrez des difficultés, essayez dans un environnement plus lumineux 
                  ou utilisez la saisie manuelle.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="qrcode" className="text-sm font-medium mb-2 block">
                  Saisissez l'URL ou l'identifiant du QR code
                </label>
                <Input 
                  id="qrcode"
                  placeholder="https://votre-app-gmao.com/equipment/eq123456" 
                  value={manualQrCode}
                  onChange={(e) => setManualQrCode(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Format: URL complète ou juste l'ID (ex: eq123456)
                </p>
              </div>
              <Button onClick={handleManualSubmit} className="w-full">
                Valider
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeScanner;
