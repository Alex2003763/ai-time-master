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
import ConfirmationModal from './components/ConfirmationModal';

function AppContent() {
  const tasksHook = useTasks();
  const [activePage, setActivePage] = useState('Dashboard');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

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

  const handleDeleteRequest = (taskId: string) => {
    // Close the edit modal before opening the confirmation modal
    if (isModalOpen) {
      handleCloseModal();
    }
    setTaskToDelete(taskId);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      tasksHook.deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
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
        return <MainContent {...tasksHook} onEditTask={handleOpenEditTaskModal} onDeleteRequest={handleDeleteRequest} />;
      case 'Focus':
        return <FocusPage tasks={tasksHook.tasks.filter(t => !t.completed)} logFocusSession={tasksHook.logFocusSession} />;
      case 'Calendar':
        return <CalendarPage tasks={tasksHook.tasks} onTaskClick={handleOpenEditTaskModal} />;
      case 'Reports':
        return <ReportsPage tasks={tasksHook.tasks} />;
      case 'Settings':
        // FIX: Pass required 'tasks' and 'addTasks' props to the SettingsPage component.
        return <SettingsPage tasks={tasksHook.tasks} addTasks={tasksHook.addTasks} />; 
      default:
        return <MainContent {...tasksHook} onEditTask={handleOpenEditTaskModal} onDeleteRequest={handleDeleteRequest} />;
    }
  };

  return (
    <div className="min-h-screen text-theme-text-primary font-sans antialiased">
       <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
      {isModalOpen && (
        <TaskModal 
          task={editingTask}
          onSave={editingTask ? tasksHook.updateTask : tasksHook.addTask} 
          onClose={handleCloseModal}
          onDelete={handleDeleteRequest} 
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