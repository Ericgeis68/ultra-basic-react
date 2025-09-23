import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserCircle, Phone, Award, Briefcase, AlertTriangle, CheckCircle, Filter, Search, Trash2, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StaffFormModal, { StaffMember, Certification } from '@/components/staff/StaffFormModal';
import CertificationTracker from '@/components/staff/CertificationTracker';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCollection } from '@/hooks/use-supabase-collection';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Helper component to render certifications
const CertificationList: React.FC<{ certifications: Certification[] | null }> = ({ certifications }) => {
  const certs = (certifications as Certification[] | null) || [];

  if (certs.length === 0) {
    return <span className="text-sm text-muted-foreground">Aucune certification enregistrée.</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {certs.map((cert, index) => {
        let displayStatus: 'valid' | 'expiring-soon' | 'expired' = 'valid';
        if (cert.expiryDate) {
           const expiryDateObj = new Date(cert.expiryDate);
           const now = new Date();
           const ninetyDaysFromNow = new Date();
           ninetyDaysFromNow.setDate(now.getDate() + 90);

           if (expiryDateObj < now) {
             displayStatus = 'expired';
           } else if (expiryDateObj < ninetyDaysFromNow) {
             displayStatus = 'expiring-soon';
           }
        }

        return (
          <span
            key={index}
            className={`px-2 py-1 rounded-md text-xs flex items-center ${displayStatus === 'valid'
              ? 'bg-green-100 text-green-800'
              : displayStatus === 'expiring-soon' // Corrected class name
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
              }`}
          >
            {cert.name}
            {displayStatus === 'expired' && (
              <AlertTriangle className="h-3 w-3 ml-1" />
            )}
          </span>
        );
      })}
    </div>
  );
};


const Staff = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'certifications'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: staff,
    loading: staffLoading,
    error: staffError,
    addDocument,
    updateDocument,
    deleteDocument
  } = useCollection<any>({
    tableName: 'staff_members',
    realtime: true,
  });

  const handleOpenAddForm = () => {
    setEditingStaff(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (member: StaffMember) => {
    setEditingStaff(member);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStaff(undefined);
  };

  const handleSaveStaff = async (staffData: StaffMember, avatarFile: File | null) => {
    console.log("handleSaveStaff called. staffData received:", staffData);
    console.log("avatarFile received:", avatarFile);
    console.log("editingStaff state:", editingStaff); // Log editingStaff state

    try {
      let avatarUrl = staffData.avatar_url; // Start with the URL from the modal data

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        console.log("Attempting to upload avatar:", filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('staff-avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase avatar upload error:", uploadError);
          throw uploadError;
        }
        console.log("Avatar uploaded successfully:", uploadData);

        const { data: publicUrlData } = supabase.storage
          .from('staff-avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
        console.log("Public avatar URL:", avatarUrl);

      } else if (staffData.avatar_url === null && editingStaff && editingStaff.avatar_url) {
         console.log("Avatar removed, attempting to delete old avatar from storage:", editingStaff.avatar_url);
         // Extract the path relative to the bucket root
         const urlParts = editingStaff.avatar_url.split('/public/staff-avatars/');
         const filePathToDelete = urlParts.length > 1 ? urlParts[1] : null;

         if (filePathToDelete) {
             const { error: deleteError } = await supabase.storage
              .from('staff-avatars')
              .remove([filePathToDelete]);

            if (deleteError) {
              console.error("Error deleting old avatar:", deleteError);
            } else {
              console.log("Old avatar deleted successfully:", filePathToDelete);
            }
         } else {
            console.warn("Could not extract file path from avatar URL for deletion:", editingStaff.avatar_url);
         }
         avatarUrl = null; // Explicitly set URL to null after deletion attempt
      }

      // Construct the data to save
      const baseDataToSave = {
        name: staffData.name,
        role: staffData.role,
        specialization: staffData.specialization,
        contact_info: staffData.contact_info,
        certifications: staffData.certifications, // This already includes the correct certifications array from the modal
        avatar_url: avatarUrl, // Use the potentially updated avatar URL
      };

      console.log("Base data prepared for saving:", baseDataToSave);

      if (editingStaff?.id) {
        // If editing, include the ID and use updateDocument
        const dataToUpdate = {
          ...baseDataToSave,
          id: editingStaff.id, // Include the existing ID for update
        };
        console.log("Attempting to update staff member with ID:", dataToUpdate.id, "Data:", dataToUpdate);
        await updateDocument(dataToUpdate.id, dataToUpdate);
        console.log("Staff member updated successfully in table.");
        toast({ title: "Technicien mis à jour", description: "Les informations du technicien ont été sauvegardées." });
      } else {
        // If adding new, omit the ID and use addDocument
        // Supabase will generate the ID based on the table schema default
        const dataToAdd = { ...baseDataToSave }; // Create a new object without the ID
        console.log("Attempting to add new staff member to table. Data:", dataToAdd);
        await addDocument(dataToAdd);
        console.log("New staff member added successfully to table.");
        toast({ title: "Technicien ajouté", description: "Le nouveau technicien a été enregistré." });
      }

      handleCloseForm();

    } catch (error: any) {
      console.error("Error during staff save process:", error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la sauvegarde: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce technicien ?")) {
      return;
    }
    try {
      const memberToDelete = staff?.find(m => m.id === staffId);
      if (memberToDelete?.avatar_url) {
         // Extract the path relative to the bucket root
         const urlParts = memberToDelete.avatar_url.split('/public/staff-avatars/');
         const filePathToDelete = urlParts.length > 1 ? urlParts[1] : null;

         if (filePathToDelete) {
             const { error: deleteError } = await supabase.storage
              .from('staff-avatars')
              .remove([filePathToDelete]);

            if (deleteError) {
              console.error("Error deleting avatar:", deleteError);
            } else {
              console.log("Old avatar deleted successfully:", filePathToDelete);
            }
         } else {
            console.warn("Could not extract file path from avatar URL for deletion:", memberToDelete.avatar_url);
         }
      }

      await deleteDocument(staffId);
      toast({ title: "Technicien supprimé", description: "Le technicien a été retiré." });
    } catch (error: any) {
       console.error("Error deleting staff member:", error);
       toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la suppression: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getCertificationStats = useMemo(() => {
    let valid = 0;
    let expiringSoon = 0;
    let expired = 0;

    if (staff) {
      staff.forEach(member => {
        const memberCertifications = (member.certifications as Certification[] | null) || [];
        memberCertifications.forEach(cert => {
          if (cert.expiryDate) {
             const expiryDateObj = new Date(cert.expiryDate);
             const now = new Date();
             const ninetyDaysFromNow = new Date();
             ninetyDaysFromNow.setDate(now.getDate() + 90);

             if (expiryDateObj < now) {
               expired++;
             } else if (expiryDateObj < ninetyDaysFromNow) {
               expiringSoon++;
             } else {
               valid++;
             }
          } else {
             valid++; // Assume valid if no expiry date
          }
        });
      });
    }

    return { valid, expiringSoon, expired };
  }, [staff]);

  const stats = getCertificationStats;

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(member => {
      const matchesSearch =
        (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.contact_info?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        ((member.certifications as Certification[] | null) || []).some(cert =>
           cert.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesSearch;
    });
  }, [staff, searchTerm]);

  const handleTabValueChange = (value: string) => {
    setViewMode(value as 'grid' | 'certifications');
  };

  const loading = staffLoading;
  const error = staffError;

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Personnel technique</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un technicien</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un technicien..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue="grid"
        value={viewMode}
        onValueChange={handleTabValueChange}
        className="mb-6"
      >
        <TabsList className={isMobile ? 'grid w-full grid-cols-2' : undefined}>
          <TabsTrigger value="grid">Vue Personnel</TabsTrigger>
          <TabsTrigger value="certifications">Vue Certifications</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'certifications' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Certifications valides</span>
                <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {stats.valid}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Certifications à jour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Expirent bientôt</span>
                <span className="ml-auto bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  {stats.expiringSoon}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Certifications expirant dans les 90 jours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Expirées</span>
                <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {stats.expired}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Certifications nécessitant un renouvellement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div>Chargement des données du personnel...</div>
      ) : error ? (
         <div className="p-4 border border-destructive text-destructive rounded-md">
          Erreur lors du chargement des données du personnel: {error.message || 'Erreur inconnue'}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {searchTerm ? "Aucun technicien ne correspond à votre recherche" : "Aucun technicien trouvé. Ajoutez-en un pour commencer !"}
        </div>
      ) : viewMode === 'certifications' ? (
        <CertificationTracker
          staff={filteredStaff}
          // onUpdateStatus={handleUpdateCertification} // Implement update logic if needed
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                   <div className="flex gap-1">
                     <Button variant="ghost" size="icon" onClick={() => handleOpenEditForm(member)}>
                       <Edit className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(member.id!)}>
                       <Trash2 className="h-4 w-4 text-red-500" />
                     </Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    {member.avatar_url ? (
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10">
                        {member.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{member.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                      <span>{member.specialization}</span>
                    </div>
                     {member.contact_info && (
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Phone className="h-4 w-4" />
                         <span>{member.contact_info}</span>
                       </div>
                     )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </h4>
                  {/* Use the helper component here */}
                  <CertificationList certifications={member.certifications} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StaffFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSaveStaff}
        existingStaff={editingStaff}
      />
    </div>
  );
};

export default Staff;
