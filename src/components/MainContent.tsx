import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import GlassCard from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import DashboardHeader from './DashboardHeader';
import ConfirmationModal from './ConfirmationModal';
import AnimatedCheckbox from './AnimatedCheckbox';


interface MainContentProps extends ReturnType<typeof useTasks> {
  onEditTask: (task: Task) => void;
}

const TaskItem: React.FC<{task: Task, onToggle: (id: string) => void, onEdit: (task: Task) => void, onDelete: (id: string) => void, updateTask: (task: Task) => void}> = ({ task, onToggle, onEdit, onDelete, updateTask }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = hasSubtasks ? task.subtasks.filter(st => st.completed).length : 0;
    const totalSubtasks = hasSubtasks ? task.subtasks.length : 0;
    const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const handleSubtaskToggle = (subtaskId: string) => {
        const updatedSubtasks = task.subtasks?.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        if(updatedSubtasks) {
            updateTask({ ...task, subtasks: updatedSubtasks });
        }
    };
    
    return (
      <div>
        <div 
          className={`p-3 rounded-lg mb-2 flex items-center gap-4 transition-all duration-300 ease-in-out relative ${task.completed ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'} ${hasSubtasks ? 'cursor-pointer hover:bg-theme-nav-hover-bg' : ''}`}
          onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}
        >
            <AnimatedCheckbox checked={task.completed} onChange={() => onToggle(task.id)} />
            <div className="flex-grow">
                <p className={`font-semibold transition-colors duration-300 ${task.completed ? 'line-through text-theme-text-secondary' : ''}`}>{task.title}</p>
                <p className="text-sm text-theme-text-secondary">{new Date(task.startTime).toLocaleDateString()}</p>
                 {hasSubtasks && (
                    <div className={`mt-1.5 flex items-center gap-2 transition-opacity duration-300 ${task.completed ? 'opacity-50' : ''}`}>
                         <div className="w-full bg-theme-progress-track rounded-full h-1.5">
                            <div className="bg-theme-brand-secondary h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <span className="text-xs text-theme-text-secondary whitespace-nowrap">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                )}
            </div>
             <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(task)} className="p-2 rounded-md text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-nav-hover-bg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => onDelete(task.id)} className="p-2 rounded-md text-theme-text-secondary hover:text-red-500 hover:bg-theme-nav-hover-bg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
                {hasSubtasks && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-theme-text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </div>
         {hasSubtasks && (
                <div className={`pl-12 pr-4 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="space-y-2 pb-3">
                         {task.subtasks?.map(st => (
                            <div key={st.id} className="flex items-center gap-3">
                                <AnimatedCheckbox checked={st.completed} onChange={() => handleSubtaskToggle(st.id)} />
                                <span className={`text-sm ${st.completed ? 'line-through text-theme-text-secondary' : ''}`}>{st.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
      </div>
    )
}

const MainContent: React.FC<MainContentProps> = ({ tasks, deleteTask, toggleTask, updateTask, error, onEditTask }) => {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { themeType } = useTheme();

  const confirmDeleteTask = () => {
    if (taskToDelete) {
        deleteTask(taskToDelete);
    }
    setTaskToDelete(null);
  };

  const productivityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    return last7Days.map(day => {
        const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
        const tasksCompletedOnDay = tasks.filter(task => 
            task.completed && 
            task.completionDate && 
            new Date(task.completionDate).toDateString() === day.toDateString()
        ).length;
        
        return { name: dayStr, tasks: tasksCompletedOnDay };
    });
  }, [tasks]);

  const tasksForToday = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
        const taskStart = new Date(task.startTime);
        
        // This handles recurring tasks because their startTime is the next occurrence.
        // It also handles multi-day tasks that have started but not ended.
        if (task.endTime) {
            const taskEnd = new Date(task.endTime);
            // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
            return taskStart <= todayEnd && taskEnd >= todayStart;
        }

        // For tasks without an end time, just check if the start date is today.
        return taskStart >= todayStart && taskStart <= todayEnd;
    });
  }, [tasks]);


  const chartColors = useMemo(() => {
    return themeType === 'dark' 
        ? { axis: '#9ca3af', grid: 'rgba(255,255,255,0.1)', tooltipBg: 'rgba(20,20,40,0.8)', tooltipBorder: 'rgba(255,255,255,0.2)', areaColor: '#8884d8' }
        : { axis: '#6b7280', grid: 'rgba(0,0,0,0.1)', tooltipBg: 'rgba(255,255,255,0.9)', tooltipBorder: 'rgba(0,0,0,0.2)', areaColor: '#8b5cf6' };
  }, [themeType]);

  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <main className="flex-1">
      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Confirm Deletion"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           {error && (
             <GlassCard className="p-4 bg-red-900/40 border-red-500/50 text-red-200 animate-slide-in-up">
               <p><span className="font-bold">Error:</span> {error}</p>
             </GlassCard>
           )}
           <DashboardHeader />
           
           <GlassCard className="p-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
             <h2 className="text-xl font-bold mb-4">Productivity Trends</h2>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={productivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.areaColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.areaColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                   <XAxis dataKey="name" stroke={chartColors.axis} />
                   <YAxis stroke={chartColors.axis} allowDecimals={false}/>
                   <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                   <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, color: chartColors.axis }} />
                   <Area type="monotone" dataKey="tasks" stroke={chartColors.areaColor} fillOpacity={1} fill="url(#colorUv)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </GlassCard>

            <GlassCard className="p-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                 <h2 className="text-xl font-bold mb-4">Today's Tasks</h2>
                 <div className="max-h-96 overflow-y-auto pr-2">
                    {tasksForToday.length > 0 ? tasksForToday.map(task => (
                       <TaskItem 
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={onEditTask}
                            onDelete={(id) => setTaskToDelete(id)}
                            updateTask={updateTask}
                       />
                    )) : <p className="text-theme-text-secondary">No tasks scheduled for today. Enjoy your day! ☀️</p>}
                </div>
            </GlassCard>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col items-center justify-center aspect-square animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full border-8 border-theme-progress-track"></div>
              <div style={{ transform: `rotate(${-45 + (totalCount > 0 ? (completedCount / totalCount) * 360 : 0)}deg)`}} className="transition-transform duration-500 absolute inset-0 rounded-full border-8 border-transparent border-t-theme-brand-primary border-r-theme-brand-primary"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-theme-brand-primary/50 to-theme-brand-secondary/50"></div>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div>
                    <div className="text-4xl font-bold">{completedCount}/{totalCount}</div>
                    <div className="text-theme-text-secondary">Tasks Done</div>
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6 flex-grow animate-slide-in-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>
            <div>
              {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                <div key={task.id} className="py-2 border-b border-theme-card-border">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-theme-text-secondary">{task.category} - {task.priority}</p>
                </div>
              )) : <p className="text-theme-text-secondary">All tasks completed! 🎉</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
};

export default MainContent;
