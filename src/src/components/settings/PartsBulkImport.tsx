import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Download, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Part } from '@/types/part';

const PartsBulkImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.toLowerCase().endsWith('.xlsx');
    if (isCsv || isXlsx) setSelectedFile(file);
    else toast({ title: "Erreur", description: "Sélectionnez un CSV ou Excel (.xlsx).", variant: "destructive" });
  };

  const parseCSV = (csvText: string): Partial<Part>[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const parts: Partial<Part>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length) {
        const part: Partial<Part> = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'name':
            case 'nom':
              part.name = value;
              break;
            case 'reference':
            case 'référence':
              part.reference = value;
              break;
            case 'description':
              part.description = value || '';
              break;
            case 'quantity':
            case 'quantité':
              part.quantity = parseInt(value) || 0;
              break;
            case 'min_quantity':
            case 'quantité_minimum':
            case 'stock_minimum':
              part.min_quantity = parseInt(value) || 0;
              break;
            case 'location':
            case 'emplacement':
              part.location = value || '';
              break;
            case 'supplier':
            case 'fournisseur':
              part.supplier = value || '';
              break;
            case 'unit':
            case 'unité':
              part.unit = value || '';
              break;
            case 'price':
            case 'prix':
              part.price = parseFloat(value) || 0;
              break;
            case 'last_restock_date':
            case 'dernière_réappro':
            case 'dernier_restock':
              part.last_restock_date = value || new Date().toISOString().split('T')[0];
              break;
          }
        });

        if (part.name && part.reference) {
          parts.push(part);
        }
      }
    }

    return parts;
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier CSV ou Excel.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let parts: Partial<Part>[] = [];
      const isXlsx = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isXlsx) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (aoa.length >= 2) {
          const headers = (aoa[0] as any[]).map(h => String(h || '').trim().replace(/"/g, '').toLowerCase());
          for (let i = 1; i < aoa.length; i++) {
            const row = (aoa[i] as any[]).map(c => (c != null ? String(c) : ''));
            const values = row;
            const part: Partial<Part> = {};
            headers.forEach((header, index) => {
              const value = values[index] ?? '';
              switch (header) {
                case 'name':
                case 'nom':
                  part.name = String(value);
                  break;
                case 'reference':
                case 'référence':
                  part.reference = String(value);
                  break;
                case 'description':
                  part.description = String(value) || '';
                  break;
                case 'quantity':
                case 'quantité':
                  part.quantity = parseInt(String(value)) || 0;
                  break;
                case 'min_quantity':
                case 'quantité_minimum':
                case 'stock_minimum':
                  part.min_quantity = parseInt(String(value)) || 0;
                  break;
                case 'location':
                case 'emplacement':
                  part.location = String(value) || '';
                  break;
                case 'supplier':
                case 'fournisseur':
                  part.supplier = String(value) || '';
                  break;
                case 'unit':
                case 'unité':
                  part.unit = String(value) || '';
                  break;
                case 'price':
                case 'prix':
                  part.price = parseFloat(String(value)) || 0;
                  break;
                case 'last_restock_date':
                case 'dernière_réappro':
                case 'dernier_restock':
                  part.last_restock_date = String(value) || new Date().toISOString().split('T')[0];
                  break;
              }
            });
            if (part.name && part.reference) parts.push(part);
          }
        }
      } else {
        const csvText = await selectedFile.text();
        parts = parseCSV(csvText);
      }

      if (parts.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucune pièce valide trouvée dans le fichier CSV.",
          variant: "destructive",
        });
        return;
      }

      // Préparer les données pour l'insertion
      const partsToInsert = parts.map(part => ({
        name: part.name!,
        reference: part.reference!,
        description: part.description || '',
        quantity: part.quantity || 0,
        min_quantity: part.min_quantity || 0,
        location: part.location || '',
        supplier: part.supplier || '',
        unit: part.unit || 'unité',
        price: part.price || 0,
        last_restock_date: part.last_restock_date || new Date().toISOString().split('T')[0],
        equipment_ids: null,
        group_ids: null,
        image: null
      }));

      const { error } = await supabase
        .from('parts')
        .insert(partsToInsert);

      if (error) {
        console.error('Error importing parts:', error);
        toast({
          title: "Erreur",
          description: `Erreur lors de l'import: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: `${parts.length} pièce(s) importée(s) avec succès.`,
        });
        setSelectedFile(null);
        // Reset the file input
        const fileInput = document.getElementById('parts-csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement du fichier CSV.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'name,reference,description,quantity,min_quantity,location,supplier,unit,price,last_restock_date',
      'Filtre à air,FA-001,Filtre à air pour système de ventilation,10,5,Magasin A,Fournisseur ABC,pièce,25.50,2024-01-15',
      'Courroie moteur,CM-002,Courroie de transmission moteur principal,3,2,Magasin B,Fournisseur XYZ,pièce,45.00,2024-02-10'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pieces.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplateExcel = async () => {
    try {
      // Récupérer les données actuelles pour les exemples
      const [buildingsResult, servicesResult, locationsResult] = await Promise.all([
        supabase.from('buildings').select('name').order('name'),
        supabase.from('services').select('name').order('name'),
        supabase.from('locations').select('name').order('name')
      ]);

      const buildings = buildingsResult.data?.map(b => b.name) || [];
      const services = servicesResult.data?.map(s => s.name) || [];
      const locations = locationsResult.data?.map(l => l.name) || [];

      const headers = ['name','reference','description','quantity','min_quantity','location','supplier','unit','price','last_restock_date'];
      const rows = [
        ['Filtre à air','FA-001','Filtre à air pour système de ventilation',10,5,locations[0] || 'Magasin A','Fournisseur ABC','pièce',25.50,'2024-01-15'],
        ['Courroie moteur','CM-002','Courroie de transmission moteur principal',3,2,locations[1] || locations[0] || 'Magasin B','Fournisseur XYZ','pièce',45.00,'2024-02-10']
      ];
      
      // Ajouter les commentaires avec les valeurs disponibles
      const comments = [
        `Locaux disponibles: ${locations.join(', ') || 'Aucun'}`,
        `Bâtiments disponibles: ${buildings.join(', ') || 'Aucun'}`,
        `Services disponibles: ${services.join(', ') || 'Aucun'}`
      ];
      
      const commentRows = comments.map(comment => [comment]);
      const allData = [headers, ...rows, ...commentRows];
      
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Définir les largeurs de colonnes optimisées
      const columnWidths = [
        { wch: 20 }, // name
        { wch: 15 }, // reference
        { wch: 40 }, // description
        { wch: 12 }, // quantity
        { wch: 12 }, // min_quantity
        { wch: 20 }, // location
        { wch: 25 }, // supplier
        { wch: 10 }, // unit
        { wch: 12 }, // price
        { wch: 15 }  // last_restock_date
      ];
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pièces');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_pieces.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la génération du modèle Excel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le modèle Excel",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import en Lot de Pièces
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-blue-800">
              <strong>Format requis:</strong> Fichier CSV avec les colonnes suivantes :
            </p>
            <p className="text-xs text-blue-700 font-mono">
              name, reference, description, quantity, min_quantity, location, supplier, unit, price, last_restock_date
            </p>
            <p className="text-xs text-blue-700">
              Les colonnes <strong>name</strong> et <strong>reference</strong> sont obligatoires.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger le modèle CSV
          </Button>
          <Button
            variant="outline"
            onClick={downloadTemplateExcel}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Télécharger le modèle Excel
          </Button>
        </div>

        <div className="space-y-2">
          <label htmlFor="parts-csv-file" className="text-sm font-medium">
            Sélectionner le fichier CSV/Excel
          </label>
          <Input
            id="parts-csv-file"
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileSelect}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {selectedFile && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Fichier sélectionné: {selectedFile.name}
            </p>
          )}
        </div>

        <Button
          onClick={handleImport}
          disabled={!selectedFile || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Import en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importer les pièces
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartsBulkImport;
