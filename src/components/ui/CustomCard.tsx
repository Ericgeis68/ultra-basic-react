import React from 'react';
import { cn } from '@/lib/utils';

type CustomCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'neomorphic' | 'outline' | 'elevated';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
};

const CustomCard = ({ 
  children, 
  className, 
  variant = 'default',
  hover = false,
  clickable = false,
  onClick
}: CustomCardProps) => {
  const baseClasses = "rounded-xl p-6 overflow-hidden";
  
  const variantClasses = {
    default: "bg-card text-card-foreground shadow-soft",
    glass: "glass-card backdrop-blur-md bg-white/70 border border-white/20",
    neomorphic: "bg-secondary shadow-neomorphic",
    outline: "bg-background border border-border",
    elevated: "bg-background shadow-lg"
  };
  
  const hoverClasses = hover ? "transition-all duration-200 hover:shadow-md" : "";
  const clickableClasses = clickable ? "cursor-pointer" : "";
  
  return (
    <div 
      className={cn(
        baseClasses, 
        variantClasses[variant], 
        hoverClasses,
        clickableClasses,
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {children}
    </div>
  );
};

export default CustomCard;
