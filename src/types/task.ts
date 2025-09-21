export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string | null;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  equipmentId?: string;
  equipmentName?: string;
}
