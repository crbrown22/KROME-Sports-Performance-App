import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  Search, 
  Dumbbell, 
  Calendar,
  Clock,
  Info,
  X,
  Check,
  TrendingUp,
  BarChart2,
  Layout,
  Activity
} from 'lucide-react';
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
  Legend
} from 'recharts';
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';
import { FullProgramTemplate } from '../data/workoutTemplates';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface ExerciseEntry {
  id: string;
  exerciseId: string;
  sets: string;
  reps: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  nameOverride?: string;
  videoLinkOverride?: string;
  canGenerateVideo?: boolean;
}

interface DayEntry {
  id: string;
  title: string;
  exercises: ExerciseEntry[];
}

interface WeekEntry {
  id: string;
  weekNumber: number;
  days: DayEntry[];
}

interface ProgramBuilderProps {
  userId: string;
  onSave?: () => void;
  onBack?: () => void;
  initialProgram?: FullProgramTemplate;
  initialPhaseIdx?: number;
  isCustom?: boolean;
}

export default function ProgramBuilder({ userId, onSave, onBack, initialProgram, initialPhaseIdx = 0, isCustom = false }: ProgramBuilderProps) {
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [weeks, setWeeks] = useState<WeekEntry[]>(() => {
    if (initialProgram) {
      // Transform phases back to weeks structure
      const phase = initialProgram.phases[initialPhaseIdx] || initialProgram.phases[0];
      if (!phase) return [];
      
      return phase.weeks.map(w => ({
        id: generateId(),
        weekNumber: w.week,
        days: w.workouts.map(d => ({
          id: d.id,
          title: d.title,
          exercises: d.exercises.map(ex => ({
            id: generateId(),
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            tempo: ex.tempo,
            rest: ex.rest,
            notes: ex.notes,
            nameOverride: ex.nameOverride,
            videoLinkOverride: ex.videoLinkOverride,
            canGenerateVideo: ex.canGenerateVideo
          }))
        }))
      }));
    }
    return [];
  });
  
  useEffect(() => {
    console.log("ProgramBuilder mounted, initialProgram:", initialProgram, "isCustom:", isCustom);
    if (initialProgram) {
      // Transform phases back to weeks structure
      const phase = initialProgram.phases[initialPhaseIdx] || initialProgram.phases[0];
      if (phase) {
        const transformedWeeks = phase.weeks.map(w => ({
          id: generateId(),
          weekNumber: w.week,
          days: w.workouts.map(d => ({
            id: d.id,
            title: d.title,
            exercises: d.exercises.map(ex => ({
              id: generateId(),
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              tempo: ex.tempo,
              rest: ex.rest,
              notes: ex.notes,
              nameOverride: ex.nameOverride,
              videoLinkOverride: ex.videoLinkOverride,
              canGenerateVideo: ex.canGenerateVideo
            }))
          }))
        }));
        setWeeks(transformedWeeks);
        setProgramName(initialProgram.name);
        setProgramDescription(initialProgram.description);
      }
    }
  }, [initialProgram, initialPhaseIdx, isCustom]);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeView, setActiveView] = useState<'builder' | 'analytics'>('builder');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'week' | 'exercise', weekId: string, dayId?: string, exerciseId?: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [targetWeekId, setTargetWeekId] = useState<string | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState<{weekId: string, dayId: string} | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('All');

  const handleWeekToggle = (weekId: string) => {
    if (activeWeekId === weekId) {
      setActiveWeekId(null);
      setActiveDayId(null);
    } else {
      setActiveWeekId(weekId);
      const week = weeks.find(w => w.id === weekId);
      if (week && week.days.length > 0) {
        setActiveDayId(week.days[0].id);
      } else {
        setActiveDayId(null);
      }
    }
  };

  const addWeek = () => {
    console.log("addWeek called");
    const newWeek: WeekEntry = {
      id: generateId(),
      weekNumber: weeks.length + 1,
      days: []
    };
    setWeeks([...weeks, newWeek]);
    handleWeekToggle(newWeek.id);
  };

  const removeWeek = (weekId: string) => {
    setWeeks(weeks.filter(w => w.id !== weekId).map((w, idx) => ({ ...w, weekNumber: idx + 1 })));
    if (activeWeekId === weekId) setActiveWeekId(null);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const addDay = (weekId: string, title?: string) => {
    console.log("addDay called with:", weekId, title);
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        console.log("Found week:", w);
        if (w.days.length >= 7) {
          setMessage({ type: 'error', text: 'Maximum 7 days per week reached' });
          return w;
        }
        const newDay: DayEntry = {
          id: generateId(),
          title: title || `Day ${w.days.length + 1}`,
          exercises: []
        };
        console.log("New day created:", newDay);
        setActiveDayId(newDay.id);
        setActiveWeekId(weekId);
        return { ...w, days: [...w.days, newDay] };
      }
      return w;
    }));
    setIsAddingWorkout(false);
    setNewWorkoutTitle('');
    setTargetWeekId(null);
  };

  const addExercise = (weekId: string, dayId: string, exerciseName: string, category: string) => {
    console.log("addExercise called with:", weekId, dayId, exerciseName, category);
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        console.log("Found week:", w);
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              console.log("Found day:", d);
              const newExercise: ExerciseEntry = {
                id: generateId(),
                exerciseId: EXERCISE_LIBRARY.find(ex => ex.name === exerciseName)?.id || '',
                sets: '3',
                reps: '10',
                tempo: '',
                rest: '60s',
                notes: '',
                nameOverride: '',
                videoLinkOverride: '',
                canGenerateVideo: true
              };
              console.log("New exercise created:", newExercise);
              return { ...d, exercises: [...d.exercises, newExercise] };
            }
            return d;
          })
        };
      }
      return w;
    }));
  };

  const removeExercise = (weekId: string, dayId: string, exerciseId: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              return { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) };
            }
            return d;
          })
        };
      }
      return w;
    }));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'week') {
      removeWeek(deleteTarget.weekId);
    } else if (deleteTarget.type === 'exercise' && deleteTarget.dayId && deleteTarget.exerciseId) {
      removeExercise(deleteTarget.weekId, deleteTarget.dayId, deleteTarget.exerciseId);
    }
  };

  const updateExercise = (weekId: string, dayId: string, exerciseId: string, field: keyof ExerciseEntry, value: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                exercises: d.exercises.map(ex => {
                  if (ex.id === exerciseId) {
                    return { ...ex, [field]: value };
                  }
                  return ex;
                })
              };
            }
            return d;
          })
        };
      }
      return w;
    }));
  };

  const handleSave = async () => {
    const trimmedName = programName.trim();
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Please enter a program name' });
      return;
    }
    if (weeks.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one week' });
      return;
    }

    setSaving(true);
    try {
      const phases: any[] = [{
        name: 'Custom Phase',
        weeks: weeks.map(w => ({
          week: w.weekNumber,
          workouts: w.days.map((d, idx) => ({
            id: d.id,
            title: d.title,
            day: idx + 1,
            exercises: d.exercises.map(ex => ({
              id: ex.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              tempo: ex.tempo,
              rest: ex.rest,
              notes: ex.notes,
              nameOverride: ex.nameOverride,
              videoLinkOverride: ex.videoLinkOverride,
              canGenerateVideo: ex.canGenerateVideo
            }))
          }))
        }))
      }];

      const method = (isCustom && initialProgram?.id) ? 'PATCH' : 'POST';
      const url = (isCustom && initialProgram?.id) ? `/api/custom-programs/${userId}/${initialProgram.id}` : `/api/custom-programs/${userId}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: programDescription,
          data: { phases, programName: trimmedName }
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Program saved successfully!' });
        if (onSave) onSave();
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save program' });
    } finally {
      setSaving(false);
    }
  };

  const volumeData = useMemo(() => {
    return weeks.map(w => {
      let totalVolume = 0;
      let totalSets = 0;
      w.days.forEach(d => {
        d.exercises.forEach(ex => {
          // Parse sets
          const setsMatch = ex.sets.match(/\d+/);
          const sets = setsMatch ? parseInt(setsMatch[0]) : 0;

          // Parse reps
          let reps = 0;
          const repsStr = ex.reps || '';
          if (repsStr.toLowerCase().includes('max')) {
            reps = 10;
          } else if (repsStr.toLowerCase().includes('trials')) {
            reps = 1;
          } else {
            const repsMatches = repsStr.match(/\d+/g);
            if (repsMatches) {
              reps = parseInt(repsMatches[repsMatches.length - 1]);
            }
          }

          if (repsStr.toLowerCase().includes('ea')) {
            reps *= 2;
          }

          totalSets += sets;
          totalVolume += (sets * reps);
        });
      });
      return {
        name: `Week ${w.weekNumber}`,
        volume: totalVolume,
        sets: totalSets
      };
    });
  }, [weeks]);

  const allEquipment = useMemo(() => {
    return Array.from(new Set(EXERCISE_LIBRARY.flatMap(ex => ex.equipment))).sort();
  }, []);

  const EQUIPMENT_OPTIONS = [
    "BB", "DB", "Cable", "Bodyweight", "Band", "Suspension", "KB", "Machine", 
    "Life Fitness", "TechnoGym", "Nautilus", "Free Motion", "Precor", "Hammer", 
    "Ab Wheel", "GX Step", "EZ Bar", "GHD", "MB", "Mini Band", "PVC", 
    "Roman Chair", "SB", "BOSU", "Step 360", "ViPR"
  ];

  const getExerciseEquipment = (name: string) => {
    const exercise = EXERCISE_LIBRARY.find(ex => ex.name === name);
    const specific = exercise ? exercise.equipment : [];
    return Array.from(new Set([...specific, ...EQUIPMENT_OPTIONS])).sort();
  };

  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    const nameStr = ex.name || '';
    return (selectedCategory === 'All' || ex.category === selectedCategory) &&
           nameStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full px-4 md:px-8 space-y-8">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}
      <header className="bg-zinc-900/50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/5 shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                <Layout className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Program Name (e.g., 52-Week Elite Soccer)"
                className="text-xl md:text-2xl font-black uppercase italic bg-transparent border-b-2 border-white/10 focus:border-gold outline-none w-full pb-2 text-white transition-all"
                value={programName}
                onChange={(e) => {
                  console.log("Program name changed to:", e.target.value);
                  setProgramName(e.target.value);
                }}
                onBlur={(e) => console.log("Program name blurred:", e.target.value)}
                aria-label="Program Name"
              />
            </div>
            <textarea 
              placeholder="Program Description (Goals, focus areas, equipment needed...)"
              className="w-full bg-transparent text-white/60 outline-none resize-none h-16 md:h-20 text-sm md:text-base leading-relaxed"
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              aria-label="Program Description"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
              <button 
                onClick={() => setActiveView('builder')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'builder' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}
              >
                <Dumbbell className="w-3.5 h-3.5" /> Builder
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'analytics' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-gold text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all disabled:opacity-50 shadow-lg shadow-gold/10"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Program'}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 md:p-6 rounded-[24px] md:rounded-[32px] flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}
        >
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {message.type === 'success' ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Info className="w-4 h-4 md:w-5 md:h-5" />}
          </div>
          <span className="font-black uppercase tracking-wider text-xs md:text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </motion.div>
      )}

      {/* Add Workout Modal */}
      <AnimatePresence>
        {isAddingWorkout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase italic mb-6">Add <span className="text-gold">Workout</span></h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Workout Title</label>
                  <input 
                    type="text"
                    value={newWorkoutTitle}
                    onChange={(e) => setNewWorkoutTitle(e.target.value)}
                    placeholder="e.g. Upper Body Power"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setIsAddingWorkout(false);
                      setNewWorkoutTitle('');
                      setTargetWeekId(null);
                    }}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => targetWeekId && addDay(targetWeekId, newWorkoutTitle)}
                    disabled={!newWorkoutTitle.trim()}
                    className="flex-1 py-4 bg-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold/90 transition-all disabled:opacity-50"
                  >
                    Add Workout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {isAddingExercise && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-2xl max-h-[80vh] flex flex-col"
            >
              <h3 className="text-2xl font-black uppercase italic mb-6">Add <span className="text-gold">Exercise</span></h3>
              <div className="flex gap-4 mb-6">
                <input 
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold transition-all"
                />
                <select 
                  value={exerciseCategory}
                  onChange={(e) => setExerciseCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-gold transition-all"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredExercises.map(ex => (
                  <button 
                    key={ex.id}
                    onClick={() => {
                      addExercise(isAddingExercise.weekId, isAddingExercise.dayId, ex.name, ex.category);
                      setIsAddingExercise(null);
                    }}
                    className="w-full text-left p-4 bg-white/5 rounded-2xl hover:bg-gold/10 transition-all flex items-center justify-between"
                  >
                    <span className="font-bold">{ex.name}</span>
                    <span className="text-[10px] font-black uppercase text-gold">{ex.category}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsAddingExercise(null)}
                className="mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeView === 'builder' ? (
          <motion.div 
            key="builder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            {/* Program Structure - Moved up */}
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-zinc-900/30 p-6 rounded-[32px] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase italic text-white/80">Program <span className="text-gold">Structure</span></h2>
                </div>
                <button 
                  onClick={() => {
                    console.log("Add Week button clicked");
                    addWeek();
                  }}
                  className="flex items-center gap-2 bg-gold text-black font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-gold/90 px-6 py-3 rounded-xl transition-all shadow-lg shadow-gold/10"
                >
                  <Plus className="w-4 h-4" /> Add Week
                </button>
              </div>

              <div className="space-y-6">
                {weeks.length === 0 && (
                  <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-zinc-900/20">
                    <Calendar className="w-12 h-12 text-white/5 mx-auto mb-6" />
                    <h3 className="text-xl font-black uppercase italic text-white/20 mb-2">No Weeks Added</h3>
                    <p className="text-white/10 font-bold uppercase tracking-widest text-[10px]">Click "Add Week" to start building your elite protocol</p>
                  </div>
                )}
                {weeks.map((week) => (
                  <div key={week.id} className="bg-zinc-900/30 border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                    <div className="flex items-center hover:bg-white/5 transition-colors">
                      <button 
                        onClick={() => handleWeekToggle(week.id)}
                        className="flex-1 flex items-center justify-between p-6 md:p-8"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-black text-lg italic shrink-0">
                            {week.weekNumber}
                          </div>
                          <div className="text-left">
                            <span className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Week {week.weekNumber}</span>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">{week.days.length} Training Days</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex gap-1">
                            {[...Array(7)].map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < week.days.length ? 'bg-gold' : 'bg-white/5'}`} />
                            ))}
                          </div>
                          {activeWeekId === week.id ? <ChevronUp className="w-6 h-6 text-gold" /> : <ChevronDown className="w-6 h-6 text-white/20" />}
                        </div>
                      </button>
                      <button 
                        onClick={() => { setDeleteTarget({ type: 'week', weekId: week.id }); setShowDeleteConfirm(true); }}
                        className="p-8 text-rose-500/30 hover:text-rose-500 transition-colors border-l border-white/5"
                        aria-label="Delete Week"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {activeWeekId === week.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 md:px-8 pb-8 space-y-8"
                        >
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                            {week.days.map((day) => (
                              <button
                                key={day.id}
                                onClick={() => setActiveDayId(day.id)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDayId === day.id ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                              >
                                {day.title}
                                <span className="w-4 h-4 rounded bg-black/20 flex items-center justify-center text-[8px]">{day.exercises.length}</span>
                              </button>
                            ))}
                              {week.days.length < 7 && (
                                <button 
                                  onClick={() => {
                                    console.log("Add Day button clicked");
                                    setTargetWeekId(week.id);
                                    setIsAddingWorkout(true);
                                  }}
                                  className="px-5 py-2.5 rounded-xl bg-white/5 text-gold hover:bg-gold/10 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest border border-gold/20 border-dashed"
                                >
                                  <Plus className="w-3 h-3" /> Add Day
                                </button>
                              )}
                          </div>

                          {week.days.map((day) => activeDayId === day.id && (
                            <div key={day.id} className="space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <input 
                                  type="text"
                                  value={day.title}
                                  onChange={(e) => {
                                    setWeeks(weeks.map(w => w.id === week.id ? {
                                      ...w,
                                      days: w.days.map(d => d.id === day.id ? { ...d, title: e.target.value } : d)
                                    } : w));
                                  }}
                                  className="bg-transparent border-b-2 border-white/5 text-xl md:text-2xl font-black uppercase italic tracking-tighter outline-none focus:border-gold pb-2 text-white w-full max-w-md transition-all"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Day Configuration</div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {day.exercises.length === 0 && (
                                  <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[24px] bg-black/20">
                                    <Dumbbell className="w-10 h-10 text-white/5 mx-auto mb-4" />
                                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No exercises added yet</p>
                                  </div>
                                )}
                                {day.exercises.map((ex) => (
                                  <motion.div 
                                    layout
                                    key={ex.id} 
                                    className="bg-black/20 border border-white/5 p-6 rounded-2xl space-y-4 hover:border-white/10 transition-all group relative"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-gold/5 flex items-center justify-center text-gold shrink-0">
                                            <Dumbbell className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <span className="text-sm font-black uppercase italic text-white">{ex.nameOverride || EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)?.name || 'Unknown Exercise'}</span>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)?.category || 'General'}</div>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => { setDeleteTarget({ type: 'exercise', weekId: week.id, dayId: day.id, exerciseId: ex.id }); setShowDeleteConfirm(true); }}
                                          className="w-8 h-8 rounded-lg bg-rose-500/5 text-rose-500/30 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <div className="flex flex-col gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Sets</label>
                                          <input 
                                            type="text" 
                                            value={ex.sets}
                                            onChange={(e) => updateExercise(week.id, day.id, ex.id, 'sets', e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-gold outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Reps</label>
                                          <input 
                                            type="text" 
                                            value={ex.reps}
                                            onChange={(e) => updateExercise(week.id, day.id, ex.id, 'reps', e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-gold outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Tempo</label>
                                          <input 
                                            type="text" 
                                            value={ex.tempo}
                                            onChange={(e) => updateExercise(week.id, day.id, ex.id, 'tempo', e.target.value)}
                                            placeholder="3-1-1"
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-gold outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Rest</label>
                                          <input 
                                            type="text" 
                                            value={ex.rest}
                                            onChange={(e) => updateExercise(week.id, day.id, ex.id, 'rest', e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-gold outline-none transition-all"
                                          />
                                        </div>
                                      </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Coaching Cues & Notes</label>
                                      <input 
                                        type="text" 
                                        value={ex.notes}
                                        onChange={(e) => updateExercise(week.id, day.id, ex.id, 'notes', e.target.value)}
                                        placeholder="Add specific cues or personal performance notes..."
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-gold outline-none transition-all"
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Library - Moved down */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                    <Search className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase italic text-white/80">Exercise <span className="text-gold">Library</span></h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Search elite movements..."
                      className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-gold transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-gold appearance-none transition-all cursor-pointer"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="All">Filter Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    <select 
                      className="flex-1 bg-gold text-black border border-gold rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none appearance-none transition-all cursor-pointer"
                      onChange={(e) => {
                        const ex = EXERCISE_LIBRARY.find(x => x.name === e.target.value);
                        if (ex) {
                          // If no active day, try to find one in active week
                          let targetDayId = activeDayId;
                          let targetWkId = activeWeekId;

                          if (!targetDayId && targetWkId) {
                            const week = weeks.find(w => w.id === targetWkId);
                            if (week && week.days.length > 0) {
                              targetDayId = week.days[0].id;
                              setActiveDayId(targetDayId);
                            }
                          }

                          // If still no day, but we have weeks, use first week first day
                          if (!targetDayId && weeks.length > 0) {
                            targetWkId = weeks[0].id;
                            if (weeks[0].days.length > 0) {
                              targetDayId = weeks[0].days[0].id;
                              setActiveWeekId(targetWkId);
                              setActiveDayId(targetDayId);
                            }
                          }

                          if (ex && targetWkId && targetDayId) {
                            addExercise(targetWkId, targetDayId, ex.name, ex.category);
                          } else {
                            setMessage({ type: 'error', text: 'Please add a week and day first' });
                          }
                        }
                      }}
                      value=""
                    >
                      <option value="" disabled className="text-black bg-white">Quick Add...</option>
                      {CATEGORIES.map(cat => (
                        <optgroup key={cat} label={cat} className="bg-white text-black font-bold">
                          {EXERCISE_LIBRARY.filter(ex => ex.category === cat).map(ex => (
                            <option key={ex.id} value={ex.name} className="text-black bg-white">{ex.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredExercises.slice(0, 12).map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // If no active day, try to find one in active week
                      let targetDayId = activeDayId;
                      let targetWkId = activeWeekId;

                      if (!targetDayId && targetWkId) {
                        const week = weeks.find(w => w.id === targetWkId);
                        if (week && week.days.length > 0) {
                          targetDayId = week.days[0].id;
                          setActiveDayId(targetDayId);
                        }
                      }

                      // If still no day, but we have weeks, use first week first day
                      if (!targetDayId && weeks.length > 0) {
                        targetWkId = weeks[0].id;
                        if (weeks[0].days.length > 0) {
                          targetDayId = weeks[0].days[0].id;
                          setActiveWeekId(targetWkId);
                          setActiveDayId(targetDayId);
                        }
                      }

                      if (targetWkId && targetDayId) {
                        addExercise(targetWkId, targetDayId, ex.name, ex.category);
                      } else {
                        setMessage({ type: 'error', text: 'Please add a week and day first' });
                      }
                    }}
                    className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-transparent hover:border-gold/20 text-left flex flex-col justify-between h-full"
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-black uppercase italic text-white group-hover:text-gold transition-colors line-clamp-2 leading-tight">{ex.name}</div>
                        {ex.videoUrl && (
                          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase tracking-widest text-gold hover:underline">
                            Watch Demo
                          </a>
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{ex.category}</div>
                  </button>
                ))}
              </div>
              {filteredExercises.length > 12 && (
                <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-widest mt-6">
                  + {filteredExercises.length - 12} more movements available. Use search to find specific exercises.
                </p>
              )}
              {!activeDayId && (
                <p className="text-center text-gold/40 text-[10px] font-black uppercase tracking-widest mt-4">
                  Select a training day above to add exercises
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Program Weeks</div>
                <div className="text-5xl font-black italic text-gold">{weeks.length}</div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Training Days</div>
                <div className="text-5xl font-black italic text-accent">{weeks.reduce((acc, w) => acc + w.days.length, 0)}</div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Exercise Volume</div>
                <div className="text-5xl font-black italic text-white">{weeks.reduce((acc, w) => acc + w.days.reduce((dAcc, d) => dAcc + d.exercises.length, 0), 0)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[48px] shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">Volume <span className="text-gold">Progression</span></h3>
                    <p className="text-white/30 text-sm font-bold uppercase tracking-widest mt-1">Total Reps per Week</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-gold/20" />
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        content={({ payload }) => (
                          <div className="flex gap-4 mb-4">
                            {payload?.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#c59c21" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorVolume)" 
                        name="Volume"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sets" 
                        stroke="#b2d8d8" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorSets)" 
                        name="Sets"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[48px] shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">Intensity <span className="text-accent">Tracker</span></h3>
                    <p className="text-white/30 text-sm font-bold uppercase tracking-widest mt-1">Total Sets per Week</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-accent/20" />
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#b2d8d8' }}
                      />
                      <Line 
                        type="stepAfter" 
                        dataKey="sets" 
                        stroke="#b2d8d8" 
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#b2d8d8', strokeWidth: 2, stroke: '#18181b' }}
                        activeDot={{ r: 8, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[48px] shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic mb-8">Program <span className="text-gold">Summary</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {weeks.map(w => (
                  <div key={w.id} className="bg-black/40 p-6 rounded-3xl border border-white/5">
                    <div className="text-gold font-black italic text-lg mb-4">Week {w.weekNumber}</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Training Days</span>
                        <span className="text-sm font-bold text-white">{w.days.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Movements</span>
                        <span className="text-sm font-bold text-white">{w.days.reduce((acc, d) => acc + d.exercises.length, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Projected Volume</span>
                        <span className="text-sm font-bold text-accent">{w.days.reduce((acc, d) => acc + d.exercises.reduce((eAcc, ex) => eAcc + (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0), 0), 0)} reps</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-red-500/20 rounded-[40px] p-10 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-xl">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Delete Item?</h3>
              <p className="text-white/40 mb-10 leading-relaxed text-sm">
                Are you sure you want to delete this {deleteTarget.type}? This action is permanent.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-white/5 text-white rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
