import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from '@/contexts/SettingsContext';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Gérer le chargement de l'image de fond
  useEffect(() => {
    const checkBackgroundReady = () => {
      if (settings.branding.loginBackgroundUrl) {
        const img = new Image();
        img.onload = () => {
          // Attendre un petit délai pour s'assurer que l'image est appliquée au DOM
          setTimeout(() => {
            setIsBackgroundReady(true);
          }, 100);
        };
        img.onerror = () => {
          // Si l'image ne peut pas être chargée, ne pas afficher la fenêtre
          console.warn('Impossible de charger l\'image de fond, fenêtre de connexion masquée');
          setIsBackgroundReady(false);
        };
        img.src = settings.branding.loginBackgroundUrl;
      } else {
        // Pas d'image de fond, ne pas afficher la fenêtre
        setIsBackgroundReady(false);
      }
    };

    checkBackgroundReady();
  }, [settings.branding.loginBackgroundUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login({ username, password });
      
      if (!success) {
        toast({
          title: "Erreur de connexion",
          description: "Identifiant ou mot de passe incorrect",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = settings.branding.loginBackgroundUrl
    ? {
        backgroundImage: `url(${settings.branding.loginBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined;

  const panelClass = settings.branding.loginPanelVariant === 'glass'
    ? 'backdrop-blur-md bg-white/60 border'
    : settings.branding.loginPanelVariant === 'bordered'
    ? 'border-2 border-primary/40'
    : '';

  // Ne rien afficher tant que l'image de fond n'est pas prête
  if (!isBackgroundReady) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={bgStyle}>
      <Card className={`w-full max-w-md ${panelClass}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{settings.branding.loginTitle || 'Connexion'} {settings.branding.appName ? `- ${settings.branding.appName}` : ''}</CardTitle>
          <CardDescription>
            Connectez-vous avec votre identifiant et mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Identifiant</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre identifiant"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
