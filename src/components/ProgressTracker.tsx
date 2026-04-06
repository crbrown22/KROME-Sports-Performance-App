import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  Plus, 
  TrendingUp, 
  History, 
  Trash2, 
  Activity,
  Calendar,
  ChevronDown,
  ChevronLeft
} from "lucide-react";
import { formatDate } from '../utils/date';
import ConfirmModal from './ConfirmModal';
import { getProgress, addProgress, deleteProgress } from '../services/firebaseService';

interface ProgressEntry {
  id: string;
  user_id: number;
  metric_name: string;
  metric_value: number;
  unit: string;
  recorded_at: any;
}

interface ProgressTrackerProps {
  userId: number;
  isAdmin?: boolean;
  onBack?: () => void;
  isOwnProfile?: boolean;
}

const METRICS = [
  { name: "Vertical Jump", unit: "in" },
  { name: "40yd Dash", unit: "s" },
  { name: "Bench Press", unit: "lbs" },
  { name: "Squat", unit: "lbs" },
  { name: "Deadlift", unit: "lbs" },
  { name: "Cleans", unit: "lbs" },
  { name: "Broad Jump", unit: "ft" },
];

export default function ProgressTracker({ userId, isAdmin = false, onBack, isOwnProfile = true }: ProgressTrackerProps) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0].name);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  
  // Form state
  const [newMetricName, setNewMetricName] = useState(METRICS[0].name);
  const [newValue, setNewValue] = useState("");

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/progress/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      const data = await res.json();
      setEntries(data as ProgressEntry[]);
    } catch (err) {
      console.error("Failed to fetch progress", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const metric = METRICS.find(m => m.name === newMetricName);
    
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          metric_name: newMetricName,
          metric_value: val,
          unit: metric?.unit || ""
        })
      });
      if (!res.ok) throw new Error("Failed to add entry");

      fetchProgress();
      setNewValue("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add entry", err);
    }
  };

  const deleteEntry = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDeleteEntry = async () => {
    if (deleteConfirm.id === null) return;
    try {
      const res = await fetch(`/api/progress/${deleteConfirm.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      fetchProgress();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

  const filteredEntries = entries
    .filter(e => e.metric_name === selectedMetric)
    .sort((a, b) => {
      const dateA = a.recorded_at?.toDate ? a.recorded_at.toDate() : new Date(a.recorded_at);
      const dateB = b.recorded_at?.toDate ? b.recorded_at.toDate() : new Date(b.recorded_at);
      return dateA.getTime() - dateB.getTime();
    })
    .map((e, index, arr) => {
      const prevValue = index > 0 ? arr[index - 1].metric_value : null;
      const diff = prevValue !== null ? e.metric_value - prevValue : 0;
      const percentDiff = prevValue !== null && prevValue !== 0 ? (diff / prevValue) * 100 : 0;
      
      const date = e.recorded_at?.toDate ? e.recorded_at.toDate() : new Date(e.recorded_at);
      const dateStr = date.toISOString().split('T')[0];
      return {
        ...e,
        date: formatDate(dateStr),
        fullDate: formatDate(dateStr),
        value: e.metric_value,
        diff: diff,
        percentDiff: percentDiff
      };
    });

  const currentMetric = METRICS.find(m => m.name === selectedMetric);

  return (
    <div className="min-h-screen p-8 relative">
      <img 
        src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2000&auto=format&fit=crop" 
        alt="Progress Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-10"
        referrerPolicy="no-referrer"
      />
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Header & Metric Selector */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-zinc-900/50 p-8 rounded-[40px] border border-white/5 krome-outline">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-[20px] bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-[0_0_20px_rgba(197,156,33,0.2)]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight leading-none break-words">
                <span className="text-white">Performance</span> <span className="text-gold">Tracking</span>
              </h2>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-black mt-1 break-words">Monitor your athletic evolution</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white appearance-none focus:border-gold/50 outline-none transition-all cursor-pointer hover:bg-black/60"
                aria-label="Select performance metric to view"
              >
                {METRICS.map(m => (
                  <option key={m.name} value={m.name} className="bg-zinc-900">{m.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gold pointer-events-none" aria-hidden="true" />
            </div>
            
            {isOwnProfile && !isAdmin && (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${
                  showAddForm 
                    ? 'bg-zinc-800 text-white border border-white/10' 
                    : 'bg-gold text-black shadow-gold/20 hover:scale-105 active:scale-95'
                }`}
                aria-label={showAddForm ? "Close add entry form" : "Add new performance entry"}
                aria-expanded={showAddForm}
              >
                {showAddForm ? 'Cancel' : (
                  <>
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    Log Entry
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      {/* Add Entry Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddEntry} className="bg-zinc-900/80 border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row gap-6 items-end backdrop-blur-xl krome-outline" aria-label="Add performance entry form">
              <div className="flex-1 space-y-3 w-full">
                <label htmlFor="newMetricName" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Select Metric</label>
                <select 
                  id="newMetricName"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:border-gold/50 outline-none transition-all"
                >
                  {METRICS.map(m => (
                    <option key={m.name} value={m.name} className="bg-zinc-900">{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <label htmlFor="newValue" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Value ({METRICS.find(m => m.name === newMetricName)?.unit})</label>
                <input 
                  id="newValue"
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:border-gold/50 outline-none transition-all placeholder:text-white/10"
                  required
                  aria-required="true"
                />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto bg-gold text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20"
                aria-label="Log performance entry"
              >
                Log Entry
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Section */}
      <div className="space-y-8">
        <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-8 md:p-12 shadow-2xl krome-outline">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">
                {selectedMetric} <span className="text-gold">Progression</span>
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Performance data visualization</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {filteredEntries.length > 1 && (
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full border ${
                  filteredEntries[filteredEntries.length - 1].value > filteredEntries[0].value
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : filteredEntries[filteredEntries.length - 1].value < filteredEntries[0].value
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-white/5 text-white/60 border-white/10'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {filteredEntries[filteredEntries.length - 1].value > filteredEntries[0].value ? '+' : ''}
                  {(((filteredEntries[filteredEntries.length - 1].value - filteredEntries[0].value) / filteredEntries[0].value) * 100).toFixed(1)}% All Time
                </div>
              )}
              {filteredEntries.length > 0 && (
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
                  {filteredEntries.length} Data Points
                </div>
              )}
            </div>
          </div>

          <div className="h-[450px] w-full">
            {filteredEntries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredEntries}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c59c21" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#c59c21" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    unit={` ${currentMetric?.unit}`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-3">{label}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-white font-black text-2xl italic">{data.value}</span>
                              <span className="text-gold font-black text-xs uppercase italic">{currentMetric?.unit}</span>
                            </div>
                            {data.diff !== 0 && (
                              <div className={`flex items-center gap-1 text-[10px] font-black mt-2 ${data.diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {data.diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                {data.diff > 0 ? '+' : ''}{data.diff.toFixed(1)} ({data.diff > 0 ? '+' : ''}{data.percentDiff.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: 'rgba(197,156,33,0.2)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#c59c21" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                    activeDot={{ r: 8, fill: '#fff', stroke: '#c59c21', strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                  <Activity className="w-10 h-10 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="font-black uppercase tracking-[0.2em] text-sm text-white/40">Insufficient Data</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/10 mt-2">Need at least 2 entries to generate chart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent History List */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-8 md:p-12 shadow-2xl krome-outline">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">
                Recent <span className="text-gold">Logs</span>
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Historical performance data</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
              <History className="w-6 h-6" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-20 bg-black/40 rounded-[32px] border border-white/5">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <History className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No entries recorded yet</p>
              </div>
            ) : [...filteredEntries].reverse().slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-gold/30 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-black/40 flex flex-col items-center justify-center border border-white/10">
                    <span className="text-sm font-black text-white italic leading-none">{entry.value}</span>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">{entry.unit}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase italic tracking-tight text-white">{entry.metric_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{entry.fullDate}</span>
                      {entry.diff !== 0 && (
                        <span className={`text-[9px] font-black ${entry.diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {entry.diff > 0 ? '+' : ''}{entry.diff.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && !isAdmin && (
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/20 text-white/20 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5"
                    aria-label={`Delete entry for ${entry.metric_name} on ${entry.fullDate}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Progress Entry"
        message="Are you sure you want to delete this progress entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDeleteEntry}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
      </div>
    </div>
  );
}
