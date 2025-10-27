import { useState, useEffect, useCallback } from 'react';
import { Task, NewTaskPayload, Recurring, RecurrenceFrequency } from '../types';

const getInitialTasks = (): Task[] => {
  try {
    const item = window.localStorage.getItem('tasks');
    const parsedTasks = item ? JSON.parse(item) : [];
    // Data migration for older task structures
    return parsedTasks.map((task: any) => {
      // Migration from deadline to startTime
      if (task.deadline && !task.startTime) {
        task.startTime = task.deadline;
        delete task.deadline;
      }
      return {
        ...task,
        timeSpent: task.timeSpent || 0,
        completed: task.completed || false,
        subtasks: task.subtasks || [],
      };
    });
  } catch (error) {
    console.error('Error reading tasks from localStorage', error);
    return [];
  }
};

const calculateNextOccurrence = (task: Task): Task => {
    const { startTime, endTime, recurring } = task;
    if (!recurring) return task;

    let currentStartDate = new Date(startTime);
    let nextStartDate = new Date(currentStartDate);

    const duration = endTime ? new Date(endTime).getTime() - new Date(startTime).getTime() : 0;

    switch (recurring.frequency) {
        case RecurrenceFrequency.DAILY:
            nextStartDate.setDate(currentStartDate.getDate() + recurring.interval);
            break;
        case RecurrenceFrequency.WEEKLY:
            if (recurring.daysOfWeek && recurring.daysOfWeek.length > 0) {
                 const sortedDays = [...recurring.daysOfWeek].sort((a,b) => a-b);
                 const currentDay = currentStartDate.getDay();
                 let nextDayInWeek = sortedDays.find(day => day > currentDay);
                 
                 if (nextDayInWeek !== undefined) {
                     nextStartDate.setDate(currentStartDate.getDate() + (nextDayInWeek - currentDay));
                 } else {
                     const daysToNextWeek = 7 - currentDay + sortedDays[0];
                     const weeksToAdd = (recurring.interval - 1) * 7;
                     nextStartDate.setDate(currentStartDate.getDate() + daysToNextWeek + weeksToAdd);
                 }
            } else {
                nextStartDate.setDate(currentStartDate.getDate() + 7 * recurring.interval);
            }
            break;
        case RecurrenceFrequency.MONTHLY: {
            const originalDay = currentStartDate.getDate();
            // Add the interval to the month.
            nextStartDate.setMonth(currentStartDate.getMonth() + recurring.interval, originalDay);
            // If the new date's day is not the same, it means we have overflowed.
            // e.g. from Jan 31st to Feb, JS would make it March 2nd or 3rd.
            if (nextStartDate.getDate() !== originalDay) {
                // By setting day to 0, we move to the last day of the previous month.
                // This correctly handles rolling back from March to the end of Feb.
                nextStartDate.setDate(0);
            }
            break;
        }
        case RecurrenceFrequency.YEARLY: {
            const originalMonth = currentStartDate.getMonth();
            nextStartDate.setFullYear(currentStartDate.getFullYear() + recurring.interval);
            // Check if we jumped a month, e.g. from Feb 29 on a leap year to a non-leap year
            if (nextStartDate.getMonth() !== originalMonth) {
                 // Roll back to the last day of the previous month (which is Feb).
                nextStartDate.setDate(0);
            }
            break;
        }
    }

    let nextEndDate: Date | undefined = undefined;
    if (duration > 0) {
        nextEndDate = new Date(nextStartDate.getTime() + duration);
    }

    return {
        ...task,
        startTime: nextStartDate.toISOString(),
        endTime: nextEndDate?.toISOString(),
    };
};


export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage', error);
    }
  }, [tasks]);

  const addTask = useCallback((task: NewTaskPayload) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      timeSpent: 0,
      subtasks: task.subtasks?.map(st => ({...st, id: crypto.randomUUID() })) || [],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, []);

  const addTasks = useCallback((newTasks: NewTaskPayload[]) => {
    const tasksToAdd: Task[] = newTasks.map(task => ({
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      timeSpent: 0,
      subtasks: task.subtasks?.map(st => ({...st, id: crypto.randomUUID() })) || [],
    }));
    setTasks(prevTasks => [...prevTasks, ...tasksToAdd]);
  }, []);
  
  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);
  
  const toggleTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
        const task = prevTasks.find(t => t.id === taskId);
        if (!task) return prevTasks;

        // If task is being marked incomplete, or is not recurring, do a simple toggle.
        if (task.completed || !task.recurring) {
             return prevTasks.map(t =>
                t.id === taskId
                    ? { ...t, completed: !t.completed, completionDate: !t.completed ? new Date().toISOString() : undefined }
                    : t
            );
        }

        // Handle completing a recurring task
        const nextOccurrence = calculateNextOccurrence(task);
        const recurrenceEndDate = task.recurring.endDate ? new Date(task.recurring.endDate) : null;
        
        if (recurrenceEndDate) {
          // Set to end of day to make comparison inclusive and avoid timezone issues
          recurrenceEndDate.setHours(23, 59, 59, 999);
        }
        
        // If the next occurrence is after the end date, this is the last one.
        if (recurrenceEndDate && new Date(nextOccurrence.startTime) > recurrenceEndDate) {
            return prevTasks.map(t =>
                t.id === taskId
                ? { ...t, completed: true, completionDate: new Date().toISOString(), recurring: undefined }
                : t
            );
        } else {
            // Generate a completed instance and update the original recurring task
            const completedInstance: Task = {
                ...task,
                id: crypto.randomUUID(),
                completed: true,
                completionDate: new Date().toISOString(),
                recurring: undefined,
            };
            return [...prevTasks.map(t => t.id === taskId ? nextOccurrence : t), completedInstance];
        }
    });
  }, []);
  
  const logFocusSession = useCallback((taskId: string, durationInSeconds: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, timeSpent: (task.timeSpent || 0) + durationInSeconds }
          : task
      )
    );
  }, []);

  return { tasks, setTasks, addTask, addTasks, updateTask, deleteTask, toggleTask, isLoading, setIsLoading, error, setError, logFocusSession };
};