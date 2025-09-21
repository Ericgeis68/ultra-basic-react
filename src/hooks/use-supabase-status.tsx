import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<{url: string, projectId: string} | null>(null);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatus('connecting');
        // Simple query to test the connection
        const { data, error } = await supabase.from('equipments').select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          throw error;
        }
        
        // Get project info from the URL
        const projectUrl = "https://vrwnnlldufajuojkcqmm.supabase.co";
        const projectId = "vrwnnlldufajuojkcqmm";
        
        setProjectInfo({
          url: projectUrl,
          projectId
        });
        
        setStatus('connected');
        setError(null);
        console.log('Supabase connection successful');
      } catch (err: any) {
        console.error('Supabase connection error:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect to Supabase');
      }
    };
    
    checkConnection();
  }, []);
  
  return { status, error, projectInfo };
}
