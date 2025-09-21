import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Eye } from 'lucide-react';
import { useSmartPrint } from '@/hooks/useSmartPrint';

interface PDFExportButtonProps {
  elementId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showPreview?: boolean;
  onPreviewClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  elementId = 'exportable-content',
  variant = 'outline',
  size = 'default',
  showPreview = true,
  onPreviewClick,
  className,
  children
}) => {
  const { isExporting, handleDirectExport } = useSmartPrint();

  const handleDirectExportClick = () => {
    handleDirectExport(elementId);
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
          onClick={handleDirectExportClick}
          disabled={isExporting}
          className={className}
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          {children || (isExporting ? 'Export...' : 'Exporter PDF')}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDirectExportClick}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {children || (isExporting ? 'Export...' : 'Exporter PDF')}
    </Button>
  );
};

export default PDFExportButton;