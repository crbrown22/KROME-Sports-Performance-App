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

  useEffect(() => {
    // In a real app, fetch statistics from backend
    // Mocking data for now
    setData([
      { category: 'Strength', volume: 4000, sets: 20, reps: 100, duration: 45 },
      { category: 'Conditioning', volume: 2000, sets: 10, reps: 50, duration: 30 },
      { category: 'Mobility', volume: 500, sets: 5, reps: 20, duration: 20 },
    ]);
  }, [userId, period]);

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] md:rounded-[48px] p-6 md:p-12 shadow-2xl krome-outline">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-gold" />
          Workout <span className="text-gold">Statistics</span>
        </h3>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as any)}
          className="bg-black/50 border border-white/5 rounded-full px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none focus:border-gold transition-colors"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="h-[300px] md:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="category" stroke="#ffffff20" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#ffffff20" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
            <Bar dataKey="volume" fill="#D4AF37" name="Volume" radius={[8, 8, 0, 0]} />
            <Bar dataKey="sets" fill="#008080" name="Sets" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-black italic">{current}</div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
          {previous}
        </div>
      </div>
    </div>
  );
}
