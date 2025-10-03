import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomCard from '../ui/CustomCard';
import { FileText, Download, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { Document } from '@/types/document';

interface EquipmentDocumentsSectionProps {
  showDocuments: boolean;
  onToggleDocuments: (show: boolean) => void;
  documentsLoading: boolean;
  documentsError: Error | null;
  equipmentDocuments: Document[];
}

const EquipmentDocumentsSection: React.FC<EquipmentDocumentsSectionProps> = ({
  showDocuments,
  onToggleDocuments,
  documentsLoading,
  documentsError,
  equipmentDocuments
}) => {
  if (!showDocuments) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm md:text-lg font-medium">Documents techniques</h3>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onToggleDocuments(false)}
        >
          Fermer
        </Button>
      </div>

      {documentsLoading ? (
        <div className="text-center p-6 border rounded-md">
          <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground">Chargement des documents...</p>
        </div>
      ) : documentsError ? (
        <div className="text-center p-6 border border-destructive text-destructive rounded-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Erreur lors du chargement des documents: {documentsError.message}</p>
        </div>
      ) : equipmentDocuments.length > 0 ? (
        <div className="space-y-3">
          {equipmentDocuments.map(doc => (
            <CustomCard key={doc.id} className="p-3" variant="outline">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{doc.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {doc.createdat ? (() => { const d = new Date(doc.createdat); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : ''}
                    </span>
                    {doc.size !== undefined && doc.size !== null && (
                      <span className="text-xs text-muted-foreground">
                        {(doc.size / 1000).toFixed(0)} Ko
                      </span>
                    )}
                    {doc.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {doc.category}
                      </Badge>
                    )}
                  </div>
                </div>
                {doc.fileurl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={doc.fileurl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </a>
                  </Button>
                )}
              </div>
            </CustomCard>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 border rounded-md">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Aucun document disponible pour cet équipement</p>
        </div>
      )}
    </div>
  );
};

export default EquipmentDocumentsSection;
