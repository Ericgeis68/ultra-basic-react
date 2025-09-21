import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

interface UseCollectionOptions {
  tableName: string;
  realtime?: boolean;
}

export const useCollection = <T extends { id: string }>({ tableName, realtime = true }: UseCollectionOptions) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*');

      if (fetchError) {
        throw fetchError;
      }
      setData(fetchedData as any);
    } catch (err: any) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const addDocument = useCallback(async (doc: Omit<T, 'id'>) => {
    try {
      const { data: newDoc, error: insertError } = await supabase
        .from(tableName as any)
        .insert(doc as any)
        .select();

      if (insertError) {
        throw insertError;
      }
      if (newDoc && newDoc.length > 0) {
        setData(prev => (prev ? [...prev, newDoc[0] as any] : [newDoc[0] as any]));
        return newDoc as any;
      }
      return null;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [tableName]);

  const updateDocument = useCallback(async (id: string, doc: Partial<Omit<T, 'id'>>) => {
    try {
      const { data: updatedDoc, error: updateError } = await supabase
        .from(tableName as any)
        .update(doc as any)
        .eq('id', id)
        .select();

      if (updateError) {
        throw updateError;
      }
      if (updatedDoc && updatedDoc.length > 0) {
        setData(prev => prev ? prev.map(item => item.id === id ? updatedDoc[0] as any : item) : null);
        return updatedDoc[0] as any;
      }
      return null;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [tableName]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
      setData(prev => prev ? prev.filter(item => item.id !== id) : null);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [tableName]);

  useEffect(() => {
    refetch();
    
    // Set up realtime subscription if enabled
    if (realtime) {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            console.log(`[${tableName}] Realtime change:`, payload);
            
            if (payload.eventType === 'INSERT' && payload.new) {
              setData(prev => prev ? [...prev, payload.new as any] : [payload.new as any]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              setData(prev => prev ? prev.map(item => 
                item.id === (payload.new as any).id ? payload.new as any : item
              ) : null);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setData(prev => prev ? prev.filter(item => item.id !== (payload.old as any).id) : null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [refetch, tableName, realtime]);

  return { data, loading, error, addDocument, updateDocument, deleteDocument, refetch };
};
