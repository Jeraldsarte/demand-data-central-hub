'use client';

import { useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Plus, Calendar, X, Loader2, CheckCircle2, ListTodo } from 'lucide-react';
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

// Helper to get distinct colors for status UI components
const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    case 'On-going':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    case 'For Audit':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
    case 'Hold':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    default: // Assigned
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
  }
};

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

  // Grouping tasks dynamically by Agent name
  const groupedAgents = tasks.reduce((groups: { [key: string]: Task[] }, task) => {
    const agentName = task.agent?.trim() || 'Unassigned';
    if (!groups[agentName]) {
      groups[agentName] = [];
    }
    groups[agentName].push(task);
    return groups;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Dynamic Action Banner Header */}
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

      {/* Grid Display Layer */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center text-gray-500">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p>No active rows parsed from Sheet1.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedAgents).map(([agentName, agentTasks]) => {
            const completedCount = agentTasks.filter(t => t.status === 'Completed').map(t => t.status).length;
            const totalCount = agentTasks.length;
            const allocationPercentage = Math.round((completedCount / totalCount) * 100);

            return (
              <div 
                key={agentName}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between overflow-hidden"
              >
                {/* Agent Statistics Header Block */}
                <div className="p-4 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{agentName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <ListTodo className="w-3 h-3" /> {totalCount} total tasks assigned
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                      {completedCount}/{totalCount} Done
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium tracking-wide">
                      {allocationPercentage}% Clear Rate
                    </p>
                  </div>
                </div>

                {/* Agent Assigned Tasks List */}
                <div className="p-4 flex-1 space-y-3 max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                  {agentTasks.map((task, idx) => (
                    <div 
                      key={task.rowIndex || idx} 
                      className={`pt-3 first:pt-0 flex flex-col justify-between gap-2`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                            {task.brand || 'No Brand'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {task.segment || 'General'} • {task.type || 'Standard'}
                          </p>
                        </div>

                        {/* Distinct Status Dropdown Selector */}
                        <select
                          value={task.status || 'Assigned'}
                          disabled={isPending}
                          onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)}
                          className={`border rounded-md text-[11px] font-semibold px-2.5 py-1 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-blue-500 ${getStatusClasses(task.status || 'Assigned')}`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Timeline Metadata Footnote */}
                      <div className="flex justify-between items-center text-[11px] text-gray-400">
                        <span>Due: <span className="text-gray-600 dark:text-gray-300 font-medium">{task.dueDate || '—'}</span></span>
                        <span>Auditor: <span className="text-gray-600 dark:text-gray-300 font-medium">{task.auditor || '—'}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal Overlay */}
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
                <input required type="text" value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. Florante" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Brand</label>
                  <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. Altra" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Segment</label>
                  <input required type="text" value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. Active" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Type</label>
                  <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. Assistance" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Due Date</label>
                  <input required type="text" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. 7/18/2026" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Auditor</label>
                <input type="text" value={formData.auditor} onChange={e => setFormData({...formData, auditor: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white" placeholder="e.g. Mark Vincen" />
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