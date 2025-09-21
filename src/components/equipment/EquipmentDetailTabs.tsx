import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, History, Wrench } from 'lucide-react';

interface EquipmentDetailTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const EquipmentDetailTabs: React.FC<EquipmentDetailTabsProps> = ({
  currentTab,
  onTabChange
}) => {
  return (
    <TabsList className="grid grid-cols-3 w-full gap-1 no-print">
      <TabsTrigger
        value="info"
        className="flex items-center justify-center gap-1.5 px-1 md:px-2 py-2 text-xs md:text-sm min-h-[40px]"
      >
        <Info className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        <span className="truncate">Informations</span>
      </TabsTrigger>
      <TabsTrigger
        value="history"
        className="flex items-center justify-center gap-1.5 px-1 md:px-2 py-2 text-xs md:text-sm min-h-[40px]"
      >
        <History className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        <span className="truncate">Historique</span>
      </TabsTrigger>
      <TabsTrigger
        value="actions"
        className="flex items-center justify-center gap-1.5 px-1 md:px-2 py-2 text-xs md:text-sm min-h-[40px]"
      >
        <Wrench className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        <span className="truncate">Actions</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default EquipmentDetailTabs;
