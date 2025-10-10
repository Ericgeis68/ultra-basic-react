import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, Building, Wrench, Package, UserCog, Eye, Tag, Bell, Paintbrush } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import UserMenuVisibilitySettings from '@/components/settings/UserMenuVisibilitySettings';
import FacilitiesManagement from '@/components/settings/FacilitiesManagement';
import EquipmentBulkImport from '@/components/settings/EquipmentBulkImport';
import PartsBulkImport from '@/components/settings/PartsBulkImport';
import UserManagement from '@/components/auth/UserManagement';
import EquipmentFieldVisibilitySettings from '@/components/settings/EquipmentFieldVisibilitySettings';
import BrandingSettings from '@/components/settings/BrandingSettings';
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
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="hidden sm:inline">Paramètres d'Administration</span>
          <span className="sm:hidden">Paramètres</span>
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Gérez les paramètres de l'application et les données de base.</p>
      </div>

      <Tabs defaultValue="menu" className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full gap-1 p-1">
            <TabsTrigger value="menu" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Menus Utilisateurs</span>
              <span className="sm:hidden">Menus</span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Champs Équipements</span>
              <span className="sm:hidden">Champs</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notif</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Installations</span>
              <span className="sm:hidden">Inst</span>
            </TabsTrigger>
            <TabsTrigger value="ufs" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">UF</span>
              <span className="sm:hidden">UF</span>
            </TabsTrigger>
            <TabsTrigger value="equipment-import" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Import Équipements</span>
              <span className="sm:hidden">Imp Eq</span>
            </TabsTrigger>
            <TabsTrigger value="parts-import" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Import Pièces</span>
              <span className="sm:hidden">Imp Pi</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
              <Paintbrush className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
              <span className="sm:hidden">Brand</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="menu" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Gestion des Menus Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <UserMenuVisibilitySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <EquipmentFieldVisibilitySettings />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <NotificationSettings />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <FacilitiesManagement />
          </div>
        </TabsContent>

        <TabsContent value="ufs" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <UFManagement />
          </div>
        </TabsContent>

        <TabsContent value="equipment-import" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <EquipmentBulkImport />
          </div>
        </TabsContent>

        <TabsContent value="parts-import" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <PartsBulkImport />
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 sm:space-y-6">
          <div className="px-3 sm:px-0">
            <BrandingSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
