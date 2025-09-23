import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSupabaseStatus } from '@/hooks/use-supabase-status';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
}

const DiagnosticSupabasePage = () => {
  const { status, error, projectInfo } = useSupabaseStatus();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    setTestResults([
      { name: 'Initialisation du client', status: 'pending' },
      { name: 'Connexion à la base de données', status: 'pending' },
      { name: 'Tables disponibles', status: 'pending' }
    ]);

    // Test 1: Client initialization
    try {
      if (supabase) {
        updateTestResult(0, 'success', 'Client Supabase initialisé correctement');
      } else {
        updateTestResult(0, 'error', 'Échec de l\'initialisation du client Supabase');
      }
    } catch (err: any) {
      updateTestResult(0, 'error', `Erreur d'initialisation: ${err.message}`);
    }

    // Test 2: Connection test
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (!error) {
        updateTestResult(1, 'success', 'Connexion à la base de données réussie');
      } else {
        updateTestResult(1, 'error', `Échec de connexion: ${error.message || 'Erreur inconnue'}`);
      }
    } catch (err: any) {
      updateTestResult(1, 'error', `Erreur de connexion: ${err.message}`);
    }

    // Test 3: Check available tables
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id')
        .limit(1);
      
      if (error) {
        updateTestResult(2, 'error', `Erreur d'accès à la table equipments: ${error.message}`);
      } else {
        updateTestResult(2, 'success', `Accès à la table equipments réussi`);
      }
    } catch (err: any) {
      updateTestResult(2, 'error', `Erreur d'accès aux tables: ${err.message}`);
    }

    setIsTesting(false);
  };

  const updateTestResult = (index: number, status: 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], status, message };
      return newResults;
    });
  };

  useEffect(() => {
    // Run tests on mount
    runTests();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Diagnostic de Connexion Supabase</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations de connexion</CardTitle>
          <CardDescription>État actuel de la connexion à Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">URL:</span>
              <span>{projectInfo?.url || 'Non disponible'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Projet ID:</span>
              <span>{projectInfo?.projectId || 'Non disponible'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">État:</span>
              <span className={`font-medium ${status === 'connected' ? 'text-green-500' : status === 'connecting' ? 'text-amber-500' : 'text-red-500'}`}>
                {status === 'connected' ? 'Connecté' : status === 'connecting' ? 'En cours de connexion' : 'Erreur de connexion'}
              </span>
            </div>
            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tests de diagnostic</CardTitle>
          <CardDescription>Vérification de la connexion et des fonctionnalités</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="p-3 border rounded-md flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  {test.message && <p className="text-sm text-gray-600">{test.message}</p>}
                </div>
                <div>
                  {test.status === 'pending' && <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />}
                  {test.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {test.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={runTests} disabled={isTesting} className="w-full">
            {isTesting ? 'Exécution des tests...' : 'Relancer les tests'}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Résolution des problèmes</h2>
        <p className="mb-2">Si vous rencontrez des problèmes de connexion avec Supabase:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vérifiez que l'URL et la clé API sont correctes</li>
          <li>Assurez-vous que le projet Supabase est actif et accessible</li>
          <li>Vérifiez les politiques de sécurité (RLS) pour les tables</li>
          <li>Confirmez que les tables nécessaires existent dans la base de données</li>
          <li>Essayez de vous reconnecter avec le bouton Supabase en haut à droite</li>
          <li>Vérifiez la console pour voir les messages d'erreur détaillés</li>
        </ul>
      </div>
    </div>
  );
};

export default DiagnosticSupabasePage;
