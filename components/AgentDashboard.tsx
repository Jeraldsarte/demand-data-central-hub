'use client';

import { useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Plus, Calendar } from 'lucide-react';
import { updateTaskStatus, addTask } from '@/app/actions';

interface Task {
  rowIndex: number;
  dateRequested?: string;
  segment?: string;
  brand?: string;
  type?: string;
  agent?: string;
  dueDate?: string;
  status?: string;
  auditor?: string;
}

const STATUS_OPTIONS = ['Assigned', 'On-going', 'For Audit', 'Completed', 'Hold', 'Cancelled'];

export default function AgentDashboard({
  initialTasks = [],
  currentUser,
  isAdmin = false,
}: {
  initialTasks?: Task[];
  currentUser?: string | null;
  isAdmin?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Status Update Handler
  const handleStatusChange = (rowIndex: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, status: newStatus } : t));
    startTransition(async () => {
      await updateTaskStatus(rowIndex, newStatus);
    });
  };

  // Mock quick-add for Manager (In reality you'd use a form/modal here)
  const handleQuickAdd = () => {
    const newTask = {
      dateRequested: new Date().toLocaleDateString(),
      segment: "New Segment",
      type: "Audit",
      brand: "New Brand",
      agent: "Unassigned",
      dueDate: new Date().toLocaleDateString(),
      auditor: "Pending"
    };

    startTransition(async () => {
      const res = await addTask(newTask);
      if (res.success) {
        alert("Test task added to Google Sheets! Refresh to see it.");
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team Workload</h1>
          {isAdmin && (
            <span className="mt-2 inline-flex rounded-full bg-purple-100 dark:bg-purple-900/50 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
              Manager View
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button onClick={handleQuickAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Task Grid */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center text-gray-500">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p>No tasks assigned.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task, idx) => (
            <div key={task.rowIndex || idx} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col justify-between">
              
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-white">{task.agent || 'Unassigned'}</div>
                  
                  {/* Interactive Status Dropdown */}
                  <select
                    value={task.status || 'Assigned'}
                    onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)}
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md text-xs font-medium px-2 py-1 outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{opt}</option>
                    ))}
                  </select>

                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="font-medium">{task.brand} • {task.type}</div>
                  <div>Due: <span className="font-medium">{task.dueDate || 'N/A'}</span></div>
                  <div>Auditor: <span className="font-medium">{task.auditor || 'N/A'}</span></div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}