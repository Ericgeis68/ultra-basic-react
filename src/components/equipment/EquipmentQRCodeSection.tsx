import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { QrCode, Printer, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Equipment } from '@/types/equipment';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentQRCodeSectionProps {
  equipment: Equipment;
  showQrCode: boolean;
  onToggleQrCode: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

const EquipmentQRCodeSection: React.FC<EquipmentQRCodeSectionProps> = ({
  equipment,
  showQrCode,
  onToggleQrCode,
  onPrint,
  onDownload
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-2 no-print">
      <Label>QR Code</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleQrCode} className="text-xs md:text-sm">
          <QrCode className="mr-1 h-3 w-3 md:h-4 md:w-4" />
          {showQrCode ? 'Masquer' : 'Afficher'}
        </Button>
        {showQrCode && (
          <>
            <Button variant="outline" size="sm" onClick={onPrint} className="text-xs md:text-sm">
              <Printer className="mr-1 h-3 w-3 md:h-4 md:w-4" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} className="text-xs md:text-sm">
              <Download className="mr-1 h-3 w-3 md:h-4 md:w-4" />
              Télécharger
            </Button>
          </>
        )}
      </div>
      {showQrCode && (
        <div className="qr-code-container p-4 border rounded-md inline-block mt-2">
          <QRCodeSVG value={equipment.id} size={isMobile ? 96 : 128} />
        </div>
      )}
    </div>
  );
};

export default EquipmentQRCodeSection;
