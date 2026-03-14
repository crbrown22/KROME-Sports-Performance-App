import { safeStorage } from '../utils/storage';
import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { FullProgramTemplate } from '../data/workoutTemplates';

interface VolumeProgressionChartProps {
  program: FullProgramTemplate;
}

export default function VolumeProgressionChart({ program }: VolumeProgressionChartProps) {
  const chartData = useMemo(() => {
    const data: any[] = [];
    let absoluteWeek = 1;

    program.phases.forEach((phase) => {
      phase.weeks.forEach((week) => {
        let weeklyVolume = 0;
        let weeklySets = 0;

        week.workouts.forEach((workout) => {
          workout.exercises.forEach((exercise) => {
            // Parse sets
            const setsMatch = exercise.sets.match(/\d+/);
            const sets = setsMatch ? parseInt(setsMatch[0]) : 0;

            // Parse reps
            let reps = 0;
            const repsStr = exercise.reps || '';
            if (repsStr.toLowerCase().includes('max')) {
              reps = 10; // Default for max
            } else if (repsStr.toLowerCase().includes('trials')) {
              reps = 1; // Default for trials
            } else {
              const repsMatches = repsStr.match(/\d+/g);
              if (repsMatches) {
                // If range like 8-10, take the max (last one)
                reps = parseInt(repsMatches[repsMatches.length - 1]);
              }
            }

            // Handle "ea" (each side)
            if (repsStr.toLowerCase().includes('ea')) {
              reps *= 2;
            }

            weeklySets += sets;
            weeklyVolume += (sets * reps);
          });
        });

        data.push({
          name: `W${absoluteWeek}`,
          week: absoluteWeek,
          phase: phase.name,
          volume: weeklyVolume,
          sets: weeklySets,
        });
        absoluteWeek++;
      });
    });

    return data;
  }, [program]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase italic text-white">
            Volume <span className="text-gold">Progression</span>
          </h3>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
            Weekly Workload Analysis
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold shadow-[0_0_8px_rgba(197,156,33,0.5)]" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Volume (Sets x Reps)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_rgba(178,216,216,0.5)]" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total Sets</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c59c21" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#c59c21" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b2d8d8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#b2d8d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
              cursor={{ stroke: 'rgba(255,215,0,0.2)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#c59c21" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVolume)" 
              name="Volume"
            />
            <Area 
              type="monotone" 
              dataKey="sets" 
              stroke="#b2d8d8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSets)" 
              name="Total Sets"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Avg Weekly Volume</div>
          <div className="text-lg font-black text-white italic">
            {Math.round(chartData.reduce((acc, d) => acc + d.volume, 0) / chartData.length).toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Peak Volume</div>
          <div className="text-lg font-black text-gold italic">
            {Math.max(...chartData.map(d => d.volume)).toLocaleString()}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Avg Weekly Sets</div>
          <div className="text-lg font-black text-white italic">
            {Math.round(chartData.reduce((acc, d) => acc + d.sets, 0) / chartData.length)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Peak Sets</div>
          <div className="text-lg font-black text-accent italic">
            {Math.max(...chartData.map(d => d.sets))}
          </div>
        </div>
      </div>
    </div>
  );
}
