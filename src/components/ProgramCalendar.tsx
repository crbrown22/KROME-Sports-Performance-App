import { safeStorage } from '../utils/storage';
import { haptics } from '../utils/nativeBridge';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Dumbbell, 
  Clock,
  CheckCircle2,
  Circle,
  X,
  PlayCircle,
  Plus,
  Trash2,
  Edit2,
  Activity
} from 'lucide-react';
import { getCurrentDate, parseISODate } from '../utils/date';
import { getWorkoutExercises, calculateWorkoutProgress } from '../lib/workoutUtils';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { ALL_PROGRAMS } from '../data/workoutTemplates';
import VideoModal from './VideoModal';
import { 
  subscribeToWorkoutLogs, 
  subscribeToProgramProgress 
} from '../services/firebaseService';

interface ProgramCalendarProps {
  userId: string;
  onBack?: () => void;
}

export default function ProgramCalendar({ userId, onBack }: ProgramCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [progressData, setProgressData] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [userPrograms, setUserPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProgramToSchedule, setSelectedProgramToSchedule] = useState<any>(null);
  const [selectedWorkoutToSchedule, setSelectedWorkoutToSchedule] = useState<any>(null);
  const [videoModal, setVideoModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});
  const [schedulingTime, setSchedulingTime] = useState("06:00");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [forceSelection, setForceSelection] = useState(false);

  const showSaveConfirmation = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const fetchUserPrograms = async () => {
    try {
      const [customRes, purchasesRes] = await Promise.all([
        fetch(`/api/custom-programs/${userId}`),
        fetch(`/api/purchases/${userId}`)
      ]);

      let customData = [];
      if (customRes.ok) {
        const data = await customRes.json();
        customData = data.map((p: any) => ({
          ...p,
          isCustom: true,
          data: typeof p.data === 'string' ? JSON.parse(p.data) : p.data
        }));
      }

      let purchasedData = [];
      if (purchasesRes.ok) {
        const data = await purchasesRes.json();
        purchasedData = data.map((p: any) => {
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
      }

      setUserPrograms([...customData, ...purchasedData]);
      console.log("User programs fetched:", [...customData, ...purchasedData]);
    } catch (err) {
      console.error("Failed to fetch user programs", err);
    }
  };

  const allWorkouts = useMemo(() => {
    // Collect all unique program IDs from progressData
    const scheduledProgramIds = new Set(progressData.map(p => p.program_id));
    
    // Start with user programs
    const programsToUse = [...userPrograms];
    
    // Add any programs that are scheduled but not in userPrograms
    scheduledProgramIds.forEach(id => {
      if (!programsToUse.some(p => String(p.id) === String(id))) {
        const template = ALL_PROGRAMS.find(t => String(t.id) === String(id));
        if (template) {
          programsToUse.push({ id: template.id, name: template.name, data: template, isCustom: false });
        }
      }
    });

    // If showAllTemplates is true, add all templates
    if (showAllTemplates) {
      ALL_PROGRAMS.forEach(template => {
        if (!programsToUse.some(p => String(p.id) === String(template.id))) {
          programsToUse.push({ id: template.id, name: template.name, data: template, isCustom: false });
        }
      });
    }

    return programsToUse.flatMap((prog: any) => {
      const progData = prog.data;
      if (!progData || !progData.phases) return [];
      
      return progData.phases.flatMap((phase: any) => 
        phase.weeks.flatMap((week: any) => 
          week.workouts.map((workout: any) => ({
            ...workout,
            programId: prog.id,
            programName: prog.name,
            phaseName: phase.name,
            weekNum: week.week
          }))
        )
      ) || [];
    });
  }, [userPrograms, showAllTemplates, progressData]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/program-progress/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProgressData(data);
      }
    } catch (err) {
      console.error("Failed to fetch progress from API", err);
    }
  };

  useEffect(() => {
    let unsubscribeLogs: () => void;
    let unsubscribeProgress: () => void;

    const setupListeners = () => {
      unsubscribeLogs = subscribeToWorkoutLogs(userId, (logs) => {
        setWorkoutLogs(logs);
      });

      unsubscribeProgress = subscribeToProgramProgress(userId, (progress) => {
        // Merge Firestore data with existing data, preferring Firestore
        setProgressData(prev => {
          const merged = [...prev];
          progress.forEach((item: any) => {
            const index = merged.findIndex(p => 
              (p.firestore_id && p.firestore_id === item.id) || 
              (p.program_id === item.program_id && p.phase === item.phase && p.week === item.week && p.day === item.day)
            );
            if (index >= 0) {
              merged[index] = { ...merged[index], ...item, firestore_id: item.id };
            } else {
              merged.push({ ...item, firestore_id: item.id });
            }
          });
          return merged;
        });
        setLoading(false);
      });
    };

    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserPrograms(),
        fetchProgress()
      ]);
      setupListeners();
    };

    init();

    return () => {
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeProgress) unsubscribeProgress();
    };
  }, [userId]);

  const handleSchedule = async (manualWorkout?: any) => {
    if (!selectedDate) return;
    
    const workout = manualWorkout || selectedWorkoutToSchedule;
    if (!workout) return;

    const newProgress = {
      programId: workout.programId,
      workoutId: workout.id,
      phase: workout.phaseName || workout.phase || 'Phase 1',
      week: workout.weekNum || workout.week || 1,
      day: workout.day,
      completed: false,
      date: selectedDate,
      scheduled_time: schedulingTime
    };

    try {
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: [newProgress] })
      });
      if (res.ok) {
        setSelectedDate(null);
        setSelectedWorkoutToSchedule(null);
        setSelectedProgramToSchedule(null);
        setForceSelection(false);
        haptics.success();
        showSaveConfirmation("Workout Scheduled");
        window.dispatchEvent(new CustomEvent('workout-completed'));
      }
    } catch (err) {
      console.error("Failed to schedule workout", err);
    }
  };

  const handleDeleteSchedule = async (dateStr: string) => {
    const existing = progressData.find(p => p.date === dateStr);
    if (!existing) return;

    try {
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          programId: existing.program_id,
          phase: existing.phase,
          week: existing.week,
          day: existing.day,
          date: dateStr
        })
      });

      if (res.ok) {
        setSelectedDate(null);
        showSaveConfirmation("Schedule Removed");
        haptics.medium();
        window.dispatchEvent(new CustomEvent('workout-completed'));
      }
    } catch (err) {
      console.error("Failed to delete schedule", err);
    }
  };

  const handleScheduleWeek = async (weekNum: number) => {
    if (!selectedDate || !selectedProgramToSchedule) return;
    
    const startDate = parseISODate(selectedDate);
    const programWorkouts = allWorkouts.filter(w => 
      String(w.programId) === String(selectedProgramToSchedule.id) && 
      w.weekNum === weekNum
    );

    if (programWorkouts.length === 0) return;

    const progressToSchedule = programWorkouts.map(workout => {
      const workoutDate = new Date(startDate);
      // Assuming day 1 is the selected date, day 2 is next day, etc.
      // Or we can map based on the workout.day (1-7)
      workoutDate.setDate(startDate.getDate() + (workout.day - 1));
      
      return {
        programId: workout.programId,
        workoutId: workout.id,
        phase: workout.phaseName || workout.phase || 'Phase 1',
        week: workout.weekNum || workout.week || 1,
        day: workout.day,
        completed: false,
        date: workoutDate.toISOString().split('T')[0],
        scheduled_time: schedulingTime
      };
    });

    try {
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: progressToSchedule })
      });
      if (res.ok) {
        setSelectedDate(null);
        setSelectedWorkoutToSchedule(null);
        setSelectedProgramToSchedule(null);
        setForceSelection(false);
        haptics.success();
        showSaveConfirmation(`Week ${weekNum} Scheduled`);
        window.dispatchEvent(new CustomEvent('workout-completed'));
      }
    } catch (err) {
      console.error("Failed to schedule week", err);
    }
  };

  const handleToggleComplete = async (dateStr: string) => {
    const existing = progressData.find(p => p.date === dateStr);
    if (!existing) return;

    const isCompleting = !existing.completed;
    const updatedProgress = {
      ...existing,
      programId: existing.program_id,
      completed: isCompleting,
      date: dateStr
    };

    try {
      // 1. Update program progress
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: [updatedProgress] })
      });

      if (res.ok) {
        // 2. If completing, also log all exercises in workout_logs for tracking accuracy
        const workout = getWorkoutForDate(dateStr);
        if (isCompleting) {
          showSaveConfirmation("Workout Completed");
          if (workout && workout.exercises) {
            const logs = workout.exercises.map((ex: any) => ({
              workoutId: workout.id,
              exerciseId: ex.id,
              completed: true,
              date: dateStr,
              editedData: {
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest
              }
            }));

            await fetch(`/api/workout-logs/${userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logs })
            });
            
            // Update local storage
            const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
            const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
            logs.forEach((log: any) => {
              completedLocal[`${log.workoutId}-${log.exerciseId}`] = true;
            });
            safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedLocal));
          }
        } else {
          if (workout && workout.exercises) {
            const logs = workout.exercises.map((ex: any) => ({
              workoutId: workout.id,
              exerciseId: ex.id,
              completed: false,
              date: dateStr,
              editedData: {
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest
              }
            }));

            await fetch(`/api/workout-logs/${userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logs })
            });
            
            // Update local storage
            const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
            const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
            logs.forEach((log: any) => {
              delete completedLocal[`${log.workoutId}-${log.exerciseId}`];
            });
            safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedLocal));
          }
          showSaveConfirmation("Workout Marked Incomplete");
        }

        haptics.light();
        
        // Notify other components (like dashboard)
        window.dispatchEvent(new CustomEvent('workout-completed'));
      }
    } catch (err) {
      console.error("Failed to update progress", err);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${month}-${d}`;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Find workout for a specific date (simplified mapping based on day index)
  // In a real app, you'd map dates to specific program days more robustly
  const getWorkoutForDate = (dateStr: string) => {
    const progress = progressData.find(p => p.date === dateStr);
    if (progress) {
      return allWorkouts.find(w => 
        String(w.programId) === String(progress.program_id) &&
        String(w.day) === String(progress.day) && 
        String(w.weekNum) === String(progress.week) && 
        String(w.phaseName) === String(progress.phase)
      ) || null;
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pt-24 pb-4 overflow-x-hidden"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-10 grayscale"
          alt="Calendar Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-krome font-bold uppercase text-[10px] md:text-xs tracking-widest mb-8 hover:gap-4 transition-all !outline-none border border-krome/30 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md w-fit shadow-xl shadow-black/50 krome-outline"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}

        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end justify-between">
          <div>
            <h2 className="text-krome font-black uppercase tracking-[0.3em] text-xs mb-2 italic">Module 01</h2>
            <h1 className="text-4xl md:text-7xl font-black uppercase italic leading-none tracking-tighter text-white">
              Training <br />
              <span className="text-krome pr-2 pb-2">Schedule</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showAllTemplates 
                  ? 'bg-krome text-black border-krome shadow-lg shadow-krome/20' 
                  : 'bg-zinc-800/50 text-krome/80 border-krome/20 hover:border-krome/40 backdrop-blur-md'
              }`}
            >
              {showAllTemplates ? 'Hide Templates' : 'Show All Templates'}
            </button>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-3 bg-black/20 hover:bg-black/40 rounded-xl text-krome transition-all border border-krome/20 backdrop-blur-md krome-outline">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-3 bg-black/20 hover:bg-black/40 rounded-xl text-krome transition-all border border-krome/20 backdrop-blur-md krome-outline">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-md border border-krome/30 rounded-3xl p-8 mb-12 krome-outline">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{monthName} <span className="text-krome">{year}</span></h3>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-krome/30 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
              
              const dateStr = formatDateString(day);
              const progress = progressData.find(p => p.date === dateStr);
              const isCompleted = progress?.completed === 1 || progress?.completed === true;
              const isScheduled = !!progress?.scheduled_time;
              const isToday = getCurrentDate() === dateStr;
              const workout = getWorkoutForDate(dateStr);
              const hasWorkout = !!workout;

              let workoutProgress = 0;
              if (hasWorkout) {
                const exercises = getWorkoutExercises(workout);
                const totalExercises = exercises.length;
                const completedCount = exercises.filter((ex: any) => {
                  return workoutLogs.some(log => 
                    String(log.workout_id) === String(workout.id) && 
                    String(log.exercise_id) === String(ex.id) && 
                    (log.completed === 1 || log.completed === true)
                  );
                }).length;
                workoutProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
              }

              // If all exercises are completed, mark as completed even if not explicitly marked in progressData
              const effectivelyCompleted = isCompleted || (hasWorkout && workoutProgress === 100);

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-2xl border p-3 flex flex-col justify-between transition-all relative group cursor-pointer overflow-hidden ${
                    effectivelyCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : isScheduled
                        ? 'bg-krome/10 border-krome/50 shadow-[0_0_15px_rgba(178,216,216,0.15)]'
                        : isToday
                          ? 'bg-white/5 border-krome'
                          : 'bg-black/40 border-krome/10 hover:border-krome/30'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-black/90 backdrop-blur-md border border-krome/30 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-krome whitespace-nowrap shadow-2xl krome-outline">
                      {effectivelyCompleted ? 'Completed' : isScheduled ? `Scheduled: ${progress.scheduled_time}` : isToday ? 'Today' : 'View Details'}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black italic relative z-10 ${isToday ? 'text-krome' : 'text-krome/40'}`}>
                    {day}
                  </span>
                  
                  <div className="flex justify-center relative z-10">
                    {effectivelyCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isScheduled ? (
                      <Clock className="w-5 h-5 text-krome" />
                    ) : hasWorkout ? (
                      <Dumbbell className={`w-5 h-5 ${isToday ? 'text-krome' : 'text-krome/10 group-hover:text-krome/30'}`} />
                    ) : (
                      <Plus className="w-5 h-5 text-krome/10 group-hover:text-krome/40 transition-all" />
                    )}
                  </div>

                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-krome rounded-full shadow-[0_0_8px_rgba(178,216,216,0.8)] z-10" />
                  )}

                  {/* Progress Bar for partial completion */}
                  {hasWorkout && !effectivelyCompleted && workoutProgress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                      <div 
                        className="h-full bg-krome" 
                        style={{ width: `${workoutProgress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 flex gap-8 justify-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-krome/40 italic">Completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-krome shadow-[0_0_8px_rgba(178,216,216,0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-krome/40 italic">Scheduled</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-krome/40 italic">Available</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black overflow-y-auto"
          >
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <img 
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-10 grayscale"
                alt="Workout Detail Background"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-12">
              <button 
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedWorkoutToSchedule(null);
                  setSelectedProgramToSchedule(null);
                  setForceSelection(false);
                }}
                className="flex items-center gap-2 text-krome font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all !outline-none border border-krome/30 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md w-fit krome-outline"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Calendar
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                  <h2 className="text-krome font-black uppercase tracking-[0.3em] text-xs mb-2 italic">Training Session</h2>
                  <h1 className="text-4xl md:text-7xl font-black uppercase italic leading-none tracking-tighter text-white">
                    Workout <br />
                    <span className="text-krome pr-2 pb-2">Details</span>
                  </h1>
                  <p className="text-xs font-black uppercase tracking-widest text-krome/40 mt-4 flex items-center gap-2 italic">
                    <CalendarIcon className="w-4 h-4" /> {selectedDate}
                  </p>
                </div>

                {getWorkoutForDate(selectedDate) && (
                  <button 
                    onClick={() => {
                      const existing = progressData.find(p => p.date === selectedDate);
                      if (existing) {
                        setSelectedProgramToSchedule(userPrograms.find(p => String(p.id) === String(existing.program_id)) || null);
                      }
                      setForceSelection(true);
                    }}
                    className="px-6 py-3 bg-black/20 border border-krome/30 text-krome rounded-xl font-black uppercase italic tracking-widest text-xs flex items-center gap-2 hover:bg-black/40 transition-all backdrop-blur-md krome-outline"
                  >
                    <Edit2 className="w-4 h-4" /> Change Workout
                  </button>
                )}
              </div>
              
              <div className="space-y-8">
                {(() => {
                  const workout = getWorkoutForDate(selectedDate);
                  const isScheduled = !!progressData.find(p => p.date === selectedDate)?.scheduled_time;

                  if (workout && !forceSelection) {
                    return (
                      <div className="space-y-8">
                        {/* Schedule Card */}
                        <div className="bg-black/20 backdrop-blur-md border border-krome/30 rounded-3xl p-8 krome-outline">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-krome/10 flex items-center justify-center text-krome">
                              <Clock className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black uppercase italic text-white">Schedule Time</h4>
                              <p className="text-[10px] text-krome/40 uppercase tracking-widest italic">Set your target training time</p>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4">
                            <input 
                              type="time" 
                              value={schedulingTime}
                              onChange={(e) => setSchedulingTime(e.target.value)}
                              className="flex-1 bg-black/50 border border-krome/30 rounded-xl px-6 py-4 text-white outline-none focus:border-krome transition-all italic font-black uppercase tracking-widest"
                            />
                            <button 
                              onClick={() => handleSchedule(workout)}
                              className="px-8 py-4 bg-krome text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all shadow-lg shadow-krome/20"
                            >
                              Update Schedule
                            </button>
                          </div>
                        </div>

                        {/* Workout Card */}
                        <div className="bg-black/20 backdrop-blur-md border border-krome/30 rounded-3xl p-8 krome-outline">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-2xl font-black uppercase italic text-krome">{workout.title}</h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-krome/40 mt-1 italic">{workout.programName}</p>
                            </div>
                            {(() => {
                              let workoutProgress = 0;
                              const exercises = getWorkoutExercises(workout);
                              if (exercises.length > 0) {
                                const totalExercises = exercises.length;
                                const completedCount = exercises.filter((ex: any) => {
                                  return workoutLogs.some(log => 
                                    String(log.workout_id) === String(workout.id) && 
                                    String(log.exercise_id) === String(ex.id) && 
                                    (log.completed === 1 || log.completed === true)
                                  );
                                }).length;
                                workoutProgress = Math.round((completedCount / totalExercises) * 100);
                              }
                              return (
                                <div className="text-right">
                                  <div className="text-3xl font-black text-krome italic">{workoutProgress}%</div>
                                  <div className="text-[10px] font-black text-krome/20 uppercase tracking-widest italic">Complete</div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Progress Bar */}
                          {(() => {
                            let workoutProgress = 0;
                            const exercises = getWorkoutExercises(workout);
                            if (exercises.length > 0) {
                              const totalExercises = exercises.length;
                              const completedCount = exercises.filter((ex: any) => {
                                return workoutLogs.some(log => 
                                  String(log.workout_id) === String(workout.id) && 
                                  String(log.exercise_id) === String(ex.id) && 
                                  (log.completed === 1 || log.completed === true)
                                );
                              }).length;
                              workoutProgress = Math.round((completedCount / totalExercises) * 100);
                            }
                            return (
                              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-8 border border-krome/10">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${workoutProgress}%` }}
                                  className="h-full bg-krome" 
                                />
                              </div>
                            );
                          })()}

                          <div className="space-y-4">
                            {workout.exercises?.map((ex: any, i: number) => {
                              const exerciseDetails = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                              const videoUrl = ex.videoLinkOverride || exerciseDetails?.videoUrl;
                              const name = ex.nameOverride || exerciseDetails?.name || 'Exercise';

                              return (
                                <div key={i} className="bg-black/40 border border-krome/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-black/60 transition-all">
                                  <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-krome/10 flex items-center justify-center text-krome shrink-0 group-hover:scale-110 transition-transform">
                                      <Dumbbell className="w-7 h-7" />
                                    </div>
                                    <div>
                                      <h5 className="text-lg font-black uppercase italic text-white group-hover:text-krome transition-colors">{name}</h5>
                                      <div className="text-[10px] font-black uppercase tracking-widest text-krome/40 mt-1 italic">
                                        {ex.sets} Sets × {ex.reps} Reps
                                      </div>
                                      {videoUrl && (
                                        <button 
                                          onClick={() => setVideoModal({ isOpen: true, url: videoUrl, title: name })}
                                          className="text-[10px] text-krome font-black uppercase tracking-widest hover:text-black mt-3 flex items-center gap-2 transition-all bg-krome/10 hover:bg-krome px-3 py-1.5 rounded-lg border border-krome/20"
                                        >
                                          <PlayCircle className="w-4 h-4" /> Watch Demo
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-krome/20 mb-1 italic">Rest</div>
                                    <div className="text-sm font-mono text-krome">{ex.rest || '60s'}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-12 flex flex-col md:flex-row gap-4">
                            <button 
                              onClick={() => handleToggleComplete(selectedDate)}
                              className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                                isScheduled && progressData.find(p => p.date === selectedDate)?.completed
                                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                  : 'bg-krome text-black shadow-lg shadow-krome/20 hover:bg-white'
                              }`}
                            >
                              {isScheduled && progressData.find(p => p.date === selectedDate)?.completed 
                                ? <><CheckCircle2 className="w-4 h-4" /> Workout Completed</>
                                : 'Mark Workout Complete'}
                            </button>
                            <button 
                              onClick={() => handleDeleteSchedule(selectedDate)}
                              className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
                            >
                              Remove from Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      <div className="text-center py-16 bg-black/20 backdrop-blur-md rounded-3xl border border-dashed border-krome/20 flex flex-col items-center justify-center krome-outline">
                        <CalendarIcon className="w-12 h-12 text-krome/10 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-krome/40 italic">No workout scheduled for this day</p>
                      </div>

                      <div className="bg-black/20 backdrop-blur-md border border-krome/30 rounded-3xl p-8 krome-outline">
                        <h5 className="text-xs font-black uppercase tracking-[0.3em] text-krome mb-8 flex items-center gap-2 italic">
                          <Plus className="w-4 h-4" /> Select a Program
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                          {(showAllTemplates ? [
                            ...userPrograms,
                            ...ALL_PROGRAMS.filter(p => !userPrograms.some(up => String(up.id) === String(p.id))).map(p => ({
                              id: p.id,
                              name: p.name,
                              sport: p.sport || 'General',
                              data: p
                            }))
                          ] : userPrograms).map((prog, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  console.log("Program selected", prog);
                                  setSelectedProgramToSchedule(prog);
                                  setSelectedWorkoutToSchedule(null);
                                }}
                                className={`p-6 rounded-2xl border text-left transition-all group backdrop-blur-md krome-outline ${
                                  selectedProgramToSchedule?.id === prog.id 
                                    ? 'bg-krome/20 border-krome/50 shadow-2xl shadow-krome/10' 
                                    : 'bg-black/40 border-krome/10 hover:border-krome/30 hover:bg-black/60'
                                }`}
                              >
                              <div className={`text-lg font-black uppercase italic transition-colors ${
                                selectedProgramToSchedule?.id === prog.id ? 'text-white' : 'text-white/60 group-hover:text-krome'
                              }`}>{prog.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-krome/30 mt-2 flex items-center gap-2 italic">
                                <Activity className="w-3 h-3" /> {prog.sport || 'General'}
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedProgramToSchedule && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                          >
                            <h5 className="text-xs font-black uppercase tracking-[0.3em] text-krome mb-6 flex items-center gap-2 italic">
                              <Dumbbell className="w-4 h-4" /> Select a Workout
                            </h5>
                            <div className="space-y-12">
                              {(() => {
                                const programWorkouts = allWorkouts.filter(w => w.programId === selectedProgramToSchedule.id);
                                const workoutsByWeek = programWorkouts.reduce((acc: any, w: any) => {
                                  const weekKey = `Week ${w.weekNum}`;
                                  if (!acc[weekKey]) acc[weekKey] = [];
                                  acc[weekKey].push(w);
                                  return acc;
                                }, {});

                                return Object.entries(workoutsByWeek).map(([week, workouts]: [string, any]) => (
                                  <div key={week} className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                      <div className="flex items-center gap-4 flex-1">
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-krome whitespace-nowrap italic">{week}</span>
                                        <div className="h-px flex-1 bg-krome/10" />
                                      </div>
                                      <button 
                                        onClick={() => handleScheduleWeek(parseInt(week.replace('Week ', '')))}
                                        className="ml-4 px-4 py-2 bg-krome/20 hover:bg-krome text-krome hover:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-krome/40 shadow-lg shadow-krome/5"
                                      >
                                        Schedule Full Week
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {workouts.map((w: any, i: number) => (
                                        <button
                                          key={i}
                                          onClick={() => setSelectedWorkoutToSchedule(w)}
                                          className={`w-full p-6 rounded-2xl border text-left transition-all flex items-center justify-between group backdrop-blur-md krome-outline ${
                                            selectedWorkoutToSchedule?.id === w.id 
                                              ? 'bg-krome/20 border-krome/50 shadow-2xl shadow-krome/10' 
                                              : 'bg-black/40 border-krome/10 hover:border-krome/30 hover:bg-black/60'
                                          }`}
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                              selectedWorkoutToSchedule?.id === w.id ? 'bg-krome text-black' : 'bg-white/5 text-white/40 group-hover:text-krome'
                                            }`}>
                                              <Dumbbell className="w-5 h-5" />
                                            </div>
                                            <div>
                                              <div className={`text-sm font-black uppercase italic transition-colors ${
                                                selectedWorkoutToSchedule?.id === w.id ? 'text-white' : 'text-white/60 group-hover:text-krome'
                                              }`}>{w.title}</div>
                                              <div className="text-[10px] font-black uppercase tracking-widest text-krome/30 mt-1 italic">
                                                {w.phaseName}
                                              </div>
                                            </div>
                                          </div>
                                          {selectedWorkoutToSchedule?.id === w.id && (
                                            <div className="w-6 h-6 rounded-full bg-krome flex items-center justify-center shadow-lg shadow-krome/20">
                                              <CheckCircle2 className="w-4 h-4 text-black" />
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {selectedWorkoutToSchedule && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-black/20 backdrop-blur-md border border-krome/30 rounded-3xl p-8 krome-outline mt-8"
                        >
                          <div className="flex items-center gap-6 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-krome/10 flex items-center justify-center text-krome">
                              <Clock className="w-7 h-7" />
                            </div>
                            <div>
                              <h4 className="text-xl font-black uppercase italic text-white">Schedule Time</h4>
                              <p className="text-[10px] text-krome/40 uppercase tracking-widest italic">Set your target training time</p>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-6">
                            <input 
                              type="time" 
                              value={schedulingTime}
                              onChange={(e) => setSchedulingTime(e.target.value)}
                              className="flex-1 bg-black/50 border border-krome/30 rounded-xl px-6 py-4 text-white outline-none focus:border-krome transition-all text-lg italic font-black uppercase tracking-widest"
                            />
                            <button 
                              onClick={() => handleSchedule()}
                              className="px-10 py-4 bg-krome text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-white transition-all shadow-xl shadow-krome/20"
                            >
                              Set Schedule
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="mt-12 pt-8 border-t border-krome/10 flex flex-col md:flex-row gap-4">
                {progressData.find(p => p.date === selectedDate) && (
                  <>
                    <button 
                      onClick={() => handleToggleComplete(selectedDate)}
                      className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                        progressData.find(p => p.date === selectedDate)?.completed
                          ? 'bg-black/20 text-white hover:bg-black/40 border border-krome/30 shadow-lg backdrop-blur-md krome-outline' 
                          : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-2xl shadow-emerald-500/40'
                      }`}
                    >
                      {progressData.find(p => p.date === selectedDate)?.completed ? (
                        <>Mark as Incomplete</>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Complete Workout
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(selectedDate)}
                      className="px-8 py-5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" /> Remove Schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VideoModal 
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />

      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
