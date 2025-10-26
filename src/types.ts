export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
  STUDY = 'Study',
  FITNESS = 'Fitness',
  OTHER = 'Other'
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface Recurring {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string; // YYYY-MM-DD
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id:string;
  title: string;
  description: string;
  startTime: string; 
  endTime?: string;
  category: TaskCategory;
  priority: TaskPriority;
  completed: boolean;
  timeSpent: number; // in seconds
  completionDate?: string;
  subtasks?: Subtask[];
  recurring?: Recurring;
  originalId?: string; // Used for projected recurring instances
}

export type NewTaskPayload = Omit<Task, 'id' | 'completed' | 'timeSpent' | 'completionDate' | 'originalId'>;