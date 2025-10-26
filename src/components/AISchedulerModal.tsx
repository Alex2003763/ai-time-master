import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { parseTaskFromText } from '../services/geminiService';
import { NewTaskPayload } from '../types';

interface AISchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (taskData: NewTaskPayload) => void;
}

// A small component to display a piece of reviewed information
const InfoPill: React.FC<{ label: string, value: React.ReactNode, className?: string }> = ({ label, value, className }) => (
    <div className={`bg-theme-input-bg/70 p-3 rounded-lg ${className}`}>
        <p className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-theme-text-primary font-medium">{value}</p>
    </div>
);


const AISchedulerModal: React.FC<AISchedulerModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'input' | 'review'>('input');
  const [parsedTask, setParsedTask] = useState<NewTaskPayload | null>(null);
  
  const examplePrompts = [
      "Schedule a team meeting tomorrow at 2pm for 1 hour.",
      "Finish the quarterly report by Friday EOD, priority high #Work",
      "Go grocery shopping every Saturday morning",
  ];

  const handleClose = () => {
    // Reset state before closing
    setText('');
    setError(null);
    setView('input');
    setParsedTask(null);
    setIsLoading(false);
    onClose();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const taskData = await parseTaskFromText(text);
      setParsedTask(taskData);
      setView('review');
    } catch (err: any) {
      setError(err.message || 'Failed to parse task. Please try again or be more specific.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirm = () => {
    if (parsedTask) {
        onSchedule(parsedTask);
        handleClose();
    }
  };

  const handleGoBack = () => {
      setView('input');
      setParsedTask(null);
      setError(null); // Clear error when going back
  };
  
  const formatRecurring = (recurring: NewTaskPayload['recurring']) => {
    if (!recurring) return 'Not recurring';
    const { frequency, interval, endDate } = recurring;
    let str = `Repeats every ${interval > 1 ? interval : ''} ${frequency.replace('ly', '')}${interval > 1 ? 's' : ''}`;
    if (endDate) {
        const date = new Date(endDate);
        // Adjust for timezone offset before displaying
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        str += ` until ${adjustedDate.toLocaleDateString()}`;
    }
    return str;
  }
  
  const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      // check if it's an all-day event
      if (isoString.endsWith('T00:00:00.000Z')) {
          return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
      }
      return date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
      <GlassCard className="w-full max-w-lg p-6 sm:p-8 relative animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary text-2xl leading-none" disabled={isLoading}>&times;</button>
        
        {view === 'input' && (
          <>
            <h2 className="text-2xl font-bold mb-2">AI Task Assistant</h2>
            <p className="text-theme-text-secondary mb-6 text-sm">Describe a task, and our AI will schedule it for you.</p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., 'Team meeting every Tuesday at 2pm for 1 hour'"
                className="w-full h-24 bg-theme-input-bg border-theme-input-border rounded-md shadow-sm p-3 focus:outline-none focus:ring-1 focus:ring-theme-input-focus transition"
                disabled={isLoading}
              />
              <div className="mt-3 text-xs text-theme-text-secondary/80">
                  <p className="font-semibold mb-1">Try something like:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map(p => (
                       <button key={p} type="button" onClick={() => setText(p)} className="px-2 py-1 bg-theme-input-bg rounded hover:bg-theme-nav-hover-bg transition-colors">{p}</button>
                    ))}
                  </div>
              </div>
              {error && <p className="text-sm text-red-400 mt-2 animate-fade-in">{error}</p>}
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isLoading} className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isLoading || !text.trim()} className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-secondary-bg text-theme-btn-secondary-text hover:bg-theme-btn-secondary-hover-bg disabled:opacity-50">
                  {isLoading && <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  <span>{isLoading ? 'Thinking...' : 'Generate Plan'}</span>
                </button>
              </div>
            </form>
          </>
        )}

        {view === 'review' && parsedTask && (
          <>
            <h2 className="text-2xl font-bold mb-2">Review Task</h2>
            <p className="text-theme-text-secondary mb-6 text-sm">Does this look right? Confirm to add it to your schedule.</p>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                <InfoPill label="Title" value={parsedTask.title} className="col-span-2" />
                
                <div className="grid grid-cols-2 gap-4">
                    <InfoPill label="Starts" value={formatDate(parsedTask.startTime)} />
                    <InfoPill label="Ends" value={parsedTask.endTime ? formatDate(parsedTask.endTime) : 'Not set'} />
                    <InfoPill label="Category" value={parsedTask.category} />
                    <InfoPill label="Priority" value={parsedTask.priority} />
                </div>
                
                {parsedTask.recurring && (
                     <InfoPill label="Recurrence" value={formatRecurring(parsedTask.recurring)} />
                )}

                {parsedTask.subtasks && parsedTask.subtasks.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider mb-2">Subtasks</p>
                        <div className="bg-theme-input-bg/70 p-3 rounded-lg space-y-2">
                           {parsedTask.subtasks.map((st, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-theme-text-secondary"></div>
                                    <span className="text-theme-text-primary">{st.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={handleGoBack} className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">Go Back</button>
                <button type="button" onClick={handleConfirm} className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg">Confirm & Create</button>
              </div>
          </>
        )}
      </GlassCard>
    </div>
  );
};

export default AISchedulerModal;