// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, TestTube } from 'lucide-react';
import { HTML2PDFService } from '@/services/HTML2PDFService';
import { useToast } from '@/hooks/use-toast';
import { Equipment } from '@/types/equipment';

const PDFTestComponent: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Données de test
  const testEquipments: Equipment[] = [
    {
      id: '1',
      name: 'Ordinateur Portable Dell',
      model: 'Latitude 5520',
      manufacturer: 'Dell',
      status: 'operational',
      health_percentage: 85,
      serial_number: 'DL123456789',
      inventory_number: 'INV-001',
      supplier: 'Dell Technologies',
      uf: 'UF-IT-001',
      purchase_date: '2023-01-15',
      warranty_expiry: '2026-01-15',
      building_id: 'building-1',
      service_id: 'service-1',
      location_id: 'location-1',
      image_url: null,
      associated_group_ids: ['group-1'],
      equipment_group_ids: ['group-1'],
      description: 'Ordinateur portable pour le service informatique',
      date_mise_en_service: '2023-01-20',
      relationships: [],
      loan_status: false
    },
    {
      id: '2',
      name: 'Imprimante HP LaserJet',
      model: 'Pro M404n',
      manufacturer: 'HP',
      status: 'maintenance',
      health_percentage: 60,
      serial_number: 'HP987654321',
      inventory_number: 'INV-002',
      supplier: 'HP Inc.',
      uf: 'UF-IT-002',
      purchase_date: '2022-06-10',
      warranty_expiry: '2025-06-10',
      building_id: 'building-1',
      service_id: 'service-2',
      location_id: 'location-2',
      image_url: null,
      associated_group_ids: ['group-2'],
      equipment_group_ids: ['group-2'],
      description: 'Imprimante laser monochrome',
      date_mise_en_service: '2022-06-15',
      relationships: [],
      loan_status: false
    }
  ];

  const testGroups = [
    {
      id: 'group-1',
      name: 'Équipements Informatiques',
      description: 'Ordinateurs et périphériques',
      shared_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'group-2',
      name: 'Imprimantes',
      description: 'Imprimantes et scanners',
      shared_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const testBuildings = [
    {
      id: 'building-1',
      name: 'Bâtiment Principal',
      address: '123 Rue de la Paix',
      description: 'Bâtiment principal de l\'entreprise'
    }
  ];

  const testServices = [
    {
      id: 'service-1',
      name: 'Service Informatique',
      description: 'Gestion des équipements informatiques',
      building_id: 'building-1',
    },
    {
      id: 'service-2',
      name: 'Service Administratif',
      description: 'Gestion administrative',
      building_id: 'building-1',
    }
  ];

  const testLocations = [
    {
      id: 'location-1',
      name: 'Bureau 101',
      description: 'Bureau du service informatique',
      service_id: 'service-1',
      building_id: 'building-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'location-2',
      name: 'Bureau 102',
      description: 'Bureau du service administratif',
      service_id: 'service-2',
      building_id: 'building-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ];

  const [testOrientation, setTestOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [testPageSize, setTestPageSize] = useState<'a4' | 'a3' | 'letter' | 'legal'>('a4');

  const testPrintOptions = {
    title: 'Test PDF Équipements',
    orientation: testOrientation,
    pageSize: testPageSize,
    includeImages: true,
    includeDetails: true,
    includeHealth: true,
    includeGroups: true,
    includeLocation: true,
    includeSupplier: true,
    includeInventoryNumber: true,
    includeSerialNumber: true,
    includeDescription: true,
    includeUF: true,
    includeDates: true,
    includeWarranty: true,
    includeRelationships: false,
    format: 'grid' as const,
    customPageWidth: 210,
    customPageHeight: 297,
    fontSize: 'medium' as const,
    gridSize: 'medium' as const,
    itemsPerPage: 9,
    showHeaders: true,
    showFooters: true
  };

  const handleTestPDFGeneration = async () => {
    setIsGenerating(true);
    try {
      // Vérifier la disponibilité du service
      if (!HTML2PDFService.isAvailable()) {
        throw new Error('HTML2PDF Service non disponible');
      }

      // Générer le PDF de test
      const filename = `test_equipements_${testPageSize}_${testOrientation}.pdf`;
      const testElement = document.createElement('div');
      testElement.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Test PDF Équipements</h1>
          <p>Orientation: ${testOrientation}</p>
          <p>Taille: ${testPageSize}</p>
          <p>Nombre d'équipements: ${testEquipments.length}</p>
        </div>
      `;
      document.body.appendChild(testElement);
      
      await HTML2PDFService.downloadPDF(testElement, {
        filename,
        orientation: testOrientation,
        format: testPageSize,
        title: 'Test PDF Équipements'
      });
      
      document.body.removeChild(testElement);

      toast({
        title: "Test PDF réussi",
        description: "Le PDF de test a été généré et téléchargé avec succès"
      });
    } catch (error: any) {
      console.error('Erreur test PDF:', error);
      toast({
        title: "Erreur test PDF",
        description: error.message || "Impossible de générer le PDF de test",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const serviceInfo = HTML2PDFService.getServiceInfo();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test de génération PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations sur le service */}
        <div className="space-y-2">
          <h3 className="font-semibold">Informations du service</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Nom:</span> {serviceInfo.name}
            </div>
            <div>
              <span className="font-medium">Version:</span> {serviceInfo.version}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Statut:</span>{' '}
              <Badge variant={serviceInfo.available ? "default" : "destructive"}>
                {serviceInfo.available ? "Disponible" : "Indisponible"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="space-y-2">
          <h3 className="font-semibold">Fonctionnalités disponibles</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {serviceInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Options de test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Options de test</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Orientation:</label>
              <select 
                value={testOrientation} 
                onChange={(e) => setTestOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full p-1 border rounded text-sm"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Taille:</label>
              <select 
                value={testPageSize} 
                onChange={(e) => setTestPageSize(e.target.value as 'a4' | 'a3' | 'letter' | 'legal')}
                className="w-full p-1 border rounded text-sm"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Données de test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Données de test</h3>
          <div className="text-sm text-gray-600">
            <p>• {testEquipments.length} équipements de test</p>
            <p>• {testGroups.length} groupes d'équipements</p>
            <p>• {testBuildings.length} bâtiment(s)</p>
            <p>• {testServices.length} service(s)</p>
            <p>• {testLocations.length} localisation(s)</p>
          </div>
        </div>

        {/* Bouton de test */}
        <Button 
          onClick={handleTestPDFGeneration}
          disabled={isGenerating || !serviceInfo.available}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Génération en cours...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" />
              Tester la génération PDF
            </>
          )}
        </Button>

        {!serviceInfo.available && (
          <p className="text-sm text-red-600 text-center">
            Le service React PDF n'est pas disponible. Vérifiez l'installation de @react-pdf/renderer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFTestComponent;
