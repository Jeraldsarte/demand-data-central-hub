'use client';

// 1. Add useEffect
import { useState, useTransition, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Calendar, Hand, Info } from 'lucide-react';
// 2. Import getTasks
import { updateTaskStatus, assignTaskAgent, getTasks } from '@/app/actions';

interface Task {
  rowIndex: number;
  brand?: string;
  task?: string;
  type?: string;
  agent?: string;
  dueDate?: string;
  status?: string;
  auditor?: string;
}

const STATUS_OPTIONS = ['Assigned', 'On-going', 'For Audit', 'Completed', 'Hold', 'Cancelled'];

const getStatusClasses = (status: string) => {
  // ... (Keep your existing switch statement)
  switch (status) {
    case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    case 'On-going': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    case 'For Audit': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
    case 'Hold': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
    case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    case 'Requested': return 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800';
    default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
  }
};

export default function AgentDashboard({ initialTasks = [], currentUser = "Guest" }: { initialTasks?: Task[]; currentUser?: string; isAdmin?: boolean; }) {
  const { theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [agentTab, setAgentTab] = useState<'mine' | 'pool'>('mine');

  // 3. ADD THIS: Keep local state synced
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // 4. ADD THIS: Silent Polling Engine for Agents (Fires every 15 seconds)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const freshTasks = await getTasks();
        if (freshTasks && freshTasks.length > 0) {
          setTasks(freshTasks);
        }
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleStatusChange = (rowIndex: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, status: newStatus } : t));
    startTransition(async () => { await updateTaskStatus(rowIndex, newStatus); });
  };

  const handleClaimRequest = (rowIndex: number) => {
    const requestString = `Requested: ${currentUser}`;
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, agent: requestString, status: 'Requested' } : t));
    
    startTransition(async () => {
      const res = await assignTaskAgent(rowIndex, requestString, 'Requested');
      if (res.success) {
        alert("Task successfully claimed! Waiting for your manager to authorize approval.");
      }
    });
  };

  // ... (Keep the rest of your AgentDashboard component exactly the same from here down)
  // ... (filteredTasks and return statement)

 // 1. Filter Engine: Separate user's own tasks from completely unassigned pool tasks
  const filteredTasks = useMemo(() => {
    const userLower = currentUser.toLowerCase().trim();

    if (agentTab === 'pool') {
      // The open pool shows completely unassigned tasks OR tasks this specific user is currently requesting
      return tasks.filter(task => {
        const agentField = (task.agent || '').toLowerCase().trim();
        const isUnassigned = agentField === "" || agentField === "unassigned";
        const isMyRequest = agentField.includes('requested:') && agentField.includes(userLower);
        
        return isUnassigned || isMyRequest;
      });
    }

    // Tab == 'mine' (Personal Task queue mapped against dates)
    const selectedTime = new Date(selectedDate).setHours(0,0,0,0);
    return tasks.filter(task => {
      const agentField = (task.agent || '').toLowerCase().trim();
      
      // STRICT CHECK: Must belong to this user, and cannot be a pending request or unassigned
      const isMyActiveTask = agentField.includes(userLower) && !agentField.includes('requested:');
      if (!isMyActiveTask) return false;

      // Date verification
      if (!task.dueDate) return false;
      const taskTime = new Date(task.dueDate).setHours(0,0,0,0);
      
      const isDateMatch = taskTime === selectedTime;
      const isCarryOver = taskTime < selectedTime && !['Completed', 'Cancelled'].includes(task.status || '');
      
      return isDateMatch || isCarryOver;
    });
  }, [tasks, selectedDate, agentTab, currentUser]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation and Selector Layout Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => setAgentTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${agentTab === 'mine' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            My Queue
          </button>
          <button onClick={() => setAgentTab('pool')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${agentTab === 'pool' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            Open Tasks Pool
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {agentTab === 'mine' && (
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
          )}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* --- RENDER LOGIC --- */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center text-gray-500">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p>{agentTab === 'mine' ? 'Your queue is completely clear for this date!' : 'The open task pool is currently empty.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task, idx) => (
             <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">{task.task || 'Unnamed Task'}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-1">{task.brand} • {task.type}</p>
                  </div>
                  
                  {/* Action Split: Claims vs Status Dropdown depending on which view is active */}
                  {agentTab === 'pool' ? (
                    task.status === 'Requested' ? (
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">Requested</span>
                    ) : (
                      <button disabled={isPending} onClick={() => handleClaimRequest(task.rowIndex)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors shrink-0">
                        <Hand className="w-3 h-3" /> Claim Task
                      </button>
                    )
                  ) : (
                    <select value={task.status || 'Assigned'} disabled={isPending} onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)} className={`border rounded-md text-[11px] font-bold px-2 py-1 outline-none cursor-pointer ${getStatusClasses(task.status || '')}`}>
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>

                <div className="text-xs space-y-1.5 border-t border-gray-50 dark:border-gray-700/60 pt-3">
                  <div className={agentTab === 'mine' && task.dueDate && new Date(task.dueDate) < new Date(selectedDate) ? "text-red-500 font-bold" : "text-gray-500"}>
                    <span className="text-gray-400 font-normal">Due Date:</span> {task.dueDate || '—'}
                  </div>
                  <div className="text-gray-500"><span className="text-gray-400 font-normal">Auditor:</span> {task.auditor || 'Pending'}</div>
                  
                  {agentTab === 'pool' && task.status === 'Requested' && (
                    <div className="text-[11px] text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-1 rounded flex items-center gap-1 mt-1 font-medium">
                      <Info className="w-3 h-3" /> You submitted a request to claim this row.
                    </div>
                  )}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}