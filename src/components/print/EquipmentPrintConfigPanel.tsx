import React from 'react';
import { ExportOptions } from '@/services/PDFExportService';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EquipmentPrintConfigPanelProps {
  options: ExportOptions;
  onOptionsChange: (newOptions: Partial<ExportOptions>) => void;
}

const EquipmentPrintConfigPanel: React.FC<EquipmentPrintConfigPanelProps> = ({
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
              placeholder="Liste des équipements"
            />
          </div>
        </div>

        <Separator />

        {/* Format d'affichage */}
        <div className="space-y-3">
          <Label>Format d'affichage</Label>
          <Select 
            value={options.format || 'grid'} 
            onValueChange={(value: 'list' | 'grid' | 'cards') => onOptionsChange({ format: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Liste</SelectItem>
              <SelectItem value="grid">Grille</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Taille de grille (si format grille) */}
        {options.format === 'grid' && (
          <div className="space-y-3">
            <Label>Taille des cartes</Label>
            <Select 
              value={options.gridSize || 'medium'} 
              onValueChange={(value: 'single' | 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge') => onOptionsChange({ gridSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Carte unique (1 par page)</SelectItem>
                <SelectItem value="xsmall">Très petites cartes (6 par ligne)</SelectItem>
                <SelectItem value="small">Petites cartes (5 par ligne)</SelectItem>
                <SelectItem value="medium">Cartes moyennes (4 par ligne)</SelectItem>
                <SelectItem value="large">Grandes cartes (3 par ligne)</SelectItem>
                <SelectItem value="xlarge">Très grandes cartes (2 par ligne)</SelectItem>
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
              <Label htmlFor="includeImages" className="text-sm">Images</Label>
              <Switch
                id="includeImages"
                checked={options.includeImages ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeImages: checked })}
              />
            </div>

            {/* Champ Détails supprimé de la configuration d'impression */}

            <div className="flex items-center justify-between">
              <Label htmlFor="includeHealth" className="text-sm">État de santé</Label>
              <Switch
                id="includeHealth"
                checked={options.includeHealth ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeHealth: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeLocation" className="text-sm">Localisation</Label>
              <Switch
                id="includeLocation"
                checked={options.includeLocation ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeLocation: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeGroups" className="text-sm">Groupes</Label>
              <Switch
                id="includeGroups"
                checked={options.includeGroups ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeGroups: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeSupplier" className="text-sm">Fournisseur</Label>
              <Switch
                id="includeSupplier"
                checked={options.includeSupplier ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeSupplier: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeSerialNumber" className="text-sm">N° de série</Label>
              <Switch
                id="includeSerialNumber"
                checked={options.includeSerialNumber ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeSerialNumber: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeInventoryNumber" className="text-sm">N° inventaire</Label>
              <Switch
                id="includeInventoryNumber"
                checked={options.includeInventoryNumber ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeInventoryNumber: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includePurchaseDate" className="text-sm">Date d'achat</Label>
              <Switch
                id="includePurchaseDate"
                checked={options.includePurchaseDate ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includePurchaseDate: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeDateMiseEnService" className="text-sm">Date mise en service</Label>
              <Switch
                id="includeDateMiseEnService"
                checked={options.includeDateMiseEnService ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeDateMiseEnService: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeWarranty" className="text-sm">Fin de garantie</Label>
              <Switch
                id="includeWarranty"
                checked={options.includeWarranty ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeWarranty: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeManufacturer" className="text-sm">Fabricant</Label>
              <Switch
                id="includeManufacturer"
                checked={options.includeManufacturer ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeManufacturer: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeModel" className="text-sm">Modèle</Label>
              <Switch
                id="includeModel"
                checked={options.includeModel ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeModel: checked })}
              />
            </div>

            {/* Champ N° de tag supprimé de la configuration d'impression */}

            <div className="flex items-center justify-between">
              <Label htmlFor="includeBuilding" className="text-sm">Bâtiment</Label>
              <Switch
                id="includeBuilding"
                checked={options.includeBuilding ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeBuilding: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeService" className="text-sm">Service</Label>
              <Switch
                id="includeService"
                checked={options.includeService ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeService: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeStatus" className="text-sm">Statut</Label>
              <Switch
                id="includeStatus"
                checked={options.includeStatus ?? true}
                onCheckedChange={(checked) => onOptionsChange({ includeStatus: checked })}
              />
            </div>

            {/* Champ Description supprimé de la configuration d'impression */}

            <div className="flex items-center justify-between">
              <Label htmlFor="includeUF" className="text-sm">UF</Label>
              <Switch
                id="includeUF"
                checked={options.includeUF ?? false}
                onCheckedChange={(checked) => onOptionsChange({ includeUF: checked })}
              />
            </div>

            {/* Champ Relations équipements supprimé de la configuration d'impression */}
          </div>
        </div>

        <Separator />

        {/* Options de page */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Options de page</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showHeaders" className="text-sm">Titre</Label>
            <Switch
              id="showHeaders"
              checked={options.showHeaders ?? true}
              onCheckedChange={(checked) => onOptionsChange({ showHeaders: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Taille du titre</Label>
            <Select 
              value={options.titleFontSize || 'medium'} 
              onValueChange={(value: 'small' | 'medium' | 'large') => onOptionsChange({ titleFontSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Petite</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pieds de page supprimés de la configuration d'impression */}

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
              onValueChange={(value: 'a4' | 'a3' | 'letter') => onOptionsChange({ pageSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="a3">A3</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default EquipmentPrintConfigPanel;