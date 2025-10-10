import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, ArrowLeft, FileText, Map, Layers, ClipboardList, Clock, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Données simulées: remplacées par des appels à la base plus tard
const useMockFacility = (id: string) => {
  return useMemo(() => ({
    id,
    name: `Installation ${id.slice(0, 6).toUpperCase()}`,
    address: "123 Rue de l'Industrie, 75001 Paris",
    type: 'logistics' as 'logistics' | 'administrative' | 'hosting' | 'other',
    size: 5200,
    yearBuilt: 2010,
    lastInspection: new Date().toISOString().split('T')[0],
    image: undefined as string | undefined,
    counts: { equipments: 128, services: 9, locations: 37 },
  }), [id]);
};

const mockDocuments = [
  { id: 'doc1', title: 'Plan architectural - RDC', category: 'Plans', ext: 'pdf', size: '2.1 Mo', updatedAt: '2025-09-01' },
  { id: 'doc2', title: 'Schéma électrique - Tableau TGBT', category: 'Schémas', ext: 'pdf', size: '1.4 Mo', updatedAt: '2025-08-21' },
  { id: 'doc3', title: "Réseau d'eau - Synoptique", category: 'Réseaux', ext: 'png', size: '860 Ko', updatedAt: '2025-07-11' },
  { id: 'doc4', title: 'Rapport inspection sécurité', category: 'Rapports', ext: 'pdf', size: '3.7 Mo', updatedAt: '2025-06-05' },
];

const FacilityDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const facility = useMockFacility(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isCancelled = false;
    const fetchImage = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('image_url')
        .eq('id', id)
        .maybeSingle();
      if (!isCancelled) {
        if (!error) {
          const url = (data as any)?.image_url || undefined;
          setImageUrl(url);
        } else {
          setImageUrl(undefined);
        }
      }
    };
    if (id) fetchImage();
    return () => { isCancelled = true; };
  }, [id]);

  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            {facility.name}
          </h1>
        </div>
        <Link to={`/facilities`}>
          <Button variant="ghost">Voir toutes les installations</Button>
        </Link>
      </div>

      {/* Photo / bannière du bâtiment */}
      <Card className="mb-4 overflow-hidden">
        <div className="h-56 bg-muted flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={facility.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Building className="h-16 w-16 text-primary/30" />
            </div>
          )}
        </div>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview" className="gap-2"><Layers className="h-4 w-4" /> Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" /> Documents</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><Map className="h-4 w-4" /> Plans & Schémas</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><ClipboardList className="h-4 w-4" /> Rapports</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="font-medium">{facility.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Superficie</p>
                  <p className="font-medium">{facility.size.toLocaleString('fr-FR')} m²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Année construction</p>
                  <p className="font-medium">{facility.yearBuilt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernière inspection</p>
                  <p className="font-medium">{new Date(facility.lastInspection).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Équipements</p>
                  <p className="font-medium">{facility.counts.equipments.toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Services / Locaux</p>
                  <p className="font-medium">{facility.counts.services} services · {facility.counts.locations} locaux</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Documents</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockDocuments.map(doc => (
              <Card key={doc.id} className="border">
                <CardHeader>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">{doc.category}</div>
                  <div className="text-sm">{doc.ext.toUpperCase()} · {doc.size} · MAJ {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">Aperçu</Button>
                    <Button size="sm">Télécharger</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plans & Schémas</CardTitle>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Espace dédié aux plans (architectural, électrique, CVC, eau) et schémas. Démonstration sans connexion base.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rapports</CardTitle>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Observations, conformité, plans d’action… (démo)" rows={4} />
                </div>
                <div>
                  <Label>Référence</Label>
                  <Input placeholder="Numéro de rapport (démo)" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                <li>01/09/2025 — Téléversement “Plan architectural - RDC”</li>
                <li>21/08/2025 — Ajout “Schéma électrique - TGBT”</li>
                <li>05/06/2025 — Rapport d’inspection sécurité ajouté</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacilityDetail;


