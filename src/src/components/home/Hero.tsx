import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
        }
      },
      { threshold: 0.1 }
    );
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);
  
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/10 -z-10" />
      <div 
        ref={heroRef}
        className="container mx-auto px-4 py-20 text-center opacity-0 translate-y-12 transition-all duration-1000"
      >
        <div className="inline-block mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Logiciel de GMAO
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          Optimisez votre maintenance
          <br /> 
          <span className="text-primary">intelligemment</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Une solution complète pour gérer vos équipements, planifier la maintenance préventive
          et optimiser les interventions techniques.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="h-12 px-8 text-base rounded-lg shadow-md"
            onClick={() => navigate('/dashboard')}
          >
            Commencer maintenant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="h-12 px-8 text-base rounded-lg border-2"
          >
            Découvrir les fonctionnalités
          </Button>
        </div>
        
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '99.8%', text: 'Disponibilité' },
            { number: '45%', text: 'Réduction des pannes' },
            { number: '60%', text: 'Maintenance plus rapide' },
            { number: '30%', text: 'Économies réalisées' },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">{stat.number}</span>
              <span className="text-sm text-muted-foreground">{stat.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
