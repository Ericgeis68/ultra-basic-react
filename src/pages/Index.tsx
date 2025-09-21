import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Application React
          </h1>
          <p className="text-lg text-muted-foreground">
            Une application simple et minimaliste
          </p>
        </div>
        
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Bienvenue</h2>
          <p className="text-muted-foreground mb-6">
            Votre application React de base est prête à être utilisée.
          </p>
          <Button>
            Commencer
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Index;
