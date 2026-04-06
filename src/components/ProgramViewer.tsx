import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { haptics, share } from '../utils/nativeBridge';
import { safeStorage } from '../utils/storage';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgramCalendar from './ProgramCalendar';
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
  Zap, 
  Activity, 
  Shield,
  Clock,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  TrendingUp,
  Dumbbell,
  Lock,
  Bot,
  Share2
} from 'lucide-react';
import AICoach from './AICoach';
import WorkoutFeedback from './WorkoutFeedback';
import VolumeProgressionChart from './VolumeProgressionChart';
import VideoModal from './VideoModal';
import ConfirmModal from './ConfirmModal';
import { ALL_PROGRAMS, FullProgramTemplate, WorkoutTemplate, ExerciseTemplate } from '../data/workoutTemplates';
import { getWorkoutExercises, calculateWorkoutProgress } from '../lib/workoutUtils';
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';
import { getCurrentDate, addDays } from '../utils/date';
import { logActivity } from '../utils/activity';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
};

interface ProgramViewerProps {
  userId: string;
  onBack: () => void;
  onSelectLockedProgram?: (program: FullProgramTemplate) => void;
  initialProgramId?: string;
  initialPhaseIdx?: number;
  initialWeekIdx?: number;
  initialWorkoutId?: string;
  isAdmin?: boolean;
  onEdit?: (program: FullProgramTemplate, isCustom: boolean) => void;
  onDelete?: (programId: string) => void;
  onProgramSelect?: (programId: string, phaseIdx?: number, weekIdx?: number, workoutId?: string) => void;
  onCreateNew?: () => void;
  onAssign?: (program: FullProgramTemplate) => void;
}

export default function ProgramViewer({ userId, onBack, onSelectLockedProgram, initialProgramId, initialPhaseIdx, initialWeekIdx, initialWorkoutId, isAdmin = false, onEdit, onDelete, onProgramSelect, onCreateNew, onAssign }: ProgramViewerProps) {
  console.log("ProgramViewer rendering");
  const [selectedProgram, setSelectedProgram] = useState<FullProgramTemplate | null>(null);
  const [customPrograms, setCustomPrograms] = useState<FullProgramTemplate[]>([]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(initialPhaseIdx || 0);
  const [currentWeekIdx, setCurrentWeekIdx] = useState(initialWeekIdx || 0);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = safeStorage.getItem(`completedExercises_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [editedExercises, setEditedExercises] = useState<Record<string, any>>(() => {
    const saved = safeStorage.getItem(`editedExercises_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (Object.keys(completedExercises).length > 0) {
      safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(completedExercises));
    }
  }, [completedExercises, userId]);

  useEffect(() => {
    if (Object.keys(editedExercises).length > 0) {
      safeStorage.setItem(`editedExercises_${userId}`, JSON.stringify(editedExercises));
    }
  }, [editedExercises, userId]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExerciseTemplate>>({});
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateProgramProgress = (program: FullProgramTemplate) => {
    let total = 0;
    let completed = 0;
    program.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.workouts.forEach(workout => {
          const exercises = getWorkoutExercises(workout);
          total += exercises.length;
          exercises.forEach(ex => {
            if (completedExercises[`${workout.id}-${ex.id}`]) {
              completed++;
            }
          });
        });
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  const [viewMode, setViewMode] = useState<'list' | 'program' | 'workout' | 'exercises' | 'dashboard' | 'calendar'>('list');

  const currentPhase = selectedProgram?.phases[currentPhaseIdx];
  const currentWeek = currentPhase?.weeks[currentWeekIdx];
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
  const [showCustomConfirm, setShowCustomConfirm] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<any>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});
  const [schedulingTime, setSchedulingTime] = useState("06:00");
  const [schedulingDate, setSchedulingDate] = useState(() => getCurrentDate());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const showSaveConfirmation = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const uniqueExercises = useMemo(() => {
    if (!selectedProgram) return [];
    const exercises = new Set<string>();
    selectedProgram.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.workouts.forEach(workout => {
          getWorkoutExercises(workout).forEach(ex => {
            exercises.add(ex.nameOverride || ex.exerciseId);
          });
        });
      });
    });
    return Array.from(exercises).sort();
  }, [selectedProgram]);

  const availablePrograms = useMemo(() => {
    const filteredAll = isAdmin ? ALL_PROGRAMS : ALL_PROGRAMS.filter(p => 
      purchasedPrograms.some(pp => String(pp) === String(p.name) || String(pp) === String(p.id))
    );
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
        // Sync local data to database first
        const completedRaw = safeStorage.getItem(`completedExercises_${userId}`);
        const editedRaw = safeStorage.getItem(`editedExercises_${userId}`);
        
        const localCompleted = completedRaw ? JSON.parse(completedRaw) : {};
        const localEdited = editedRaw ? JSON.parse(editedRaw) : {};
        
        if (Object.keys(localCompleted).length > 0 || Object.keys(localEdited).length > 0) {
          try {
            const existingLogsRes = await fetch(`/api/workout-logs/${userId}`);
            if (existingLogsRes.ok) {
              const existingLogs = await existingLogsRes.json();
              const existingKeys = new Set(existingLogs.map((l: any) => `${l.workout_id}-${l.exercise_id}`));
              
              const logsToSync = [];
              
              for (const key of Object.keys(localCompleted)) {
                if (!existingKeys.has(key)) {
                  const [workoutId, exerciseId] = key.split('-');
                  if (workoutId && exerciseId) {
                    logsToSync.push({
                      workoutId,
                      exerciseId,
                      completed: localCompleted[key],
                      date: getCurrentDate(),
                      editedData: localEdited[key] || {}
                    });
                    existingKeys.add(key);
                  }
                }
              }
              
              for (const key of Object.keys(localEdited)) {
                if (!existingKeys.has(key)) {
                  const [workoutId, exerciseId] = key.split('-');
                  if (workoutId && exerciseId) {
                    logsToSync.push({
                      workoutId,
                      exerciseId,
                      completed: false,
                      date: getCurrentDate(),
                      editedData: localEdited[key]
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
            }
          } catch (syncErr) {
            console.error("Failed to sync local data to database", syncErr);
          }
        }

        // Load purchases
        let purchased: string[] = [];
        const [pRes, assignedRes, templatesRes] = await Promise.all([
          fetch(`/api/purchases/${userId}`),
          fetch(`/api/assigned-programs/${userId}`),
          fetch('/api/program-templates')
        ]);

        if (pRes.ok) {
          const data = await pRes.json();
          purchased = data.map((p: any) => p.program_id || p.item_name).filter(Boolean);
        }

        if (assignedRes.ok) {
          const data = await assignedRes.json();
          const assignedIds = data.map((ap: any) => String(ap.program_id));
          purchased = [...new Set([...purchased, ...assignedIds])];
        }
        setPurchasedPrograms(purchased);

        let globalTemplates: FullProgramTemplate[] = [];
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          globalTemplates = data.map((p: any) => {
            let parsedData = p.data || {};
            if (typeof p.data === 'string') {
              try {
                parsedData = JSON.parse(p.data);
              } catch (e) {
                parsedData = {};
              }
            }
            return {
              ...p,
              ...parsedData,
              id: p.id,
              name: p.name,
              description: p.description,
              isGlobal: true
            };
          });
        }

        // Load custom programs
        const cpRes = await fetch(`/api/custom-programs/${userId}`);
        let loadedCustom: FullProgramTemplate[] = [];
        if (cpRes.ok) {
          const data = await cpRes.json();
          loadedCustom = data.map((p: any) => {
            let parsedData = p.data;
            if (typeof p.data === 'string') {
              try {
                parsedData = JSON.parse(p.data);
              } catch (e) {
                console.error("Error parsing custom program data:", e, p.data);
                parsedData = {};
              }
            }
            return {
              ...p,
              ...parsedData,
              id: p.id,
              name: p.name,
              description: p.description,
              phases: p.phases || parsedData?.phases || []
            };
          });
          setCustomPrograms([...loadedCustom, ...globalTemplates]);
        }

        // Load progress
        const logRes = await fetch(`/api/workout-logs/${userId}`);
        if (logRes.ok) {
          const logs = await logRes.json();
          const completed: Record<string, boolean> = {};
          const edited: Record<string, any> = {};
          logs.forEach((log: any) => {
            completed[`${log.workout_id}-${log.exercise_id}`] = log.completed === 1 || log.completed === true;
            if (log.edited_data) {
              try {
                edited[`${log.workout_id}-${log.exercise_id}`] = typeof log.edited_data === 'string' 
                  ? JSON.parse(log.edited_data) 
                  : log.edited_data;
              } catch (e) {
                console.error("Error parsing edited_data:", e, log.edited_data);
                edited[`${log.workout_id}-${log.exercise_id}`] = log.edited_data;
              }
            }
          });
          setCompletedExercises(prev => {
            const merged = { ...completed, ...prev };
            safeStorage.setItem(`completedExercises_${userId}`, JSON.stringify(merged));
            return merged;
          });
          setEditedExercises(prev => {
            const merged = { ...edited, ...prev };
            safeStorage.setItem(`editedExercises_${userId}`, JSON.stringify(merged));
            return merged;
          });
        }

        // Handle initial program
        if (initialProgramId) {
          const allAvailable = [...ALL_PROGRAMS, ...loadedCustom, ...globalTemplates];
          const program = allAvailable.find(p => String(p.id) === String(initialProgramId));
          const isCustom = loadedCustom.some(p => String(p.id) === String(initialProgramId));
          if (program && (purchased.includes(program.name) || purchased.includes(String(program.id)) || isAdmin || isCustom)) {
            setSelectedProgram(program);
            if (initialPhaseIdx !== undefined) {
              setCurrentPhaseIdx(initialPhaseIdx);
            }
            if (initialWeekIdx !== undefined) {
              setCurrentWeekIdx(initialWeekIdx);
            }
            
            let workoutToSelect = null;
            if (initialWorkoutId && initialPhaseIdx !== undefined && initialWeekIdx !== undefined) {
              const phase = program.phases[initialPhaseIdx];
              if (phase && phase.weeks[initialWeekIdx]) {
                workoutToSelect = phase.weeks[initialWeekIdx].workouts.find(w => w.id === initialWorkoutId);
              }
            }
            
            if (workoutToSelect) {
              setSelectedWorkout(workoutToSelect);
              setViewMode('workout');
            } else {
              setViewMode('program');
            }
          }
        }
      } catch (err) {
        console.error("Failed to load viewer data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, initialProgramId, initialPhaseIdx, initialWeekIdx, initialWorkoutId, isAdmin]);

  const toggleExercise = async (workoutId: string, exerciseInstanceId: string, idx: number) => {
    const key = `${workoutId}-${exerciseInstanceId}`;
    const isCompleted = !completedExercises[key];
    
    // Trigger haptic feedback
    if (isCompleted) {
      haptics.success();
    } else {
      haptics.light();
    }

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
        window.dispatchEvent(new Event('workout-completed'));
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
      weight: editedExercises[key]?.weight ?? exercise.weight,
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
        showSaveConfirmation('Exercise details saved!');
      } catch (err) {
        console.error("Failed to save edit", err);
      }
    }
  };

  const renderExercise = (exercise: ExerciseTemplate, idx: number, sectionKey: string) => {
    const key = `${selectedWorkout?.id}-${exercise.id}`;
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
              onClick={() => toggleExercise(selectedWorkout!.id, exercise.id, idx)}
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
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl max-w-md">
                    <iframe 
                      src={getYouTubeEmbedUrl(displayData.videoUrl) || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${displayData.name} Demo`}
                    />
                  </div>
                  <button 
                    onClick={() => setVideoModal({ isOpen: true, url: displayData.videoUrl, title: displayData.name })}
                    className="text-xs text-gold hover:underline flex items-center gap-1 !outline-none"
                  >
                    <PlayCircle className="w-3 h-3" /> Full Screen
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:w-1/2">
            {isEditing ? (
              <div className="bg-black/40 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Sets</label>
                    <input 
                      type="text" 
                      value={editForm.sets || ''} 
                      onChange={(e) => {
                        const newSets = e.target.value;
                        const numSets = parseInt(newSets);
                        let newSetsLog = [...(editForm.setsLog || [])];
                        if (!isNaN(numSets)) {
                          if (newSetsLog.length < numSets) {
                            for (let i = newSetsLog.length; i < numSets; i++) {
                              newSetsLog.push({ weight: editForm.weight || '', reps: editForm.reps || '', tempo: editForm.tempo || '', rest: editForm.rest || '', notes: '' });
                            }
                          } else if (newSetsLog.length > numSets) {
                            newSetsLog = newSetsLog.slice(0, numSets);
                          }
                        }
                        setEditForm({...editForm, sets: newSets, setsLog: newSetsLog});
                      }}
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
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Weight</label>
                    <input 
                      type="text" 
                      value={editForm.weight || ''} 
                      onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="e.g. 135 lbs"
                    />
                  </div>
                </div>

                {/* Sets Log Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-white/30">Detailed Set Log</label>
                    <button 
                      onClick={() => {
                        const newSetsLog = [...(editForm.setsLog || [])];
                        newSetsLog.push({ weight: editForm.weight || '', reps: editForm.reps || '', tempo: editForm.tempo || '', rest: editForm.rest || '', notes: '' });
                        setEditForm({...editForm, setsLog: newSetsLog, sets: (newSetsLog.length).toString()});
                      }}
                      className="text-[8px] font-black uppercase text-gold hover:underline"
                    >
                      + Add Set
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editForm.setsLog || []).map((set: any, sIdx: number) => (
                      <div key={sIdx} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-gold uppercase italic">Set {sIdx + 1}</span>
                          <button 
                            onClick={() => {
                              const newSetsLog = editForm.setsLog.filter((_: any, i: number) => i !== sIdx);
                              setEditForm({...editForm, setsLog: newSetsLog, sets: (newSetsLog.length).toString()});
                            }}
                            className="text-white/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[8px] font-black uppercase text-white/20 block mb-1">Weight</label>
                            <input 
                              type="text" 
                              value={set.weight || ''} 
                              onChange={(e) => {
                                const newSetsLog = [...editForm.setsLog];
                                newSetsLog[sIdx].weight = e.target.value;
                                setEditForm({...editForm, setsLog: newSetsLog});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-white/20 block mb-1">Reps</label>
                            <input 
                              type="text" 
                              value={set.reps || ''} 
                              onChange={(e) => {
                                const newSetsLog = [...editForm.setsLog];
                                newSetsLog[sIdx].reps = e.target.value;
                                setEditForm({...editForm, setsLog: newSetsLog});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-white/20 block mb-1">Tempo</label>
                            <input 
                              type="text" 
                              value={set.tempo || ''} 
                              onChange={(e) => {
                                const newSetsLog = [...editForm.setsLog];
                                newSetsLog[sIdx].tempo = e.target.value;
                                setEditForm({...editForm, setsLog: newSetsLog});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-white/20 block mb-1">Rest</label>
                            <input 
                              type="text" 
                              value={set.rest || ''} 
                              onChange={(e) => {
                                const newSetsLog = [...editForm.setsLog];
                                newSetsLog[sIdx].rest = e.target.value;
                                setEditForm({...editForm, setsLog: newSetsLog});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-white/20 block mb-1">Set Notes</label>
                          <input 
                            type="text" 
                            value={set.notes || ''} 
                            onChange={(e) => {
                              const newSetsLog = [...editForm.setsLog];
                              newSetsLog[sIdx].notes = e.target.value;
                              setEditForm({...editForm, setsLog: newSetsLog});
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold"
                            placeholder="e.g. Felt strong"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Default Tempo</label>
                    <input 
                      type="text" 
                      value={editForm.tempo || ''} 
                      onChange={(e) => setEditForm({...editForm, tempo: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="e.g. 3-0-1-0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/30 block mb-1">Default Rest</label>
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
                  <label className="text-[10px] font-black uppercase text-white/30 block mb-1">General Notes</label>
                  <textarea 
                    value={editForm.notes || ''} 
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold min-h-[80px] resize-none"
                    placeholder="Add general notes for this exercise..."
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit(selectedWorkout!.id, exercise.id, idx)}
                    className="flex-1 py-3 bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-4 py-3 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">Sets</div>
                    <div className="text-lg font-black text-white italic">{displayData.sets}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">Reps</div>
                    <div className="text-lg font-black text-white italic">{displayData.reps}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">Weight</div>
                    <div className="text-lg font-black text-gold italic">{displayData.weight || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">Tempo</div>
                    <div className="text-sm font-black text-white italic">{displayData.tempo || '—'}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">Rest</div>
                    <div className="text-sm font-black text-white italic">{displayData.rest || '—'}</div>
                  </div>
                </div>
                {displayData.notes && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black uppercase text-white/20 mb-1">General Notes</div>
                    <div className="text-xs text-white/60 italic">{displayData.notes}</div>
                  </div>
                )}
                {displayData.setsLog && displayData.setsLog.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase text-white/20">Set Details</div>
                    <div className="grid grid-cols-1 gap-2">
                      {displayData.setsLog.map((set: any, sIdx: number) => (
                        <div key={sIdx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between text-[10px]">
                          <div className="flex gap-4">
                            <span className="text-gold font-black italic">SET {sIdx + 1}</span>
                            <span className="text-white/60 uppercase">WT: <span className="text-white">{set.weight || '—'}</span></span>
                            <span className="text-white/60 uppercase">REPS: <span className="text-white">{set.reps || '—'}</span></span>
                          </div>
                          <div className="flex gap-4">
                            {set.tempo && <span className="text-white/40 uppercase">T: {set.tempo}</span>}
                            {set.rest && <span className="text-white/40 uppercase">R: {set.rest}</span>}
                          </div>
                          {set.notes && <div className="text-white/40 italic ml-4 truncate max-w-[100px]">{set.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => {
                      setEditingId(key);
                      const initialData = { ...displayData };
                      if (!initialData.setsLog || initialData.setsLog.length === 0) {
                        const numSets = parseInt(initialData.sets || '0');
                        if (!isNaN(numSets) && numSets > 0) {
                          initialData.setsLog = Array(numSets).fill(null).map(() => ({
                            weight: initialData.weight || '',
                            reps: initialData.reps || '',
                            tempo: initialData.tempo || '',
                            rest: initialData.rest || '',
                            notes: ''
                          }));
                        }
                      }
                      setEditForm(initialData);
                    }}
                    className="p-3 bg-white/5 text-white/20 hover:text-gold rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navigateWorkout = (direction: 'prev' | 'next') => {
    if (!selectedWorkout || !currentWeek) return;
    const currentIndex = currentWeek.workouts.findIndex(w => w.id === selectedWorkout.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < currentWeek.workouts.length) {
      setSelectedWorkout(currentWeek.workouts[nextIndex]);
      setViewMode('workout');
      haptics.light();
    } else if (direction === 'next' && currentWeekIdx < currentPhase.weeks.length - 1) {
      // Move to next week
      const nextWeek = currentPhase.weeks[currentWeekIdx + 1];
      if (nextWeek.workouts.length > 0) {
        setCurrentWeekIdx(currentWeekIdx + 1);
        setSelectedWorkout(nextWeek.workouts[0]);
        setViewMode('workout');
        haptics.light();
      }
    } else if (direction === 'prev' && currentWeekIdx > 0) {
      // Move to prev week
      const prevWeek = currentPhase.weeks[currentWeekIdx - 1];
      if (prevWeek.workouts.length > 0) {
        setCurrentWeekIdx(currentWeekIdx - 1);
        setSelectedWorkout(prevWeek.workouts[prevWeek.workouts.length - 1]);
        setViewMode('workout');
        haptics.light();
      }
    }
  };

  const handleScheduleWeek = async () => {
    if (!selectedProgram || !currentWeek || !schedulingDate) return;

    const progressEntries = currentWeek.workouts.map((workout, idx) => {
      return {
        programId: selectedProgram.id,
        phase: currentPhase.name,
        week: currentWeek.week,
        day: workout.day,
        completed: false,
        date: addDays(schedulingDate, idx),
        scheduled_time: schedulingTime
      };
    });

    try {
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: progressEntries })
      });
      if (res.ok) {
        haptics.success();
        // showSaveConfirmation('Week scheduled successfully!');
      }
    } catch (err) {
      console.error("Failed to schedule week", err);
    }
  };

  const handleSchedule = async () => {
    if (!selectedProgram || !selectedWorkout || !schedulingDate) return;

    const newProgress = {
      programId: selectedProgram.id,
      phase: currentPhase.name,
      week: currentWeek.week,
      day: selectedWorkout.day,
      completed: false,
      date: schedulingDate,
      scheduled_time: schedulingTime
    };

    try {
      const res = await fetch(`/api/program-progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: [newProgress] })
      });
      if (res.ok) {
        haptics.success();
        showSaveConfirmation('Session scheduled successfully!');
      }
    } catch (err) {
      console.error("Failed to schedule workout", err);
    }
  };

  const getWorkoutProgress = (workout: WorkoutTemplate) => {
    return calculateWorkoutProgress(workout, completedExercises);
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
      setPendingExercise(exercise);
      setShowCustomConfirm(true);
      return;
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
              
              const section = addingToSection || 'exercises';
              const currentExercises = (workout as any)[section] || [];
              
              return {
                ...workout,
                [section]: [...currentExercises, newExercise]
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
      setShowCustomConfirm(true);
      return;
    }

    const newWorkout: WorkoutTemplate = {
      id: generateId(),
      title: newWorkoutTitle,
      day: currentWeek.workouts.length + 1,
      warmUp: [],
      quickness: [],
      lift: [],
      metabolic: [],
      coolDown: [],
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

  const handleConfirmCustom = async () => {
    if (!selectedProgram) return;
    const isAddingExerciseIntent = !!pendingExercise;
    setShowCustomConfirm(false);
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
        
        if (isAddingExerciseIntent) {
          // Proceed with adding exercise
          const newExercise: ExerciseTemplate = {
            id: generateId(),
            exerciseId: pendingExercise.id,
            sets: '3',
            reps: '10',
            tempo: '',
            rest: '60s',
            notes: '',
            videoLinkOverride: pendingExercise.videoUrl
          };

          const updatedPhases = loadedProgram.phases.map((phase, pIdx) => {
            if (pIdx !== currentPhaseIdx) return phase;
            return {
              ...phase,
              weeks: phase.weeks.map((week, wIdx) => {
                if (wIdx !== currentWeekIdx) return week;
                return {
                  ...week,
                  workouts: week.workouts.map(w => {
                    if (w.id !== selectedWorkout?.id) return w;
                    
                    const section = addingToSection || 'exercises';
                    if (section === 'exercises') {
                      return { ...w, exercises: [...(w.exercises || []), newExercise] };
                    } else {
                      return { ...w, [section]: [...(w[section as keyof WorkoutTemplate] as any[] || []), newExercise] };
                    }
                  })
                };
              })
            };
          });

          const patchRes = await fetch(`/api/custom-programs/${userId}/${loadedProgram.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: { ...loadedProgram, phases: updatedPhases }
            })
          });
          
          if (patchRes.ok) {
            const finalProgram = { ...loadedProgram, phases: updatedPhases };
            setSelectedProgram(finalProgram);
            setCustomPrograms(prev => prev.map(p => p.id === finalProgram.id ? finalProgram : p));
            
            // Update selectedWorkout reference
            const updatedWorkout = updatedPhases[currentPhaseIdx].weeks[currentWeekIdx].workouts.find(w => w.id === selectedWorkout?.id);
            if (updatedWorkout) setSelectedWorkout(updatedWorkout);
            
            setIsAddingExercise(false);
            setPendingExercise(null);
            showSaveConfirmation("Exercise added to custom program");
          }
        } else {
          // Proceed with adding workout
          const newWorkout: WorkoutTemplate = {
            id: generateId(),
            title: newWorkoutTitle,
            day: (loadedProgram.phases[currentPhaseIdx]?.weeks[currentWeekIdx]?.workouts?.length || 0) + 1,
            warmUp: [],
            quickness: [],
            lift: [],
            metabolic: [],
            coolDown: [],
            exercises: []
          };

          const updatedPhases = loadedProgram.phases.map((phase, pIdx) => {
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

          const patchRes = await fetch(`/api/custom-programs/${userId}/${loadedProgram.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: { ...loadedProgram, phases: updatedPhases }
            })
          });
          
          if (patchRes.ok) {
            const finalProgram = { ...loadedProgram, phases: updatedPhases };
            setSelectedProgram(finalProgram);
            setCustomPrograms(prev => prev.map(p => p.id === finalProgram.id ? finalProgram : p));
            setIsAddingWorkout(false);
            setNewWorkoutTitle('');
            showSaveConfirmation("Workout added to custom program");
          }
        }
      }
    } catch (err) {
      console.error(err);
      showSaveConfirmation("Failed to create custom program");
    } finally {
      setSavingCustom(false);
    }
  };

  const filteredLibrary = EXERCISE_LIBRARY.filter(ex => {
    const nameStr = ex.name || '';
    return (exerciseCategory === 'All' || ex.category === exerciseCategory) &&
           nameStr.toLowerCase().includes(exerciseSearch.toLowerCase());
  });

  const handleShare = async () => {
    if (!selectedProgram) return;
    haptics.light();
    const result = await share(
      `Check out my KROME Program: ${selectedProgram.name}`,
      selectedProgram.description,
      window.location.href
    );
    if (result === 'copied') {
      alert("Link copied to clipboard!");
    }
  };

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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-24 min-h-screen relative overflow-hidden"
        style={{ paddingTop: 'calc(100px + var(--safe-area-top))' }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop)' }}
          />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full px-4 md:px-12 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest hover:gap-4 transition-all !outline-none border border-[#b2d8d8] px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-gold text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2 krome-outline"
              >
                <Plus className="w-4 h-4" /> Create Custom
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-16 gap-6 md:gap-8">
            <div className="max-w-2xl">
              <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm mb-3 md:mb-4 italic">
                Your Training Protocols
              </h2>
              <h1 className="text-4xl md:text-8xl font-black uppercase italic leading-none tracking-tighter">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">
                  Available
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Programs</span>
              </h1>
              <p className="mt-4 md:mt-6 text-white/70 text-sm md:text-lg leading-relaxed">
                Access all your purchased programs and custom protocols created in the program builder. Each program is scientifically structured for maximum athletic development.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4 bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-[#b2d8d8]">
              <div className="text-right">
                <div className="text-2xl font-black text-gold italic">
                  {availablePrograms.length}
                </div>
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Protocols</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-right">
                <div className="text-2xl font-black text-accent italic">
                  {customPrograms.length}
                </div>
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Custom Builds</div>
              </div>
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {availablePrograms.map((program) => {
              const isCustom = customPrograms.some(p => String(p.id) === String(program.id));
              const locked = !purchasedPrograms.some(p => String(p) === String(program.name) || String(p) === String(program.id)) && !isAdmin && !isCustom;
              
              let totalWorkouts = 0;
              let firstWorkoutTitle = '';
              if (program.phases) {
                for (const phase of program.phases) {
                  for (const week of phase.weeks || []) {
                    for (const workout of week.workouts || []) {
                      totalWorkouts++;
                      if (totalWorkouts === 1) firstWorkoutTitle = workout.title;
                    }
                  }
                }
              }
              const isSingleWorkout = totalWorkouts === 1;
              const progress = calculateProgramProgress(program);

              const getIcon = (id: string) => {
                if (id.includes('soccer')) return <Activity className="w-6 h-6" />;
                if (id.includes('softball') || id.includes('baseball')) return <Zap className="w-6 h-6" />;
                if (id.includes('rehab')) return <Shield className="w-6 h-6" />;
                return <Dumbbell className="w-6 h-6" />;
              };

              const getAccentColor = (id: string, locked: boolean) => {
                if (locked) return 'text-white/20 bg-white/5';
                if (id.includes('soccer')) return 'text-emerald-500 bg-emerald-500/10';
                if (id.includes('softball') || id.includes('baseball')) return 'text-gold bg-gold/10';
                if (id.includes('rehab')) return 'text-rose-500 bg-rose-500/10';
                return 'text-accent bg-accent/10';
              };

              return (
                <motion.button
                  key={program.id}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="group relative text-left bg-black/20 backdrop-blur-md border border-[#b2d8d8] rounded-[32px] md:rounded-[40px] hover:border-gold/50 transition-all overflow-hidden krome-outline flex flex-col h-full"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${program.name}/800/600`} 
                      alt={program.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    
                    <div className="absolute top-4 right-4 flex gap-2">
                      {isCustom && (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit?.(program, true); }}
                            className="w-8 h-8 rounded-lg bg-gold/20 text-gold flex items-center justify-center hover:bg-gold hover:text-black transition-all border border-gold/30"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteCustomProgram(program.id); }}
                            className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 krome-outline ${getAccentColor(program.id, locked)}`}>
                        {locked ? <Lock className="w-4 h-4 text-white/40" /> : getIcon(program.id)}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col h-full p-6 md:p-10 -mt-12">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#b2d8d8]/50">
                        <Clock className="w-3 h-3 text-white/60" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/80">
                          {isCustom ? (isSingleWorkout ? '1 Workout' : `${totalWorkouts} Workouts`) : (program.id.includes('52-week') ? '52 Weeks' : program.id.includes('rehab') ? '6 Weeks' : '8 Weeks')}
                        </span>
                      </div>
                      {isCustom && (
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                          {isSingleWorkout ? 'Custom Workout' : 'Custom Program'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl md:text-3xl font-black uppercase italic leading-tight mb-4 group-hover:text-gold transition-colors drop-shadow-lg text-[#b2d8d8]">
                      {isCustom && isSingleWorkout && program.name === 'Custom Program' ? firstWorkoutTitle : program.name}
                    </h3>

                    <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed mb-8 flex-1 line-clamp-2">
                      {program.description}
                    </p>

                    {!locked && (
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Overall Progress</span>
                          <span className="text-[10px] font-black text-gold italic">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-gold to-accent" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Sport</span>
                        <span className="text-[10px] font-bold text-gold uppercase italic">{program.sport || 'All Sports'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gold font-black uppercase italic text-xs group-hover:gap-4 transition-all">
                        {locked ? 'Purchase Access' : 'Access Program'} <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!selectedProgram) {
    return (
      <div className="p-20 text-center">
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No program selected.</p>
      </div>
    );
  }

  if (!currentPhase || !currentWeek) {
    return (
      <div className="p-20 text-center">
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No program data available for this phase/week.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="space-y-8">
        <header className="flex flex-col bg-zinc-900/50 p-6 lg:p-8 rounded-[40px] border border-white/5 overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" 
            alt="Program Overview" 
            className="absolute inset-0 w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center flex-wrap gap-2 text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
                <button 
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-1 hover:text-gold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Programs
                </button>
                <ChevronRight className="w-4 h-4 text-white/20" />
                <button 
                  onClick={() => setViewMode('program')}
                  className={`hover:text-gold transition-colors ${viewMode === 'program' ? 'text-gold' : ''}`}
                >
                  {selectedProgram.name}
                </button>
                {viewMode === 'workout' && selectedWorkout && (
                  <>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <span className="text-white/80">Week {currentWeek.week}</span>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <span className="text-gold">Day {selectedWorkout.day}: {selectedWorkout.title}</span>
                </>
              )}
              {viewMode === 'exercises' && (
                <>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <span className="text-gold">All Exercises</span>
                </>
              )}
              {viewMode === 'calendar' && (
                <>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <span className="text-gold">Training Schedule</span>
                </>
              )}
              {viewMode === 'dashboard' && (
                <>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <span className="text-gold">Performance Dashboard</span>
                </>
              )}
            </div>
            <h2 className="text-2xl lg:text-3xl font-black uppercase italic text-white">
              {viewMode === 'program' ? selectedProgram.name :
               viewMode === 'workout' && selectedWorkout ? selectedWorkout.title :
               viewMode === 'exercises' ? 'All Exercises' :
               viewMode === 'calendar' ? 'Training Schedule' :
               viewMode === 'dashboard' ? 'Performance Dashboard' : selectedProgram.name}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button 
              onClick={() => setViewMode('dashboard')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent/10 border border-accent/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-black transition-all shadow-lg shadow-accent/5 krome-outline"
            >
              <TrendingUp className="w-4 h-4" /> Performance Dashboard
            </button>
            <button 
              onClick={() => onEdit?.(selectedProgram, !!customPrograms.find(p => p.id === selectedProgram.id))}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gold/10 border border-gold/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all shadow-lg shadow-gold/5 krome-outline"
            >
              <Edit2 className="w-4 h-4" /> Customize Program
            </button>
            {isAdmin && onAssign && (
              <button 
                onClick={() => onAssign(selectedProgram)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent/10 border border-accent/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-black transition-all shadow-lg shadow-accent/5 krome-outline"
              >
                <CheckCircle2 className="w-4 h-4" /> Assign Program
              </button>
            )}
            <button 
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all krome-outline"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Phase</div>
                <div className="text-sm font-bold text-gold">{currentPhase.name}</div>
              </div>
              <div className="flex-1 sm:flex-none bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
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
              onClick={() => setViewMode('calendar')}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'calendar' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} krome-outline`}
            >
              <Calendar className="w-4 h-4" /> Training Schedule
            </button>

            <button
              onClick={() => setViewMode('exercises')}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'exercises' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} krome-outline`}
            >
              <Dumbbell className="w-4 h-4" /> View All Exercises
            </button>

            {selectedWorkout && (
              <div className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 space-y-6 mt-6">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => {
                      const workouts = currentWeek.workouts;
                      const idx = workouts.findIndex(w => w.id === selectedWorkout.id);
                      if (idx > 0) setSelectedWorkout(workouts[idx - 1]);
                    }}
                    disabled={currentWeek.workouts.findIndex(w => w.id === selectedWorkout.id) === 0}
                    className="p-3 rounded-2xl bg-white/5 disabled:opacity-30 hover:bg-white/10"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setViewMode('program')}
                    className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Back to Overview
                  </button>
                  <button
                    onClick={() => {
                      const workouts = currentWeek.workouts;
                      const idx = workouts.findIndex(w => w.id === selectedWorkout.id);
                      if (idx < workouts.length - 1) setSelectedWorkout(workouts[idx + 1]);
                    }}
                    disabled={currentWeek.workouts.findIndex(w => w.id === selectedWorkout.id) === currentWeek.workouts.length - 1}
                    className="p-3 rounded-2xl bg-white/5 disabled:opacity-30 hover:bg-white/10"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center text-gold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase italic">Schedule Session</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Plan your training</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2">Date</label>
                    <input 
                      type="date" 
                      value={schedulingDate}
                      onChange={(e) => setSchedulingDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 ml-2">Time</label>
                    <input 
                      type="time" 
                      value={schedulingTime}
                      onChange={(e) => setSchedulingTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <button 
                    onClick={handleSchedule}
                    className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white transition-all shadow-xl shadow-gold/10"
                  >
                    Add Session to Schedule
                  </button>
                  <button 
                    onClick={handleScheduleWeek}
                    className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all border border-white/10"
                  >
                    Add Week to Schedule
                  </button>
                </div>
              </div>
            )}
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
                        className="group flex flex-col p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-gold/30 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-black italic">
                              D{workout.day}
                            </div>
                            <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg uppercase italic group-hover:text-gold transition-colors">{workout.title}</h4>
                              {getWorkoutProgress(workout) === 100 && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              )}
                            </div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Week {currentWeek.week} • {getWorkoutExercises(workout).length} Exercises</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-black text-accent">{getWorkoutProgress(workout)}%</div>
                              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Complete</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-gold transition-colors" />
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${getWorkoutProgress(workout)}%` }}
                            className="h-full bg-gradient-to-r from-gold to-accent"
                          />
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
                <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-white/5 gap-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setViewMode('program')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gold"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-black uppercase italic">{selectedWorkout.title}</h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Day {selectedWorkout.day} • {getWorkoutExercises(selectedWorkout).length} Exercises</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex bg-black/40 rounded-2xl p-1 border border-white/5">
                      <button 
                        onClick={() => navigateWorkout('prev')}
                        className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-gold transition-all"
                        title="Previous Workout"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setViewMode('dashboard')}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/10 rounded-xl transition-all flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" /> Dashboard
                      </button>
                      <button 
                        onClick={() => navigateWorkout('next')}
                        className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-gold transition-all"
                        title="Next Workout"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-2xl font-black text-accent">{getWorkoutProgress(selectedWorkout)}%</div>
                      <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Workout Progress</div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {/* Structured Sections - Always show for new flow */}
                  <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60">Warm Up: Soft Tissue / Movement Prep / Dynamic Warm Up</h4>
                    <button 
                      onClick={() => { setAddingToSection('warmUp'); setIsAddingExercise(true); }}
                      className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {selectedWorkout.warmUp?.map((exercise, idx) => renderExercise(exercise, idx, 'warmUp'))}
                  {(!selectedWorkout.warmUp || selectedWorkout.warmUp.length === 0) && (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No exercises in this section</div>
                  )}

                  <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60">Quickness: Fast Twitch / CNS / COD</h4>
                    <button 
                      onClick={() => { setAddingToSection('quickness'); setIsAddingExercise(true); }}
                      className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {selectedWorkout.quickness?.map((exercise, idx) => renderExercise(exercise, idx, 'quickness'))}
                  {(!selectedWorkout.quickness || selectedWorkout.quickness.length === 0) && (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No exercises in this section</div>
                  )}

                  <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60">Lift: Power / Strength</h4>
                    <button 
                      onClick={() => { setAddingToSection('lift'); setIsAddingExercise(true); }}
                      className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {selectedWorkout.lift?.map((exercise, idx) => renderExercise(exercise, idx, 'lift'))}
                  {(!selectedWorkout.lift || selectedWorkout.lift.length === 0) && (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No exercises in this section</div>
                  )}

                  <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60">Metabolic Training: ESD / Core</h4>
                    <button 
                      onClick={() => { setAddingToSection('metabolic'); setIsAddingExercise(true); }}
                      className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {selectedWorkout.metabolic?.map((exercise, idx) => renderExercise(exercise, idx, 'metabolic'))}
                  {(!selectedWorkout.metabolic || selectedWorkout.metabolic.length === 0) && (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No exercises in this section</div>
                  )}

                  <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60">Cool Down: Conditioning / Mobility</h4>
                    <button 
                      onClick={() => { setAddingToSection('coolDown'); setIsAddingExercise(true); }}
                      className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-black transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {selectedWorkout.coolDown?.map((exercise, idx) => renderExercise(exercise, idx, 'coolDown'))}
                  {(!selectedWorkout.coolDown || selectedWorkout.coolDown.length === 0) && (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest italic">No exercises in this section</div>
                  )}

                  {/* Legacy/Unstructured Exercises - Only show if they exist */}
                  {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                    <>
                      <div className="px-8 py-4 bg-white/5 border-b border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Other Exercises</h4>
                      </div>
                      {selectedWorkout.exercises.map((exercise, idx) => renderExercise(exercise, idx, 'exercises'))}
                    </>
                  )}

                  <div className="p-8 flex justify-center">
                    <button 
                      onClick={() => {
                        setAddingToSection('exercises');
                        setIsAddingExercise(true);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/20 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest text-gold"
                    >
                      <Plus className="w-4 h-4" /> Add General Exercise
                    </button>
                  </div>
                </div>
        
                  <div className="p-12 bg-white/5 border-t border-white/5 flex flex-col items-center gap-8">
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
                    
                    <div className="w-full h-px bg-white/5 my-8" />
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-6">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => navigateWorkout('prev')}
                          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-gold"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous Workout
                        </button>
                        <button 
                          onClick={() => navigateWorkout('next')}
                          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-gold"
                        >
                          Next Workout <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => setViewMode('dashboard')}
                        className="flex items-center gap-2 px-8 py-4 bg-gold text-black rounded-2xl font-black uppercase italic tracking-tight hover:scale-105 transition-all shadow-xl shadow-gold/20"
                      >
                        <TrendingUp className="w-5 h-5" /> View Program Dashboard
                      </button>
                    </div>
                  </div>
              </motion.div>
            )}
            {viewMode === 'dashboard' && (
              <motion.div
                key="program-dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setViewMode('program')}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gold"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-2xl font-black uppercase italic">Performance <span className="text-gold">Dashboard</span></h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{selectedProgram.name}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Overall Completion</div>
                    <div className="text-4xl font-black text-gold italic">
                      {(() => {
                        let total = 0;
                        let completed = 0;
                        selectedProgram.phases.forEach(p => p.weeks.forEach(w => w.workouts.forEach(wk => {
                          const exercises = getWorkoutExercises(wk);
                          total += exercises.length;
                          exercises.forEach(ex => {
                            if (completedExercises[`${wk.id}-${ex.id}`]) completed++;
                          });
                        })));
                        return total > 0 ? Math.round((completed / total) * 100) : 0;
                      })()}%
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Total Movements</div>
                    <div className="text-4xl font-black text-accent italic">{uniqueExercises.length}</div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Current Phase</div>
                    <div className="text-4xl font-black text-white italic">{currentPhaseIdx + 1} / {selectedProgram.phases.length}</div>
                  </div>
                </div>

                <VolumeProgressionChart program={selectedProgram} />

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase italic text-white/60">Phase Progress</h4>
                  <div className="space-y-3">
                    {selectedProgram.phases.map((phase, pIdx) => {
                      let pTotal = 0;
                      let pCompleted = 0;
                      phase.weeks.forEach(w => w.workouts.forEach(wk => {
                        const exercises = getWorkoutExercises(wk);
                        pTotal += exercises.length;
                        exercises.forEach(ex => {
                          if (completedExercises[`${wk.id}-${ex.id}`]) pCompleted++;
                        });
                      }));
                      const progress = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;
                      return (
                        <div key={pIdx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest">{phase.name}</span>
                            <span className="text-xs font-black text-gold">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {viewMode === 'calendar' && (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setViewMode('program')}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">Training <span className="text-gold">Schedule</span></h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Schedule & Track Progress</p>
                  </div>
                </div>
                
                <ProgramCalendar 
                  userId={userId} 
                />
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
                    <div
                      key={idx}
                      className="p-6 bg-white/5 border border-white/5 rounded-3xl transition-all text-left group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-lg font-black uppercase italic text-white group-hover:text-gold transition-colors mb-1">{ex.name}</div>
                          {ex.videoUrl && (
                            <button 
                              onClick={() => setVideoModal({isOpen: true, url: ex.videoUrl!, title: ex.name})}
                              className="p-2 bg-white/5 rounded-xl text-gold hover:bg-gold hover:text-black transition-all"
                              title="Preview Movement"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{ex.category}</div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {ex.equipment.map((eq, i) => (
                            <span key={i} className="text-[8px] font-bold bg-white/5 px-2 py-0.5 rounded text-white/40">{eq}</span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleAddExercise(ex)}
                          className="p-2 bg-gold/10 text-gold rounded-xl hover:bg-gold hover:text-black transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
                phase={selectedProgram.phases[currentPhaseIdx].name}
                week={selectedProgram.phases[currentPhaseIdx].weeks[currentWeekIdx].week}
                day={selectedWorkout.day}
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

      <VideoModal 
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />

      <ConfirmModal 
        isOpen={showCustomConfirm}
        title="Create Custom Program"
        message="To add workouts, we'll create a custom copy of this program for you. This allows you to personalize your training while keeping the original template intact."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={handleConfirmCustom}
        onCancel={() => {
          setShowCustomConfirm(false);
          setPendingExercise(null);
        }}
      />
      </div>
    </div>
  );
}
