import React from 'react';

interface EquipmentHealthBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: string;
  scaleFactor?: number; // Facteur de mise à l'échelle pour le ratio fixe
  labelPlacement?: 'below' | 'inline';
  compact?: boolean;
}

const EquipmentHealthBar: React.FC<EquipmentHealthBarProps> = ({ 
  percentage, 
  showLabel = true,
  height = 'h-1.5',
  scaleFactor = 1,
  labelPlacement = 'below',
  compact = false
}) => {
  const getHealthBarColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const scaledHeight = Math.round((compact ? 4 : 6) * scaleFactor); // 4–6px
  const fontSize = Math.round((compact ? 9 : 12) * scaleFactor); // 9–12px

  const bar = (
    <div 
      className="w-full rounded-full bg-gray-100 overflow-hidden"
      style={{ height: `${scaledHeight}px` }}
    >
      <div 
        className={`h-full ${getHealthBarColor(percentage)}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  if (!showLabel) {
    return <div className="w-full">{bar}</div>;
  }

  if (labelPlacement === 'inline') {
    return (
      <div className="w-full flex items-center" style={{ gap: `${Math.max(2, Math.round(4 * scaleFactor))}px` }}>
        <div className="flex-1 min-w-0">{bar}</div>
        <div className="shrink-0 text-muted-foreground" style={{ fontSize: `${fontSize}px` }}>{percentage}%</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {bar}
      <div className="mt-1 text-right" style={{ fontSize: `${fontSize}px` }}>
        État de santé: <span className="font-medium">{percentage}%</span>
      </div>
    </div>
  );
};

export default EquipmentHealthBar;
