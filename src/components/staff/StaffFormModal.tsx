// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AvatarUpload from './AvatarUpload';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types'; // Import Supabase types

// Define Certification type - matches the structure stored in the JSONB column
export interface Certification {
  name: string;
  obtainedDate: string; // ISO date string
  expiryDate: string | null; // ISO date string or null
  status: 'valid' | 'expiring-soon' | 'expired';
  [key: string]: any; // To allow for JSONB compatibility
}

// Define StaffMember type based on Supabase table schema
export type StaffMember = TablesInsert<'staff_members'> & {
  id?: string; // ID is optional for inserts, but present for updates/fetched data
  certifications?: Certification[] | null; // Certifications stored as JSONB
};


interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staff: StaffMember, avatarFile: File | null) => Promise<void>; // Modified to accept File
  existingStaff?: StaffMember;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingStaff
}) => {
  const [name, setName] = useState(existingStaff?.name || '');
  const [role, setRole] = useState(existingStaff?.role || '');
  const [specialization, setSpecialization] = useState(existingStaff?.specialization || '');
  const [contactInfo, setContactInfo] = useState(existingStaff?.contact_info || ''); // Use contact_info
  const [certifications, setCertifications] = useState<Certification[]>(
    (existingStaff?.certifications as Certification[] | null) || [] // Cast JSONB to Certification[]
  );
  const [newCertName, setNewCertName] = useState('');
  const [obtainedDate, setObtainedDate] = useState<Date | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // State to hold the selected file
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>(existingStaff?.avatar_url || undefined); // State for displaying the current/new avatar

  // Effect to update form state when existingStaff prop changes (for editing)
  useEffect(() => {
    if (existingStaff) {
      setName(existingStaff.name || '');
      setRole(existingStaff.role || '');
      setSpecialization(existingStaff.specialization || '');
      setContactInfo(existingStaff.contact_info || '');
      setCertifications((existingStaff.certifications as Certification[] | null) || []);
      setAvatarPreviewUrl(existingStaff.avatar_url || undefined);
      setAvatarFile(null); // Reset file when editing a new staff member
    } else {
      // Reset form for adding new staff
      setName('');
      setRole('');
      setSpecialization('');
      setContactInfo('');
      setCertifications([]);
      setNewCertName('');
      setObtainedDate(undefined);
      setExpiryDate(undefined);
      setAvatarFile(null);
      setAvatarPreviewUrl(undefined);
    }
  }, [existingStaff]);


  const handleAddCertification = () => {
    if (!newCertName || !obtainedDate) return;

    // Determine status based on expiry date
    let status: 'valid' | 'expiring-soon' | 'expired' = 'valid';

    if (expiryDate) {
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      if (expiryDate < now) {
        status = 'expired';
      } else if (expiryDate < ninetyDaysFromNow) {
        status = 'expiring-soon';
      }
    }

    const newCert: Certification = {
      name: newCertName,
      obtainedDate: obtainedDate.toISOString().split('T')[0], // Store as ISO date string
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : null, // Store as ISO date string or null
      status
    };

    setCertifications([...certifications, newCert]);
    setNewCertName('');
    setObtainedDate(undefined);
    setExpiryDate(undefined);
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !role || !specialization) {
      return; // Basic validation
    }

    const staffData: StaffMember = {
      id: existingStaff?.id, // Include ID if editing
      name,
      role,
      specialization,
      contact_info: contactInfo, // Use contact_info
      certifications: certifications.length > 0 ? certifications : null, // Store as JSONB, null if empty
      avatar_url: existingStaff?.avatar_url || null, // Keep existing URL unless a new file is uploaded
    };

    // The onSubmit function in the parent will handle the Supabase interaction,
    // including avatar upload if avatarFile is not null.
    await onSubmit(staffData, avatarFile);
    // onClose is called by the parent after onSubmit completes
  };

  const handleImageChange = (file: File | null, previewUrl: string | undefined) => {
    setAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingStaff ? 'Modifier le technicien' : 'Ajouter un nouveau technicien'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <AvatarUpload
                initialImage={existingStaff?.avatar_url || undefined} // Pass the Supabase URL
                onImageChange={handleImageChange} // Pass handler that accepts File and previewUrl
              />
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du technicien"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Fonction</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Rôle ou fonction"
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialization">Spécialisation</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Domaine de spécialisation"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactInfo">Contact</Label>
                <Input
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Email ou téléphone"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="block mb-2">Certifications</Label>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <span>{cert.name}</span>
                    {cert.expiryDate && (
                      <span className="text-xs text-muted-foreground">
                        (Exp: {new Date(cert.expiryDate).toLocaleDateString('fr-FR')}) {/* Format date */}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveCertification(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Input
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                    placeholder="Nom de la certification"
                    className="w-full"
                  />
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        {obtainedDate ? (
                          format(obtainedDate, "dd MMMM yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Date d'obtention</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={obtainedDate}
                        onSelect={setObtainedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        {expiryDate ? (
                          format(expiryDate, "dd MMMM yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Date d'expiration (opt.)</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCertification}
                disabled={!newCertName || !obtainedDate}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter certification
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {existingStaff ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffFormModal;
