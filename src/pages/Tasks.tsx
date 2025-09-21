import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Clock, AlertTriangle, Plus, Filter } from "lucide-react";
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TasksList from '@/components/tasks/TasksList';
import { Task } from '@/types/task';

// Exemple de tâches
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Inspection de la chaudière centrale",
    description: "Effectuer une inspection complète de la chaudière centrale avec contrôle des paramètres de combustion.",
    status: "pending",
    priority: "high",
    assignedTo: "Thomas Martin",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 jours
    createdAt: new Date().toISOString(),
    equipmentId: "CH001",
    equipmentName: "Chaudière Industrielle"
  },
  {
    id: "2",
    title: "Remplacement des filtres CVC",
    description: "Remplacer tous les filtres des unités CVC du bâtiment principal.",
    status: "completed",
    priority: "medium",
    assignedTo: "Émilie Dubois",
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Hier
    completedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    equipmentId: "CVC002",
    equipmentName: "Système CVC Principal"
  },
  {
    id: "3",
    title: "Calibration des capteurs de pression",
    description: "Calibrer les capteurs de pression sur les lignes de production 1 et 2.",
    status: "in-progress",
    priority: "medium",
    assignedTo: "Thomas Martin",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 jour
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    equipmentId: "CAP003",
    equipmentName: "Capteurs de pression"
  },
  {
    id: "4",
    title: "Maintenance des compresseurs d'air",
    description: "Effectuer la maintenance trimestrielle sur tous les compresseurs d'air.",
    status: "pending",
    priority: "low",
    assignedTo: null,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 jours
    createdAt: new Date().toISOString(),
    equipmentId: "COMP004",
    equipmentName: "Compresseurs d'air"
  },
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const taskWithIds = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, taskWithIds]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'completed', 
            completedAt: new Date().toISOString() 
          } 
        : task
    ));
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && 
    new Date(task.dueDate) < new Date() && 
    !task.completedAt
  );

  const getTotalByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority).length;
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des tâches</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filtrer</span>
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Nouvelle tâche</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>En attente</span>
              <span className="ml-auto bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                {pendingTasks.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tâches qui n'ont pas encore été démarrées.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <span>En cours</span>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {inProgressTasks.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tâches actuellement en cours d'exécution.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>En retard</span>
              <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {overdueTasks.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tâches dont la date d'échéance est dépassée.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="in-progress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TasksList 
            tasks={tasks} 
            onComplete={handleCompleteTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </TabsContent>
        <TabsContent value="pending">
          <TasksList 
            tasks={pendingTasks} 
            onComplete={handleCompleteTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </TabsContent>
        <TabsContent value="in-progress">
          <TasksList 
            tasks={inProgressTasks} 
            onComplete={handleCompleteTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </TabsContent>
        <TabsContent value="completed">
          <TasksList 
            tasks={completedTasks} 
            onComplete={handleCompleteTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </TabsContent>
        <TabsContent value="overdue">
          <TasksList 
            tasks={overdueTasks} 
            onComplete={handleCompleteTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </TabsContent>
      </Tabs>

      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddTask}
        existingStaff={initialTasks.map(task => task.assignedTo).filter(Boolean) as string[]}
      />
    </div>
  );
};

export default Tasks;
