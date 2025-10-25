import React, { useState } from 'react';

interface FloatingActionButtonProps {
  onNewTaskClick: () => void;
  onAIAssistantClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onNewTaskClick, onAIAssistantClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNewTask = () => {
    onNewTaskClick();
    setIsOpen(false);
  };

  const handleAIAssistant = () => {
    onAIAssistantClick();
    setIsOpen(false);
  };
  
  const subButtonBaseClass = "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transform-gpu transition-all duration-200 hover:scale-110 active:scale-95";
  const labelBaseClass = "bg-theme-card-bg text-theme-text-primary text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap";

  return (
    <div className="fixed bottom-28 right-4 lg:bottom-8 lg:right-8 z-30" aria-live="polite">
      <div className="relative">
        {/* Sub-buttons container */}
        <div 
          className={`absolute right-0 bottom-full mb-4 flex w-max flex-col items-end gap-4 transition-all duration-300 ease-in-out ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* AI Assistant Button */}
          <div className="flex items-center gap-4">
            <span className={labelBaseClass}>
              AI Assistant
            </span>
            <button
              onClick={handleAIAssistant}
              className={`${subButtonBaseClass} bg-gradient-to-tr from-theme-brand-secondary to-theme-brand-tertiary`}
              aria-label="Use AI Assistant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
          </div>

          {/* New Task Button */}
          <div className="flex items-center gap-4">
             <span className={labelBaseClass}>
              New Task
            </span>
            <button
              onClick={handleNewTask}
              className={`${subButtonBaseClass} bg-gradient-to-tr from-theme-brand-primary to-theme-brand-secondary`}
              aria-label="Add New Task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main FAB */}
        <button
          onClick={toggleMenu}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-theme-brand-primary to-theme-brand-tertiary text-white shadow-xl transform-gpu transition-transform duration-300 hover:scale-110 active:scale-95"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close task creation menu" : "Open task creation menu"}
        >
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45 scale-110' : 'rotate-0'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default FloatingActionButton;
