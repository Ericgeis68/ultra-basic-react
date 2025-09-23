import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Equipment, EquipmentRelationship, RelationshipType } from '@/types/equipment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { XCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RelatedEquipmentPanelProps {
  relationships: EquipmentRelationship[];
  availableEquipment: Equipment[];
  onChange: (relationships: EquipmentRelationship[]) => void;
}

const relationshipLabels: Record<RelationshipType, string> = {
  'parent': 'Parent',
  'child': 'Enfant',
  'component': 'Composant',
  'assembly': 'Assemblage', 
  'other': 'Autre',
  'related': 'Lié',
  'same-model': 'Même modèle',
  'same-manufacturer': 'Même fabricant',
  'shared-parts': 'Pièces communes',
  'same-location': 'Même emplacement',
  'parts-reference': 'Référence pièces',
  'docs-reference': 'Référence documents',
  'reference-to': 'Référencé par'
};

const relationshipColors: Record<RelationshipType, string> = {
  'parent': 'bg-gray-100 text-gray-800 border-gray-300',
  'child': 'bg-gray-100 text-gray-800 border-gray-300',
  'component': 'bg-orange-100 text-orange-800 border-orange-300',
  'assembly': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'other': 'bg-slate-100 text-slate-800 border-slate-300',
  'related': 'bg-gray-100 text-gray-800 border-gray-300',
  'same-model': 'bg-blue-100 text-blue-800 border-blue-300',
  'same-manufacturer': 'bg-purple-100 text-purple-800 border-purple-300',
  'shared-parts': 'bg-amber-100 text-amber-800 border-amber-300',
  'same-location': 'bg-green-100 text-green-800 border-green-300',
  'parts-reference': 'bg-red-100 text-red-800 border-red-300',
  'docs-reference': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'reference-to': 'bg-teal-100 text-teal-800 border-teal-300'
};

const relationshipDescriptions: Record<RelationshipType, string> = {
  'parent': 'Équipement parent',
  'child': 'Équipement enfant',
  'component': 'Composant d\'un équipement',
  'assembly': 'Assemblage d\'équipements',
  'other': 'Autre type de relation',
  'related': 'Équipement relié',
  'same-model': 'Équipements du même modèle',
  'same-manufacturer': 'Équipements du même fabricant',
  'shared-parts': 'Équipements partageant des pièces',
  'same-location': 'Équipements au même emplacement',
  'parts-reference': 'Référence commune pour les pièces détachées',
  'docs-reference': 'Référence commune pour les documents techniques',
  'reference-to': 'Cet équipement est référencé par'
};

const RelatedEquipmentPanel: React.FC<RelatedEquipmentPanelProps> = ({
  relationships,
  availableEquipment,
  onChange
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('related');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReferenceType, setIsReferenceType] = useState(false);

  const addRelationship = () => {
    if (!selectedEquipmentId) return;
    
      // Check if relationship already exists
      const existingRelation = relationships.find(
        r => r.related_equipment_id === selectedEquipmentId && r.type === selectedRelationType
      );
    
    if (!existingRelation) {
      const newRelationships: EquipmentRelationship[] = [
        ...relationships,
        {
          equipment_id: '',  // Sera défini par le parent
          related_equipment_id: selectedEquipmentId,
          type: selectedRelationType
        }
      ];
      onChange(newRelationships);
      
      // Si c'est une relation de référence, ajouter automatiquement la relation inverse
      if (selectedRelationType === 'parts-reference' || selectedRelationType === 'docs-reference') {
        // On pourrait ajouter une logique ici pour mettre à jour l'équipement référencé
        // Cette partie serait gérée par la fonction parente qui reçoit onChange
      }
    }
    
    // Reset selection
    setSelectedEquipmentId('');
  };

  const removeRelationship = (relatedEquipmentId: string, type: RelationshipType) => {
    const newRelationships = relationships.filter(
      r => !(r.related_equipment_id === relatedEquipmentId && r.type === type)
    );
    onChange(newRelationships);
  };
  
  const filteredEquipment = availableEquipment.filter(
    eq => eq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (eq.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (eq.manufacturer?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Find equipment by id
  const getEquipmentById = (id: string) => {
    return availableEquipment.find(eq => eq.id === id);
  };

  const handleRelationTypeChange = (value: RelationshipType) => {
    setSelectedRelationType(value);
    setIsReferenceType(value === 'parts-reference' || value === 'docs-reference');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Équipements similaires ou reliés</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Établissez des relations avec d'autres équipements pour faciliter la gestion de la maintenance et le partage d'informations.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-md p-4 space-y-4">
          <h4 className="font-medium">Ajouter une relation</h4>
          
          <div className="space-y-2">
            <Label htmlFor="relation-type">Type de relation</Label>
            <Select
              value={selectedRelationType}
              onValueChange={(value) => handleRelationTypeChange(value as RelationshipType)}
            >
              <SelectTrigger id="relation-type">
                <SelectValue placeholder="Type de relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Enfant</SelectItem>
                <SelectItem value="related">Lié</SelectItem>
                <SelectItem value="same-model">Même modèle</SelectItem>
                <SelectItem value="same-manufacturer">Même fabricant</SelectItem>
                <SelectItem value="shared-parts">Pièces communes</SelectItem>
                <SelectItem value="same-location">Même emplacement</SelectItem>
                <SelectItem value="parts-reference">Référence pièces</SelectItem>
                <SelectItem value="docs-reference">Référence documents</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {relationshipDescriptions[selectedRelationType]}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equipment-search">Rechercher un équipement</Label>
            <Input
              id="equipment-search"
              placeholder="Rechercher par nom, modèle ou fabricant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="equipment-select">Équipement {isReferenceType ? 'de référence' : ''}</Label>
            <Select
              value={selectedEquipmentId}
              onValueChange={setSelectedEquipmentId}
            >
              <SelectTrigger id="equipment-select">
                <SelectValue placeholder={isReferenceType ? "Sélectionner un équipement de référence" : "Sélectionner un équipement"} />
              </SelectTrigger>
              <SelectContent>
                {filteredEquipment.length === 0 ? (
                  <SelectItem value="" disabled>Aucun équipement trouvé</SelectItem>
                ) : (
                  filteredEquipment.map(equipment => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name} ({equipment.model})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={addRelationship} 
            disabled={!selectedEquipmentId}
            className="w-full mt-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isReferenceType ? "Ajouter la référence" : "Ajouter la relation"}
          </Button>
        </div>
      </div>

      {relationships.length > 0 ? (
        <div className="border rounded-md p-4">
          <h4 className="font-medium mb-4">Relations existantes</h4>
          <div className="space-y-3">
          {relationships.map((relationship, index) => {
              const relatedEquipment = getEquipmentById(relationship.related_equipment_id);
              if (!relatedEquipment) return null;
              
              return (
                <div 
                  key={`${relationship.equipment_id}-${relationship.type}-${index}`}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{relatedEquipment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {relatedEquipment.model} • {relatedEquipment.manufacturer}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={relationshipColors[relationship.type]}>
                      {relationshipLabels[relationship.type]}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRelationship(relationship.related_equipment_id, relationship.type)}
                      className="h-6 w-6 rounded-full"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center p-6 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Aucune relation n'a encore été établie.</p>
        </div>
      )}
    </div>
  );
};

export default RelatedEquipmentPanel;
