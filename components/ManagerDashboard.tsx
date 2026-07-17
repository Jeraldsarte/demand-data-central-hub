'use client';

import { useState, useTransition, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Plus, Calendar, X, Loader2, ListTodo, ChevronLeft, ChevronRight, Search, Check, AlertCircle } from 'lucide-react';
import { updateTaskStatus, addTask, assignTaskAgent } from '@/app/actions';

interface Task {
  rowIndex: number;
  dateRequested?: string;
  segment?: string;
  brand?: string;
  task?: string;
  type?: string;
  agent?: string;
  dueDate?: string;
  status?: string;
  auditor?: string;
}

const STATUS_OPTIONS = ['Assigned', 'On-going', 'For Audit', 'Completed', 'Hold', 'Cancelled', 'Requested'];

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    case 'On-going': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    case 'For Audit': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
    case 'Hold': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
    case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    case 'Requested': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 animate-pulse';
    default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
  }
};

export default function ManagerDashboard({ initialTasks = [] }: { initialTasks?: Task[]; currentUser?: string | null; }) {
  const { theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [formData, setFormData] = useState({ task: '', segment: '', type: '', brand: '', agent: '', dueDate: '', auditor: '' });

  const handleStatusChange = (rowIndex: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, status: newStatus } : t));
    startTransition(async () => { await updateTaskStatus(rowIndex, newStatus); });
  };

  const handleApproveRequest = (rowIndex: number, rawAgentString: string) => {
    // Strips out "Requested: " prefix to isolate actual name
    const cleanAgent = rawAgentString.replace('Requested: ', '').trim();
    setTasks(prev => prev.map(t => t.rowIndex === rowIndex ? { ...t, agent: cleanAgent, status: 'Assigned' } : t));
    startTransition(async () => {
      await assignTaskAgent(rowIndex, cleanAgent, 'Assigned');
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addTask({ dateRequested: new Date().toLocaleDateString(), ...formData });
      if (res.success) window.location.reload();
    });
  };

  // Extract task items explicitly flagged as active worker requests
  const pendingRequests = useMemo(() => tasks.filter(t => t.status === 'Requested'), [tasks]);

  const counts = useMemo(() => {
    return tasks.reduce((acc: { [key: string]: number }, task) => {
      const status = task.status || 'Assigned';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { All: tasks.length });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'active') {
      const selectedTime = new Date(selectedDate).setHours(0,0,0,0);
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskTime = new Date(task.dueDate).setHours(0,0,0,0);
        if (taskTime === selectedTime) return true;
        if (taskTime < selectedTime && !['Completed', 'Cancelled'].includes(task.status || '')) return true;
        return false;
      });
    }

    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'All' || (task.status || 'Assigned') === statusFilter;
      const cleanQuery = searchQuery.toLowerCase().trim();
      return matchesStatus && (!cleanQuery || 
        task.agent?.toLowerCase().includes(cleanQuery) ||
        task.brand?.toLowerCase().includes(cleanQuery) ||
        task.task?.toLowerCase().includes(cleanQuery) ||
        task.type?.toLowerCase().includes(cleanQuery));
    });
  }, [tasks, activeTab, selectedDate, statusFilter, searchQuery]);

  const groupedAgents = filteredTasks.reduce((groups: { [key: string]: Task[] }, task) => {
    const agentName = task.agent?.trim() || 'Unassigned';
    if (!groups[agentName]) groups[agentName] = [];
    groups[agentName].push(task);
    return groups;
  }, {});

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / 25));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * 25, currentPage * 25);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 🔔 PENDING AGENT REQUESTS NOTIFICATION MODULE */}
      {pendingRequests.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4" /> Pending Agent Task Requests ({pendingRequests.length})
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map(task => (
              <div key={task.rowIndex} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/60 shadow-sm flex items-center justify-between gap-2">
                <div className="text-xs truncate">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block truncate">{task.agent?.replace('Requested: ', '')} wants to claim:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{task.brand} • {task.task || 'Unnamed'}</span>
                </div>
                <button onClick={() => handleApproveRequest(task.rowIndex, task.agent || '')} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors shrink-0">
                  <Check className="w-3 h-3" /> Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => { setActiveTab('active'); setCurrentPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            Active Overview
          </button>
          <button onClick={() => { setActiveTab('all'); setCurrentPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            All Tasks (History)
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'active' && (
            <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* --- ACTIVE GRID CARDS --- */}
      {activeTab === 'active' && (
        Object.keys(groupedAgents).length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"><p>No workloads logged for this date.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedAgents).map(([agentName, agentTasks]) => {
              const completedCount = agentTasks.filter(t => t.status === 'Completed').length;
              return (
                <div key={agentName} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base truncate max-w-[180px]">{agentName.startsWith('Requested: ') ? agentName.replace('Requested: ', 'Requested By: ') : agentName}</h3>
                      <p className="text-xs text-gray-500"><ListTodo className="w-3 h-3 inline mr-1" />{agentTasks.length} assigned</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">{completedCount}/{agentTasks.length} Done</span>
                  </div>
                  <div className="p-4 flex-1 space-y-3 max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                    {agentTasks.map((task, idx) => (
                      <div key={idx} className="pt-3 first:pt-0 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{task.task || 'No Task Name'}</h4>
                            <p className="text-[11px] font-medium text-gray-500">{task.brand} • {task.type}</p>
                          </div>
                          {task.status === 'Requested' ? (
                            <button onClick={() => handleApproveRequest(task.rowIndex, task.agent || '')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[10px] font-bold shrink-0">Approve</button>
                          ) : (
                            <select value={task.status || 'Assigned'} disabled={isPending} onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)} className={`border rounded-md text-[10px] font-bold px-1.5 py-0.5 outline-none cursor-pointer ${getStatusClasses(task.status || 'Assigned')}`}>
                              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span className={task.dueDate && new Date(task.dueDate) < new Date(selectedDate) ? "text-red-500 font-bold" : ""}>Due: {task.dueDate || '—'}</span>
                          <span>Auditor: {task.auditor || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* --- HISTORY DATA TABLE --- */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search history..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm outline-none text-gray-900 dark:text-white" />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3 text-xs font-semibold">
              <span className="text-gray-400 mr-2">Status:</span>
              <button onClick={() => { setStatusFilter('All'); setCurrentPage(1); }} className={`px-2.5 py-1 rounded-full border ${statusFilter === 'All' ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-500'}`}>All ({counts.All})</button>
              {STATUS_OPTIONS.map(opt => <button key={opt} onClick={() => { setStatusFilter(opt); setCurrentPage(1); }} className={`px-2.5 py-1 rounded-full border ${statusFilter === opt ? 'bg-blue-600 text-white font-bold' : 'text-gray-500'}`}>{opt} ({counts[opt] || 0})</button>)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase tracking-wider text-xs font-bold border-b border-gray-200 dark:border-gray-700">
                <tr><th className="p-4">Task Name</th><th className="p-4">Agent</th><th className="p-4">Brand</th><th className="p-4">Type</th><th className="p-4">Due Date</th><th className="p-4 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTasks.map((task, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                    <td className="p-4 font-semibold">{task.task || '—'}</td>
                    <td className="p-4 font-medium">{task.agent || '—'}</td>
                    <td className="p-4">{task.brand}</td>
                    <td className="p-4 text-gray-400">{task.type}</td>
                    <td className="p-4">{task.dueDate}</td>
                    <td className="p-4 text-right">
                      {task.status === 'Requested' ? (
                        <button onClick={() => handleApproveRequest(task.rowIndex, task.agent || '')} className="bg-indigo-600 text-white font-bold px-2 py-1 text-xs rounded">Approve</button>
                      ) : (
                        <select value={task.status || 'Assigned'} disabled={isPending} onChange={(e) => handleStatusChange(task.rowIndex, e.target.value)} className={`border rounded text-[11px] font-bold px-2 py-1 ${getStatusClasses(task.status || '')}`}>
                          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
              <span>Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, filteredTasks.length)} of {filteredTasks.length} tasks</span>
              <div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="p-1 border disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="p-1 border disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW UPDATED ADD TASK MODAL INPUT PAGE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Pipeline Task</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Task Name</label>
                <input required type="text" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none text-gray-900 dark:text-white focus:border-blue-500" placeholder="e.g. LL Result Rerun / Prebook Audit" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Agent Name (Leave blank to add later)</label>
                <input type="text" value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none text-gray-900 dark:text-white focus:border-blue-500" placeholder="Type name OR leave empty to pool" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Brand</label>
                  <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" placeholder="e.g. Orvis" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Segment</label>
                  <input required type="text" value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" placeholder="e.g. Outdoor" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Type</label>
                  <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" placeholder="e.g. Rerun" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Due Date</label>
                  <input required type="text" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" placeholder="e.g. 7/23/2026" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Auditor</label>
                <input type="text" value={formData.auditor} onChange={e => setFormData({...formData, auditor: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" placeholder="e.g. Janroe" />
              </div>
              <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Append to Google Sheet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}