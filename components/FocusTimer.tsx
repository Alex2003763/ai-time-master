import React, { useState, useEffect, useRef, useMemo } from 'react';
import GlassCard from './GlassCard';
import { Task } from '../types';

interface FocusTimerProps {
  tasks: Task[];
  logFocusSession: (taskId: string, duration: number) => void;
}

const playSound = () => {
  try {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Could not play sound:", error);
  }
};


const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, logFocusSession }) => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [sessionType, setSessionType] = useState<'Work' | 'Break'>('Work');
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
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
            logFocusSession(selectedTaskId, workDuration * 60);
        }
        setIsActive(false);
        const nextSession = sessionType === 'Work' ? 'Break' : 'Work';
        setSessionType(nextSession);
        setTimeRemaining(nextSession === 'Work' ? workDuration * 60 : breakDuration * 60);
    }
  }, [timeRemaining]);
  

  const handleStartPause = () => {
    if (!selectedTaskId) return;
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setSessionType('Work');
    setTimeRemaining(workDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    return (sessionType === 'Work' ? workDuration : breakDuration) * 60;
  }, [sessionType, workDuration, breakDuration]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalDuration;
  const offset = circumference * (1 - progress);
  
  const inputClasses = "mt-1 w-full bg-theme-input-bg border-theme-input-border rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-theme-input-focus";

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
        
        <div className="flex justify-between gap-4 pt-4">
            <div className="w-1/2">
                <label className="block text-sm font-medium text-theme-text-secondary">Work (min)</label>
                <input type="number" value={workDuration} onChange={e => setWorkDuration(Math.max(1, parseInt(e.target.value) || 1))} className={inputClasses}/>
            </div>
            <div className="w-1/2">
                <label className="block text-sm font-medium text-theme-text-secondary">Break (min)</label>
                <input type="number" value={breakDuration} onChange={e => setBreakDuration(Math.max(1, parseInt(e.target.value) || 1))} className={inputClasses}/>
            </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default FocusTimer;