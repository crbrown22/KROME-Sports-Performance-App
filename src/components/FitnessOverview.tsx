import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { Loader2, TrendingUp, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FitnessOverviewProps {
  userId: string;
  showGenerationCard?: boolean;
}

const WorkoutStatistics = ({ userId }: { userId: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/workout-logs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        const logs = await response.json();
        
        // Aggregate log data
        const aggregated: Record<string, any> = {};
        logs.forEach((log: any) => {
          const data = log.edited_data ? JSON.parse(log.edited_data) : {};
          const category = data.category || 'General';
          if (!aggregated[category]) {
            aggregated[category] = { category, volume: 0, sets: 0, reps: 0, duration: 0 };
          }
          aggregated[category].volume += (data.volume || 0);
          aggregated[category].sets += (data.sets || 0);
          aggregated[category].reps += (data.reps || 0);
          aggregated[category].duration += (data.duration || 0);
        });
        
        setData(Object.values(aggregated));
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [userId, period]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-gold/5 rounded-full blur-[100px] group-hover:bg-gold/10 transition-colors" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
        <div>
          <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-gold" />
            </div>
            Performance <span className="text-gold">Analytics</span>
          </h3>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 ml-13">Volume & training load distribution</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          {['weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[350px] md:h-[450px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={1}/>
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={1}/>
                <stop offset="100%" stopColor="#00ACC1" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="category" 
              stroke="#ffffff20" 
              fontSize={10} 
              fontWeight="900" 
              tickLine={false} 
              axisLine={false} 
              dy={15}
              tick={{ fill: 'rgba(255,255,255,0.4)' }}
            />
            <YAxis 
              stroke="#ffffff10" 
              fontSize={10} 
              fontWeight="bold" 
              tickLine={false} 
              axisLine={false} 
              hide={true}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ 
                backgroundColor: '#09090b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '24px',
                padding: '16px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value: any, name: string) => [value, name]}
            />
            <Bar dataKey="volume" fill="url(#goldGradient)" name="Volume (lbs)" radius={[12, 12, 12, 12]} barSize={40} />
            <Bar dataKey="duration" fill="url(#cyanGradient)" name="Duration (min)" radius={[12, 12, 12, 12]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5 relative z-10">
        {data.map((item, i) => (
          <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center group/card hover:border-gold/30 transition-all">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 group-hover/card:text-gold/50 transition-colors">{item.category}</span>
            <span className="text-lg font-black italic text-white/80">{item.duration}m</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricsGrid = ({ userId }: { userId: string }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, historyRes] = await Promise.all([
          fetch(`/api/metrics/${userId}`),
          fetch(`/api/body-comp/${userId}`)
        ]);

        if (!metricsRes.ok || !historyRes.ok) throw new Error('Failed to fetch data');

        const metricsData = await metricsRes.json();
        const historyData = await historyRes.json();

        setMetrics(metricsData);
        setHistory(historyData);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div className="text-white/40 text-xs">Loading metrics...</div>;
  if (error) return <div className="text-rose-500 text-xs">Error loading metrics: {error}</div>;
  if (!metrics) return <div className="text-white/40 text-xs">No metrics available.</div>;

  const latestComp = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {[
        { label: 'Weight', value: latestComp ? `${latestComp.weight} lbs` : (metrics.initialWeight ? `${metrics.initialWeight} lbs` : 'N/A') },
        { label: 'Body Fat', value: latestComp ? `${latestComp.bodyFat}%` : 'N/A' },
        { label: 'VO2 Max', value: metrics.vo2Max ? `${metrics.vo2Max}` : 'N/A' },
        { label: 'Resting HR', value: metrics.restingHR ? `${metrics.restingHR} bpm` : 'N/A' },
      ].map((m, i) => (
        <div key={i} className="bg-zinc-900/50 border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl krome-outline">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">{m.label}</p>
          <p className="text-lg md:text-xl font-black italic text-gold mt-1">{m.value}</p>
        </div>
      ))}
    </div>
  );
};

export default function FitnessOverview({ userId, showGenerationCard = true }: FitnessOverviewProps) {
  const [overview, setOverview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, historyRes] = await Promise.all([
        fetch(`/api/metrics/${userId}`),
        fetch(`/api/body-comp/${userId}`)
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/fitness-overview/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching fitness overviews:', error);
    }
  };

  const toggleLog = (id: number) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateOverview = async () => {
    setLoading(true);
    try {
      const [metricsRes, nutritionRes, workoutsRes, logsRes] = await Promise.all([
        fetch(`/api/metrics/${userId}`),
        fetch(`/api/nutrition/${userId}`),
        fetch(`/api/workout-logs/${userId}`),
        fetch(`/api/body-composition/${userId}`)
      ]);

      const metrics = metricsRes.ok ? await metricsRes.json() : null;
      const nutrition = nutritionRes.ok ? await nutritionRes.json() : [];
      const workouts = workoutsRes.ok ? await workoutsRes.json() : [];
      const logs = logsRes.ok ? await logsRes.json() : [];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const metricsSummary = metrics ? `Weight: ${metrics.initialWeight}lbs, VO2 Max: ${metrics.vo2Max}` : 'No metrics available';
      const nutritionSummary = nutrition.length > 0 ? `Recent average calories: ${Math.round(nutrition.reduce((acc: number, curr: any) => acc + curr.calories, 0) / nutrition.length)}` : 'No nutrition data';
      const workoutsSummary = workouts.slice(-10).map((w: any) => `${w.workout_id || 'Unknown'}`).join('; ');
      const analysisSummary = logs.slice(-3).map((l: any) => l.analysis.substring(0, 100)).join('; ');

      const prompt = `Analyze the user's fitness journey based on this summary:
      Metrics: ${metricsSummary}
      Nutrition: ${nutritionSummary}
      Workouts: ${workoutsSummary}
      Recent Body Composition Analysis Highlights: ${analysisSummary}

      Provide a concise, encouraging, and highly personalized overview of their progress. Highlight key trends, achievements, and areas for improvement. Keep the response under 500 words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{ text: prompt }] },
      });

      const newOverview = response.text || 'No overview available.';
      setOverview(newOverview);

      // Save to database
      await fetch(`/api/fitness-overview/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overview: newOverview }),
      });
      fetchLogs();
    } catch (error) {
      console.error('Overview generation error:', error);
      setOverview('Error generating overview.');
    } finally {
      setLoading(false);
    }
  };

  const getComparativeData = () => {
    if (history.length < 2) {
      const latest = history.length > 0 ? history[history.length - 1] : null;
      return {
        weight: { current: latest ? `${latest.weight} lbs` : (metrics?.initialWeight ? `${metrics.initialWeight} lbs` : 'N/A'), previous: 'N/A', trend: 'down' as const },
        bodyFat: { current: latest ? `${latest.bodyFat}%` : 'N/A', previous: 'N/A', trend: 'down' as const },
        vo2Max: { current: metrics?.vo2Max ? `${metrics.vo2Max}` : 'N/A', previous: 'N/A', trend: 'up' as const }
      };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    return {
      weight: { 
        current: `${latest.weight} lbs`, 
        previous: `${previous.weight} lbs`, 
        trend: latest.weight <= previous.weight ? 'down' as const : 'up' as const 
      },
      bodyFat: { 
        current: `${latest.bodyFat}%`, 
        previous: `${previous.bodyFat}%`, 
        trend: latest.bodyFat <= previous.bodyFat ? 'down' as const : 'up' as const 
      },
      vo2Max: { 
        current: metrics?.vo2Max ? `${metrics.vo2Max}` : 'N/A', 
        previous: 'N/A', 
        trend: 'up' as const 
      }
    };
  };

  const compData = getComparativeData();

  return (
    <div className="space-y-8 relative min-h-screen">
      <img 
        src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2000&auto=format&fit=crop" 
        alt="Analytics Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-5"
        referrerPolicy="no-referrer"
      />
      <div className="relative z-10 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Athlete <span className="text-gold">Dashboard</span></h2>
      </div>
      
      {/* Comparative Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ComparativeMetricCard title="Weight" current={compData.weight.current} previous={compData.weight.previous} trend={compData.weight.trend} />
        <ComparativeMetricCard title="Body Fat" current={compData.bodyFat.current} previous={compData.bodyFat.previous} trend={compData.bodyFat.trend} />
        <ComparativeMetricCard title="VO2 Max" current={compData.vo2Max.current} previous={compData.vo2Max.previous} trend={compData.vo2Max.trend} />
      </div>

      <MetricsGrid userId={userId} />

      <WorkoutStatistics userId={userId} />
      {showGenerationCard && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <h3 className="font-bold uppercase italic flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            Fitness Journey Overview
          </h3>
          <p className="text-white/60 text-sm mb-8">
            This overview is generated by analyzing your body metrics, nutrition logs, workout history, and body composition data to provide personalized insights and trends.
          </p>
          <button 
            onClick={generateOverview}
            disabled={loading}
            className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 mb-6"
            aria-label="Generate new fitness overview using AI"
          >
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : 'Generate Fitness Overview'}
          </button>
          {overview && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-white/80 whitespace-pre-wrap text-sm">{overview}</p>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <h3 className="font-bold uppercase italic mb-6">Overview History</h3>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => toggleLog(log.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                  aria-expanded={expandedLogs[log.id]}
                  aria-label={`Toggle overview from ${new Date(log.created_at).toLocaleString()}`}
                >
                  <div className="text-[10px] text-white/60">{new Date(log.created_at).toLocaleString()}</div>
                  {expandedLogs[log.id] ? <ChevronUp className="w-4 h-4 text-white/60" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-white/60" aria-hidden="true" />}
                </button>
                <AnimatePresence>
                  {expandedLogs[log.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-white/60 whitespace-pre-wrap text-sm">{log.overview}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ComparativeMetricCard({ title, current, previous, trend }: { title: string, current: string, previous: string, trend: 'up' | 'down' }) {
  const isNeutral = previous === 'N/A';
  
  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-[40px] p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-gold/30 transition-all">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl opacity-50 group-hover:bg-gold/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
          <div className="text-[10px] font-black italic text-white/40 uppercase tracking-[0.2em]">{title}</div>
        </div>

        <div className="flex items-baseline justify-between gap-4 min-w-0">
          <div className="text-3xl sm:text-4xl md:text-5xl font-black italic text-white tracking-tighter transition-transform group-hover:scale-[1.05] origin-left duration-500 truncate min-w-0 flex-1">
            {current.split(' ')[0]}
            <span className="text-[10px] md:text-xs font-black uppercase text-white/20 not-italic ml-1.5 md:ml-2 tracking-widest leading-none">
              {current.split(' ')[1] || ''}
            </span>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            {!isNeutral && (
              <div className={`flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-tight py-1 px-2 md:px-3 rounded-full ${trend === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                {previous}
              </div>
            )}
            <div className="text-[7px] md:text-[8px] font-bold text-white/10 uppercase tracking-widest mt-2 whitespace-nowrap">Baseline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
