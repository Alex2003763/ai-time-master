import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GlassCard from './GlassCard';
import { Task } from '../types';
import { playSound } from '../utils/soundPlayer';

interface FocusTimerProps {
  tasks: Task[];
  logFocusSession: (taskId: string, duration: number) => void;
}

// Helper function to format duration for notifications
const formatDurationForNotification = (minutes: number, seconds: number): string => {
    const parts = [];
    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }
    if (seconds > 0) {
        parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }
    if (parts.length === 0) {
        return "a short break";
    }
    return parts.join(' and ');
};


const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, logFocusSession }) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const workDurationInSeconds = useMemo(() => workMinutes * 60 + workSeconds, [workMinutes, workSeconds]);
  const breakDurationInSeconds = useMemo(() => breakMinutes * 60 + breakSeconds, [breakMinutes, breakSeconds]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [sessionType, setSessionType] = useState<'Work' | 'Break'>('Work');
  const [timeRemaining, setTimeRemaining] = useState(workDurationInSeconds);
  const [isActive, setIsActive] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  // Update time remaining if duration is changed while timer is paused
  useEffect(() => {
    if (!isActive) {
      if (sessionType === 'Work') {
        setTimeRemaining(workDurationInSeconds);
      } else { // sessionType is 'Break'
        setTimeRemaining(breakDurationInSeconds);
      }
    }
  }, [workDurationInSeconds, breakDurationInSeconds, isActive, sessionType]);
  
  // Main timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining <= 0 && isActive) { // Check isActive to prevent running on initial load if duration is 0
      // Timer finished, handle session switch
      playSound();
      
      const finishedSessionType = sessionType;
      const nextSessionType = finishedSessionType === 'Work' ? 'Break' : 'Work';

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
          const title = finishedSessionType === 'Work' ? 'Focus session complete!' : "Break's over!";
          const body = finishedSessionType === 'Work' 
              ? `Time for ${formatDurationForNotification(breakMinutes, breakSeconds)}.` 
              : "Time to get back to focusing!";
          
          navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
              registration.showNotification(title, { body, icon: '/icon.svg' });
            } else {
              new Notification(title, { body, icon: '/icon.svg' });
            }
          });
      }

      // Log the session if it was a work session
      if (finishedSessionType === 'Work' && selectedTaskId) {
          logFocusSession(selectedTaskId, workDurationInSeconds);
      }
      
      // Stop the timer and switch to the next session
      setIsActive(false);
      setSessionType(nextSessionType);
      setTimeRemaining(nextSessionType === 'Work' ? workDurationInSeconds : breakDurationInSeconds);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining, workDurationInSeconds, breakDurationInSeconds, selectedTaskId, logFocusSession, sessionType, breakMinutes, breakSeconds]);
  
  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setSessionType('Work');
    setTimeRemaining(workDurationInSeconds);
  }, [workDurationInSeconds]);

  const handleStartPause = () => {
    if (!selectedTaskId || (workDurationInSeconds === 0 && sessionType === 'Work')) return;
    
    // Request notification permission if not granted or denied
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    const duration = sessionType === 'Work' ? workDurationInSeconds : breakDurationInSeconds;
    return duration > 0 ? duration : 1; // Prevent division by zero for progress calculation
  }, [sessionType, workDurationInSeconds, breakDurationInSeconds]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalDuration;
  const offset = circumference * (1 - progress);
  
  const inputClasses = "w-full text-center bg-theme-input-bg border-theme-input-border rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-theme-input-focus";

  // Handlers for duration inputs
  const handleMinuteChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
    setter(Math.max(0, parseInt(value) || 0));
  };

  const handleSecondChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
    setter(Math.max(0, Math.min(59, parseInt(value) || 0)));
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">Focus Timer</h2>
      <div className="space-y-4">
        <select 
            value={selectedTaskId || ''} 
            onChange={e => {
              setSelectedTaskId(e.target.value)
              handleReset();
            }}
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
        
        <div className="flex justify-between gap-4 pt-4 border-t border-theme-card-border/50">
            <div className="w-1/2">
                <label className="block text-sm font-medium text-theme-text-secondary text-center mb-1">Work Duration</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={workMinutes} onChange={e => handleMinuteChange(setWorkMinutes, e.target.value)} className={inputClasses} placeholder="min" min="0"/>
                    <span className="text-theme-text-secondary font-bold">:</span>
                    <input type="number" value={workSeconds} onChange={e => handleSecondChange(setWorkSeconds, e.target.value)} className={inputClasses} placeholder="sec" min="0" max="59"/>
                </div>
            </div>
            <div className="w-1/2">
                <label className="block text-sm font-medium text-theme-text-secondary text-center mb-1">Break Duration</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={breakMinutes} onChange={e => handleMinuteChange(setBreakMinutes, e.target.value)} className={inputClasses} placeholder="min" min="0"/>
                    <span className="text-theme-text-secondary font-bold">:</span>
                    <input type="number" value={breakSeconds} onChange={e => handleSecondChange(setBreakSeconds, e.target.value)} className={inputClasses} placeholder="sec" min="0" max="59"/>
                </div>
            </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default FocusTimer;