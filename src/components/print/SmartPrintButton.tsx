import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Eye } from 'lucide-react';
import { useSmartPrint } from '@/hooks/useSmartPrint';

interface SmartPrintButtonProps {
  elementId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showPreview?: boolean;
  onPreviewClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const SmartPrintButton: React.FC<SmartPrintButtonProps> = ({
  elementId = 'printable-content',
  variant = 'outline',
  size = 'default',
  showPreview = true,
  onPreviewClick,
  className,
  children
}) => {
  const { isPrinting, handlePrint, isDesktop } = useSmartPrint();

  const handleDirectPrint = () => {
    handlePrint(elementId);
  };

  const handlePreviewClick = () => {
    if (onPreviewClick) {
      onPreviewClick();
    }
  };

  if (showPreview) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={handlePreviewClick}
          className={className}
        >
          <Eye className="h-4 w-4 mr-2" />
          Aperçu
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={handleDirectPrint}
          disabled={isPrinting}
          className={className}
        >
          {isPrinting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          ) : isDesktop ? (
            <Printer className="h-4 w-4 mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {children || (isPrinting ? 'En cours...' : isDesktop ? 'Imprimer' : 'PDF')}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDirectPrint}
      disabled={isPrinting}
      className={className}
    >
      {isPrinting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      ) : isDesktop ? (
        <Printer className="h-4 w-4 mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {children || (isPrinting ? 'En cours...' : isDesktop ? 'Imprimer' : 'PDF')}
    </Button>
  );
};

export default SmartPrintButton;