import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseCollectionProps<T> {
  tableName: string;
  initialData?: T[];
  orderBy?: { column: string; ascending?: boolean };
  where?: { column: string; operator: string; value: any }[];
}

export function useCollection<T extends { id: string }>({
  tableName,
  initialData = [],
  orderBy,
  where,
}: UseCollectionProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching data from ${tableName}...`);

      // Create a type-safe query using 'as any' only at the from() method call point
      let query = supabase.from(tableName as any).select('*');

      // Apply where clauses if provided
      if (where && where.length > 0) {
        where.forEach(condition => {
          // Use 'as any' for the query for flexibility
          (query as any) = query.filter(condition.column, condition.operator, condition.value);
        });
      }

      // Apply orderBy if provided
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }

      // --- Added logging and check for debugging the 'cannot destructure data' error ---
      const result = await query;
      console.log(`Supabase query result for ${tableName}:`, result);

      if (!result || typeof result !== 'object' || !('data' in result) || !('error' in result)) {
         console.error(`Supabase query returned unexpected result structure for ${tableName}:`, result);
         // Attempt to provide a more specific error if possible
         const errorMessage = result && typeof result === 'object' && 'message' in result ? result.message : 'Invalid result structure from Supabase query.';
         throw new Error(`Supabase query failed or returned invalid structure: ${errorMessage}`);
      }
      // --- End of added debugging code ---


      const { data: responseData, error: fetchError } = result; // Destructure from the checked result

      if (fetchError) {
        console.error(`Error fetching ${tableName}:`, fetchError);
        throw fetchError;
      }

      // Cast the response data to the expected type with a type assertion
      // This works because we know the structure follows our generic T
      const typedData = responseData as unknown as T[];
      console.log(`Fetched ${typedData.length} items from ${tableName}`);
      setData(typedData);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
      toast({
        title: "Erreur de connexion",
        description: `Impossible de récupérer les données depuis ${tableName}: ${err.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Added where and orderBy to dependencies so refetch happens if filters/sorting change
  }, [tableName, JSON.stringify(where), JSON.stringify(orderBy)]); // Use JSON.stringify for object/array dependencies

  const addDocument = async (document: Omit<T, 'id'>): Promise<boolean> => {
    try {
      console.log(`Adding document to ${tableName}:`, document);

      // Add type safety with a cast at the point of interaction
      const { data: insertedData, error: insertError } = await supabase
        .from(tableName as any)
        .insert([document as any])
        .select();

      if (insertError) {
        console.error(`Error adding document to ${tableName}:`, insertError);
        throw insertError;
      }

      if (insertedData && insertedData[0]) {
        // Cast the response data with a type assertion
        const newItem = insertedData[0] as unknown as T;
        // Optimistically add the new item to the state
        setData(prevData => [...prevData, newItem]);

        toast({
          title: "Succès",
          description: "Document ajouté avec succès.",
        });
        return true;
      }

      return false;
    } catch (err: any) {
      console.error(`Error adding document to ${tableName}:`, err);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter le document: ${err.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateDocument = async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      console.log(`Updating document in ${tableName}:`, { id, updates });

      const { data: updatedData, error: updateError } = await supabase
        .from(tableName as any)
        .update(updates as any)
        .eq('id', id)
        .select();

      if (updateError) {
        console.error(`Error updating document in ${tableName}:`, updateError);
        throw updateError;
      }

      if (updatedData && updatedData[0]) {
        // Update local state with the updated item
        setData(prevData =>
          prevData.map(item => item.id === id ? { ...item, ...updatedData[0] } as T : item) // Use updatedData[0] for the latest state
        );

        toast({
          title: "Succès",
          description: "Document mis à jour avec succès.",
        });
        return true;
      }

      return false;
    } catch (err: any) {
      console.error(`Error updating document in ${tableName}:`, err);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le document: ${err.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      console.log(`Deleting document from ${tableName}:`, id);

      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`Error deleting document from ${tableName}:`, deleteError);
        throw deleteError;
      }

      // Optimistically remove the item from the state
      setData(prevData => prevData.filter(item => item.id !== id));

      toast({
        title: "Succès",
        description: "Document supprimé avec succès.",
      });
      return true;
    } catch (err: any) {
      console.error(`Error deleting document from ${tableName}:`, err);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le document: ${err.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch
  };
}
