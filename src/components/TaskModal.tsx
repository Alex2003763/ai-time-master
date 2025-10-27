import React, { useState, useRef } from 'react';
import { Task, TaskPriority, TaskCategory, NewTaskPayload, Subtask, Recurring, RecurrenceFrequency } from '../types';
import GlassCard from './GlassCard';
import { requestNotificationPermission } from '../utils/notifications';


interface TaskModalProps {
  task: Task | null;
  onSave: (task: Task | NewTaskPayload) => void;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onSave, onClose }) => {
    
  const toLocalDateString = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const isAllDayEvent = (isoString: string | undefined) => !isoString || isoString.endsWith('T00:00:00.000Z');
  
  const [isRecurring, setIsRecurring] = useState(() => !!task?.recurring);
  const permissionRequestedRef = useRef(false);


  const [formData, setFormData] = useState(() => {
    const start = task?.startTime ? new Date(task.startTime) : new Date();
    const end = task?.endTime ? new Date(task.endTime) : null;
    
    return {
      title: task?.title || '',
      description: task?.description || '',
      startDate: toLocalDateString(start),
      startTime: task?.startTime && !isAllDayEvent(task.startTime) ? start.toTimeString().slice(0, 5) : '',
      endDate: end ? toLocalDateString(end) : '',
      endTime: end && task?.endTime ? end.toTimeString().slice(0, 5) : '',
      category: task?.category || TaskCategory.WORK,
      priority: task?.priority || TaskPriority.MEDIUM,
      subtasks: task?.subtasks?.map(st => ({...st})) || [], // Deep copy
      frequency: task?.recurring?.frequency || RecurrenceFrequency.DAILY,
      interval: task?.recurring?.interval || 1,
      recurringEndDate: task?.recurring?.endDate || '',
      reminderMinutes: task?.reminderMinutes === undefined ? '' : String(task.reminderMinutes),
    };
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null);

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReminderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, reminderMinutes: value }));

    if (value && !permissionRequestedRef.current) {
        await requestNotificationPermission();
        permissionRequestedRef.current = true;
    }
  };

  const handleRecurringToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setIsRecurring(checked);
      if (checked) {
          setFormData(prev => ({...prev, endDate: ''}));
      }
  };
  
  const handleAddSubtask = () => {
    setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { id: crypto.randomUUID(), text: '', completed: false }]
    }));
  };

  const handleSubtaskChange = (id: string, text: string) => {
    setFormData(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(st => st.id === id ? { ...st, text } : st)
    }));
  };

  const handleSubtaskToggle = (id: string) => {
    setFormData(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st)
    }));
  };
  
  const handleDeleteSubtask = (id: string) => {
     setFormData(prev => ({
        ...prev,
        subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startTimeWithTimezone = formData.startTime 
        ? `${formData.startDate}T${formData.startTime}:00`
        : formData.startDate;
    const startDateTime = new Date(startTimeWithTimezone);

    let finalEndTime: string | undefined = undefined;
    
    // An end time can be provided for both recurring and non-recurring tasks.
    if (formData.endTime) {
        // For recurring tasks, the end time is on the same day as the start time.
        // For non-recurring, it can be on a different day (formData.endDate).
        const datePartForEndTime = isRecurring ? formData.startDate : (formData.endDate || formData.startDate);
        const endTimeWithTimezone = `${datePartForEndTime}T${formData.endTime}:00`;
        const endDateTime = new Date(endTimeWithTimezone);

        if (endDateTime <= startDateTime) {
            setError("The task's end time must be after its start time.");
            return;
        }
        finalEndTime = endDateTime.toISOString();
    } 
    // Handle case for multi-day, non-recurring, all-day events
    else if (!isRecurring && formData.endDate) {
        const endDateTime = new Date(formData.endDate);
        if (endDateTime <= startDateTime) {
            setError("End date must be after the start date.");
            return;
        }
        finalEndTime = endDateTime.toISOString();
    }


    let recurring: Recurring | undefined = undefined;
    if (isRecurring) {
        const interval = parseInt(String(formData.interval), 10);
        if (isNaN(interval) || interval < 1) {
            setError("Repeat interval must be a positive number.");
            return;
        }
        recurring = {
            frequency: formData.frequency as RecurrenceFrequency,
            interval,
            endDate: formData.recurringEndDate || undefined,
        };
    }
    
    const reminderMinutes = formData.reminderMinutes !== '' ? Number(formData.reminderMinutes) : undefined;

    const payload: NewTaskPayload = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: finalEndTime,
        category: formData.category,
        priority: formData.priority,
        subtasks: formData.subtasks.filter(st => st.text.trim() !== ''),
        recurring,
        reminderMinutes,
    };

    if (task) {
      onSave({ ...task, ...payload });
    } else {
      onSave(payload);
    }
    onClose();
  };

  const inputClasses = "block w-full bg-theme-input-bg border-theme-input-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-theme-input-focus focus:border-theme-input-focus transition";
  const isEditing = !!task;
  const isTimedEvent = formData.startTime !== '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-lg p-6 sm:p-8 relative animate-pop-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-theme-text-secondary">Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={inputClasses} required />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-theme-text-secondary">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className={`${inputClasses} h-24`} />
          </div>
          
           <div>
            <label className="block text-sm font-medium text-theme-text-secondary">Subtasks</label>
            <div className="mt-1 space-y-2 max-h-40 overflow-y-auto pr-2">
                {formData.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={subtask.completed} onChange={() => handleSubtaskToggle(subtask.id)} className="form-checkbox h-5 w-5 rounded bg-theme-input-bg border-theme-input-border text-theme-brand-primary focus:ring-theme-brand-primary" />
                        <input type="text" value={subtask.text} onChange={(e) => handleSubtaskChange(subtask.id, e.target.value)} placeholder="New subtask..." className={`${inputClasses} py-1.5`} />
                        <button type="button" onClick={() => handleDeleteSubtask(subtask.id)} className="text-theme-text-secondary hover:text-red-500 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleAddSubtask} className="text-sm mt-2 font-semibold py-1 px-3 rounded-md transition-colors backdrop-blur-sm border border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">
                + Add Subtask
            </button>
          </div>

          <GlassCard className="p-4 bg-black/5 dark:bg-white/5 border-none space-y-4">
            <h3 className="text-lg font-semibold text-theme-text-primary">Time & Scheduling</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-theme-text-secondary">Start Date</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClasses} required />
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-theme-text-secondary">Start Time <span className="text-xs">(optional)</span></label>
                <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} className={inputClasses} />
              </div>
              <div style={{ visibility: isRecurring ? 'hidden' : 'visible' }} className="transition-all">
                <label htmlFor="endDate" className="block text-sm font-medium text-theme-text-secondary">End Date <span className="text-xs">(optional)</span></label>
                <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClasses} min={formData.startDate} />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-theme-text-secondary">End Time <span className="text-xs">(optional)</span></label>
                <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} className={inputClasses} />
              </div>
            </div>
            {isTimedEvent && (
                <div className="pt-4 border-t border-theme-input-border/50">
                    <label htmlFor="reminderMinutes" className="block text-sm font-medium text-theme-text-secondary">Reminder</label>
                    <select id="reminderMinutes" name="reminderMinutes" value={formData.reminderMinutes} onChange={handleReminderChange} className={`${inputClasses} custom-select mt-1`}>
                        <option value="">No reminder</option>
                        <option value="0">At time of event</option>
                        <option value="5">5 minutes before</option>
                        <option value="15">15 minutes before</option>
                        <option value="30">30 minutes before</option>
                        <option value="60">1 hour before</option>
                        <option value="1440">1 day before</option>
                    </select>
                </div>
            )}
            <div className="pt-4 border-t border-theme-input-border/50">
               <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isRecurringToggle"
                        className="h-4 w-4 rounded border-gray-300 text-theme-brand-primary focus:ring-theme-brand-primary"
                        checked={isRecurring}
                        onChange={handleRecurringToggle}
                    />
                    <label htmlFor="isRecurringToggle" className="ml-2 block text-sm font-medium">
                        Repeat Task
                    </label>
                </div>
                {isRecurring && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-4 pl-6 animate-fade-in">
                        <div className="col-span-3 sm:col-span-1">
                            <label htmlFor="frequency" className="block text-sm font-medium text-theme-text-secondary">Frequency</label>
                            <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange} className={`${inputClasses} custom-select`}>
                                <option value={RecurrenceFrequency.DAILY}>Daily</option>
                                <option value={RecurrenceFrequency.WEEKLY}>Weekly</option>
                                <option value={RecurrenceFrequency.MONTHLY}>Monthly</option>
                                <option value={RecurrenceFrequency.YEARLY}>Yearly</option>
                            </select>
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                            <label htmlFor="interval" className="block text-sm font-medium text-theme-text-secondary">Every</label>
                            <input type="number" id="interval" name="interval" value={formData.interval} onChange={handleChange} min="1" className={inputClasses} />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                            <label htmlFor="recurringEndDate" className="block text-sm font-medium text-theme-text-secondary">Until <span className="text-xs">(optional)</span></label>
                            <input type="date" id="recurringEndDate" name="recurringEndDate" value={formData.recurringEndDate} onChange={handleChange} className={inputClasses} min={formData.startDate} />
                        </div>
                    </div>
                )}
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-theme-text-secondary">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} className={`${inputClasses} custom-select`}>
                {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-theme-text-secondary">Priority</label>
              <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className={`${inputClasses} custom-select`}>
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 mt-2 animate-fade-in">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">Cancel</button>
            <button type="submit" className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg">{isEditing ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default TaskModal;