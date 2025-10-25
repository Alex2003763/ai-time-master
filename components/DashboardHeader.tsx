import React from 'react';

interface DashboardHeaderProps {
  isLoading: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isLoading }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-in-up">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome Back!</h1>
        <p className="text-theme-text-secondary">Here's your productivity dashboard.</p>
      </div>
    </div>
  );
};

export default DashboardHeader;