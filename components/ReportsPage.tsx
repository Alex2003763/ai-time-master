import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Task, TaskCategory, TaskPriority } from '../types';
import GlassCard from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';

interface ReportsPageProps {
  tasks: Task[];
}

const DARK_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
const LIGHT_COLORS = ['#0A6EBD', '#00A49F', '#E8A32A', '#E86A42', '#8F00DB', '#DB2540'];

const ReportsPage: React.FC<ReportsPageProps> = ({ tasks }) => {
  const { themeType } = useTheme();
  const chartColors = themeType === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalFocusTime = tasks.reduce((acc, task) => acc + (task.timeSpent || 0), 0);
    
    const categoryCounts = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<TaskCategory, number>);

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : 0,
      totalFocusTime,
      categoryData,
      priorityCounts,
    };
  }, [tasks]);

  const formatFocusTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const tooltipStyle = themeType === 'dark'
    ? { backgroundColor: 'rgba(20,20,40,0.8)', border: '1px solid rgba(255,255,255,0.2)' }
    : { backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.2)' };


  return (
    <main className="flex-1">
      <div className="flex flex-col gap-6">
        <GlassCard className="p-6 animate-slide-in-up">
          <h1 className="text-3xl font-bold">Your Productivity Report</h1>
          <p className="text-theme-text-secondary">An overview of your performance and habits.</p>
        </GlassCard>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 flex flex-col items-center justify-center animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="text-6xl font-bold text-theme-brand-primary">{stats.completionRate}%</div>
              <p className="text-theme-text-primary mt-2 text-lg">Completion Rate</p>
              <p className="text-sm text-theme-text-secondary">({stats.completedTasks} of {stats.totalTasks} tasks)</p>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col items-center justify-center animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <div className="text-6xl font-bold text-theme-brand-secondary">{formatFocusTime(stats.totalFocusTime)}</div>
              <p className="text-theme-text-primary mt-2 text-lg">Total Focus Time</p>
            </GlassCard>
            
            <GlassCard className="p-6 flex flex-col justify-center animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                <h3 className="text-lg font-bold mb-3 text-center">Priority Breakdown</h3>
                <div className="text-left w-full space-y-2">
                    {Object.values(TaskPriority).map(priority => (
                        <div key={priority} className="flex justify-between items-center">
                            <span className="text-theme-text-secondary">{priority}</span>
                            <span className="font-semibold bg-theme-input-bg px-2 py-1 rounded-md">{stats.priorityCounts[priority] || 0}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>

        <GlassCard className="p-6 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-xl font-bold mb-4 text-center">Tasks by Category</h2>
          {stats.categoryData.length > 0 ? (
            <div className="w-full h-96">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    // Fix: Explicitly convert percent to a Number before multiplication to fix type error.
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-theme-text-secondary text-center py-10">No tasks with categories to display.</p>
          )}
        </GlassCard>
      </div>
    </main>
  );
};

export default ReportsPage;