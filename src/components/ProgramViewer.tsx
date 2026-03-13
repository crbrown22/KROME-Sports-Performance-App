import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  Edit2, 
  Trash2,
  Save, 
  X, 
  Calendar,
  Clock,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  TrendingUp,
  Dumbbell,
  Lock,
  Bot
} from 'lucide-react';
import AICoach from './AICoach';
import WorkoutFeedback from './WorkoutFeedback';
import VolumeProgressionChart from './VolumeProgressionChart';
import VideoModal from './VideoModal';
import { ALL_PROGRAMS, FullProgramTemplate, WorkoutTemplate, ExerciseTemplate } from '../data/workoutTemplates';
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';
import { getCurrentDate } from '../utils/date';
import { logActivity } from '../utils/activity';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface ProgramViewerProps {
  userId: string;
  onBack: () => void;
  onSelectLockedProgram?: (program: FullProgramTemplate) => void;
  initialProgramId?: string;
  initialPhaseIdx?: number;
  isAdmin?: boolean;
  onEdit?: (program: FullProgramTemplate, isCustom: boolean) => void;
  onDelete?: (programId: string) => void;
  onProgramSelect?: (programId: string) => void;
  onCreateNew?: () => void;
}

export default function ProgramViewer({ userId, onBack, onSelectLockedProgram, initialProgramId, initialPhaseIdx, isAdmin = false, onEdit, onDelete, onProgramSelect, onCreateNew }: ProgramViewerProps) {
  console.log("ProgramViewer rendering");
  const [selectedProgram, setSelectedProgram] = useState<FullProgramTemplate | null>(null);
  const [customPrograms, setCustomPrograms] = useState<FullProgramTemplate[]>([]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(initialPhaseIdx || 0);
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [editedExercises, setEditedExercises] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExerciseTemplate>>({});
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'program' | 'workout' | 'exercises'>('list');
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('All');
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);
  const [videoModal, setVideoModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});

  const uniqueExercises = useMemo(() => {
    if (!selectedProgram) return [];
    const exercises = new Set<string>();
    selectedProgram.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.workouts.forEach(workout => {
          workout.exercises.forEach(ex => {
            exercises.add(ex.nameOverride || ex.exerciseId);
          });
        });
      });
    });
    return Array.from(exercises).sort();
  }, [selectedProgram]);

  const availablePrograms = useMemo(() => {
    const filteredAll = isAdmin ? ALL_PROGRAMS : ALL_PROGRAMS.filter(p => purchasedPrograms.includes(p.name));
    return [...filteredAll, ...customPrograms];
  }, [isAdmin, purchasedPrograms, customPrograms]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (userId === 'guest') {
        setLoading(false);
        return;
      }

      try {
        // Load purchases
        let purchased: string[] = [];
        const pRes = await fetch(`/api/purchases/${userId}`);
        if (pRes.ok) {
          const data = await pRes.json();
          purchased = data.map((p: any) => p.item_name);
          setPurchasedPrograms(purchased);
        }

        // Load custom programs
        const cpRes = await fetch(`/api/custom-programs/${userId}`);
        let loadedCustom: FullProgramTemplate[] = [];
        if (cpRes.ok) {
          const data = await cpRes.json();
          loadedCustom = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            phases: p.data.phases || []
          }));
          setCustomPrograms(loadedCustom);
        }

        // Load progress
        const logRes = await fetch(`/api/workout-logs/${userId}`);
        if (logRes.ok) {
          const logs = await logRes.json();
          const completed: Record<string, boolean> = {};
          const edited: Record<string, any> = {};
          logs.forEach((log: any) => {
            completed[`${log.workout_id}-${log.exercise_id}`] = log.completed === 1;
            if (log.edited_data) {
              edited[`${log.workout_id}-${log.exercise_id}`] = JSON.parse(log.edited_data);
            }
          });
          setCompletedExercises(completed);
          setEditedExercises(edited);
        }

        // Handle initial program
        if (initialProgramId) {
          const program = [...ALL_PROGRAMS, ...loadedCustom].find(p => p.id === initialProgramId);
          const isCustom = loadedCustom.some(p => p.id === initialProgramId);
          if (program && (purchased.includes(program.name) || isAdmin || isCustom)) {
            setSelectedProgram(program);
            if (initialPhaseIdx !== undefined) {
              setCurrentPhaseIdx(initialPhaseIdx);
            }
            setViewMode('program');
          }
        }
      } catch (err) {
        console.error("Failed to load viewer data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, initialProgramId, initialPhaseIdx, isAdmin]);

  const toggleExercise = async (workoutId: string, exerciseInstanceId: string, idx: number) => {
    const key = `${workoutId}-${exerciseInstanceId}`;
    const isCompleted = !completedExercises[key];
    
    setCompletedExercises(prev => ({ ...prev, [key]: isCompleted }));

    if (userId !== 'guest') {
      try {
        await fetch(`/api/workout-logs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: [{
              workoutId,
              exerciseId: exerciseInstanceId,
              completed: isCompleted,
              date: getCurrentDate(),
              editedData: editedExercises[key] || {},
              workoutStartTime
            }]
          })
        });
        
        await logActivity(userId, isCompleted ? 'exercise_completed' : 'exercise_uncompleted', {
          workoutId,
          exerciseId: exerciseInstanceId
        });
      } catch (err) {
        console.error("Failed to sync exercise", err);
      }
    }
  };

  const startEditing = (workoutId: string, exercise: ExerciseTemplate, idx: number) => {
    const key = `${workoutId}-${exercise.id}`;
    setEditingId(key);
    setEditForm({
      sets: editedExercises[key]?.sets ?? exercise.sets,
      reps: editedExercises[key]?.reps ?? exercise.reps,
      tempo: editedExercises[key]?.tempo ?? exercise.tempo,
      rest: editedExercises[key]?.rest ?? exercise.rest,
      notes: editedExercises[key]?.notes ?? exercise.notes,
    });
  };

  const saveEdit = async (workoutId: string, exerciseInstanceId: string, idx: number) => {
    const key = `${workoutId}-${exerciseInstanceId}`;
    setEditedExercises(prev => ({ ...prev, [key]: editForm }));
    setEditingId(null);

    if (userId !== 'guest') {
      try {
        await fetch(`/api/workout-logs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: [{
              workoutId,
              exerciseId: exerciseInstanceId,
              completed: completedExercises[key] || false,
              date: getCurrentDate(),
              editedData: editForm,
              workoutStartTime
            }]
          })
        });
        
        await logActivity(userId, 'workout_updated', {
          workoutId,
          exerciseId: exerciseInstanceId,
          editedData: editForm
        });
      } catch (err) {
        console.error("Failed to save edit", err);
      }
    }
  };

  const getWorkoutProgress = (workout: WorkoutTemplate) => {
    const completedCount = workout.exercises.filter((ex) => completedExercises[`${workout.id}-${ex.id}`]).length;
    return Math.round((completedCount / workout.exercises.length) * 100);
  };

  const deleteCustomProgram = async (programId: string) => {
    if (onDelete) {
      onDelete(programId);
      return;
    }
    try {
      const res = await fetch(`/api/custom-programs/${userId}/${programId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCustomPrograms(prev => prev.filter(p => p.id !== programId));
      } else {
        console.error("Failed to delete program");
      }
    } catch (err) {
      console.error("Failed to delete program", err);
    }
  };

  const handleAddExercise = async (exercise: any) => {
    console.log("handleAddExercise called with:", exercise);
    console.log("selectedProgram:", selectedProgram);
    console.log("selectedWorkout:", selectedWorkout);
    if (!selectedProgram || !selectedWorkout) {
      console.log("Missing selectedProgram or selectedWorkout");
      return;
    }

    let programToUpdate = selectedProgram;
    const isCustom = customPrograms.some(p => p.id === selectedProgram.id);

    // If not custom, we need to create a custom copy first
    if (!isCustom) {
      if (!confirm("To add exercises, we'll create a custom copy of this program for you. Continue?")) return;
      setSavingCustom(true);
      try {
        const res = await fetch(`/api/custom-programs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${selectedProgram.name} (Custom)`,
            description: selectedProgram.description,
            data: { phases: selectedProgram.phases, programName: selectedProgram.name }
          })
        });
        if (res.ok) {
          const result = await res.json();
          const loadedProgram = {
            id: result.id.toString(),
            name: `${selectedProgram.name} (Custom)`,
            description: selectedProgram.description,
            phases: selectedProgram.phases
          };
          setCustomPrograms(prev => [...prev, loadedProgram]);
          setSelectedProgram(loadedProgram);
          programToUpdate = loadedProgram;
        } else {
          throw new Error("Failed to create custom copy");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to create custom copy");
        setSavingCustom(false);
        return;
      }
      setSavingCustom(false);
    }

    // Now update the programToUpdate with the new exercise
    const newExercise: ExerciseTemplate = {
      id: generateId(),
      exerciseId: exercise.id,
      sets: '3',
      reps: '10',
      tempo: '',
      rest: '60s',
      notes: '',
      videoLinkOverride: exercise.videoUrl
    };

    const updatedPhases = programToUpdate.phases.map((phase, pIdx) => {
      if (pIdx !== currentPhaseIdx) return phase;
      return {
        ...phase,
        weeks: phase.weeks.map((week, wIdx) => {
          if (wIdx !== currentWeekIdx) return week;
          return {
            ...week,
            workouts: week.workouts.map(workout => {
              if (workout.id !== selectedWorkout.id) return workout;
              return {
                ...workout,
                exercises: [...workout.exercises, newExercise]
              };
            })
          };
        })
      };
    });

    try {
      const res = await fetch(`/api/custom-programs/${userId}/${programToUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...programToUpdate, phases: updatedPhases }
        })
      });
      if (res.ok) {
        const updatedProgram = { ...programToUpdate, phases: updatedPhases };
        setSelectedProgram(updatedProgram);
        setCustomPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
        // Update selectedWorkout if needed
        const newWorkout = updatedPhases[currentPhaseIdx].weeks[currentWeekIdx].workouts.find(w => w.id === selectedWorkout.id);
        if (newWorkout) setSelectedWorkout(newWorkout);
        setIsAddingExercise(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save exercise");
    }
  };

  const handleAddWorkout = async () => {
    console.log("handleAddWorkout called");
    console.log("selectedProgram:", selectedProgram);
    console.log("newWorkoutTitle:", newWorkoutTitle);
    if (!selectedProgram || !newWorkoutTitle.trim()) {
      console.log("Missing selectedProgram or newWorkoutTitle");
      return;
    }

    let programToUpdate = selectedProgram;
    const isCustom = customPrograms.some(p => p.id === selectedProgram.id);

    if (!isCustom) {
      if (!confirm("To add workouts, we'll create a custom copy of this program for you. Continue?")) return;
      setSavingCustom(true);
      try {
        const res = await fetch(`/api/custom-programs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${selectedProgram.name} (Custom)`,
            description: selectedProgram.description,
            data: { phases: selectedProgram.phases, programName: selectedProgram.name }
          })
        });
        if (res.ok) {
          const result = await res.json();
          const loadedProgram = {
            id: result.id.toString(),
            name: `${selectedProgram.name} (Custom)`,
            description: selectedProgram.description,
            phases: selectedProgram.phases
          };
          setCustomPrograms(prev => [...prev, loadedProgram]);
          setSelectedProgram(loadedProgram);
          programToUpdate = loadedProgram;
        }
      } catch (err) {
        console.error(err);
        setSavingCustom(false);
        return;
      }
      setSavingCustom(false);
    }

    const newWorkout: WorkoutTemplate = {
      id: generateId(),
      title: newWorkoutTitle,
      day: currentWeek.workouts.length + 1,
      exercises: []
    };

    const updatedPhases = programToUpdate.phases.map((phase, pIdx) => {
      if (pIdx !== currentPhaseIdx) return phase;
      return {
        ...phase,
        weeks: phase.weeks.map((week, wIdx) => {
          if (wIdx !== currentWeekIdx) return week;
          return {
            ...week,
            workouts: [...week.workouts, newWorkout]
          };
        })
      };
    });

    try {
      const res = await fetch(`/api/custom-programs/${userId}/${programToUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...programToUpdate, phases: updatedPhases }
        })
      });
      if (res.ok) {
        const updatedProgram = { ...programToUpdate, phases: updatedPhases };
        setSelectedProgram(updatedProgram);
        setCustomPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
        setIsAddingWorkout(false);
        setNewWorkoutTitle('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLibrary = EXERCISE_LIBRARY.filter(ex => {
    const nameStr = ex.name || '';
    return (exerciseCategory === 'All' || ex.category === exerciseCategory) &&
           nameStr.toLowerCase().includes(exerciseSearch.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading programs...</p>
      </div>
    );
  }

  if (viewMode === 'list' || !selectedProgram) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black uppercase italic text-white">Available <span className="text-gold">Programs</span></h2>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Custom
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availablePrograms.map((program) => {
            const isCustom = customPrograms.find(p => p.id === program.id);
            const locked = !purchasedPrograms.includes(program.name) && !isAdmin && !isCustom;
            return (
              <motion.div
                key={program.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => { 
                  if (locked) {
                    if (onSelectLockedProgram) {
                      onSelectLockedProgram(program);
                      return;
                    }
                    alert("Please purchase access to this program.");
                    return;
                  }
                  if (onProgramSelect) {
                    onProgramSelect(program.id);
                  } else {
                    setSelectedProgram(program); 
                    setViewMode('program'); 
                  }
                }}
                className={`cursor-pointer text-left bg-zinc-900/30 border ${customPrograms.find(p => p.id === program.id) ? 'border-gold/10' : 'border-white/5'} p-8 md:p-10 rounded-[40px] hover:border-gold/30 transition-all group relative overflow-hidden krome-outline`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {locked ? <Lock className="w-24 h-24 text-white" /> : (customPrograms.find(p => p.id === program.id) ? <Edit2 className="w-24 h-24 text-gold" /> : <Dumbbell className="w-24 h-24" />)}
                </div>
                <div className="relative z-10 flex flex-col h-full items-center text-center">
                  <div className="flex items-center justify-between mb-8 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${locked ? 'text-white/20 bg-white/5' : 'text-gold bg-gold/10'}`}>
                      {locked ? <Lock className="w-6 h-6 text-white/40" /> : (customPrograms.find(p => p.id === program.id) ? <Edit2 className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />)}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {program.phases.length} Phases
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    {customPrograms.find(p => p.id === program.id) && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="text-[10px] font-black text-gold uppercase tracking-widest">Custom Program</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit?.(program, !!customPrograms.find(p => p.id === program.id)); }}
                            className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteCustomProgram(program.id); }}
                            className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg md:text-xl font-black uppercase italic mb-4 group-hover:text-gold transition-colors leading-tight break-words">{program.name}</h3>
                    <p className="text-white/40 text-xs md:text-sm leading-relaxed mb-8 line-clamp-2">{program.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all pt-6 border-t border-white/5 w-full justify-center">
                    {locked ? 'View Overview & Purchase' : 'View Program'} <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentPhase = selectedProgram.phases[currentPhaseIdx];
  const currentWeek = currentPhase?.weeks[currentWeekIdx];

  if (!currentPhase || !currentWeek) {
    return (
      <div className="p-20 text-center">
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No program data available for this phase/week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col bg-zinc-900/50 p-8 rounded-[40px] border border-white/5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <button 
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest mb-4 hover:gap-3 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Switch Program
            </button>
            <h2 className="text-3xl font-black uppercase italic text-white">{selectedProgram.name}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onEdit?.(selectedProgram, !!customPrograms.find(p => p.id === selectedProgram.id))}
              className="flex items-center justify-center gap-2 bg-gold/10 border border-gold/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all shadow-lg shadow-gold/5 krome-outline"
            >
              <Edit2 className="w-4 h-4" /> Customize Program
            </button>
            <div className="flex gap-2">
              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Phase</div>
                <div className="text-sm font-bold text-gold">{currentPhase.name}</div>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Week</div>
                <div className="text-sm font-bold text-gold">{currentWeek.week}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Program Overview</h3>
            <button 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-white transition-colors flex items-center gap-1"
            >
              {isDescriptionExpanded ? 'Collapse' : 'Expand'} Details
              <motion.div
                animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
          </div>
          
          <AnimatePresence initial={false}>
            <motion.div
              initial={false}
              animate={{ height: isDescriptionExpanded ? 'auto' : '40px' }}
              className="overflow-hidden relative"
            >
              <p className={`text-white/60 text-sm leading-relaxed ${!isDescriptionExpanded && 'line-clamp-1'}`}>
                {selectedProgram.description}
              </p>
              
              {isDescriptionExpanded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5"
                >
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Phases</div>
                    <div className="text-sm font-bold text-white">{selectedProgram.phases.length}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Current Phase</div>
                    <div className="text-sm font-bold text-white">{currentPhaseIdx + 1} of {selectedProgram.phases.length}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Weeks</div>
                    <div className="text-sm font-bold text-white">
                      {selectedProgram.phases.reduce((acc, p) => acc + p.weeks.length, 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Program Type</div>
                    <div className="text-sm font-bold text-white">
                      {selectedProgram.id.includes('custom') ? 'Custom' : 'Standard'}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <button 
            onClick={() => setIsCoachOpen(true)}
            className="w-full bg-zinc-900/50 border border-gold/20 rounded-3xl p-6 flex items-center justify-between hover:bg-gold/10 transition-all group krome-outline"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black uppercase italic text-white">AI <span className="text-gold">Coach</span></h3>
                <p className="text-xs text-white/40 uppercase tracking-widest">Personalized Insights</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-gold group-hover:translate-x-1 transition-transform" />
          </button>
          
          <AnimatePresence>
            {isCoachOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsCoachOpen(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AICoach userId={userId} onClose={() => setIsCoachOpen(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6 sticky top-32">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3">Phases</label>
              <div className="space-y-2">
                {selectedProgram.phases.map((phase, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentPhaseIdx(idx); setCurrentWeekIdx(0); setSelectedWorkout(null); setViewMode('program'); }}
                    className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex justify-between items-center ${currentPhaseIdx === idx ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} krome-outline`}
                  >
                    <span>{phase.name}</span>
                    {currentPhaseIdx === idx && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3">Weeks</label>
              <div className="grid grid-cols-4 gap-2">
                {currentPhase.weeks.map((week, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentWeekIdx(idx); setSelectedWorkout(null); setViewMode('program'); }}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentWeekIdx === idx && viewMode !== 'exercises' ? 'bg-accent text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'} krome-outline`}
                  >
                    {week.week}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setViewMode('exercises')}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'exercises' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} krome-outline`}
            >
              <Dumbbell className="w-4 h-4" /> View All Exercises
            </button>
          </div>
        </div>

        {/* Workout Content */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {viewMode === 'program' && (
              <motion.div
                key="weekly-breakdown"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8">
                  <h3 className="text-xl font-black uppercase italic mb-6">Week {currentWeek.week} <span className="text-gold">Breakdown</span></h3>
                  <div className="grid grid-cols-1 gap-4">
                    {currentWeek.workouts.map((workout) => (
                      <button
                        key={workout.id}
                        onClick={() => {
                          setSelectedWorkout(workout);
                          setViewMode('workout');
                          if (!workoutStartTime) setWorkoutStartTime(new Date().toISOString());
                        }}
                        className="group flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-gold/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-black italic">
                            D{workout.day}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg uppercase italic group-hover:text-gold transition-colors">{workout.title}</h4>
                            <p className="text-xs text-white/40 uppercase tracking-widest">{workout.exercises.length} Exercises</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-black text-accent">{getWorkoutProgress(workout)}%</div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Complete</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-gold transition-colors" />
                        </div>
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsAddingWorkout(true)}
                      className="flex items-center justify-center gap-3 p-6 bg-gold/5 border-2 border-dashed border-gold/20 rounded-3xl hover:bg-gold/10 transition-all group krome-outline"
                    >
                      <Plus className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-black uppercase tracking-widest text-gold">Add Workout to Week {currentWeek.week}</span>
                    </button>
                  </div>
                </div>

                {/* Volume Progression Chart */}
                <VolumeProgressionChart program={selectedProgram} />
              </motion.div>
            )}
            {viewMode === 'workout' && selectedWorkout && (
              <motion.div
                key={selectedWorkout.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden"
              >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setViewMode('program')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gold"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-black uppercase italic">{selectedWorkout.title}</h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Day {selectedWorkout.day} • {selectedWorkout.exercises.length} Exercises</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-accent">{getWorkoutProgress(selectedWorkout)}%</div>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Workout Progress</div>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {selectedWorkout.exercises.map((exercise, idx) => {
                    const key = `${selectedWorkout.id}-${exercise.id}`;
                    const isCompleted = completedExercises[key];
                    const isEditing = editingId === key;
                    const exerciseDetails = EXERCISE_LIBRARY.find(ex => ex.id === exercise.exerciseId);
                    const displayData = { 
                      ...exercise, 
                      ...editedExercises[key],
                      name: exercise.nameOverride || exerciseDetails?.name || 'Unknown Exercise',
                      videoUrl: exercise.videoLinkOverride || exerciseDetails?.videoUrl
                    };

                    return (
                      <div key={`${key}-${idx}`} className={`p-8 transition-colors rounded-[40px] border ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/30 border-white/5 hover:border-gold/30'}`}>
                        <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between">
                          <div className="flex items-start gap-6 flex-1">
                            <motion.button 
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={() => toggleExercise(selectedWorkout.id, exercise.id, idx)}
                              className={`mt-1 flex-shrink-0 transition-all relative ${isCompleted ? 'text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
                            >
                              <AnimatePresence mode="wait">
                                {isCompleted ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1.1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                  >
                                    <CheckCircle2 className="w-8 h-8" />
                                    {/* Success burst effect */}
                                    <motion.div
                                      initial={{ scale: 0, opacity: 1 }}
                                      animate={{ scale: 2, opacity: 0 }}
                                      className="absolute inset-0 bg-emerald-500 rounded-full -z-10"
                                    />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="incomplete"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                  >
                                    <Circle className="w-8 h-8" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                            <div>
                              <motion.h4 
                                animate={{ 
                                  color: isCompleted ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,1)",
                                  textDecoration: isCompleted ? "line-through" : "none"
                                }}
                                className="text-xl font-black uppercase italic"
                              >
                                {displayData.name}
                              </motion.h4>
                              {displayData.notes && <p className="text-sm text-white/40 mt-2 italic">{displayData.notes}</p>}
                              {displayData.videoUrl && (
                                <button 
                                  onClick={() => setVideoModal({ isOpen: true, url: displayData.videoUrl, title: displayData.name })}
                                  className="text-xs text-gold hover:underline mt-2 flex items-center gap-1 !outline-none"
                                >
                                  <PlayCircle className="w-3 h-3" /> Watch Demo
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="md:w-1/2">
                            {isEditing ? (
                              <div className="bg-black/40 p-6 rounded-3xl border border-white/10 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Sets</label>
                                    <input 
                                      type="text" 
                                      value={editForm.sets || ''} 
                                      onChange={(e) => setEditForm({...editForm, sets: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Reps</label>
                                    <input 
                                      type="text" 
                                      value={editForm.reps || ''} 
                                      onChange={(e) => setEditForm({...editForm, reps: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Tempo</label>
                                    <input 
                                      type="text" 
                                      value={editForm.tempo || ''} 
                                      onChange={(e) => setEditForm({...editForm, tempo: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                                      placeholder="e.g. 3-0-1-0"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Rest</label>
                                    <input 
                                      type="text" 
                                      value={editForm.rest || ''} 
                                      onChange={(e) => setEditForm({...editForm, rest: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                                      placeholder="e.g. 60s"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Notes</label>
                                  <textarea 
                                    value={editForm.notes || ''} 
                                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold h-20 resize-none"
                                    placeholder="Add custom notes for this exercise..."
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingId(null)} className="p-3 text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                                  <button onClick={() => saveEdit(selectedWorkout.id, exercise.id, idx)} className="p-3 bg-gold text-black rounded-xl font-bold uppercase text-xs tracking-widest">Save</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-6">
                                <div className="flex flex-wrap gap-6 text-sm font-mono text-white/60">
                                  <div><span className="text-[10px] font-sans uppercase text-white/30 mr-2">Sets</span>{displayData.sets}</div>
                                  <div><span className="text-[10px] font-sans uppercase text-white/30 mr-2">Reps</span>{displayData.reps}</div>
                                  {displayData.tempo && <div><span className="text-[10px] font-sans uppercase text-white/30 mr-2">Tempo</span>{displayData.tempo}</div>}
                                  {displayData.rest && <div><span className="text-[10px] font-sans uppercase text-white/30 mr-2">Rest</span>{displayData.rest}</div>}
                                </div>
                                <button 
                                  onClick={() => startEditing(selectedWorkout.id, exercise, idx)}
                                  className="p-3 text-white/20 hover:text-gold transition-colors"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="p-12 bg-white/5 border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="btn-gold px-12 py-4 text-lg font-black uppercase italic tracking-widest shadow-2xl shadow-gold/20 hover:scale-105 transition-transform"
                      >
                        Finish Workout
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-gold italic mb-2">{getWorkoutProgress(selectedWorkout)}%</div>
                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Workout Completion</div>
                    </div>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Submit your performance data to the elite system</p>
                  </div>
                </div>
              </motion.div>
            )}
            {viewMode === 'exercises' && (
              <motion.div
                key="exercises-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setViewMode('program')}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">Program <span className="text-gold">Exercises</span></h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{uniqueExercises.length} Unique Movements</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uniqueExercises.map((ex, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm text-white/90">{ex.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                    onClick={() => setIsAddingWorkout(false)}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddWorkout}
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
              className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-2xl font-black uppercase italic">Exercise <span className="text-gold">Library</span></h3>
                <button onClick={() => setIsAddingExercise(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text"
                      placeholder="Search elite movements..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-gold transition-all"
                    />
                  </div>
                  <select 
                    value={exerciseCategory}
                    onChange={(e) => setExerciseCategory(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-gold appearance-none transition-all cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibrary.map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddExercise(ex)}
                      className="p-6 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/30 rounded-3xl transition-all text-left group flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-lg font-black uppercase italic text-white group-hover:text-gold transition-colors mb-1">{ex.name}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{ex.category}</div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-1">
                          {ex.equipment.map((eq, i) => (
                            <span key={i} className="text-[8px] font-bold bg-white/5 px-2 py-0.5 rounded text-white/40">{eq}</span>
                          ))}
                        </div>
                        <Plus className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showFeedback && selectedWorkout && selectedProgram && (
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
              className="w-full max-w-lg relative"
            >
              <button 
                onClick={() => setShowFeedback(false)}
                className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <WorkoutFeedback 
                userId={userId} 
                workoutId={selectedWorkout.id} 
                programId={selectedProgram.id} 
                onSuccess={() => {
                  setTimeout(() => {
                    setShowFeedback(false);
                    setViewMode('program');
                    setSelectedWorkout(null);
                  }, 2000);
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VideoModal 
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />
    </div>
  );
}
