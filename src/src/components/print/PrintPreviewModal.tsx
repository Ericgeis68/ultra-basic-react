import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer, X } from 'lucide-react';
import { FileDown } from 'lucide-react';
import { PDFExportService, ExportOptions } from '@/services/PDFExportService';

interface LocalPrintOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter';
  itemsPerPage?: number;
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (options: LocalPrintOptions) => void;
  previewContent: React.ReactNode;
}

export const PrintPreviewModal = ({ isOpen, onClose, onPrint, previewContent }: PrintPreviewModalProps) => {
  const [options, setOptions] = useState<LocalPrintOptions>({
    orientation: 'portrait',
    pageSize: 'A4',
    itemsPerPage: 9
  });

  const handlePrint = () => {
    onPrint(options);
    onClose();
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('generic-print-preview');
    if (el) {
      await PDFExportService.downloadPDF(el, {
        orientation: options.orientation?.toLowerCase() as any,
        pageSize: options.pageSize?.toLowerCase() as any,
        title: 'Export'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Aperçu d'impression
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Options Panel */}
          <div className="w-64 space-y-4 flex-shrink-0">
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select value={options.orientation} onValueChange={(value: 'portrait' | 'landscape') => 
                setOptions(prev => ({ ...prev, orientation: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Paysage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille de page</Label>
              <Select value={options.pageSize} onValueChange={(value: 'A4' | 'A3' | 'Letter') => 
                setOptions(prev => ({ ...prev, pageSize: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre d'éléments par page</Label>
              <input
                type="number"
                value={options.itemsPerPage || 9}
                onChange={(e) => setOptions(prev => ({ ...prev, itemsPerPage: Math.max(1, parseInt(e.target.value) || 9) }))}
                className="w-full p-2 border rounded"
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Le système optimise automatiquement la disposition pour maximiser l'utilisation de l'espace.
              </p>
            </div>

            <Button onClick={handlePrint} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>

          {/* Preview Panel */
          }
          <div className="flex-1 border rounded-lg p-4 overflow-auto bg-white">
            <div 
              className={`
                mx-auto bg-white shadow-lg
                ${options.orientation === 'portrait' ? 'w-[210mm]' : 'w-[297mm]'}
                ${options.pageSize === 'A4' ? 
                  (options.orientation === 'portrait' ? 'min-h-[297mm]' : 'min-h-[210mm]') :
                  options.pageSize === 'A3' ?
                  (options.orientation === 'portrait' ? 'min-h-[420mm]' : 'min-h-[297mm]') :
                  (options.orientation === 'portrait' ? 'min-h-[280mm]' : 'min-h-[216mm]')
                }
                print-${options.orientation}
                print-${options.pageSize.toLowerCase()}
              `}
              id="generic-print-preview"
              style={{ zoom: 0.3 }}
            >
              {/* Quadrillage supprimé */}
              {previewContent}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};