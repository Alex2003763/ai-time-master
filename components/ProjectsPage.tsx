import React from 'react';
import GlassCard from './GlassCard';

const ProjectsPage: React.FC = () => {
  return (
    <main className="flex-1">
      <GlassCard className="p-6 h-full min-h-[80vh] flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-4">Projects</h1>
        <p className="text-theme-text-secondary text-lg">This feature is coming soon!</p>
        <p className="text-theme-text-secondary/70 mt-2">You'll be able to group your tasks into projects here.</p>
      </GlassCard>
    </main>
  );
};

export default ProjectsPage;