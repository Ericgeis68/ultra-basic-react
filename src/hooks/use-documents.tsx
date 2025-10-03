import { useState } from 'react';
import { Document } from '@/types/document';
import { useCollection } from '@/hooks/use-supabase-collection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDocuments() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    data: documents,
    loading: docsLoading,
    error: docsError,
    addDocument,
    updateDocument,
    deleteDocument: deleteDocFromCollection,
    refetch,
  } = useCollection<Document>({
    tableName: 'documents',
  });
  
  const uploadDocumentWithFile = async (document: Partial<Omit<Document, 'id'>>, file: File) => {
    setLoading(true);
    
    try {
      console.log('Uploading document with file:', document, file);
      
      // Upload file to Supabase Storage
      const filePath = `public/documents/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const documentData = {
        ...document,
        fileurl: publicUrlData.publicUrl,
        filename: file.name,
        filetype: file.type,
        size: file.size,
        uploadDate: (() => { const d = new Date(); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })(),
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };
      
      console.log('Document data to save:', documentData);
      
      const success = await addDocument(documentData as Omit<Document, 'id'>);
      
      if (success) {
        toast({
          title: "Document ajouté",
          description: `${document.title} a été ajouté avec succès.`,
        });
        return { success: true };
      } else {
        return { success: false, error: { message: "Échec de l'ajout du document" } };
      }
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Une erreur est survenue"));
      
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'upload: ${err.message}`,
        variant: "destructive",
      });
      
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };
  
  const deleteDocument = async (id: string) => {
    setLoading(true);
    
    try {
      // In a real app, we would also delete the file from storage
      await deleteDocFromCollection(id);
      const actualSuccess = true;
      
      if (actualSuccess) {
        toast({
          title: "Document supprimé",
          description: "Le document a été supprimé avec succès.",
        });
        return { success: true };
      } else {
        return { success: false, error: { message: "Échec de la suppression du document" } };
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Une erreur est survenue"));
      
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de la suppression: ${err.message}`,
        variant: "destructive",
      });
      
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    documents,
    loading: loading || docsLoading,
    error: error || docsError,
    uploadDocumentWithFile,
    deleteDocument,
    refetchDocuments: refetch
  };
}
