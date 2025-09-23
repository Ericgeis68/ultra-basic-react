import React from 'react';
import { ExportOptions } from '@/services/PDFExportService';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InterventionPrintConfigPanelProps {
  options: ExportOptions;
  onOptionsChange: (newOptions: Partial<ExportOptions>) => void;
}

const InterventionPrintConfigPanel: React.FC<InterventionPrintConfigPanelProps> = ({
  options,
  onOptionsChange
}) => {
  return (
    <ScrollArea className="h-full p-4 border-r bg-muted/20">
      <div className="space-y-6 w-64">
        <div>
          <h3 className="font-semibold mb-4">Configuration PDF</h3>
          
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre du document</Label>
            <Input
              id="title"
              value={options.title || ''}
              onChange={(e) => onOptionsChange({ title: e.target.value })}
              placeholder="Liste des interventions"
            />
          </div>
        </div>

        <Separator />

        {/* Type de vue */}
        <div className="space-y-3">
          <Label>Type de vue</Label>
          <Select 
            value={options.format || 'grid'} 
            onValueChange={(value: 'grid' | 'list') => onOptionsChange({ format: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Vue grille (cartes)</SelectItem>
              <SelectItem value="list">Vue liste</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Taille des cartes - uniquement pour la vue grille */}
        {(options.format === 'grid' || !options.format) && (
          <div className="space-y-3">
            <Label>Taille des cartes</Label>
            <Select 
              value={options.gridSize || 'medium'} 
              onValueChange={(value: 'single' | 'small' | 'medium' | 'large' | 'xlarge') => onOptionsChange({ gridSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Carte unique (pleine page)</SelectItem>
                <SelectItem value="small">Petites cartes (4 par ligne)</SelectItem>
                <SelectItem value="medium">Cartes moyennes (3 par ligne)</SelectItem>
                <SelectItem value="large">Grandes cartes (2 par ligne)</SelectItem>
                <SelectItem value="xlarge">Très grandes cartes (1 par ligne)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Options d'affichage */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Contenu à inclure</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeHistory" className="text-sm">Historique des actions</Label>
              <Switch
                id="includeHistory"
                checked={options.includeHistory ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeHistory: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Options de page */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Options de page</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showHeaders" className="text-sm">En-tête du document</Label>
            <Switch
              id="showHeaders"
              checked={options.showHeaders ?? true}
              onCheckedChange={(checked) => onOptionsChange({ showHeaders: checked })}
            />
          </div>

          <div className="space-y-3">
            <Label>Orientation</Label>
            <Select 
              value={options.orientation || 'portrait'} 
              onValueChange={(value: 'portrait' | 'landscape') => onOptionsChange({ orientation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Paysage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Taille de page</Label>
            <Select 
              value={options.pageSize || 'a4'} 
              onValueChange={(value: 'a4' | 'a3' | 'letter' | 'legal' | 'custom') => onOptionsChange({ pageSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                <SelectItem value="letter">Letter (216 × 279 mm)</SelectItem>
                <SelectItem value="legal">Legal (216 × 356 mm)</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {options.pageSize === 'custom' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customWidth">Largeur (mm)</Label>
                <Input
                  id="customWidth"
                  type="number"
                  value={options.customPageWidth || 210}
                  onChange={(e) => onOptionsChange({ customPageWidth: parseInt(e.target.value) || 210 })}
                  placeholder="210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customHeight">Hauteur (mm)</Label>
                <Input
                  id="customHeight"
                  type="number"
                  value={options.customPageHeight || 297}
                  onChange={(e) => onOptionsChange({ customPageHeight: parseInt(e.target.value) || 297 })}
                  placeholder="297"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default InterventionPrintConfigPanel;
