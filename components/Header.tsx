import React from 'react';

const AppIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="app-icon-gradient-header" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-brand-primary)"/>
                <stop offset="1" stopColor="var(--color-brand-secondary)"/>
            </linearGradient>
        </defs>
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="url(#app-icon-gradient-header)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7V12L15 13.5" stroke="url(#app-icon-gradient-header)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 6L17 7" stroke="url(#app-icon-gradient-header)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-20 bg-theme-bg/80 backdrop-blur-lg p-4 lg:hidden flex items-center justify-between border-b border-theme-card-border">
      <div className="flex items-center gap-3">
        <AppIcon />
        <h1 className="text-xl font-bold tracking-wider text-theme-text-primary">AI Time Master</h1>
      </div>
    </header>
  );
};

export default Header;