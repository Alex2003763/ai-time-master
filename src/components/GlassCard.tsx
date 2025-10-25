import React from 'react';

// Fix: Extend React.HTMLAttributes<HTMLDivElement> to allow any standard div props, including onClick and style.
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <div
      {...props}
      className={`bg-theme-card-bg backdrop-blur-xl rounded-2xl border border-theme-card-border shadow-lg transition-all duration-300 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
