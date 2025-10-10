import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase';

const BRANDING_BUCKET = 'branding';

const BrandingSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [appName, setAppName] = useState(settings.branding.appName || '');
  const [logoUrl, setLogoUrl] = useState(settings.branding.logoUrl || '');
  const [loginBackgroundUrl, setLoginBackgroundUrl] = useState(settings.branding.loginBackgroundUrl || '');
  const [loginPanelVariant, setLoginPanelVariant] = useState(settings.branding.loginPanelVariant || 'default');
  const [loginTitle, setLoginTitle] = useState(settings.branding.loginTitle || 'Connexion');
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // If an existing logo is set, try to delete it before replacing
      if (settings.branding.logoUrl) {
        try {
          await deleteFileFromSupabase(BRANDING_BUCKET, settings.branding.logoUrl);
        } catch (delErr) {
          console.warn('Logo deletion skipped or failed:', delErr);
        }
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `logo_${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToSupabase(BRANDING_BUCKET, file, path);
      setLogoUrl(publicUrl);
      updateSettings({ branding: { ...settings.branding, logoUrl: publicUrl } as any });
      toast({ title: 'Logo mis à jour', description: 'Le logo a été téléversé avec succès.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erreur', description: err?.message || "Échec du téléversement du logo.", variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings.branding.logoUrl) {
      toast({ title: 'Aucun logo', description: "Aucun logo à supprimer." });
      return;
    }
    setIsUploading(true);
    try {
      await deleteFileFromSupabase(BRANDING_BUCKET, settings.branding.logoUrl);
      setLogoUrl('');
      updateSettings({ branding: { ...settings.branding, logoUrl: '' } as any });
      toast({ title: 'Logo supprimé', description: 'Le logo a été supprimé du stockage.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erreur', description: err?.message || "Échec de la suppression du logo.", variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateSettings({ branding: { ...settings.branding, appName, logoUrl, loginBackgroundUrl, loginPanelVariant, loginTitle } as any });
    toast({ title: 'Enregistré', description: 'Les informations de branding ont été sauvegardées.' });
  };

  const handlePickBg = () => {
    bgFileInputRef.current?.click();
  };

  const handleBgChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      if (settings.branding.loginBackgroundUrl) {
        try {
          await deleteFileFromSupabase(BRANDING_BUCKET, settings.branding.loginBackgroundUrl);
        } catch (delErr) {
          console.warn('BG deletion skipped or failed:', delErr);
        }
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `login_bg_${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToSupabase(BRANDING_BUCKET, file, path);
      setLoginBackgroundUrl(publicUrl);
      updateSettings({ branding: { ...settings.branding, loginBackgroundUrl: publicUrl } as any });
      toast({ title: 'Arrière-plan mis à jour', description: "L'image de fond a été téléversée avec succès." });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erreur', description: err?.message || "Échec du téléversement de l'arrière-plan.", variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    }
  };

  const handleDeleteBg = async () => {
    if (!settings.branding.loginBackgroundUrl) {
      toast({ title: 'Aucun fond', description: "Aucune image de fond à supprimer." });
      return;
    }
    setIsUploading(true);
    try {
      await deleteFileFromSupabase(BRANDING_BUCKET, settings.branding.loginBackgroundUrl);
      setLoginBackgroundUrl('');
      updateSettings({ branding: { ...settings.branding, loginBackgroundUrl: '' } as any });
      toast({ title: 'Fond supprimé', description: "L'image de fond a été supprimée du stockage." });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erreur', description: err?.message || "Échec de la suppression de l'arrière-plan.", variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding de l'application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="appName">Nom de l'application</Label>
            <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="GMAO MEYER" />
          </div>
          <div>
            <Label htmlFor="loginTitle">Titre de la page de connexion</Label>
            <Input id="loginTitle" value={loginTitle} onChange={(e) => setLoginTitle(e.target.value)} placeholder="Connexion" />
          </div>
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-10 w-10 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handlePickFile} disabled={isUploading}>
                  {isUploading ? 'Téléversement...' : (logoUrl ? 'Remplacer' : 'Choisir un fichier')}
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteLogo} disabled={isUploading || !logoUrl}>
                  Supprimer le logo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Arrière-plan de la page de connexion</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-16 w-28 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                {loginBackgroundUrl ? (
                  <img src={loginBackgroundUrl} alt="Fond" className="h-16 w-28 object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handlePickBg} disabled={isUploading}>
                  {isUploading ? 'Téléversement...' : (loginBackgroundUrl ? 'Remplacer' : 'Choisir un fichier')}
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteBg} disabled={isUploading || !loginBackgroundUrl}>
                  Supprimer le fond
                </Button>
                <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="panelVariant">Style de la fenêtre de connexion</Label>
            <select
              id="panelVariant"
              className="mt-2 w-full border rounded-md h-9 px-2"
              value={loginPanelVariant}
              onChange={(e) => setLoginPanelVariant(e.target.value as any)}
            >
              <option value="default">Par défaut</option>
              <option value="glass">Verre (blur, translucide)</option>
              <option value="bordered">Bordure accentuée</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUploading}>Sauvegarder</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandingSettings;


