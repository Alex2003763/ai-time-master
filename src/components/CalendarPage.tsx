import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from './GlassCard';
import { Task, TaskCategory, RecurrenceFrequency } from '../types';

interface CalendarPageProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const categoryColors: Record<TaskCategory, { bg: string; text: string; border: string; glow: string; pillBg: string }> = {
  [TaskCategory.WORK]: { bg: 'bg-sky-900/30', text: 'text-sky-300', border: 'border-sky-500', glow: 'shadow-sky-500/50', pillBg: 'bg-sky-500/20' },
  [TaskCategory.PERSONAL]: { bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-500', glow: 'shadow-purple-500/50', pillBg: 'bg-purple-500/20' },
  [TaskCategory.STUDY]: { bg: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-500', glow: 'shadow-emerald-500/50', pillBg: 'bg-emerald-500/20' },
  [TaskCategory.FITNESS]: { bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-500', glow: 'shadow-amber-500/50', pillBg: 'bg-amber-500/20' },
  [TaskCategory.OTHER]: { bg: 'bg-gray-700/30', text: 'text-gray-300', border: 'border-gray-500', glow: 'shadow-gray-500/50', pillBg: 'bg-gray-500/20' },
};

type ProcessedEvent = {
  task: Task;
  startMinutes: number;
  endMinutes: number;
  style: {
    top: string;
    height: string;
    left: string;
    width: string;
    zIndex: number;
  };
};

const CalendarPage: React.FC<CalendarPageProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(new Date());
  const HOUR_HEIGHT = 64; // in pixels

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Get the start and end dates for the current calendar view
  const [viewStartDate, viewEndDate] = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    if (view === 'month') {
        start.setDate(1);
        start.setDate(start.getDate() - start.getDay());
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setDate(end.getDate() + (6 - end.getDay()));
    } else if (view === 'week') {
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
    }
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return [start, end];
  }, [currentDate, view]);

  const projectedTasks = useMemo(() => {
    const occurrences = new Map<string, Task>(); // Use a map to prevent duplicates
    tasks.forEach(task => {
        // Find original completed tasks to exclude their future projections
        const completedOriginalIds = new Set(tasks.filter(t => t.completed && t.originalId).map(t => t.originalId));

        if (task.completed && !task.recurring) { // Show completed non-recurring tasks
             occurrences.set(task.id, task);
             return;
        }
        if (task.completed && task.recurring) return; // Hide the template of a recurring task if it was completed
        if (completedOriginalIds.has(task.id)) return;


        if (!task.recurring) {
            if (!occurrences.has(task.id)) {
                occurrences.set(task.id, task);
            }
        } else {
            let current = new Date(task.startTime);
            const duration = task.endTime ? new Date(task.endTime).getTime() - new Date(task.startTime).getTime() : 0;
            const recurrenceEndDate = task.recurring.endDate ? new Date(task.recurring.endDate) : null;
            if (recurrenceEndDate) {
                recurrenceEndDate.setHours(23, 59, 59, 999);
            }
            
            let i = 0;
            while (current <= viewEndDate && i < 365) { // Safety break after 365 instances
                if (current >= viewStartDate && (!recurrenceEndDate || current <= recurrenceEndDate)) {
                     const instanceId = `${task.id}-${current.toISOString()}`;
                     if (!occurrences.has(instanceId)) {
                        occurrences.set(instanceId, {
                            ...task,
                            id: instanceId,
                            startTime: current.toISOString(),
                            endTime: duration > 0 ? new Date(current.getTime() + duration).toISOString() : undefined,
                            originalId: task.id,
                            completed: false,
                        });
                     }
                }
                
                if (recurrenceEndDate && current > recurrenceEndDate) break;
                if (current > viewEndDate) break; // Optimization
                
                const { interval, frequency, daysOfWeek } = task.recurring;
                
                switch (frequency) {
                    case RecurrenceFrequency.DAILY:
                        current.setDate(current.getDate() + interval);
                        break;
                    case RecurrenceFrequency.WEEKLY:
                        if (daysOfWeek && daysOfWeek.length > 0) {
                            const sortedDays = [...daysOfWeek].sort((a,b) => a-b);
                            const currentDay = current.getDay();
                            let nextDayInWeek = sortedDays.find(day => day > currentDay);
                            if (nextDayInWeek !== undefined) {
                                current.setDate(current.getDate() + (nextDayInWeek - currentDay));
                            } else {
                                const daysToNextWeek = 7 - currentDay + sortedDays[0];
                                const weeksToAdd = (interval - 1) * 7;
                                current.setDate(current.getDate() + daysToNextWeek + weeksToAdd);
                            }
                        } else {
                            current.setDate(current.getDate() + 7 * interval);
                        }
                        break;
                    case RecurrenceFrequency.MONTHLY: {
                        const originalDay = current.getDate();
                        current.setMonth(current.getMonth() + interval, originalDay);
                        if (current.getDate() !== originalDay) {
                           current.setDate(0);
                        }
                        break;
                    }
                    case RecurrenceFrequency.YEARLY:
                        current.setFullYear(current.getFullYear() + interval);
                        break;
                }
                i++;
            }
        }
    });
    return Array.from(occurrences.values());
  }, [tasks, viewStartDate, viewEndDate]);
  
  const toggleDayExpansion = (dayString: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayString)) {
        newSet.delete(dayString);
      } else {
        newSet.add(dayString);
      }
      return newSet;
    });
  };

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    projectedTasks.forEach(task => {
        const startDate = new Date(task.startTime);
        // If endTime is missing or before startTime, treat it as a point in time on the same day.
        const endDate = task.endTime && new Date(task.endTime) > startDate ? new Date(task.endTime) : startDate;
        
        let loopDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        // Safety break for very long-running events to avoid infinite loops
        let safetyCounter = 0;
        while (loopDate <= finalDate && safetyCounter < 366) {
            const dateKey = loopDate.toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(task);
            
            loopDate.setDate(loopDate.getDate() + 1);
            safetyCounter++;
        }
    });
    return map;
  }, [projectedTasks]);
  
  const handlePrev = () => {
    if (view === 'month') setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    if (view === 'week') setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
    if (view === 'day') setCurrentDate(prev => new Date(prev.getTime() - 1 * 24 * 60 * 60 * 1000));
  };
  
  const handleNext = () => {
    if (view === 'month') setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    if (view === 'week') setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
    if (view === 'day') setCurrentDate(prev => new Date(prev.getTime() + 1 * 24 * 60 * 60 * 1000));
  };

  const handleToday = () => setCurrentDate(new Date());

  const headerTitle = useMemo(() => {
    if (view === 'month') return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (view === 'week') {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (view === 'day') return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return '';
  }, [currentDate, view]);

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    
    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    
    return (
        <>
            <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-semibold text-theme-text-secondary mb-2 px-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 gap-1 sm:gap-2 flex-grow">
                {days.map(d => {
                    const tasksForDay = tasksByDate.get(d.toDateString()) || [];
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    return (
                        <div key={d.toISOString()} className={`rounded-lg p-1.5 sm:p-2 overflow-hidden flex flex-col transition-colors duration-200 ${isCurrentMonth ? 'bg-theme-card-bg/20' : 'bg-transparent'} hover:bg-theme-card-bg/40`}>
                            <span className={`self-start sm:self-center flex items-center justify-center h-6 w-6 rounded-full text-center text-xs sm:text-sm transition-all duration-200 ${isToday(d) ? 'bg-theme-brand-primary text-white font-bold ring-2 ring-theme-brand-primary ring-offset-2 ring-offset-theme-bg dark:ring-offset-gray-800' : ''} ${isCurrentMonth ? 'text-theme-text-primary' : 'text-theme-text-secondary/50'}`}>{d.getDate()}</span>
                            <div className="mt-1 space-y-1.5 overflow-y-auto max-h-24 pr-1 scrollbar-thin">
                                {tasksForDay.map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                          const originalTask = t.originalId ? tasks.find(ot => ot.id === t.originalId) : t;
                                          if (originalTask) onTaskClick(originalTask);
                                      }}
                                      title={t.title}
                                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] sm:text-xs truncate transition-transform hover:scale-105 ${categoryColors[t.category].pillBg} ${categoryColors[t.category].text} `}
                                    >
                                      {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
  };

    const renderWeekView = () => {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });

        const MobileView = () => (
             <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto p-1 lg:hidden">
                {days.map(day => {
                    const tasksForDay = tasksByDate.get(day.toDateString()) || [];
                    const dayString = day.toDateString();
                    const isExpanded = expandedDays.has(dayString);
                    const isToday = dayString === new Date().toDateString();
                    const displayedTasks = isExpanded ? tasksForDay : tasksForDay.slice(0, 2);
                    
                    return (
                        <div key={`mobile-${day.toISOString()}`}>
                            <div className={`flex items-baseline gap-2 mb-2 ${isToday ? 'text-theme-brand-primary' : ''}`}>
                                <h3 className="font-bold text-lg">{day.toLocaleDateString('en-US', { weekday: 'short' })}</h3>
                                <span className="text-2xl font-bold">{day.getDate()}</span>
                            </div>
                            <div className="pl-4 border-l-2 border-theme-card-border/30 space-y-3">
                                {displayedTasks.length > 0 ? displayedTasks.map(t => (
                                    <GlassCard
                                      key={t.id}
                                      onClick={() => {
                                          const originalTask = t.originalId ? tasks.find(ot => ot.id === t.originalId) : t;
                                          if (originalTask) onTaskClick(originalTask);
                                      }}
                                      className={`p-3 border-l-4 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-transform ${categoryColors[t.category].border} ${categoryColors[t.category].bg}`}
                                    >
                                        <p className="font-semibold">{t.title}</p>
                                        <p className="text-xs text-theme-text-secondary opacity-80">{t.description.substring(0, 50)}</p>
                                    </GlassCard>
                                )) : <p className="text-xs text-theme-text-secondary/70 italic py-2">No tasks scheduled.</p>}
                                
                                {tasksForDay.length > 2 && (
                                    <button 
                                        onClick={() => toggleDayExpansion(dayString)} 
                                        className="text-xs font-semibold text-theme-brand-primary hover:underline"
                                    >
                                        {isExpanded ? 'Show less' : `+ ${tasksForDay.length - 2} more`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );

        const DesktopView = () => (
            <div className="hidden lg:grid grid-cols-7 gap-3 h-full">
                {days.map(day => {
                    const tasksForDay = tasksByDate.get(day.toDateString()) || [];
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <GlassCard key={day.toISOString()} className="p-2 flex flex-col overflow-hidden">
                            <div className="text-center mb-2 flex-shrink-0">
                                <p className={`font-semibold text-sm ${isToday ? 'text-theme-brand-primary' : 'text-theme-text-secondary'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                <p className={`text-2xl font-bold ${isToday ? 'text-theme-brand-primary' : ''}`}>{day.getDate()}</p>
                            </div>
                            <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin flex-grow">
                                {tasksForDay.length > 0 ? tasksForDay.map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                          const originalTask = t.originalId ? tasks.find(ot => ot.id === t.originalId) : t;
                                          if (originalTask) onTaskClick(originalTask);
                                      }}
                                      className={`w-full text-left p-2 rounded text-xs transition-transform hover:scale-105 ${categoryColors[t.category].pillBg} ${categoryColors[t.category].text} `}
                                    >
                                        <p className="font-bold truncate">{t.title}</p>
                                        <p className="opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">{t.description.substring(0, 30)}</p>
                                    </button>
                                )) : <div className="h-full flex items-center justify-center"><p className="text-xs text-center text-theme-text-secondary/50 pt-4">No tasks</p></div>}
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        );

        return (
            <>
                <MobileView />
                <DesktopView />
            </>
        )
    };

    const isAllDay = (task: Task): boolean => {
      // FIX: The previous logic incorrectly flagged any multi-day event as "all-day".
      // This revised logic correctly identifies an event as "all-day" only if it
      // lacks a specific time (i.e., starts at midnight) and has no specific end time.
      // Multi-day events with start/end times will now correctly appear on the timeline.
      const start = new Date(task.startTime);
      const end = task.endTime ? new Date(task.endTime) : null;
    
      if (!end || end.getTime() <= start.getTime()) {
        const startTimeStr = start.toTimeString().slice(0, 8);
        return startTimeStr === "00:00:00";
      }
      
      // If the event has a duration (end > start), it's a timed event for the timeline view.
      return false;
    };

    const processedEvents = useMemo(() => {
        const tasksForDay = tasksByDate.get(currentDate.toDateString()) || [];
        const timedTasks = tasksForDay.filter(t => !isAllDay(t));
        
        type EventWithLayoutData = {
            task: Task;
            startMinutes: number;
            endMinutes: number;
        };
        
        const currentDayStart = new Date(currentDate);
        currentDayStart.setHours(0, 0, 0, 0);
        const currentDayEnd = new Date(currentDate);
        currentDayEnd.setHours(23, 59, 59, 999);

        const events: EventWithLayoutData[] = timedTasks.map(task => {
            const taskStart = new Date(task.startTime);
            const taskEnd = (task.endTime && new Date(task.endTime).getTime() > taskStart.getTime()) 
                ? new Date(task.endTime) 
                : new Date(taskStart.getTime() + 60 * 60 * 1000); // Default to 1 hour if no/invalid end time
            
            const eventStartForDay = new Date(Math.max(taskStart.getTime(), currentDayStart.getTime()));
            const eventEndForDay = new Date(Math.min(taskEnd.getTime(), currentDayEnd.getTime()));

            return {
                task,
                startMinutes: eventStartForDay.getHours() * 60 + eventStartForDay.getMinutes(),
                endMinutes: Math.min(eventEndForDay.getHours() * 60 + eventEndForDay.getMinutes(), 24 * 60 - 1),
            };
        }).sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

        if (events.length === 0) return [];
        
        let groups: EventWithLayoutData[][] = [];
        let lastEventEnding: number | null = null;
    
        events.forEach(event => {
            if (lastEventEnding !== null && event.startMinutes >= lastEventEnding) {
                groups.push([]);
                lastEventEnding = null;
            }
    
            if (groups.length === 0) {
                groups.push([]);
            }
    
            groups[groups.length - 1].push(event);
            
            if (lastEventEnding === null || event.endMinutes > lastEventEnding) {
                lastEventEnding = event.endMinutes;
            }
        });
    
        return groups.flatMap(group => {
            const columns: EventWithLayoutData[][] = [];
            group.forEach(event => {
                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    const lastEventInColumn = columns[i][columns[i].length - 1];
                    if (lastEventInColumn.endMinutes <= event.startMinutes) {
                        columns[i].push(event);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([event]);
                }
            });
    
            const numColumns = columns.length;
            return columns.flatMap((column, colIndex) => {
                return column.map(event => {
                    const top = (event.startMinutes / 60) * HOUR_HEIGHT;
                    const height = ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT;
                    
                    return {
                        task: event.task,
                        startMinutes: event.startMinutes,
                        endMinutes: event.endMinutes,
                        style: {
                            top: `${top}px`,
                            height: `${Math.max(height, 20)}px`,
                            left: `${(colIndex / numColumns) * 100}%`,
                            width: `${(1 / numColumns) * 100}%`,
                            zIndex: 10 + colIndex,
                        }
                    };
                });
            });
        });

    }, [tasksByDate, currentDate]);
  
    const renderDayView = () => {
        const tasksForDay = (tasksByDate.get(currentDate.toDateString()) || []);
        const allDayTasks = tasksForDay.filter(isAllDay);
        const isToday = currentDate.toDateString() === new Date().toDateString();

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const nowPosition = (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * (HOUR_HEIGHT * 24);

        return (
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* All-day Section */}
                {allDayTasks.length > 0 && (
                    <div className="flex-shrink-0 p-2 border-b border-theme-card-border/50">
                        <div className="flex items-center">
                            <span className="w-14 text-center text-xs font-medium text-theme-text-secondary">all-day</span>
                            <div className="flex flex-wrap gap-2 pl-2">
                                {allDayTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => {
                                            const originalTask = task.originalId ? tasks.find(ot => ot.id === task.originalId) : task;
                                            if (originalTask) onTaskClick(originalTask);
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-transform hover:scale-105 ${categoryColors[task.category].pillBg} ${categoryColors[task.category].text}`}
                                    >
                                        {task.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* Time Grid Section */}
                <div className="flex-grow overflow-y-auto relative scrollbar-thin">
                    <div className="relative" style={{ height: `${HOUR_HEIGHT * 24}px` }}>
                        {/* Time Gutter */}
                        <div className="absolute top-0 left-0 w-14 h-full">
                            {hours.map(hour => (
                                <div key={`time-${hour}`} style={{ height: `${HOUR_HEIGHT}px` }} className="relative">
                                    {hour > 0 && (
                                        <span className="absolute -top-2.5 right-3 text-xs text-theme-text-secondary/60">
                                            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Grid and Events */}
                        <div className="ml-14 relative h-full">
                            {/* Grid Lines */}
                            {hours.map(hour => (
                                <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT}px` }} className="border-t border-theme-card-border/30"></div>
                            ))}
                            {/* Events */}
                            {processedEvents.map(({ task, style }) => {
                                const heightPx = parseFloat(style.height);
                                const isCompact = heightPx < 45;
                                const canShowTime = heightPx > 25;

                                return (
                                    <div key={task.id} className="absolute pr-1" style={style}>
                                        <button
                                          onClick={() => {
                                            const originalTask = task.originalId ? tasks.find(ot => ot.id === task.originalId) : task;
                                            if (originalTask) onTaskClick(originalTask);
                                          }}
                                          className={`h-full w-full text-left rounded-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-2xl hover:z-20 transition-all duration-200 ${categoryColors[task.category].bg} border-l-4 ${categoryColors[task.category].border} shadow-lg ${categoryColors[task.category].glow} p-1.5`}
                                        >
                                            <p className={`font-bold ${categoryColors[task.category].text} leading-tight ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
                                                {task.title}
                                            </p>
                                            {canShowTime && (
                                                <p className={`text-theme-text-secondary/90 leading-tight ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                                                    {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {/* "Now" Indicator */}
                            {isToday && (
                                <div className="absolute left-0 right-0 flex items-center z-30 pointer-events-none" style={{ top: `${nowPosition}px` }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-theme-brand-tertiary -ml-1.5 ring-4 ring-theme-bg animate-pulse"></div>
                                    <div className="w-full h-0.5 bg-theme-brand-tertiary"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const buttonClass = "font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-sm active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg";
    const navIconClass = "w-5 h-5";

    return (
        <main className="flex-1 flex flex-col gap-4 sm:gap-6 animate-fade-in">
            <GlassCard className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <GlassCard className="flex items-center gap-1 p-1 rounded-lg">
                          <button onClick={handlePrev} className={`${buttonClass} px-3`}><svg xmlns="http://www.w3.org/2000/svg" className={navIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                          <button onClick={handleNext} className={`${buttonClass} px-3`}><svg xmlns="http://www.w3.org/2000/svg" className={navIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </GlassCard>
                        <button onClick={handleToday} className={`${buttonClass} hidden sm:block`}>Today</button>
                        <h2 className="text-lg sm:text-xl font-bold ml-2 sm:ml-4">{headerTitle}</h2>
                    </div>
                    <GlassCard className="flex items-center gap-1 p-1 rounded-lg">
                        {(['month', 'week', 'day'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all capitalize duration-200 ${view === v ? 'bg-theme-nav-active-bg shadow-sm text-theme-text-primary' : 'text-theme-text-secondary hover:bg-theme-nav-hover-bg'}`}>{v}</button>
                        ))}
                    </GlassCard>
                </div>
            </GlassCard>
            <GlassCard className="p-2 sm:p-4 flex-grow flex flex-col">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
            </GlassCard>
        </main>
    );
};

export default CalendarPage;