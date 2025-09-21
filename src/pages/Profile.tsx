import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from '@/components/staff/AvatarUpload';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    contact_info: user?.contact_info || '',
    specialization: user?.specialization || ''
  });
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const { toast } = useToast();
  
  const handleSaveProfile = async () => {
    try {
      const updates: any = {
        full_name: formData.full_name,
        contact_info: formData.contact_info,
        specialization: formData.specialization,
        avatar_url: avatar
      };

      await updateUser(updates);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de profil ont été enregistrées avec succès.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    }
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    try {
      await updateUser({ dark_mode: enabled });
      toast({
        title: enabled ? "Mode sombre activé" : "Mode sombre désactivé",
        description: "Votre préférence de thème a été sauvegardée.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer le thème",
        variant: "destructive",
      });
    }
  };
  
  const handleAvatarChange = async (file: File, previewUrl: string) => {
    setAvatar(previewUrl);
  };
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto p-4 pt-20 md:pl-72 lg:pl-80">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Modifiez vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input 
                  id="username" 
                  value={user.username}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground">L'identifiant ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input 
                  id="full_name" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                  placeholder="Votre nom complet"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact</Label>
                <Input 
                  id="contact_info" 
                  value={formData.contact_info} 
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })} 
                  placeholder="Email, téléphone..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Spécialisation</Label>
                <Input 
                  id="specialization" 
                  value={formData.specialization} 
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} 
                  placeholder="Votre domaine d'expertise"
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark_mode">Mode sombre</Label>
                    <p className="text-xs text-muted-foreground">
                      Activez le mode sombre pour votre confort personnel
                    </p>
                  </div>
                  <Switch
                    id="dark_mode"
                    checked={user.dark_mode || false}
                    onCheckedChange={handleDarkModeToggle}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveProfile}>Enregistrer</Button>
            </CardFooter>
          </Card>

          <ChangePasswordForm />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>
              Cliquez sur l'avatar pour changer votre photo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <AvatarUpload 
              initialImage={avatar}
              onImageChange={handleAvatarChange} 
            />

            <div className="text-center text-sm space-y-1">
              <p><strong>Rôle:</strong> {user.role === 'admin' ? 'Administrateur' : 'Technicien'}</p>
              <p><strong>Membre depuis:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <p><strong>Thème:</strong> {user.dark_mode ? '🌙 Mode sombre' : '☀️ Mode clair'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
