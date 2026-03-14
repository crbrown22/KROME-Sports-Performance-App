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

interface ProgressEntry {
  id: number;
  user_id: number;
  metric_name: string;
  metric_value: number;
  unit: string;
  recorded_at: string;
}

interface ProgressTrackerProps {
  userId: number;
  isAdmin?: boolean;
  onBack?: () => void;
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

export default function ProgressTracker({ userId, isAdmin = false, onBack }: ProgressTrackerProps) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0].name);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [newMetricName, setNewMetricName] = useState(METRICS[0].name);
  const [newValue, setNewValue] = useState("");

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }
      const data = await response.json();
      setEntries(data);
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
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          metric_name: newMetricName,
          metric_value: val,
          unit: metric?.unit || ""
        })
      });

      if (response.ok) {
        fetchProgress();
        setNewValue("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed to add entry", err);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }
    try {
      await fetch(`/api/progress/${id}`, { method: 'DELETE' });
      fetchProgress();
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

  const filteredEntries = entries
    .filter(e => e.metric_name === selectedMetric)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((e, index, arr) => {
      const prevValue = index > 0 ? arr[index - 1].metric_value : null;
      const diff = prevValue !== null ? e.metric_value - prevValue : 0;
      const percentDiff = prevValue !== null && prevValue !== 0 ? (diff / prevValue) * 100 : 0;
      
      const dateStr = e.recorded_at.split(' ')[0].split('T')[0];
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
    <div className="space-y-8">
      {/* Header & Metric Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-gold hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Performance <span className="text-gold">Tracking</span></h2>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Monitor your athletic evolution</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white appearance-none focus:border-gold outline-none transition-colors cursor-pointer"
              aria-label="Select performance metric to view"
            >
              {METRICS.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" aria-hidden="true" />
          </div>
          
          {!isAdmin && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gold text-black p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20 krome-outline"
              aria-label={showAddForm ? "Close add entry form" : "Add new performance entry"}
              aria-expanded={showAddForm}
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Add Entry Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddEntry} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end" aria-label="Add performance entry form">
              <div className="flex-1 space-y-2 w-full">
                <label htmlFor="newMetricName" className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Metric</label>
                <select 
                  id="newMetricName"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-gold outline-none transition-colors"
                >
                  {METRICS.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label htmlFor="newValue" className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Value ({METRICS.find(m => m.name === newMetricName)?.unit})</label>
                <input 
                  id="newValue"
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-gold outline-none transition-colors"
                  required
                  aria-required="true"
                />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold transition-colors krome-outline"
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
        <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white/80">
              {selectedMetric} <span className="text-gold">History</span>
            </h3>
            <div className="flex items-center gap-3">
              {filteredEntries.length > 1 && (
                <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border ${
                  filteredEntries[filteredEntries.length - 1].value > filteredEntries[0].value
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : filteredEntries[filteredEntries.length - 1].value < filteredEntries[0].value
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-white/5 text-white/60 border-white/10'
                }`}>
                  {filteredEntries[filteredEntries.length - 1].value > filteredEntries[0].value ? '+' : ''}
                  {(((filteredEntries[filteredEntries.length - 1].value - filteredEntries[0].value) / filteredEntries[0].value) * 100).toFixed(1)}% All Time
                </span>
              )}
              {filteredEntries.length > 0 && (
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  {filteredEntries.length} Data Points
                </span>
              )}
            </div>
          </div>

          <div className="h-[400px] w-full">
            {filteredEntries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredEntries}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    unit={` ${currentMetric?.unit}`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-xl">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-gold font-black text-lg">
                              {data.value} <span className="text-xs text-white/40 font-normal">{currentMetric?.unit}</span>
                            </p>
                            {data.diff !== 0 && (
                              <p className={`text-xs font-bold mt-1 ${data.diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {data.diff > 0 ? '+' : ''}{data.diff.toFixed(1)} {currentMetric?.unit} ({data.diff > 0 ? '+' : ''}{data.percentDiff.toFixed(1)}%)
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#D4AF37" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <Activity className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-bold uppercase tracking-widest text-sm">Need at least 2 entries to generate chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent History List */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
          <h3 className="text-xl font-black uppercase italic tracking-tight text-white/80 mb-8">
            Recent <span className="text-gold">Logs</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-3xl border border-white/5">
                <p className="text-white/20 text-sm font-bold uppercase tracking-widest">No entries recorded yet</p>
              </div>
            ) : [...filteredEntries].reverse().slice(0, 10).map((entry) => (
              <div key={entry.id} className="group flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-default">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-lg font-black text-gold border border-gold/20">
                    {entry.value}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase tracking-widest text-white/70">{entry.metric_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30 font-mono">{entry.unit}</span>
                      {entry.diff !== 0 && (
                        <span className={`text-xs font-bold ${entry.diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {entry.diff > 0 ? '+' : ''}{entry.diff.toFixed(1)} {entry.unit} ({entry.diff > 0 ? '+' : ''}{entry.percentDiff.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-white/60 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase tracking-wider">{entry.fullDate}</span>
                  </div>
                  {!isAdmin && (
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all krome-outline"
                      aria-label={`Delete entry for ${entry.metric_name} on ${entry.fullDate}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
