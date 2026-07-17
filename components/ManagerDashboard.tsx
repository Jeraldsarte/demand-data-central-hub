'use client';

import { useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Plus, Calendar, X, Loader2 } from 'lucide-react';
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

export default function ManagerDashboard({
  initialTasks = [],
  currentUser,
}: {
  initialTasks?: Task[];
  currentUser?: string | null;
}) {
  const { theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    segment: '',
    type: '',
    brand: '',
    agent: '',
    dueDate: '',
    auditor: '',
  });

  const handleStatusChange = (rowIndex: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, status: newStatus } : t));
    startTransition(async () => {
      await updateTaskStatus(rowIndex, newStatus);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask = {
      dateRequested: new Date().toLocaleDateString(),
      ...formData
    };

    startTransition(async () => {
      const res = await addTask(newTask);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({ segment: '', type: '', brand: '', agent: '', dueDate: '', auditor: '' });
        alert("Task successfully added to Google Sheets! Refreshing window...");
        window.location.reload();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Demand Data Central</h1>
          <span className="mt-2 inline-flex rounded-full bg-purple-100 dark:bg-purple-900/50 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
            Manager Control Center
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-300"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content (Table) */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center text-gray-500">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p>No active rows parsed from Sheet1.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Agent</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Segment</th>
                <th className="p-4">Type</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Auditor</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {tasks.map((task, idx) => (
                <tr key={task.rowIndex || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{task.agent || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{task.brand || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{task.segment || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{task.type || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{task.dueDate || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{task.auditor || '—'}</td>
                  <td className="p-4 text-right">
                    <select
                      value={task.status || 'Assigned'}
                      disabled={isPending}
                      onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)}
                      className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md text-xs font-medium px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Task</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Agent Name</label>
                <input required type="text" value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Jerald" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Brand</label>
                  <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Danner" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Segment</label>
                  <input required type="text" value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Work" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Type</label>
                  <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Bulks" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Due Date</label>
                  <input required type="text" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. 7/25/2026" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Auditor</label>
                <input type="text" value={formData.auditor} onChange={e => setFormData({...formData, auditor: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. Mark Vincen" />
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors mt-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Append to Google Sheet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}