import React from 'react';
import GlassCard from './GlassCard';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <GlassCard className="w-full max-w-md p-6 relative animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-theme-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-4">
           <button
            onClick={onClose}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-danger-bg text-theme-btn-danger-text hover:bg-theme-btn-danger-hover-bg"
          >
            Delete
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default ConfirmationModal;