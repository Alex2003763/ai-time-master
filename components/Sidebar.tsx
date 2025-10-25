import React from 'react';
import GlassCard from './GlassCard';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const AppIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="app-icon-gradient-sidebar" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-brand-primary)"/>
                <stop offset="1" stopColor="var(--color-brand-secondary)"/>
            </linearGradient>
        </defs>
        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="url(#app-icon-gradient-sidebar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7V12L15 13.5" stroke="url(#app-icon-gradient-sidebar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 6L17 7" stroke="url(#app-icon-gradient-sidebar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    
    // Desktop Sidebar Content
    const desktopNavigation = (
        <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex-grow">
                <div className="flex items-center gap-3 mb-10">
                    <AppIcon />
                    <h1 className="text-xl font-bold tracking-wider text-theme-text-primary">AI Time Master</h1>
                </div>
                <nav>
                  <ul>
                    {NAV_ITEMS.map((item) => (
                      <li key={item.name} className="mb-2">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage(item.name);
                          }}
                          className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                            activePage === item.name
                              ? 'bg-theme-nav-active-bg text-theme-text-primary font-semibold'
                              : 'text-theme-text-secondary hover:bg-theme-nav-hover-bg hover:text-theme-text-primary'
                          }`}
                        >
                          {item.icon}
                          <span className="font-medium">{item.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
            </div>
        </GlassCard>
    );

    // Mobile Bottom Nav Content
    const mobileNavigation = (
        <nav className="fixed bottom-0 left-0 right-0 p-2 z-30 lg:hidden">
            <GlassCard className="rounded-2xl">
                <ul className="flex justify-around items-center p-1">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.name}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
                                className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 transform-gpu ${
                                    activePage === item.name
                                    ? 'bg-theme-nav-active-bg/80 text-theme-brand-primary scale-100 shadow-inner'
                                    : 'text-theme-text-secondary hover:bg-theme-nav-hover-bg hover:text-theme-text-primary hover:scale-105'
                                }`}
                                aria-current={activePage === item.name ? 'page' : undefined}
                            >
                                <div className={`${activePage === item.name ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>{item.icon}</div>
                                <span className={`text-xs mt-1 transition-opacity ${activePage === item.name ? 'opacity-100 font-semibold' : 'opacity-80'}`}>{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </GlassCard>
        </nav>
    );


    return (
        <>
            {/* Mobile Bottom Nav */}
            {mobileNavigation}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
                <div className="sticky top-8">
                    {desktopNavigation}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;