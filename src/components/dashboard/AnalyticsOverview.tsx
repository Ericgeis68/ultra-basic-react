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
import { useCollection } from '@/hooks/use-supabase-collection';
import { useMaintenance } from '@/hooks/useMaintenance';
import { Equipment } from '@/types/equipment';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnalyticsOverview = () => {
  // Récupération des vraies données
  const { data: equipments } = useCollection<Equipment>({ tableName: 'equipments' });
  const { maintenances } = useMaintenance();
  const { data: interventions } = useCollection<any>({ tableName: 'interventions' });

  // Calcul des données de maintenance par mois (6 derniers mois)
  const maintenanceData = React.useMemo(() => {
    if (!interventions) return [];
    
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthInterventions = interventions.filter(intervention => {
        const interventionDate = new Date(intervention.created_at);
        return interventionDate >= monthStart && interventionDate <= monthEnd;
      });

      const preventive = monthInterventions.filter(i => i.type === 'preventive').length;
      const corrective = monthInterventions.filter(i => i.type === 'corrective').length;
      const regulatory = monthInterventions.filter(i => i.type === 'regulatory').length;
      const improvement = monthInterventions.filter(i => i.type === 'improvement').length;

      return {
        month: format(month, 'MMM', { locale: fr }),
        preventive,
        corrective,
        regulatory,
        improvement,
        total: monthInterventions.length
      };
    });
  }, [interventions]);

  // Calcul des données de statut des équipements
  const equipmentStatusData = React.useMemo(() => {
    if (!equipments) return [];
    
    const statusCounts = equipments.reduce((acc, equipment) => {
      const status = equipment.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = equipments.length;
    
    return [
      { 
        name: 'Opérationnel', 
        value: Math.round((statusCounts.operational || 0) / total * 100), 
        color: '#10b981',
        count: statusCounts.operational || 0
      },
      { 
        name: 'En maintenance', 
        value: Math.round((statusCounts.maintenance || 0) / total * 100), 
        color: '#f59e0b',
        count: statusCounts.maintenance || 0
      },
      { 
        name: 'En panne', 
        value: Math.round((statusCounts.faulty || 0) / total * 100), 
        color: '#ef4444',
        count: statusCounts.faulty || 0
      }
    ].filter(item => item.count > 0);
  }, [equipments]);

  // Calcul des données par bâtiment/service
  const departmentData = React.useMemo(() => {
    if (!interventions || !equipments) return [];
    
    const departmentCounts = interventions.reduce((acc, intervention) => {
      const equipment = equipments.find(eq => eq.id === intervention.equipment_id);
      const department = equipment?.service_id || 'Non assigné';
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(departmentCounts)
      .map(([department, count]) => ({ department, interventions: Number(count) }))
      .sort((a, b) => b.interventions - a.interventions)
      .slice(0, 5); // Top 5
  }, [interventions, equipments]);
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
                <linearGradient id="colorRegulatory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorImprovement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="preventive" 
                name="Préventive"
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorPreventive)" 
              />
              <Area 
                type="monotone" 
                dataKey="corrective" 
                name="Corrective"
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorCorrective)" 
              />
              <Area 
                type="monotone" 
                dataKey="regulatory" 
                name="Réglementaire"
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorRegulatory)" 
              />
              <Area 
                type="monotone" 
                dataKey="improvement" 
                name="Amélioration"
                stroke="#06b6d4" 
                fillOpacity={1} 
                fill="url(#colorImprovement)" 
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
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value}% (${props.payload.count} équipements)`, 
                  props.payload.name
                ]} 
              />
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
