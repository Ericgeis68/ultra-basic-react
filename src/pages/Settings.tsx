import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, Building, Wrench, Package, UserCog, Eye, Tag, Bell } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import UserMenuVisibilitySettings from '@/components/settings/UserMenuVisibilitySettings';
import FacilitiesManagement from '@/components/settings/FacilitiesManagement';
import EquipmentBulkImport from '@/components/settings/EquipmentBulkImport';
import PartsBulkImport from '@/components/settings/PartsBulkImport';
import UserManagement from '@/components/auth/UserManagement';
import EquipmentFieldVisibilitySettings from '@/components/settings/EquipmentFieldVisibilitySettings';
import UFManagement from '@/components/settings/UFManagement';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const Settings = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="text-center">
          <SettingsIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-600">Accès Restreint</h1>
          <p className="text-gray-500">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Paramètres d'Administration
        </h1>
        <p className="text-gray-600 mt-2">Gérez les paramètres de l'application et les données de base.</p>
      </div>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Menus Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Champs Équipements
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Installations
          </TabsTrigger>
          <TabsTrigger value="ufs" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            UF
          </TabsTrigger>
          <TabsTrigger value="equipment-import" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Import Équipements
          </TabsTrigger>
          <TabsTrigger value="parts-import" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Import Pièces
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Menus Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <UserMenuVisibilitySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <EquipmentFieldVisibilitySettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          <FacilitiesManagement />
        </TabsContent>

        <TabsContent value="ufs" className="space-y-6">
          <UFManagement />
        </TabsContent>

        <TabsContent value="equipment-import" className="space-y-6">
          <EquipmentBulkImport />
        </TabsContent>

        <TabsContent value="parts-import" className="space-y-6">
          <PartsBulkImport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
