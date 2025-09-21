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
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Search, Package, CheckCircle2, X } from "lucide-react";
import { Part } from '@/types/part';
import { Card, CardContent } from "@/components/ui/card";

interface SelectedPart {
  partId: string;
  quantity: number;
  name: string;
}

interface PartsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedParts: SelectedPart[]) => void;
  availableParts: Part[];
  initialSelectedParts: SelectedPart[];
  isLoading?: boolean;
}

const PartsSelectionModal: React.FC<PartsSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableParts,
  initialSelectedParts,
  isLoading = false
}) => {
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(initialSelectedParts);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset selected parts when modal opens with initial data
  useEffect(() => {
    if (isOpen) {
      setSelectedParts(initialSelectedParts);
    }
  }, [isOpen, initialSelectedParts]);

  // Filter parts based on search term
  const filteredParts = availableParts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPartQuantity = (partId: string): number => {
    const selectedPart = selectedParts.find(p => p.partId === partId);
    return selectedPart ? selectedPart.quantity : 0;
  };

  const updatePartQuantity = (partId: string, partName: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove part if quantity is 0 or less
      setSelectedParts(prev => prev.filter(p => p.partId !== partId));
    } else {
      // Update or add part
      setSelectedParts(prev => {
        const existingIndex = prev.findIndex(p => p.partId === partId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity = quantity;
          return updated;
        } else {
          return [...prev, { partId, quantity, name: partName }];
        }
      });
    }
  };

  const incrementQuantity = (partId: string, partName: string) => {
    const currentQuantity = getPartQuantity(partId);
    updatePartQuantity(partId, partName, currentQuantity + 1);
  };

  const decrementQuantity = (partId: string, partName: string) => {
    const currentQuantity = getPartQuantity(partId);
    if (currentQuantity > 0) {
      updatePartQuantity(partId, partName, currentQuantity - 1);
    }
  };

  const handleQuantityInputChange = (partId: string, partName: string, value: string) => {
    const quantity = parseInt(value) || 0;
    updatePartQuantity(partId, partName, quantity);
  };

  const handleConfirm = () => {
    onConfirm(selectedParts);
    onClose();
  };

  const handleCancel = () => {
    setSelectedParts(initialSelectedParts); // Reset to initial state
    onClose();
  };

  const totalSelectedParts = selectedParts.reduce((sum, part) => sum + part.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sélectionner les pièces
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher une pièce par nom ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected parts summary */}
          {selectedParts.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">
                  {totalSelectedParts} pièce{totalSelectedParts > 1 ? 's' : ''} sélectionnée{totalSelectedParts > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedParts.map((part) => (
                  <Badge key={part.partId} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {part.name} (x{part.quantity})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Parts list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Chargement des pièces...</div>
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                  {searchTerm ? 'Aucune pièce trouvée pour cette recherche' : 'Aucune pièce disponible'}
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredParts.map((part) => {
                  const quantity = getPartQuantity(part.id);
                  const isSelected = quantity > 0;
                  
                  return (
                    <Card key={part.id} className={`transition-all ${isSelected ? 'ring-2 ring-green-500 bg-green-50/50' : 'hover:bg-muted/50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{part.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {part.reference}
                              </Badge>
                            </div>
                            {part.description && (
                              <p className="text-sm text-muted-foreground mt-1">{part.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Stock: {part.quantity} {part.unit}</span>
                              <span>Emplacement: {part.location}</span>
                              {part.price && <span>Prix: {part.price}€</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => decrementQuantity(part.id, part.name)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={quantity || ''}
                              onChange={(e) => handleQuantityInputChange(part.id, part.name, e.target.value)}
                              className="w-16 text-center h-8"
                              min="0"
                              placeholder="0"
                            />
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => incrementQuantity(part.id, part.name)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmer ({totalSelectedParts} pièce{totalSelectedParts > 1 ? 's' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartsSelectionModal;
