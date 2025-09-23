import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  MoreVertical, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Task } from '@/types/task';
import TaskFormModal from './TaskFormModal';

interface TasksListProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TasksList: React.FC<TasksListProps> = ({ 
  tasks, 
  onComplete,
  onUpdate,
  onDelete 
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Haute</Badge>;
      case 'medium':
        return <Badge variant="default">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline">Faible</Badge>;
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: Task['status'], dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'completed';
    
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };
  
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
  };
  
  const handleUpdateTask = (updatedTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      const updatedTask = {
        ...editingTask,
        ...updatedTaskData
      };
      onUpdate(updatedTask);
      setEditingTask(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Tâche</TableHead>
              <TableHead className="w-[150px]">Priorité</TableHead>
              <TableHead className="w-[150px]">Assigné à</TableHead>
              <TableHead className="w-[150px]">Échéance</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Aucune tâche trouvée
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(task.status, task.dueDate)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {task.status === 'completed' 
                          ? 'Terminée' 
                          : task.status === 'in-progress' 
                            ? 'En cours' 
                            : 'En attente'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </div>
                    {task.equipmentName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Équipement: {task.equipmentName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{task.assignedTo || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => onComplete(task.id)}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span>Marquer comme terminée</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEditClick(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingTask && (
        <TaskFormModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          existingTask={editingTask}
          existingStaff={tasks.map(task => task.assignedTo).filter(Boolean) as string[]}
        />
      )}
    </>
  );
};

export default TasksList;
