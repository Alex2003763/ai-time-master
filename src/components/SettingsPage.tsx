import React, { useState, useEffect, useRef } from 'react';
import GlassCard from './GlassCard';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { Task, NewTaskPayload } from '../types';
import { generateICS, parseICS } from '../utils/calendarUtils';
import ImportConfirmationModal from './ImportConfirmationModal';


interface SettingsPageProps {
  tasks: Task[];
  addTasks: (tasks: NewTaskPayload[]) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ tasks, addTasks }) => {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [tasksToImport, setTasksToImport] = useState<NewTaskPayload[] | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(storedKey);
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setSaveStatus('API Key saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };
  
  const handleExport = () => {
    try {
      const icsContent = generateICS(tasks);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ai-time-master-export.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export tasks:", error);
        alert("An error occurred while exporting tasks.");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            if (!content) throw new Error("File is empty.");
            
            const parsedTasks = parseICS(content);
            if(parsedTasks.length === 0) {
                setImportStatus({type: 'error', message: "No valid tasks found in the file."});
                return;
            }
            setTasksToImport(parsedTasks);
            setIsImportModalOpen(true);
        } catch (error: any) {
            console.error("Failed to parse ICS file:", error);
            setImportStatus({type: 'error', message: `Error parsing file: ${error.message}`});
        } finally {
            // Reset file input to allow re-uploading the same file
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.onerror = () => {
        setImportStatus({type: 'error', message: "Failed to read the file."});
    }
    reader.readAsText(file);
  };
  
  const confirmImport = () => {
      if (tasksToImport) {
          addTasks(tasksToImport);
          setImportStatus({ type: 'success', message: `${tasksToImport.length} tasks imported successfully!`});
          setTimeout(() => setImportStatus(null), 5000);
      }
      closeImportModal();
  };

  const closeImportModal = () => {
      setIsImportModalOpen(false);
      setTasksToImport(null);
  };

  return (
    <main className="flex-1">
      {isImportModalOpen && tasksToImport && (
        <ImportConfirmationModal
          isOpen={isImportModalOpen}
          onClose={closeImportModal}
          onConfirm={confirmImport}
          taskCount={tasksToImport.length}
        />
      )}
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <GlassCard className="p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-theme-text-secondary">Customize your application experience.</p>
        </GlassCard>
        
        <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-2">Appearance</h2>
            <p className="text-theme-text-secondary mb-4">Select a theme to personalize the look and feel of the app.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {THEMES.map((t) => (
                <div key={t.id} onClick={() => setTheme(t.id)} className="cursor-pointer group">
                  <div 
                    className={`relative rounded-lg h-20 w-full transition-all duration-200 border-2 ${theme === t.id ? 'border-theme-brand-primary scale-105 shadow-lg' : 'border-theme-card-border group-hover:border-theme-brand-secondary group-hover:scale-105'}`}
                    style={{ background: `linear-gradient(135deg, ${t.colors.join(', ')})` }}
                  >
                    {theme === t.id && (
                       <div className="absolute -top-2 -right-2 w-6 h-6 bg-theme-brand-primary rounded-full flex items-center justify-center text-white border-2 border-theme-bg">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                    )}
                  </div>
                  <p className={`mt-2 text-center text-sm font-medium transition-colors ${theme === t.id ? 'text-theme-text-primary' : 'text-theme-text-secondary group-hover:text-theme-text-primary'}`}>{t.name}</p>
                </div>
              ))}
            </div>
        </GlassCard>

        <GlassCard className="p-6 animate-slide-in-up">
          <h2 className="text-xl font-bold mb-2">Data Management</h2>
          <p className="text-sm text-theme-text-secondary mb-4">
            Export your tasks to a universal `.ics` file or import tasks from an existing calendar. Compatible with Google Calendar, Apple Calendar, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleExport}
              className="w-full sm:w-auto font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-secondary-bg text-theme-btn-secondary-text hover:bg-theme-btn-secondary-hover-bg"
            >
              Export All Tasks
            </button>
            <label className="w-full sm:w-auto cursor-pointer font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-default-bg text-theme-btn-default-text hover:bg-theme-btn-default-hover-bg">
              Import from File...
              <input type="file" accept=".ics,text/calendar" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            </label>
          </div>
           {importStatus && <p className={`text-sm mt-3 animate-fade-in ${importStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{importStatus.message}</p>}
        </GlassCard>

        <GlassCard className="p-6 animate-slide-in-up">
          <form onSubmit={handleSaveKey}>
            <h2 className="text-xl font-bold mb-2">Gemini API Key</h2>
            <p className="text-sm text-theme-text-secondary mb-4">
              Your API key is stored locally in your browser and is never sent to our servers. You can get your key from Google AI Studio.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="flex-grow w-full bg-theme-input-bg border-theme-input-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-theme-input-focus focus:border-theme-input-focus transition"
              />
              <button
                type="submit"
                className="w-full sm:w-auto font-semibold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border shadow-md active:shadow-inner active:scale-95 border-theme-btn-border bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover-bg"
              >
                Save
              </button>
            </div>
            {saveStatus && <p className="text-sm text-green-400 mt-2 animate-fade-in">{saveStatus}</p>}
          </form>
        </GlassCard>

      </div>
    </main>
  );
};

export default SettingsPage;