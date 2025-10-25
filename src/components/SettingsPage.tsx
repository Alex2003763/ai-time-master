import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const { theme, setTheme } = useTheme();

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

  return (
    <main className="flex-1">
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