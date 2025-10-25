import React from 'react';
import FocusTimer from './FocusTimer';
import { Task } from '../types';

interface FocusPageProps {
  tasks: Task[];
  logFocusSession: (taskId: string, duration: number) => void;
}

const FocusPage: React.FC<FocusPageProps> = ({ tasks, logFocusSession }) => {
  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-10 lg:justify-center lg:pt-0">
      <div className="w-full max-w-md animate-slide-in-up">
        <FocusTimer tasks={tasks} logFocusSession={logFocusSession} />
      </div>
    </main>
  );
};

export default FocusPage;