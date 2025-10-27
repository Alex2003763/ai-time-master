import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import FocusPage from './components/FocusPage';
import CalendarPage from './components/CalendarPage';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import { useTasks } from './hooks/useTasks';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import { Task, NewTaskPayload } from './types';
import TaskModal from './components/TaskModal';
import AISchedulerModal from './components/AISchedulerModal';
import FloatingActionButton from './components/FloatingActionButton';

function AppContent() {
  const tasksHook = useTasks();
  const [activePage, setActivePage] = useState('Dashboard');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);

  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
    tasksHook.setError(null);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

 const handleSaveTask = (taskData: Task | NewTaskPayload) => {
    if ('id' in taskData && taskData.id) {
        tasksHook.updateTask(taskData as Task);
    } else {
        tasksHook.addTask(taskData as NewTaskPayload);
    }
    handleCloseModal();
  };

  const handleOpenAIScheduler = () => {
    setIsAISchedulerOpen(true);
  };

  const handleCloseAIScheduler = () => {
    setIsAISchedulerOpen(false);
  };

  const handleScheduleWithAI = (taskData: NewTaskPayload) => {
    tasksHook.addTask(taskData);
    setIsAISchedulerOpen(false);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <MainContent {...tasksHook} onEditTask={handleOpenEditTaskModal} />;
      case 'Focus':
        return <FocusPage tasks={tasksHook.tasks.filter(t => !t.completed)} logFocusSession={tasksHook.logFocusSession} />;
      case 'Calendar':
        return <CalendarPage tasks={tasksHook.tasks} onTaskClick={handleOpenEditTaskModal} />;
      case 'Reports':
        return <ReportsPage tasks={tasksHook.tasks} />;
      case 'Settings':
        return <SettingsPage tasks={tasksHook.tasks} addTasks={tasksHook.addTasks} />; 
      default:
        return <MainContent {...tasksHook} onEditTask={handleOpenEditTaskModal} />;
    }
  };

  return (
    <div className="min-h-screen text-theme-text-primary font-sans antialiased">
      {isModalOpen && (
        <TaskModal 
          task={editingTask}
          onSave={handleSaveTask} 
          onClose={handleCloseModal} 
        />
      )}
      <AISchedulerModal
        isOpen={isAISchedulerOpen}
        onClose={handleCloseAIScheduler}
        onSchedule={handleScheduleWithAI}
      />
      <Header />
      <div className="flex flex-col lg:flex-row p-4 sm:p-6 lg:p-8 gap-6">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
        />
        <div key={activePage} className="flex-1 pb-24 lg:pb-0 animate-fade-in">
          {renderContent()}
        </div>
      </div>
      <FloatingActionButton 
        onNewTaskClick={handleOpenAddTaskModal}
        onAIAssistantClick={handleOpenAIScheduler}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}