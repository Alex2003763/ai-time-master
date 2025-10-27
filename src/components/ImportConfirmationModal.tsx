import React from 'react';
import GlassCard from './GlassCard';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskCount: number;
}

const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({ isOpen, onClose, onConfirm, taskCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-md p-6 relative animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Confirm Import</h2>
        <p className="text-theme-text-secondary mb-6">
          Found <span className="font-bold text-theme-text-primary">{taskCount}</span> {taskCount === 1 ? 'task' : 'tasks'} in the file.
          Would you like to add them to your schedule?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg"
          >
            Confirm Import
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default ImportConfirmationModal;
