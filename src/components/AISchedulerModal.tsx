import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { parseTaskFromText } from '../services/geminiService';
import { NewTaskPayload } from '../types';

interface AISchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (taskData: NewTaskPayload) => void;
}

const AISchedulerModal: React.FC<AISchedulerModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const taskData = await parseTaskFromText(text);
      onSchedule(taskData as NewTaskPayload);
      setText('');
      // onClose is called by the parent after it receives the data
    } catch (err: any) {
      setError(err.message || 'Failed to parse task. Please try again or be more specific.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <GlassCard className="w-full max-w-lg p-6 sm:p-8 relative animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary text-2xl leading-none" disabled={isLoading}>&times;</button>
        <h2 className="text-2xl font-bold mb-2">AI Task Assistant</h2>
        <p className="text-theme-text-secondary mb-6 text-sm">Describe a task, and AI will fill in the details. e.g., "Schedule a team meeting tomorrow at 2pm for 1 hour."</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your task here..."
            className="w-full h-24 bg-theme-input-bg border-theme-input-border rounded-md shadow-sm p-3 focus:outline-none focus:ring-1 focus:ring-theme-input-focus transition"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-400 mt-2 animate-fade-in">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-secondary-bg text-theme-btn-secondary-text hover:bg-theme-btn-secondary-hover-bg disabled:opacity-50">
              {isLoading && <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              <span>{isLoading ? 'Processing...' : 'Generate Task'}</span>
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AISchedulerModal;