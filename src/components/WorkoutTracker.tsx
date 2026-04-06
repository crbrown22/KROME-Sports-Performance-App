import { haptics } from '../utils/nativeBridge';
import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Award,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Zap,
  Dumbbell,
  StretchHorizontal,
  X,
  RefreshCw,
  Trash2,
  List as ListIcon
} from 'lucide-react';
import { ALL_PROGRAMS } from '../data/workoutTemplates';
import { formatDate, getCurrentDate, parseISODate } from '../utils/date';
import WorkoutFeedback from './WorkoutFeedback';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import ReactCalendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import VideoModal from './VideoModal';
import ConfirmModal from './ConfirmModal';
import { PlayCircle } from 'lucide-react';
import { 
  getWorkoutLogs, 
  addWorkoutLog, 
  deleteWorkoutLog, 
  getProgramProgress, 
  getWorkoutFeedback, 
  updateWorkoutLog,
  subscribeToWorkoutLogs,
  subscribeToProgramProgress
} from '../services/firebaseService';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

interface WorkoutLog {
  id?: string;
  workoutId: string;
  exerciseId: string;
  completed: boolean;
  date: string;
  editedData?: any;
  workoutStartTime?: string;
  workoutEndTime?: string;
}

interface ProgramProgress {
  programId: string;
  phase: string;
  week: number;
  day: number;
  completed: boolean;
  date: string;
}

interface WorkoutTrackerProps {
  userId: string;
  isAdminView?: boolean;
  onBack?: () => void;
}

export default function WorkoutTracker({ userId, isAdminView = false, onBack }: WorkoutTrackerProps) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [programProgress, setProgramProgress] = useState<ProgramProgress[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'phase' | 'completion' | 'exercises' | 'duration'>('phase');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [videoModal, setVideoModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; log: WorkoutLog | null }>({
    isOpen: false,
    log: null
  });

  const showSaveConfirmation = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/workout-logs/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch workout logs");
      const logs = await res.json();
      const localEditedDataRaw = safeStorage.getItem(`editedExercises_${userId}`);
      const localEditedData = localEditedDataRaw ? JSON.parse(localEditedDataRaw) : {};
      
      const localCompletedRaw = safeStorage.getItem(`completedExercises_${userId}`);
      const localCompleted = localCompletedRaw ? JSON.parse(localCompletedRaw) : {};

      setWorkoutLogs(logs.map((l: any) => {
        const key = `${l.workout_id}-${l.exercise_id}`;
        const apiEditedData = (() => {
          if (!l.edited_data) return {};
          if (typeof l.edited_data === 'object') return l.edited_data;
          try {
            return JSON.parse(l.edited_data);
          } catch (e) {
            console.error("Error parsing edited_data in WorkoutTracker:", e, l.edited_data);
            return {};
          }
        })();

        const isCompleted = localCompleted[key] !== undefined ? localCompleted[key] : (l.completed === 1 || l.completed === true);

        return {
          id: l.id,
          workoutId: l.workout_id,
          exerciseId: l.exercise_id,
          completed: isCompleted,
          date: l.date || getCurrentDate(),
          editedData: localEditedData[key] || apiEditedData,
          workoutStartTime: l.workout_start_time,
          workoutEndTime: l.workout_end_time
        };
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'workout_logs');
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`/api/workout-feedback/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  useEffect(() => {
    let unsubscribeLogs: () => void;
    let unsubscribeProgress: () => void;

    const fetchData = async () => {
      try {
        // First, sync any local data that might not be in the database
        await syncLocalData();
        
        await fetchFeedback();

        // Real-time listeners
        unsubscribeLogs = subscribeToWorkoutLogs(userId, (logs) => {
          const localEditedDataRaw = safeStorage.getItem(`editedExercises_${userId}`);
          const localEditedData = localEditedDataRaw ? JSON.parse(localEditedDataRaw) : {};
          
          const localCompletedRaw = safeStorage.getItem(`completedExercises_${userId}`);
          const localCompleted = localCompletedRaw ? JSON.parse(localCompletedRaw) : {};

          setWorkoutLogs(logs.map((l: any) => {
            const key = `${l.workout_id}-${l.exercise_id}`;
            const apiEditedData = (() => {
              if (!l.edited_data) return {};
              if (typeof l.edited_data === 'object') return l.edited_data;
              try {
                return JSON.parse(l.edited_data);
              } catch (e) {
                console.error("Error parsing edited_data in WorkoutTracker:", e, l.edited_data);
                return {};
              }
            })();

            const isCompleted = localCompleted[key] !== undefined ? localCompleted[key] : (l.completed === 1 || l.completed === true);

            return {
              id: l.id,
              workoutId: l.workout_id,
              exerciseId: l.exercise_id,
              completed: isCompleted,
              date: l.date || getCurrentDate(),
              editedData: localEditedData[key] || apiEditedData,
              workoutStartTime: l.workout_start_time,
              workoutEndTime: l.workout_end_time
            };
          }));
        });

        unsubscribeProgress = subscribeToProgramProgress(userId, (progress) => {
          setProgramProgress(progress.map((p: any) => ({
            ...p,
            programId: p.program_id,
            completed: p.completed === 1 || p.completed === true
          })));
        });

      } catch (err) {
        console.error("Failed to fetch workout data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeProgress) unsubscribeProgress();
    };
  }, [userId]);

  const syncLocalData = async () => {
    if (userId === 'guest') return;
    
    try {
      const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
      const editedRaw = safeStorage.getItem(`editedExercises_${userId}`);
      
      const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
      const editedLocal = editedRaw ? JSON.parse(editedRaw) : {};
      
      if (Object.keys(completedLocal).length === 0 && Object.keys(editedLocal).length === 0) return;

      // Fetch existing logs to avoid duplicates
      const existingLogs = await getWorkoutLogs(userId);
      const existingKeys = new Set(existingLogs.map((l: any) => `${l.workout_id}-${l.exercise_id}`));
      
      const logsToSync = [];
      
      // Sync completed exercises
      for (const key of Object.keys(completedLocal)) {
        if (!existingKeys.has(key)) {
          const [workoutId, exerciseId] = key.split('-');
          if (workoutId && exerciseId) {
            logsToSync.push({
              workoutId,
              exerciseId,
              completed: completedLocal[key],
              date: getCurrentDate(),
              editedData: editedLocal[key] || {}
            });
            existingKeys.add(key); // Prevent adding same key twice if it's also in editedLocal
          }
        }
      }
      
      // Sync edited exercises that weren't in completedLocal
      for (const key of Object.keys(editedLocal)) {
        if (!existingKeys.has(key)) {
          const [workoutId, exerciseId] = key.split('-');
          if (workoutId && exerciseId) {
            logsToSync.push({
              workoutId,
              exerciseId,
              completed: false, // It's edited but not completed
              date: getCurrentDate(),
              editedData: editedLocal[key]
            });
            existingKeys.add(key);
          }
        }
      }
      
      if (logsToSync.length > 0) {
        await fetch(`/api/workout-logs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSync })
        });
      }
    } catch (err) {
      console.error("Failed to sync local data", err);
    }
  };

  const handleAddLog = async (log: WorkoutLog) => {
    try {
      const res = await fetch(`/api/workout-logs/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: [{
            workoutId: log.workoutId,
            exerciseId: log.exerciseId,
            completed: log.completed,
            date: log.date,
            editedData: log.editedData || {},
            workoutStartTime: log.workoutStartTime,
            workoutEndTime: log.workoutEndTime
          }]
        })
      });
      if (!res.ok) throw new Error("Failed to add log");
      await fetchLogs();
      checkAndMarkWorkoutComplete(log.workoutId, log.date);
    } catch (err) {
      console.error("Error adding log:", err);
    }
  };

  const checkAndMarkWorkoutComplete = async (workoutId: string, date: string) => {
    // Find the workout in ALL_PROGRAMS to get its structure
    let workout = null;
    let programId = '';
    let phaseName = '';
    let weekNum = 0;
    let dayNum = 0;

    for (const prog of ALL_PROGRAMS) {
      for (const phase of prog.phases) {
        for (const week of phase.weeks) {
          const found = week.workouts.find(w => w.id === workoutId);
          if (found) {
            workout = found;
            programId = prog.id;
            phaseName = phase.name;
            weekNum = week.week;
            dayNum = found.day;
            break;
          }
        }
        if (workout) break;
      }
      if (workout) break;
    }

    if (!workout) return;

    // Check if all exercises for this workout on this date are completed in workoutLogs
    const workoutExercises = workout.exercises;
    const logsForWorkout = workoutLogs.filter(l => l.workoutId === workoutId && l.date === date);
    
    const allCompleted = workoutExercises.every(ex => {
      const log = logsForWorkout.find(l => l.exerciseId === ex.id);
      return log && log.completed;
    });

    if (allCompleted) {
      // Mark as complete in program_progress
      try {
        await fetch(`/api/program-progress/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progress: [{
              programId,
              phase: phaseName,
              week: weekNum,
              day: dayNum,
              completed: true,
              date
            }]
          })
        });
        window.dispatchEvent(new Event('workout-completed'));
      } catch (err) {
        console.error("Failed to mark workout as complete:", err);
      }
    }
  };

  const handleUpdateLog = async (log: WorkoutLog) => {
    const isCompleted = !log.completed;
    if (isCompleted) {
      haptics.success();
    } else {
      haptics.light();
    }
    try {
      const res = await fetch(`/api/workout-logs/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: [{
            workoutId: log.workoutId,
            exerciseId: log.exerciseId,
            completed: isCompleted,
            date: log.date,
            editedData: log.editedData || {},
            workoutStartTime: log.workoutStartTime,
            workoutEndTime: log.workoutEndTime
          }]
        })
      });
      if (!res.ok) throw new Error("Failed to update log");
      
      // Sync to local storage
      const key = `${log.workoutId}-${log.exerciseId}`;
      const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
      const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
      completedLocal[key] = isCompleted;
      safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedLocal));
      
      await fetchLogs();
      checkAndMarkWorkoutComplete(log.workoutId, log.date);
      showSaveConfirmation(isCompleted ? "Exercise Completed" : "Exercise Marked Incomplete");
      window.dispatchEvent(new Event('workout-completed'));
    } catch (err) {
      console.error("Error updating log:", err);
    }
  };

  const handleDeleteLog = async (log: WorkoutLog) => {
    setDeleteConfirm({ isOpen: true, log });
  };

  const confirmDeleteLog = async () => {
    if (!deleteConfirm.log) return;
    const log = deleteConfirm.log;
    
    try {
      const res = await fetch(`/api/workout-logs/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: log.workoutId,
          exercise_id: log.exerciseId,
          date: log.date
        })
      });
      if (!res.ok) throw new Error("Failed to delete log");
      
      // Sync to local storage
      const key = `${log.workoutId}-${log.exerciseId}`;
      const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
      const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
      delete completedLocal[key];
      safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedLocal));
      
      const editedRaw = safeStorage.getItem(`editedExercises_${userId}`);
      const editedLocal = editedRaw ? JSON.parse(editedRaw) : {};
      delete editedLocal[key];
      safeStorage.setItem(`editedExercises_${userId}`, JSON.stringify(editedLocal));
      
      await fetchLogs();
      showSaveConfirmation("Exercise Deleted");
      window.dispatchEvent(new Event('workout-completed'));
    } catch (err) {
      console.error("Error deleting log:", err);
    } finally {
      setDeleteConfirm({ isOpen: false, log: null });
    }
  };

  const calculateCompletion = (period: 'week' | 'month' | 'year') => {
    const nowStr = getCurrentDate();
    const now = parseISODate(nowStr);
    let startDate = parseISODate(nowStr);

    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const periodProgress = programProgress.filter(p => parseISODate(p.date) >= startDate);
    const totalWorkouts = periodProgress.length;
    const completedWorkouts = periodProgress.filter(p => p.completed).length;

    if (totalWorkouts === 0) return 0;
    return Math.round((completedWorkouts / totalWorkouts) * 100);
  };

  const getPhaseData = () => {
    const phases = [
      { name: 'MEE', range: [1, 12] },
      { name: 'S&P', range: [13, 24] },
      { name: 'SHP', range: [25, 36] },
      { name: 'FTTX', range: [37, 48] },
      { name: 'OP', range: [49, 52] },
    ];

    return phases.map(phase => {
      const phaseProgress = programProgress.filter(p => p.week >= phase.range[0] && p.week <= phase.range[1]);
      const completed = phaseProgress.filter(p => p.completed).length;
      const total = (phase.range[1] - phase.range[0] + 1) * 7; // Assuming 7 days per week
      return {
        name: phase.name,
        value: total === 0 ? 0 : Math.round((completed / total) * 100)
      };
    });
  };

  const getChartData = () => {
    if (metric === 'phase') return getPhaseData();

    // Group logs by date
    const logsByDate: Record<string, WorkoutLog[]> = {};
    workoutLogs.forEach(log => {
      if (!logsByDate[log.date]) logsByDate[log.date] = [];
      logsByDate[log.date].push(log);
    });

    return Object.entries(logsByDate).map(([date, logs]) => {
      const completed = logs.filter(l => l.completed).length;
      const total = logs.length;
      
      let value = 0;
      if (metric === 'completion') value = total === 0 ? 0 : Math.round((completed / total) * 100);
      else if (metric === 'exercises') value = completed;
      else if (metric === 'duration') {
        // Calculate duration for each workout session on this date
        const sessions: Record<string, { start: Date, end: Date }> = {};
        logs.forEach(log => {
          if (log.workoutStartTime && log.workoutEndTime) {
            const sessionId = log.workoutId;
            const start = new Date(log.workoutStartTime);
            const end = new Date(log.workoutEndTime);
            if (!sessions[sessionId] || start < sessions[sessionId].start) sessions[sessionId] = { start, end };
            if (end > sessions[sessionId].end) sessions[sessionId].end = end;
          }
        });
        value = Object.values(sessions).reduce((acc, s) => acc + (s.end.getTime() - s.start.getTime()) / (1000 * 60), 0);
      }

      return { name: date.slice(5), value };
    });
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.max(0, Math.round((endTime - startTime) / (1000 * 60)));
  };

  const getRecentSessions = () => {
    const sessions: Record<string, { 
      workoutId: string, 
      date: string, 
      startTime?: string, 
      endTime?: string, 
      completedCount: number, 
      totalCount: number,
      logs: WorkoutLog[]
    }> = {};

    workoutLogs.forEach(log => {
      const key = `${log.workoutId}-${log.date}`;
      if (!sessions[key]) {
        sessions[key] = {
          workoutId: log.workoutId,
          date: log.date,
          startTime: log.workoutStartTime,
          endTime: log.workoutEndTime,
          completedCount: 0,
          totalCount: 0,
          logs: []
        };
      }
      sessions[key].logs.push(log);
      sessions[key].totalCount++;
      if (log.completed) sessions[key].completedCount++;
      if (log.workoutStartTime) sessions[key].startTime = log.workoutStartTime;
      if (log.workoutEndTime) sessions[key].endTime = log.workoutEndTime;
    });

    return Object.values(sessions)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const getSessionsNeedingFeedback = () => {
    const sessions = getRecentSessions();
    if (!Array.isArray(feedback)) return [];
    return sessions.filter(session => {
      // Check if feedback exists for this workoutId on this date
      // We look for feedback where the workout_id matches and it was created on the same day as the session
      return !feedback.some(f => 
        f.workout_id === session.workoutId && 
        f.created_at && f.created_at.startsWith(session.date)
      );
    });
  };

  const handleDeleteSession = async (session: any) => {
    if (!window.confirm("Are you sure you want to delete this entire workout session?")) {
      return;
    }
    try {
      const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
      const completedLocal = completedRaw ? JSON.parse(completedRaw) : {};
      const editedRaw = safeStorage.getItem(`editedExercises_${userId}`);
      const editedLocal = editedRaw ? JSON.parse(editedRaw) : {};
      
      let localChanged = false;

      for (const log of session.logs) {
        if (log.id) {
          await deleteWorkoutLog(log.id);
          
          const key = `${log.workoutId}-${log.exerciseId}`;
          if (key in completedLocal) {
            delete completedLocal[key];
            localChanged = true;
          }
          if (key in editedLocal) {
            delete editedLocal[key];
            localChanged = true;
          }
        }
      }
      
      if (localChanged) {
        safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedLocal));
        safeStorage.setItem(`editedExercises_${userId}`, JSON.stringify(editedLocal));
      }

      await fetchLogs();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'workout_logs');
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading workout data...</p>
      </div>
    );
  }

  const pendingSessions = getSessionsNeedingFeedback();
  const firstPendingSession = pendingSessions[0];

  return (
    <div className="space-y-8">
      {/* View Toggle */}
      <div className="flex items-center justify-end gap-2">
        <button 
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-xl transition-colors krome-outline ${viewMode === 'list' ? 'bg-gold text-black' : 'bg-white/5 text-white/60'}`}
        >
          <ListIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setViewMode('calendar')}
          className={`p-2 rounded-xl transition-colors ${viewMode === 'calendar' ? 'bg-gold text-black' : 'bg-white/5 text-white/60'}`}
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8">
          <ReactCalendar 
            onChange={(value) => setSelectedDate(value as Date)} 
            value={selectedDate}
            tileContent={({ date }) => {
              const hasWorkout = workoutLogs.some(log => isSameDay(parseISODate(log.date), date));
              return hasWorkout ? <div className="w-2 h-2 bg-gold rounded-full mx-auto mt-1" /> : null;
            }}
            className="w-full bg-transparent border-none text-white"
          />
          <div className="mt-8">
            <h4 className="text-lg font-black uppercase italic mb-4">Workouts on {format(selectedDate, 'PPP')}</h4>
            {workoutLogs.filter(log => isSameDay(parseISODate(log.date), selectedDate)).length > 0 ? (
              <div className="space-y-2">
                {workoutLogs.filter(log => isSameDay(parseISODate(log.date), selectedDate)).map(log => {
                  const exerciseDetails = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
                  const videoUrl = exerciseDetails?.videoUrl;
                  const name = exerciseDetails?.name || log.exerciseId;

                  return (
                    <div key={`${log.workoutId}-${log.exerciseId}`} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gold">{log.workoutId.replace(/-/g, ' ')}</p>
                        <p className="text-xs text-white/60">Exercise: {name}</p>
                        {(log.editedData?.sets || log.editedData?.reps || log.editedData?.weight) && (
                          <div className="flex gap-3 mt-2 text-[10px] font-mono text-white/40">
                            {log.editedData?.sets && <span>Sets: {log.editedData.sets}</span>}
                            {log.editedData?.reps && <span>Reps: {log.editedData.reps}</span>}
                            {log.editedData?.weight && <span>Weight: {log.editedData.weight}</span>}
                          </div>
                        )}
                        {videoUrl && (
                          <button 
                            onClick={() => setVideoModal({ isOpen: true, url: videoUrl, title: name })}
                            className="text-[10px] text-gold hover:underline mt-1 flex items-center gap-1 !outline-none"
                          >
                            <PlayCircle className="w-3 h-3" /> Watch Demo
                          </button>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${log.completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gold/20 text-gold'}`}>
                        {log.completed ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40">No workouts on this day.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Weekly Completion', value: calculateCompletion('week'), icon: Activity, color: 'text-gold' },
              { label: 'Monthly Progress', value: calculateCompletion('month'), icon: TrendingUp, color: 'text-accent' },
              { label: 'Yearly Consistency', value: calculateCompletion('year'), icon: Award, color: 'text-blue-400' }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">{stat.label}</div>
                  <div className="flex flex-col items-start gap-0">
                    <div className={`text-4xl font-black italic ${stat.color}`}>{stat.value}%</div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Completed</div>
                  </div>
                  <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      className={`h-full bg-gradient-to-r from-gold to-accent`}
                      role="progressbar"
                      aria-valuenow={stat.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stat.label} progress`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="space-y-8">
            {/* Phase Progress Chart */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase italic tracking-tight">
                  {metric === 'phase' ? 'Phase' : metric === 'completion' ? 'Completion' : metric === 'exercises' ? 'Exercises' : 'Duration'} <span className="text-gold">Progress</span>
                </h3>
                <select 
                  value={metric} 
                  onChange={(e) => setMetric(e.target.value as any)}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-gold w-32"
                  aria-label="Select metric for progress chart"
                >
                  <option value="phase">Phase</option>
                  <option value="completion">Completion %</option>
                  <option value="exercises">Exercises</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#008080" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl shadow-xl">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{label}</p>
                              <p className="text-sm font-black italic text-gold">{payload[0].value} {metric === 'duration' ? 'min' : ''}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phase Progress */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-6 text-white/80">Phase <span className="text-gold">Progress</span></h3>
              <div className="space-y-4">
                {[
                  { name: 'MEE', range: [1, 12], color: 'from-amber-900 via-gold to-amber-900' },
                  { name: 'S&P', range: [13, 24], color: 'from-emerald-900 via-emerald-500 to-emerald-900' },
                  { name: 'SHP', range: [25, 36], color: 'from-blue-900 via-blue-500 to-blue-900' },
                  { name: 'FTTX', range: [37, 48], color: 'from-purple-900 via-purple-500 to-purple-900' },
                  { name: 'OP', range: [49, 52], color: 'from-rose-900 via-rose-500 to-rose-900' }
                ].map((phase) => {
                  const phaseProgress = programProgress.filter(p => p.week >= phase.range[0] && p.week <= phase.range[1]);
                  const completed = phaseProgress.filter(p => p.completed).length;
                  const total = (phase.range[1] - phase.range[0] + 1) * 7;
                  const percent = Math.min(100, Math.round((completed / total) * 100));

                  return (
                    <div key={phase.name} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-colors">
                      <div className="text-xs font-black uppercase tracking-widest text-white/70">{phase.name}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={`h-full bg-gradient-to-r ${phase.color}`}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${phase.name} phase progress`}
                        />
                      </div>
                      <div className="text-xs font-black italic text-gold w-10 text-right">{percent}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Workouts - Full Width */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white/80">Recent <span className="text-gold">Workouts</span></h3>
              <button 
                onClick={fetchLogs} 
                className="text-white/60 hover:text-gold transition-colors"
                aria-label="Refresh workout logs"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {getRecentSessions().map((session, idx) => {
                const sessionId = `${session.workoutId}-${session.date}`;
                const isExpanded = expandedSession === sessionId;
                
                return (
                <div key={idx} className="flex flex-col bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                  <div 
                    onClick={() => setExpandedSession(isExpanded ? null : sessionId)}
                    className="flex items-center justify-between p-4 cursor-pointer gap-8"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${session.completedCount === session.totalCount ? 'bg-emerald-500' : 'bg-gold'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold uppercase tracking-widest text-white/70 whitespace-nowrap overflow-hidden text-ellipsis" title={session.workoutId.replace(/-/g, ' ')}>
                          {session.workoutId.replace(/-/g, ' ')}
                        </span>
                        <span className="text-xs text-white/30">
                          {session.completedCount}/{session.totalCount} Exercises
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0">
                      {session.startTime && session.endTime && (
                        <div className="flex items-center gap-2 text-gold bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/10">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-mono font-bold whitespace-nowrap">
                            {calculateDuration(session.startTime, session.endTime)} min
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-white/30 font-medium whitespace-nowrap">
                        {formatDate(session.date)}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session); }}
                        className="text-white/40 hover:text-red-500 transition-colors"
                        aria-label="Delete workout session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/40"
                      >
                        <div className="p-4 space-y-2">
                          {workoutLogs
                            .filter(log => log.workoutId === session.workoutId && log.date === session.date)
                            .map(log => {
                              const exerciseDetails = EXERCISE_LIBRARY.find(e => e.id === log.exerciseId);
                              const videoUrl = exerciseDetails?.videoUrl;
                              const name = exerciseDetails?.name || log.exerciseId;

                              return (
                                <div key={`${log.workoutId}-${log.exerciseId}`} className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-bold text-white/80">{name}</p>
                                    {(log.editedData?.sets || log.editedData?.reps || log.editedData?.weight) && (
                                      <div className="flex gap-3 mt-1 text-[10px] font-mono text-white/40">
                                        {log.editedData?.sets && <span>Sets: {log.editedData.sets}</span>}
                                        {log.editedData?.reps && <span>Reps: {log.editedData.reps}</span>}
                                        {log.editedData?.weight && <span>Weight: {log.editedData.weight}</span>}
                                      </div>
                                    )}
                                    {videoUrl && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setVideoModal({ isOpen: true, url: videoUrl, title: name }); }}
                                        className="text-[10px] text-gold hover:underline mt-1 flex items-center gap-1 !outline-none"
                                      >
                                        <PlayCircle className="w-3 h-3" /> Watch Demo
                                      </button>
                                    )}
                                  </div>
                                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${log.completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gold/20 text-gold'}`}>
                                    {log.completed ? 'Completed' : 'Pending'}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )})}
            </div>
          </div>

          {/* Workout Feedback */}
          {!isAdminView && firstPendingSession && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Pending Feedback Required</h4>
              </div>
              <WorkoutFeedback 
                userId={userId} 
                workoutId={firstPendingSession.workoutId} 
                programId="52-week-foundation" 
                onSuccess={() => {
                  // Refresh feedback list after submission
                  setTimeout(fetchFeedback, 2000);
                }}
              />
            </div>
          )}
        </>
      )}

      <VideoModal 
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Workout Log"
        message="Are you sure you want to delete this workout log? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDeleteLog}
        onCancel={() => setDeleteConfirm({ isOpen: false, log: null })}
      />

      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
