import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Apple, 
  Calendar, 
  ChevronRight, 
  Target,
  Award,
  Zap,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

interface AthleteDashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

export default function AthleteDashboard({ user, onNavigate }: AthleteDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, nutritionRes] = await Promise.all([
          fetch(`/api/metrics/${user.id}`),
          fetch(`/api/nutrition/${user.id}/latest`)
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (nutritionRes.ok) setNutrition(await nutritionRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const stats = [
    { 
      label: 'Weight', 
      value: metrics?.weight || '--', 
      unit: 'lbs', 
      icon: Activity, 
      color: 'text-gold',
      trend: '+0.5' 
    },
    { 
      label: 'Body Fat', 
      value: metrics?.body_fat || '--', 
      unit: '%', 
      icon: Target, 
      color: 'text-blue-400',
      trend: '-0.2'
    },
    { 
      label: 'Daily Calories', 
      value: nutrition?.calories || '--', 
      unit: 'kcal', 
      icon: Apple, 
      color: 'text-green-400',
      trend: 'On Track'
    },
    { 
      label: 'Workouts', 
      value: '12', 
      unit: 'this month', 
      icon: Zap, 
      color: 'text-purple-400',
      trend: '+2'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">
            Mission Control
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
            Welcome back, {user.username}. Your performance is trending up.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-2xl flex items-center gap-2">
            <Award className="w-4 h-4 text-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">Elite Tier</span>
          </div>
          <button 
            onClick={() => onNavigate('programCalendar')}
            className="p-2 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900/50 border border-white/5 p-5 rounded-[32px] backdrop-blur-xl group hover:border-white/20 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black uppercase italic">{stat.value}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase">{stat.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black uppercase italic flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Performance Trend
            </h3>
            <div className="flex gap-2">
              {['7D', '30D', '90D'].map(p => (
                <button key={p} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Mon', value: 65 },
                { date: 'Tue', value: 72 },
                { date: 'Wed', value: 68 },
                { date: 'Thu', value: 85 },
                { date: 'Fri', value: 82 },
                { date: 'Sat', value: 94 },
                { date: 'Sun', value: 88 },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Session */}
        <div className="bg-gold border border-gold rounded-[40px] p-8 text-black relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl -mr-32 -mt-32 group-hover:bg-white/30 transition-all" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Next Session</span>
              </div>
              <h3 className="text-3xl font-black uppercase italic leading-tight mb-2">
                Hypertrophy Phase 1
              </h3>
              <p className="text-sm font-bold opacity-60 uppercase tracking-widest mb-8">
                Today @ 5:30 PM
              </p>
            </div>

            <button 
              onClick={() => onNavigate('workoutTracker')}
              className="w-full py-4 bg-black text-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start Workout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Training Stats', icon: Activity, view: 'progressTracker' },
          { label: 'Nutrition Log', icon: Apple, view: 'performanceMacroNutrients' },
          { label: 'Body Metrics', icon: Activity, view: 'bodyMetrics' }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(item.view)}
            className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/5 text-white/60 group-hover:text-gold transition-colors">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase italic tracking-widest">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
