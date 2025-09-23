import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Camera } from 'lucide-react';

const ScannerPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <QrCode className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4">Scanner QR Code</CardTitle>
          <CardDescription>
            Utilisez votre appareil photo pour scanner les QR codes des équipements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-64 bg-muted flex items-center justify-center rounded-lg border border-dashed">
            <Camera className="h-16 w-16 text-muted-foreground" />
          </div>
          <Button className="w-full">
            Activer le scanner
          </Button>
          <p className="text-sm text-muted-foreground">
            (Fonctionnalité de scan réelle à implémenter avec Capacitor Camera pour les applications natives)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScannerPage;
