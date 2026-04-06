import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { safeStorage } from '../utils/storage';
import { ALL_PROGRAMS } from '../data/workoutTemplates';
import { calculateWorkoutProgress, getWorkoutExercises } from '../lib/workoutUtils';
import { getCurrentDate, parseISODate } from '../utils/date';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  subscribeToWorkoutLogs, 
  subscribeToProgramProgress,
  subscribeToBodyComp,
  subscribeToMetrics,
  subscribeToProgress,
  subscribeToCustomPrograms
} from "../services/firebaseService";
import { 
  TrendingUp, 
  Activity, 
  Apple, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Target,
  Award,
  Zap,
  Clock,
  Dumbbell,
  FileText,
  CheckCircle2,
  Edit3,
  User,
  ChefHat,
  Utensils
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
  isOwnProfile?: boolean;
  onProgramSelect?: (programId: string, phaseIdx?: number, weekIdx?: number, workoutId?: string) => void;
}

export default function AthleteDashboard({ user, onNavigate, isOwnProfile = true, onProgramSelect }: AthleteDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [parq, setParq] = useState<any>(null);
  const [bodyCompHistory, setBodyCompHistory] = useState<any[]>([]);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'bodyFat' | 'verticalJump' | 'fortyYardDash' | 'benchPress' | 'squat' | 'deadlift' | 'cleans' | 'broadJump' | 'vo2Max' | 'restingHR'>('weight');
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = safeStorage.getItem(`completedExercises_${user.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [completedToday, setCompletedToday] = useState<boolean>(false);
  const [programProgressList, setProgramProgressList] = useState<any[]>([]);
  const [workoutLogsList, setWorkoutLogsList] = useState<any[]>([]);
  const [customPrograms, setCustomPrograms] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const [activeProgramsProgress, setActiveProgramsProgress] = useState<any[]>([]);

  const calculateOverallProgress = (program: any, progress: any[]) => {
    const dataObj = typeof program.data === 'string' ? JSON.parse(program.data) : (program.data || {});
    const phases = program.phases || dataObj.phases || [];
    
    let totalWorkouts = 0;
    let completedWorkouts = 0;

    phases.forEach((phase: any) => {
      phase.weeks?.forEach((week: any) => {
        week.workouts?.forEach((workout: any) => {
          totalWorkouts++;
          const isCompleted = progress.some(p => 
            String(p.program_id) === String(program.id) && 
            p.phase === phase.name && 
            p.week === week.week && 
            p.day === workout.day && 
            p.completed
          );
          if (isCompleted) completedWorkouts++;
        });
      });
    });

    return totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  };

  const updateNextWorkout = (logs: any[], progress: any[], cProgs: any[], pData: any[]) => {
    const today = getCurrentDate();
    const apiCompleted: Record<string, boolean> = {};
    logs.forEach((log: any) => {
      apiCompleted[`${log.workout_id}-${log.exercise_id}`] = log.completed === 1 || log.completed === true;
    });
    const mergedCompleted = { ...completedExercises, ...apiCompleted };

    const purchasedData = pData.map((p: any) => {
      const programId = p.program_id || p.item_id || p.item_name;
      const template = ALL_PROGRAMS.find(t => t.id === programId || t.name === programId);
      if (template) {
        return {
          id: template.id,
          name: template.name,
          data: template,
          isCustom: false
        };
      }
      return null;
    }).filter(Boolean);

    const allPrograms = [...cProgs, ...purchasedData];

    if (allPrograms.length > 0) {
      const nextScheduled = progress
        .filter(p => !p.completed && p.date >= today)
        .sort((a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime())[0];

      let foundWorkout = null;

      if (nextScheduled) {
        const program = allPrograms.find((p: any) => p.id === nextScheduled.program_id);
        if (program) {
          const dataObj = typeof program.data === 'string' ? JSON.parse(program.data) : (program.data || {});
          const phases = program.phases || dataObj.phases || [];
          
          if (phases.length > 0) {
            const phaseIdx = phases.findIndex((ph: any) => ph.name === nextScheduled.phase);
            const phase = phases[phaseIdx >= 0 ? phaseIdx : 0];
            const weekIdx = phase?.weeks?.findIndex((w: any) => w.week === nextScheduled.week);
            const week = phase?.weeks?.[weekIdx >= 0 ? weekIdx : 0];
            const workout = week?.workouts?.find((w: any) => w.day === nextScheduled.day);

            if (workout) {
              foundWorkout = {
                ...workout,
                phase: nextScheduled.phase,
                phaseIdx: phaseIdx >= 0 ? phaseIdx : 0,
                weekIdx: weekIdx >= 0 ? weekIdx : 0,
                week: nextScheduled.week,
                programName: program.name,
                programId: program.id,
                progress: calculateWorkoutProgress(workout, mergedCompleted),
                scheduledDate: nextScheduled.date,
                scheduledTime: nextScheduled.scheduled_time
              };
            }
          }
        }
      }

      if (!foundWorkout) {
        for (const program of allPrograms) {
          const dataObj = typeof program.data === 'string' ? JSON.parse(program.data) : (program.data || {});
          const phases = program.phases || dataObj.phases || [];
          
          for (let pIdx = 0; pIdx < phases.length; pIdx++) {
            const phase = phases[pIdx];
            for (let wIdx = 0; wIdx < (phase.weeks?.length || 0); wIdx++) {
              const week = phase.weeks[wIdx];
              for (const workout of (week.workouts || [])) {
                const progressVal = calculateWorkoutProgress(workout, mergedCompleted);
                if (progressVal < 100) {
                  foundWorkout = {
                    ...workout,
                    phase: phase.name,
                    phaseIdx: pIdx,
                    weekIdx: wIdx,
                    week: week.week,
                    programName: program.name,
                    programId: program.id,
                    progress: progressVal
                  };
                  break;
                }
              }
              if (foundWorkout) break;
            }
            if (foundWorkout) break;
          }
          if (foundWorkout) break;
        }
      }
      setNextWorkout(foundWorkout);

      // Update active programs progress
      const progressList = allPrograms.map(program => ({
        ...program,
        overallProgress: calculateOverallProgress(program, progress)
      }));
      setActiveProgramsProgress(progressList);
    }
  };

  useEffect(() => {
    updateNextWorkout(workoutLogsList, programProgressList, customPrograms, purchases);
  }, [workoutLogsList, programProgressList, customPrograms, purchases]);

  useEffect(() => {
    let unsubscribeLogs: () => void;
    let unsubscribeProgress: () => void;
    let unsubscribeBodyComp: () => void;
    let unsubscribeMetrics: () => void;
    let unsubscribeProgressHistory: () => void;
    let unsubscribeCustomPrograms: () => void;

    const fetchData = async () => {
      try {
        const [nutritionRes, parqRes, purchasesRes] = await Promise.all([
          fetch(`/api/nutrition/${user.id}/latest`),
          fetch(`/api/parq/${user.id}`),
          fetch(`/api/purchases/${user.id}`)
        ]);

        if (nutritionRes.ok) setNutrition(await nutritionRes.json());
        if (parqRes.ok) setParq(await parqRes.json());
        if (purchasesRes.ok) setPurchases(await purchasesRes.json());

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to connect to the server. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    const setupListeners = () => {
      const uid = user.id.toString();

      unsubscribeLogs = subscribeToWorkoutLogs(uid, (logs) => {
        setWorkoutLogsList(logs);
        const apiCompleted: Record<string, boolean> = {};
        logs.forEach((log: any) => {
          apiCompleted[`${log.workout_id}-${log.exercise_id}`] = log.completed === 1 || log.completed === true;
        });
        setCompletedExercises(prev => ({ ...prev, ...apiCompleted }));
      });

      unsubscribeProgress = subscribeToProgramProgress(uid, (progress) => {
        setProgramProgressList(progress);
        const today = getCurrentDate();
        const hasCompletedToday = progress.some(p => p.completed && p.date === today);
        setCompletedToday(hasCompletedToday);
      });

      unsubscribeBodyComp = subscribeToBodyComp(uid, (history) => {
        setBodyCompHistory(history);
      });

      unsubscribeMetrics = subscribeToMetrics(uid, (data) => {
        setMetrics(data);
      });

      unsubscribeProgressHistory = subscribeToProgress(uid, (history) => {
        setProgressHistory(history);
      });

      unsubscribeCustomPrograms = subscribeToCustomPrograms(uid, (programs) => {
        setCustomPrograms(programs);
      });
    };

    fetchData();
    setupListeners();
    
    const handleRefresh = () => {
      console.log("[AthleteDashboard] Refreshing data due to workout completion...");
      fetchData();
    };
    
    window.addEventListener('workout-completed', handleRefresh);
    return () => {
      window.removeEventListener('workout-completed', handleRefresh);
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeBodyComp) unsubscribeBodyComp();
      if (unsubscribeMetrics) unsubscribeMetrics();
      if (unsubscribeProgressHistory) unsubscribeProgressHistory();
      if (unsubscribeCustomPrograms) unsubscribeCustomPrograms();
    };
  }, [user.id]);

  const getChartData = () => {
    if (selectedMetric === 'weight' || selectedMetric === 'bodyFat') {
      return bodyCompHistory
        .sort((a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime())
        .map(entry => ({
          date: parseISODate(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: entry[selectedMetric]
        }));
    } else if (selectedMetric === 'vo2Max' || selectedMetric === 'restingHR') {
      return [{
        date: 'Current',
        value: selectedMetric === 'vo2Max' ? (metrics?.vo2Max || 0) : (metrics?.restingHR || 0)
      }];
    } else if (['verticalJump', 'fortyYardDash', 'benchPress', 'squat', 'deadlift', 'cleans', 'broadJump'].includes(selectedMetric)) {
      const metricNameMap: Record<string, string> = {
        verticalJump: 'Vertical Jump',
        fortyYardDash: '40yd Dash',
        benchPress: 'Bench Press',
        squat: 'Squat',
        deadlift: 'Deadlift',
        cleans: 'Cleans',
        broadJump: 'Broad Jump'
      };
      const targetName = metricNameMap[selectedMetric];
      return progressHistory
        .filter(entry => entry.metric_name === targetName)
        .sort((a, b) => {
          const dateA = a.recorded_at?.toDate ? a.recorded_at.toDate() : parseISODate(a.recorded_at);
          const dateB = b.recorded_at?.toDate ? b.recorded_at.toDate() : parseISODate(b.recorded_at);
          return dateA.getTime() - dateB.getTime();
        })
        .map(entry => ({
          date: (entry.recorded_at?.toDate ? entry.recorded_at.toDate() : parseISODate(entry.recorded_at)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: entry.metric_value
        }));
    }
    return [];
  };

  const chartData = getChartData();
  const metricLabels: Record<string, string> = {
    weight: 'Weight (lbs)',
    bodyFat: 'Body Fat (%)',
    verticalJump: 'Vertical Jump (in)',
    fortyYardDash: '40yd Dash (s)',
    benchPress: 'Bench Press (lbs)',
    squat: 'Squat (lbs)',
    deadlift: 'Deadlift (lbs)',
    cleans: 'Cleans (lbs)',
    broadJump: 'Broad Jump (ft)'
  };

  const getWeeklySummaryData = () => {
    const todayStr = getCurrentDate();
    const today = parseISODate(todayStr);
    const data = [];
    let totalWorkoutsCompleted = 0;
    let totalExercisesCompleted = 0;

    // Get the last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Correctly format date string without timezone shift
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Workouts completed on this day from program progress
      const progressCompletedOnDay = programProgressList.filter(p => p.completed && p.date === dateStr);
      const workoutsOnDayCount = progressCompletedOnDay.length;
      
      // Scheduled workouts on this day
      const totalWorkoutsOnDay = programProgressList.filter(p => p.date === dateStr).length;
      
      // Exercises completed on this day from workout logs
      const logsOnDay = workoutLogsList.filter(l => (l.completed === 1 || l.completed === true) && l.date === dateStr);
      const exercisesOnDay = logsOnDay.length;

      // If there are logs but no progress record, we should still count it as a workout if it has a workoutId
      const uniqueWorkoutsFromLogs = new Set(logsOnDay.map(l => l.workout_id || l.workoutId).filter(Boolean)).size;
      
      // Use the maximum of progress count or unique workouts from logs to be safe
      const finalWorkoutsOnDay = Math.max(workoutsOnDayCount, uniqueWorkoutsFromLogs);

      totalWorkoutsCompleted += finalWorkoutsOnDay;
      totalExercisesCompleted += exercisesOnDay;

      data.push({
        day: dayName,
        workouts: finalWorkoutsOnDay,
        totalWorkouts: Math.max(totalWorkoutsOnDay, finalWorkoutsOnDay), // Ensure scheduled is at least as much as completed
        exercises: exercisesOnDay,
        date: dateStr
      });
    }

    return { data, totalWorkoutsCompleted, totalExercisesCompleted };
  };

  const weeklySummary = getWeeklySummaryData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-4 p-8">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-white/60 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
        >
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider">Service Alert</h3>
            <p className="text-white/60 text-xs mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-black/40 border border-krome/40 rounded-[40px] p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-krome">
              <TrendingUp className="w-5 h-5 text-gold" />
              Performance Trend
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['weight', 'bodyFat', 'verticalJump', 'fortyYardDash', 'benchPress', 'squat', 'deadlift', 'cleans', 'broadJump', 'vo2Max', 'restingHR'] as const).map(m => (
                <button 
                  key={m} 
                  onClick={() => setSelectedMetric(m)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all krome-outline ${
                    selectedMetric === m 
                      ? 'bg-gold text-zinc-950 shadow-lg shadow-gold/20' 
                      : 'bg-white/5 text-krome hover:bg-white/10'
                  }`}
                >
                  {m === 'weight' ? 'Weight' : 
                   m === 'bodyFat' ? 'Body Fat' : 
                   m === 'verticalJump' ? 'Vert Jump' :
                   m === 'fortyYardDash' ? '40yd' :
                   m === 'benchPress' ? 'Bench' :
                   m === 'squat' ? 'Squat' :
                   m === 'deadlift' ? 'Deadlift' :
                   m === 'cleans' ? 'Cleans' :
                   m === 'vo2Max' ? 'VO2 Max' :
                   m === 'restingHR' ? 'RHR' :
                   'Broad Jump'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#ffffff40' }}
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#D4AF37', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                    labelStyle={{ color: '#ffffff40', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any) => {
                      const unit = metricLabels[selectedMetric].split('(')[1]?.replace(')', '') || '';
                      return [`${value} ${unit}`, metricLabels[selectedMetric].split(' (')[0]];
                    }}
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
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Activity className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">No data points for {metricLabels[selectedMetric]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Session */}
        <div className="space-y-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-zinc-900 border border-[#b2d8d8]/40 rounded-[40px] p-8 text-[#b2d8d8] relative overflow-hidden group shadow-2xl cursor-pointer"
            onClick={() => {
              if (isOwnProfile) {
                if (nextWorkout) {
                  if (onProgramSelect) {
                    onProgramSelect(nextWorkout.programId, nextWorkout.phaseIdx, nextWorkout.weekIdx, nextWorkout.id);
                  } else {
                    onNavigate('programViewer');
                  }
                } else {
                  onNavigate('programCatalog');
                }
              }
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop" 
              alt="Strength Training" 
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2d8d8]/10 blur-3xl -mr-32 -mt-32 group-hover:bg-[#b2d8d8]/20 transition-all duration-500" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  {completedToday ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#b2d8d8]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#b2d8d8]">
                        Today's Session Complete
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-[#b2d8d8]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#b2d8d8]">
                        {nextWorkout ? 'Active Program' : 'No Active Program'}
                      </span>
                    </>
                  )}
                </div>
                
                {nextWorkout ? (
                  <>
                    <h3 className="text-3xl font-black uppercase italic leading-tight mb-2 text-[#b2d8d8]">
                      {nextWorkout.title}
                    </h3>
                    <div className="space-y-1 mb-6">
                      <p className="text-sm font-bold opacity-80 uppercase tracking-widest">
                        {nextWorkout.programName}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#b2d8d8]/60">
                        Week {nextWorkout.week} • Day {nextWorkout.day}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">Workout Progress</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{nextWorkout.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#b2d8d8]/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${nextWorkout.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-[#b2d8d8]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-black uppercase italic leading-tight mb-2 text-[#b2d8d8]">
                      {completedToday ? 'Schedule Next Workout' : 'Ready to Start?'}
                    </h3>
                    <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-8">
                      {completedToday ? 'Keep the momentum going' : 'Explore elite training programs'}
                    </p>
                  </>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (nextWorkout) {
                        if (completedToday && !nextWorkout.scheduledDate) {
                          onNavigate('programCalendar');
                        } else {
                          if (onProgramSelect) {
                            onProgramSelect(nextWorkout.programId, nextWorkout.phaseIdx, nextWorkout.weekIdx, nextWorkout.id);
                          } else {
                            onNavigate('programViewer');
                          }
                        }
                      } else {
                        onNavigate('programCatalog');
                      }
                    }}
                    className="flex-1 py-4 bg-transparent border border-[#b2d8d8] text-[#b2d8d8] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b2d8d8]/10 active:scale-[0.98] transition-all"
                  >
                    {nextWorkout 
                      ? (nextWorkout.progress > 0 ? 'Resume Workout' : 
                         (completedToday 
                           ? (nextWorkout.scheduledDate ? 'View Next Workout' : 'Schedule Next Workout') 
                           : 'Start Workout')) 
                      : (completedToday ? 'Schedule Next Workout' : 'Explore Elite Programs')}
                  </button>
                  
                  {nextWorkout && !completedToday && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Mark complete logic
                        try {
                          const today = getCurrentDate();
                          
                          // 1. Update program progress
                          await fetch(`/api/program-progress/${user.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              progress: [{
                                programId: nextWorkout.programId,
                                phase: nextWorkout.phase || 'Phase 1',
                                week: nextWorkout.week,
                                day: nextWorkout.day,
                                completed: true,
                                date: today
                              }]
                            })
                          });

                          // 2. Log all exercises for this workout
                          const workoutExercises = getWorkoutExercises(nextWorkout);
                          if (workoutExercises && workoutExercises.length > 0) {
                            const exercisesToLog = workoutExercises.map((ex: any) => ({
                              workoutId: nextWorkout.id,
                              exerciseId: ex.id,
                              completed: true,
                              date: today,
                              editedData: {
                                sets: ex.sets,
                                reps: ex.reps,
                                rest: ex.rest
                              }
                            }));

                            await fetch(`/api/workout-logs/${user.id}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logs: exercisesToLog })
                            });
                            
                            // Update local storage
                            const completedRaw = safeStorage.getItem(`completedExercises_${user.id}`);
                            const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
                            exercisesToLog.forEach((log: any) => {
                              completedLocal[`${log.workoutId}-${log.exerciseId}`] = true;
                            });
                            safeStorage.setItem(`completedExercises_${user.id}`, JSON.stringify(completedLocal));
                          }

                          // Dispatch event to refresh dashboard
                          window.dispatchEvent(new Event('workout-completed'));
                        } catch (err) {
                          console.error("Failed to mark workout complete", err);
                        }
                      }}
                      className="px-6 py-4 bg-[#b2d8d8] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b2d8d8]/90 active:scale-[0.98] transition-all"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Active Programs Progress Card */}
          {activeProgramsProgress.length > 0 && (
            <div className="bg-black/40 border border-krome/40 rounded-[40px] p-8 backdrop-blur-xl">
              <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-krome mb-6">
                <Award className="w-5 h-5 text-gold" />
                Active Programs
              </h3>
              <div className="space-y-6">
                {activeProgramsProgress.map((prog, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-black uppercase italic text-white">{prog.name}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">{prog.sport || 'General'}</p>
                      </div>
                      <span className="text-xs font-black text-gold italic">{prog.overallProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${prog.overallProgress}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-black/90 border border-krome/40 rounded-[40px] p-8 backdrop-blur-xl relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop" 
          alt="Weekly Progress" 
          className="absolute inset-0 w-full h-full object-cover opacity-10"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Calendar className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-black uppercase italic text-krome">Weekly Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col justify-center space-y-6">
              <div className="bg-black/80 rounded-3xl p-6 border border-krome/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gold/10 rounded-xl">
                    <Dumbbell className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Workouts</span>
                </div>
                <div className="text-4xl font-black italic text-white">{weeklySummary.totalWorkoutsCompleted}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Completed this week</div>
              </div>
              
              <div className="bg-black/80 rounded-3xl p-6 border border-krome/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Exercises</span>
                </div>
                <div className="text-4xl font-black italic text-white">{weeklySummary.totalExercisesCompleted}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Completed this week</div>
              </div>
            </div>
            
            <div className="md:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySummary.data}>
                  <XAxis 
                    dataKey="day" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#ffffff40' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#D4AF37', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                    labelStyle={{ color: '#ffffff40', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Bar dataKey="totalWorkouts" name="Scheduled" fill="#ffffff10" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="workouts" name="Completed" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="exercises" name="Exercises" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Builder', icon: Edit3, view: 'programBuilder', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
            { label: 'Exercise Library', icon: Dumbbell, view: 'exerciseLibrary', img: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop' },
            { label: 'Macronutrients & Supplementation', icon: Zap, view: 'supplementsAndVitamins', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop' },
            { label: 'Fuel & Prep Recipes', icon: ChefHat, view: 'recipeLibrary', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop' },
            { label: 'Body Metrics', icon: Activity, view: 'bodyMetrics', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop' },
            { label: 'Account', icon: User, view: 'accountSettings', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(item.view)}
              className="flex items-center justify-between p-6 bg-black/40 border border-krome/20 rounded-3xl hover:bg-white/10 hover:border-krome/40 transition-all group krome-outline relative overflow-hidden"
            >
              <img 
                src={item.img} 
                alt={item.label} 
                className="absolute inset-0 w-full h-full object-cover opacity-10"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-2xl bg-white/5 text-krome group-hover:text-gold transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase italic tracking-widest text-krome">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-krome/20 group-hover:text-gold group-hover:translate-x-1 transition-all relative z-10" />
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
