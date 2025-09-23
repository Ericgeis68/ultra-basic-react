import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CustomCard from '../ui/CustomCard';
import { 
  Calendar, 
  Database, 
  BarChart, 
  Users, 
  Clock, 
  Smartphone 
} from 'lucide-react';

const FeatureItem = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: number;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }, delay);
        }
      },
      { threshold: 0.1 }
    );
    
    if (itemRef.current) {
      observer.observe(itemRef.current);
    }
    
    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, [delay]);
  
  return (
    <div 
      ref={itemRef} 
      className="opacity-0 translate-y-8 transition-all duration-700"
    >
      <CustomCard variant="glass" hover className="h-full">
        <div className="flex flex-col h-full">
          <div className="mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </CustomCard>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: Database,
      title: 'Gestion des équipements',
      description: 'Inventaire complet, suivi des pièces détachées et historique des interventions.'
    },
    {
      icon: Calendar,
      title: 'Maintenance préventive',
      description: 'Planifiez les interventions et prévenez les pannes grâce à des alertes intelligentes.'
    },
    {
      icon: BarChart,
      title: 'Tableaux de bord',
      description: 'Visualisez vos KPIs et prenez des décisions basées sur les données.'
    },
    {
      icon: Users,
      title: 'Gestion des équipes',
      description: 'Assignez des tâches et suivez la performance des techniciens.'
    },
    {
      icon: Clock,
      title: 'Temps réel',
      description: 'Notifications instantanées et mises à jour en temps réel des interventions.'
    },
    {
      icon: Smartphone,
      title: 'Mobile',
      description: 'Application mobile pour vos techniciens sur le terrain.'
    }
  ];
  
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Notre solution GMAO offre tous les outils nécessaires pour optimiser 
            la gestion de votre maintenance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureItem 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
