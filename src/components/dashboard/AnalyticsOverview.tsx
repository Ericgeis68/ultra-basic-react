import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import CustomCard from '../ui/CustomCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const maintenanceData = [
  { month: 'Jan', preventive: 65, corrective: 35 },
  { month: 'Fév', preventive: 59, corrective: 25 },
  { month: 'Mar', preventive: 80, corrective: 40 },
  { month: 'Avr', preventive: 81, corrective: 24 },
  { month: 'Mai', preventive: 56, corrective: 37 },
  { month: 'Juin', preventive: 55, corrective: 18 },
  { month: 'Juil', preventive: 70, corrective: 30 }
];

const equipmentStatusData = [
  { name: 'Opérationnel', value: 70, color: '#10b981' },
  { name: 'En maintenance', value: 20, color: '#f59e0b' },
  { name: 'En panne', value: 10, color: '#ef4444' }
];

const departmentData = [
  { department: 'Production', interventions: 45 },
  { department: 'Logistique', interventions: 30 },
  { department: 'Services', interventions: 20 },
  { department: 'Admin', interventions: 10 }
];

const AnalyticsOverview = () => {
  return (
    <Tabs defaultValue="maintenance" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Analyse de maintenance</h2>
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="equipment">Équipements</TabsTrigger>
          <TabsTrigger value="departments">Départements</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="maintenance" className="mt-0">
        <CustomCard variant="default" className="border h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={maintenanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="preventive" 
                name="Maintenance préventive"
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorPreventive)" 
              />
              <Area 
                type="monotone" 
                dataKey="corrective" 
                name="Maintenance corrective"
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorCorrective)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CustomCard>
      </TabsContent>
      
      <TabsContent value="equipment" className="mt-0">
        <CustomCard variant="default" className="border h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={equipmentStatusData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {equipmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Pourcentage']} />
            </PieChart>
          </ResponsiveContainer>
        </CustomCard>
      </TabsContent>
      
      <TabsContent value="departments" className="mt-0">
        <CustomCard variant="default" className="border h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="interventions" 
                name="Interventions" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CustomCard>
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsOverview;
