import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Upload, Download, AlertTriangle, Tag, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { UF } from '@/types/uf';

interface DuplicateInfo {
  duplicates: string[];
  newItems: UF[];
  allItems: UF[];
}

const UFManagement = () => {
  const { toast } = useToast();
  const [ufs, setUfs] = useState<UF[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateInfo | null>(null);

  // File input ref
  const ufFileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newUF, setNewUF] = useState({ name: '' });

  useEffect(() => {
    fetchUFs();
  }, []);

  const fetchUFs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ufs')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setUfs((data || []) as UF[]);
    } catch (error: any) {
      console.error('Erreur lors du chargement des UF:', error);
      toast({ title: "Erreur", description: "Impossible de charger les UF.", variant: 'destructive' });
      setUfs([]);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateName = (name: string): boolean => {
    const normalizedName = name.trim().toLowerCase();
    return ufs.some(uf => uf.name.toLowerCase() === normalizedName);
  };

  const addUF = async () => {
    if (!newUF.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'UF est requis",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (checkDuplicateName(newUF.name)) {
      toast({
        title: "Doublon détecté",
        description: `Une UF avec le nom "${newUF.name}" existe déjà`,
        variant: "destructive"
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('ufs')
        .insert([{ name: newUF.name.trim() }]);
      if (error) throw error;
      toast({ title: 'UF ajoutée', description: `"${newUF.name}" a été créée.` });
      setNewUF({ name: '' });
      await fetchUFs();
    } catch (error: any) {
      console.error('Erreur ajout UF:', error);
      toast({ title: 'Erreur', description: "Impossible d'ajouter l'UF.", variant: 'destructive' });
    }
  };

  const deleteUF = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette UF ?")) return;
    try {
      const { error } = await supabase
        .from('ufs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'UF supprimée' });
      await fetchUFs();
    } catch (error: any) {
      console.error('Erreur suppression UF:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'UF.", variant: 'destructive' });
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }).filter(line => line.some(cell => cell.length > 0));
  };

  const checkForDuplicates = (newItems: UF[]) => {
    return newItems
      .filter(item => ufs.some(existing => existing.name.toLowerCase() === item.name.toLowerCase()))
      .map(item => item.name);
  };

  const performImport = async (items: UF[], ignoreDuplicates: boolean = false) => {
    try {
      // Rafraîchir la liste existante pour mieux filtrer
      await fetchUFs();
      let itemsToInsert = items.map(i => ({ name: (i as any).name?.trim?.() || i.name?.trim?.() || '' }))
        .filter(i => i.name);

      if (ignoreDuplicates) {
        const duplicates = new Set(ufs.map(u => u.name.toLowerCase()));
        itemsToInsert = itemsToInsert.filter(i => !duplicates.has(i.name.toLowerCase()));
      }

      if (itemsToInsert.length === 0) {
        toast({ title: 'Information', description: 'Aucun élément à importer après filtrage des doublons' });
        return;
      }

      const { error } = await supabase
        .from('ufs')
        .insert(itemsToInsert);
      if (error) throw error;

      toast({ title: 'Import terminé', description: `${itemsToInsert.length} UF ajoutée(s).` });
      await fetchUFs();
    } catch (error: any) {
      console.error('Erreur import UF:', error);
      toast({ title: 'Erreur', description: "Impossible d'importer les UF.", variant: 'destructive' });
    }
  };

  const handleUFImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let rows: string[][] = [];
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        rows = parseCSV(text);
      }

      const dataRows = rows.slice(1);
      
      const ufsToInsert = dataRows
        .map(row => ({ name: row[0]?.trim(), id: '', created_at: '', updated_at: '' }))
        .filter(uf => uf.name);

      if (ufsToInsert.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucune UF valide trouvée dans le fichier",
          variant: "destructive"
        });
        return;
      }

      const duplicates = checkForDuplicates(ufsToInsert);
      
      if (duplicates.length > 0) {
        setDuplicateDialog({
          duplicates,
          newItems: ufsToInsert,
          allItems: ufsToInsert
        });
      } else {
        await performImport(ufsToInsert);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }

    if (ufFileRef.current) {
      ufFileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = '"Nom de l\'UF"\n"UF A"\n"UF B"';
    const filename = 'template_ufs.csv';
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplateExcel = () => {
    const headers = ["Nom de l'UF"];
    const sample = [["UF A"], ["UF B"]];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    
    // Définir la largeur de colonne optimisée
    worksheet['!cols'] = [{ wch: 25 }]; // Nom de l'UF
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UF');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_ufs.xlsx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDuplicateDialogAction = async (action: 'import-all' | 'skip-duplicates') => {
    if (!duplicateDialog) return;

    if (action === 'import-all') {
      await performImport(duplicateDialog.allItems, false);
    } else {
      await performImport(duplicateDialog.newItems, true);
    }

    setDuplicateDialog(null);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gestion des UF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end flex-1">
              <div className="space-y-2">
                <Label htmlFor="uf-name">Nom de l'UF</Label>
                <Input
                  id="uf-name"
                  value={newUF.name}
                  onChange={(e) => setNewUF({ name: e.target.value })}
                  placeholder="Nom de l'UF"
                />
              </div>
              <Button onClick={addUF} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => ufFileRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importer CSV/Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Modèle
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplateExcel}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Modèle Excel
                </Button>
              </div>
              <input
                ref={ufFileRef}
                type="file"
                accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleUFImport}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            {ufs.map((uf) => (
              <div key={uf.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{uf.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteUF(uf.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duplicate confirmation dialog */}
      <AlertDialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Doublons détectés
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Les éléments suivants existent déjà dans le système :</p>
              <div className="bg-amber-50 p-3 rounded-lg">
                <ul className="list-disc list-inside space-y-1">
                  {duplicateDialog?.duplicates.map((duplicate, index) => (
                    <li key={index} className="text-sm text-amber-800">{duplicate}</li>
                  ))}
                </ul>
              </div>
              <p>Que souhaitez-vous faire ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setDuplicateDialog(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDuplicateDialogAction('skip-duplicates')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ignorer les doublons
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleDuplicateDialogAction('import-all')}
            >
              Importer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UFManagement;
