import React, { useState, useEffect, useRef, useMemo } from 'react';
import GlassCard from './GlassCard';
import { Task } from '../types';
import { playSound, unlockAudioContext } from '../utils/soundPlayer';

interface FocusTimerProps {
  tasks: Task[];
  logFocusSession: (taskId: string, duration: number) => void;
}

const WORK_PRESETS = [15, 25, 50];
const BREAK_PRESETS = [5, 10, 15];


const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, logFocusSession }) => {
  const [workDuration, setWorkDuration] = useState({ minutes: 25, seconds: 0 });
  const [breakDuration, setBreakDuration] = useState({ minutes: 5, seconds: 0 });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [sessionType, setSessionType] = useState<'Work' | 'Break'>('Work');
  
  const calculateTotalSeconds = (duration: {minutes: number, seconds: number}) => duration.minutes * 60 + duration.seconds;

  const [timeRemaining, setTimeRemaining] = useState(calculateTotalSeconds(workDuration));
  const [isActive, setIsActive] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    handleReset();
  }, [workDuration, breakDuration]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);
  
  useEffect(() => {
    if (timeRemaining <= 0) {
        playSound();
        if (sessionType === 'Work' && selectedTaskId) {
            logFocusSession(selectedTaskId, calculateTotalSeconds(workDuration));
        }
        setIsActive(false);
        const nextSession = sessionType === 'Work' ? 'Break' : 'Work';
        setSessionType(nextSession);
        setTimeRemaining(nextSession === 'Work' ? calculateTotalSeconds(workDuration) : calculateTotalSeconds(breakDuration));
    }
  }, [timeRemaining, workDuration, breakDuration, logFocusSession, selectedTaskId, sessionType]);
  

  const handleStartPause = () => {
    if (!selectedTaskId || calculateTotalSeconds(workDuration) === 0) return;
    unlockAudioContext();
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setSessionType('Work');
    setTimeRemaining(calculateTotalSeconds(workDuration));
  };

  const handleDurationChange = (
    type: 'work' | 'break', 
    unit: 'minutes' | 'seconds', 
    value: string
  ) => {
    const numericValue = parseInt(value) || 0;
    const setter = type === 'work' ? setWorkDuration : setBreakDuration;

    setter(prev => {
        let newValue = { ...prev };
        if (unit === 'minutes') {
            newValue.minutes = Math.max(0, numericValue);
        } else {
            newValue.seconds = Math.max(0, Math.min(59, numericValue));
        }
        return newValue;
    });
  };
  
  const handlePresetClick = (type: 'work' | 'break', minutes: number) => {
    const setter = type === 'work' ? setWorkDuration : setBreakDuration;
    setter({ minutes, seconds: 0 });
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    return sessionType === 'Work' ? calculateTotalSeconds(workDuration) : calculateTotalSeconds(breakDuration);
  }, [sessionType, workDuration, breakDuration]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 0;
  const offset = circumference * (1 - progress);
  
  const inputBaseClasses = "w-full text-center bg-transparent focus:outline-none text-lg";
  const presetButtonClass = "px-3 py-1 text-xs font-medium rounded-full transition-colors";

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">Focus Timer</h2>
      <div className="space-y-4">
        <select 
            value={selectedTaskId || ''} 
            onChange={e => setSelectedTaskId(e.target.value)}
            className="w-full bg-theme-input-bg border-theme-input-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-theme-input-focus focus:border-theme-input-focus custom-select"
        >
          {tasks.length > 0 ? (
            tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)
          ) : (
            <option disabled>No tasks to focus on</option>
          )}
        </select>

        <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
             <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle className="text-theme-progress-track" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50%" cy="50%" />
                <circle
                    className={sessionType === 'Work' ? 'text-theme-brand-primary' : 'text-theme-brand-secondary'}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                    style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                />
            </svg>
            <div className="z-10 text-center">
                <div className="text-4xl font-mono font-bold tracking-tighter">{formatTime(timeRemaining)}</div>
                <div className="text-sm uppercase tracking-wider text-theme-text-secondary">{sessionType}</div>
            </div>
        </div>

        <div className="flex justify-center items-center gap-4">
          <button onClick={handleStartPause} disabled={!selectedTaskId} className={`font-bold py-2 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 disabled:opacity-50 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg`}>{isActive ? 'Pause' : 'Start'}</button>
          <button onClick={handleReset} className="font-medium text-sm py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">Reset</button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <div className="w-full sm:w-1/2 space-y-2">
                <label className="block text-sm font-medium text-theme-text-secondary text-center">Work Duration</label>
                <div className="flex items-center justify-center bg-theme-input-bg border border-theme-input-border rounded-lg p-1 focus-within:ring-1 focus-within:ring-theme-input-focus">
                    <input type="number" value={String(workDuration.minutes).padStart(2, '0')} onChange={e => handleDurationChange('work', 'minutes', e.target.value)} className={inputBaseClasses} placeholder="mm"/>
                    <span className="font-bold text-theme-text-secondary text-lg">:</span>
                    <input type="number" value={String(workDuration.seconds).padStart(2, '0')} onChange={e => handleDurationChange('work', 'seconds', e.target.value)} className={inputBaseClasses} placeholder="ss"/>
                </div>
                <div className="flex justify-center gap-2 pt-1">
                    {WORK_PRESETS.map(preset => (
                        <button
                            key={`work-${preset}`}
                            type="button"
                            onClick={() => handlePresetClick('work', preset)}
                            className={`${presetButtonClass} ${
                                workDuration.minutes === preset && workDuration.seconds === 0
                                    ? 'bg-theme-brand-primary text-white'
                                    : 'bg-theme-input-bg/50 text-theme-text-secondary hover:bg-theme-input-bg'
                            }`}
                        >
                            {preset}m
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
                <label className="block text-sm font-medium text-theme-text-secondary text-center">Break Duration</label>
                 <div className="flex items-center justify-center bg-theme-input-bg border border-theme-input-border rounded-lg p-1 focus-within:ring-1 focus-within:ring-theme-input-focus">
                    <input type="number" value={String(breakDuration.minutes).padStart(2, '0')} onChange={e => handleDurationChange('break', 'minutes', e.target.value)} className={inputBaseClasses} placeholder="mm"/>
                    <span className="font-bold text-theme-text-secondary text-lg">:</span>
                    <input type="number" value={String(breakDuration.seconds).padStart(2, '0')} onChange={e => handleDurationChange('break', 'seconds', e.target.value)} className={inputBaseClasses} placeholder="ss"/>
                </div>
                 <div className="flex justify-center gap-2 pt-1">
                    {BREAK_PRESETS.map(preset => (
                        <button
                            key={`break-${preset}`}
                            type="button"
                            onClick={() => handlePresetClick('break', preset)}
                             className={`${presetButtonClass} ${
                                breakDuration.minutes === preset && breakDuration.seconds === 0
                                    ? 'bg-theme-brand-secondary text-white'
                                    : 'bg-theme-input-bg/50 text-theme-text-secondary hover:bg-theme-input-bg'
                            }`}
                        >
                            {preset}m
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default FocusTimer;