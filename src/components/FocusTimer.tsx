import React, { useState, useEffect, useRef, useMemo } from 'react';
import GlassCard from './GlassCard';
import { Task } from '../types';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

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

interface FocusTimerProps {
  tasks: Task[];
  logFocusSession: (taskId: string, duration: number) => void;
}

const workPresets = [{m: 15, s: 0}, {m: 25, s: 0}, {m: 50, s: 0}];
const breakPresets = [{m: 5, s: 0}, {m: 10, s: 0}, {m: 15, s: 0}];

const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, logFocusSession }) => {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [breakSeconds, setBreakSeconds] = useState(0);
  
  const totalWorkSeconds = useMemo(() => workMinutes * 60 + workSeconds, [workMinutes, workSeconds]);
  const totalBreakSeconds = useMemo(() => breakMinutes * 60 + breakSeconds, [breakMinutes, breakSeconds]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [sessionType, setSessionType] = useState<'Work' | 'Break'>('Work');
  const [timeRemaining, setTimeRemaining] = useState(totalWorkSeconds);
  const [isActive, setIsActive] = useState(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (!isActive) {
        const newDuration = sessionType === 'Work' ? totalWorkSeconds : totalBreakSeconds;
        setTimeRemaining(newDuration);
    }
  }, [totalWorkSeconds, totalBreakSeconds, sessionType, isActive]);

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
    document.title = `${formatTime(timeRemaining)} - ${sessionType} | AI Time Master`;
    if (timeRemaining <= 0) {
      playSound();

      const completedSessionType = sessionType;
      if (completedSessionType === 'Work' && selectedTaskId) {
        logFocusSession(selectedTaskId, totalWorkSeconds);
      }

      const nextSession = completedSessionType === 'Work' ? 'Break' : 'Work';
      const notificationTitle = completedSessionType === 'Work' ? 'Focus session complete!' : "Break's over!";
      const notificationBody = completedSessionType === 'Work' ? `Great job! Time for a break.` : "Time to get back to focus!";
      sendNotification(notificationTitle, { body: notificationBody });
      
      setIsActive(false); // Stop the timer
      setSessionType(nextSession);
      setTimeRemaining(nextSession === 'Work' ? totalWorkSeconds : totalBreakSeconds);
    }
  }, [timeRemaining, sessionType, selectedTaskId, totalWorkSeconds, totalBreakSeconds, logFocusSession]);
  
  const handleStartPause = async () => {
    if (isStartDisabled) return;
    if (Notification.permission !== 'granted') {
      await requestNotificationPermission();
    }
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setSessionType('Work');
    setTimeRemaining(totalWorkSeconds);
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    return (sessionType === 'Work' ? totalWorkSeconds : totalBreakSeconds);
  }, [sessionType, totalWorkSeconds, totalBreakSeconds]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 0;
  const offset = circumference * (1 - progress);
  
  const inputClasses = "w-full text-center bg-theme-input-bg border-theme-input-border rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-theme-input-focus";
  const presetButtonClasses = "text-xs font-semibold py-1 px-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg flex-grow text-center active:scale-95 active:shadow-inner";
  const isStartDisabled = !selectedTaskId || totalWorkSeconds <= 0;

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">Focus Timer</h2>
      <div className="space-y-4">
        <select 
            value={selectedTaskId || ''} 
            onChange={e => setSelectedTaskId(e.target.value)}
            disabled={isActive}
            className="w-full bg-theme-input-bg border-theme-input-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-theme-input-focus focus:border-theme-input-focus custom-select disabled:opacity-70"
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
          <button onClick={handleStartPause} disabled={isStartDisabled} className={`font-bold py-2 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 disabled:opacity-50 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg`}>{isActive ? 'Pause' : 'Start'}</button>
          <button onClick={handleReset} className="font-medium text-sm py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">Reset</button>
        </div>
        
        <fieldset className="pt-4 border-t border-theme-card-border/50" disabled={isActive}>
            <legend className="px-2 text-sm font-semibold text-theme-text-secondary">Session Durations</legend>
            <div className="flex justify-between gap-4 pt-2">
                {/* Work Duration Settings */}
                <div className="w-1/2 flex flex-col gap-2">
                    <label htmlFor="work-minutes" className="text-sm text-center font-medium text-theme-text-primary">Work</label>
                    <div className="flex items-center gap-1">
                        <input id="work-minutes" type="number" value={workMinutes} onChange={e => setWorkMinutes(Math.max(0, parseInt(e.target.value) || 0))} placeholder="min" className={inputClasses} aria-label="Work minutes"/>
                        <span className="text-theme-text-secondary font-bold text-lg">:</span>
                        <input type="number" value={workSeconds} onChange={e => setWorkSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} placeholder="sec" className={inputClasses} aria-label="Work seconds"/>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                         {workPresets.map(({ m, s }) => (
                            <button key={`w-${m}-${s}`} type="button" onClick={() => { setWorkMinutes(m); setWorkSeconds(s); }} className={presetButtonClasses} >
                                {m}m
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Break Duration Settings */}
                <div className="w-1/2 flex flex-col gap-2">
                    <label htmlFor="break-minutes" className="text-sm text-center font-medium text-theme-text-primary">Break</label>
                    <div className="flex items-center gap-1">
                        <input id="break-minutes" type="number" value={breakMinutes} onChange={e => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))} placeholder="min" className={inputClasses} aria-label="Break minutes"/>
                        <span className="text-theme-text-secondary font-bold text-lg">:</span>
                        <input type="number" value={breakSeconds} onChange={e => setBreakSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} placeholder="sec" className={inputClasses} aria-label="Break seconds"/>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                         {breakPresets.map(({ m, s }) => (
                            <button key={`b-${m}-${s}`} type="button" onClick={() => { setBreakMinutes(m); setBreakSeconds(s); }} className={presetButtonClasses}>
                                {m}m
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </fieldset>
      </div>
    </GlassCard>
  );
};

export default FocusTimer;
