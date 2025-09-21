import React, { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen w-full bg-background page-transition">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl font-bold text-primary">GMAO</div>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="nav-item">Fonctionnalités</a>
              <a href="#" className="nav-item">Prix</a>
              <a href="#" className="nav-item">Clients</a>
              <a href="#" className="nav-item">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="hidden md:inline-flex"
                onClick={() => navigate('/dashboard')}
              >
                Se connecter
              </Button>
              <Button onClick={() => navigate('/dashboard')}>Essayer</Button>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <Hero />
        <Features />
        
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Prêt à optimiser votre maintenance ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              Commencez dès aujourd'hui à simplifier la gestion de vos équipements et 
              à améliorer la productivité de vos équipes de maintenance.
            </p>
            
            <Button 
              size="lg" 
              className="h-12 px-8 rounded-lg text-base"
              onClick={() => navigate('/dashboard')}
            >
              Démarrer maintenant
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">GMAO</h3>
              <p className="text-sm text-muted-foreground">
                Solution complète pour la gestion de maintenance assistée par ordinateur.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Fonctionnalités</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Tarifs</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Ressources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Tutoriels</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">Entreprise</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">À propos</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Clients</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} GMAO. Tous droits réservés.
            </p>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Conditions d'utilisation</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Confidentialité</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
