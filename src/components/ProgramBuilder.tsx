import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { safeStorage } from '../utils/storage';
import { haptics } from '../utils/nativeBridge';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Search, 
  CheckCircle2,
  Dumbbell, 
  Calendar,
  Clock,
  Info,
  X,
  Check,
  TrendingUp,
  BarChart2,
  Layout,
  Activity,
  MoreHorizontal,
  Edit3,
  Video,
  ShoppingBag,
  RefreshCw
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { EXERCISE_LIBRARY as STATIC_EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';
import { FullProgramTemplate } from '../data/workoutTemplates';
import { getExercises as fetchExercisesFromDb, addExercise as addExerciseToDb, updateExercise as updateExerciseInDb, deleteExercise as deleteExerciseFromDb } from '../services/firebaseService';

const KSP_SECTIONS = [
  { id: 'warmUp', label: 'Warm Up', subLabel: 'Soft Tissue / Movement Prep / Dynamic Warm Up' },
  { id: 'quickness', label: 'Quickness', subLabel: 'Fast Twitch / CNS / COD' },
  { id: 'lift', label: 'Lift', subLabel: 'Power / Strength' },
  { id: 'metabolic', label: 'Metabolic Training', subLabel: 'ESD / Core' },
  { id: 'coolDown', label: 'Cool Down', subLabel: 'Conditioning / Mobility' },
  { id: 'exercises', label: 'Other Exercises', subLabel: 'General Movements' }
] as const;

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

interface ExerciseEntry {
  id: string;
  exerciseId: string;
  sets: string;
  reps: string;
  weight?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  nameOverride?: string;
  videoLinkOverride?: string;
  canGenerateVideo?: boolean;
  collapsed?: boolean;
}

interface DayEntry {
  id: string;
  title: string;
  exercises: ExerciseEntry[];
  warmUp?: ExerciseEntry[];
  quickness?: ExerciseEntry[];
  lift?: ExerciseEntry[];
  metabolic?: ExerciseEntry[];
  coolDown?: ExerciseEntry[];
  [key: string]: any; // Allow dynamic sections
}

interface WeekEntry {
  id: string;
  weekNumber: number;
  days: DayEntry[];
}

interface Breadcrumb {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface ProgramBuilderProps {
  userId: string;
  userRole?: string;
  onSave?: () => void;
  onBack?: () => void;
  breadcrumbs?: Breadcrumb[];
  initialProgram?: FullProgramTemplate;
  initialPhaseIdx?: number;
  isCustom?: boolean;
  isGlobalTemplate?: boolean;
  initialView?: 'builder' | 'analytics' | 'library';
}

export default function ProgramBuilder({ 
  userId, 
  userRole,
  onSave, 
  onBack, 
  breadcrumbs,
  initialProgram, 
  initialPhaseIdx = 0, 
  isCustom = false,
  isGlobalTemplate = false,
  initialView = 'builder'
}: ProgramBuilderProps) {
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [programCategory, setProgramCategory] = useState(initialProgram?.category || 'Custom');
  const [programPrice, setProgramPrice] = useState(initialProgram?.id ? (initialProgram as any).price || 0 : 0);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeView, setActiveView] = useState<'builder' | 'analytics' | 'library'>(initialView);
  const [realWorldLogs, setRealWorldLogs] = useState<any[]>([]);
  const [loadingRealWorld, setLoadingRealWorld] = useState(false);
  const [customSections, setCustomSections] = useState<{id: string, label: string}[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [newExercise, setNewExercise] = useState({ name: '', category: 'SQUAT', equipment: [] as string[], videoUrl: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'week' | 'day' | 'exercise', weekId: string, dayId?: string, exerciseId?: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [targetWeekId, setTargetWeekId] = useState<string | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState<{weekId: string, dayId: string, section: keyof DayEntry} | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('All');

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (weekId: string, dayId: string, sectionId: string) => {
    const key = `${weekId}-${dayId}-${sectionId}`;
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [weeks, setWeeks] = useState<WeekEntry[]>(() => {
    if (initialProgram) {
      // Transform phases back to weeks structure
      const phase = initialProgram.phases[initialPhaseIdx] || initialProgram.phases[0];
      if (!phase) return [];
      
      return phase.weeks.map(w => ({
        id: (w as any).id || generateId(),
        weekNumber: w.week,
        days: w.workouts.map(d => ({
          id: d.id || generateId(),
          title: d.title,
          exercises: d.exercises.map(ex => ({
            id: ex.id || generateId(),
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            tempo: ex.tempo,
            rest: ex.rest,
            notes: ex.notes,
            nameOverride: ex.nameOverride,
            videoLinkOverride: ex.videoLinkOverride,
            canGenerateVideo: ex.canGenerateVideo
          })),
          warmUp: d.warmUp?.map(ex => ({ ...ex, id: ex.id || generateId() })),
          quickness: d.quickness?.map(ex => ({ ...ex, id: ex.id || generateId() })),
          lift: d.lift?.map(ex => ({ ...ex, id: ex.id || generateId() })),
          metabolic: d.metabolic?.map(ex => ({ ...ex, id: ex.id || generateId() })),
          coolDown: d.coolDown?.map(ex => ({ ...ex, id: ex.id || generateId() }))
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
          id: (w as any).id || generateId(),
          weekNumber: w.week,
          days: w.workouts.map(d => ({
            id: d.id || generateId(),
            title: d.title,
            exercises: d.exercises.map(ex => ({
              id: ex.id || generateId(),
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              tempo: ex.tempo,
              rest: ex.rest,
              notes: ex.notes,
              nameOverride: ex.nameOverride,
              videoLinkOverride: ex.videoLinkOverride,
              canGenerateVideo: ex.canGenerateVideo
            })),
            warmUp: d.warmUp?.map(ex => ({ ...ex, id: ex.id || generateId() })),
            quickness: d.quickness?.map(ex => ({ ...ex, id: ex.id || generateId() })),
            lift: d.lift?.map(ex => ({ ...ex, id: ex.id || generateId() })),
            metabolic: d.metabolic?.map(ex => ({ ...ex, id: ex.id || generateId() })),
            coolDown: d.coolDown?.map(ex => ({ ...ex, id: ex.id || generateId() }))
          }))
        }));
        setWeeks(transformedWeeks);
        setProgramName(initialProgram.name);
        setProgramDescription(initialProgram.description);
      }
    }
  }, [initialProgram, initialPhaseIdx, isCustom]);

  const allSections = useMemo(() => [
    ...KSP_SECTIONS.filter(s => s.id !== 'exercises'),
    ...customSections,
    KSP_SECTIONS.find(s => s.id === 'exercises')!
  ], [customSections]);

  const migrateExercisesToSections = (weeksData: WeekEntry[]) => {
    return weeksData.map(week => ({
      ...week,
      days: week.days.map(day => {
        if (!day.exercises || day.exercises.length === 0) return day;

        const newDay = { ...day };
        const legacyExercises = [...day.exercises];
        
        legacyExercises.forEach(ex => {
          const exerciseInfo = exercises.find(e => e.id === ex.exerciseId);
          const category = exerciseInfo?.category?.toUpperCase() || 'GENERAL';
          
          let targetSection: keyof DayEntry = 'lift'; // Default

          if (category.includes('WARM') || category.includes('MOBILITY') || category.includes('PREP')) {
            targetSection = 'warmUp';
          } else if (category.includes('SPEED') || category.includes('AGILITY') || category.includes('PLYO') || category.includes('JUMP')) {
            targetSection = 'quickness';
          } else if (category.includes('CONDITIONING') || category.includes('CORE') || category.includes('METABOLIC')) {
            targetSection = 'metabolic';
          } else if (category.includes('COOL') || category.includes('STRETCH')) {
            targetSection = 'coolDown';
          }

          if (!newDay[targetSection]) newDay[targetSection] = [];
          (newDay[targetSection] as ExerciseEntry[]).push(ex);
        });

        newDay.exercises = []; // Clear legacy
        return newDay;
      })
    }));
  };

  useEffect(() => {
    if (exercises.length > 0 && weeks.some(w => w.days.some(d => d.exercises && d.exercises.length > 0))) {
      setWeeks(prev => migrateExercisesToSections(prev));
    }
  }, [exercises.length]);

  useEffect(() => {
    if (activeView === 'analytics' && initialProgram?.id) {
      fetchRealWorldAnalytics();
    }
  }, [activeView, initialProgram?.id]);

  const fetchRealWorldAnalytics = async () => {
    setLoadingRealWorld(true);
    try {
      const res = await fetch(`/api/analytics/program/${initialProgram?.id}`);
      if (res.ok) {
        const data = await res.json();
        setRealWorldLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching real world analytics:", err);
    } finally {
      setLoadingRealWorld(false);
    }
  };

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await fetchExercisesFromDb();
        if (data.length === 0) {
          // Initialize with static library if empty
          for (const ex of STATIC_EXERCISE_LIBRARY) {
            await addExerciseToDb(ex);
          }
          const newData = await fetchExercisesFromDb();
          setExercises(newData);
        } else {
          setExercises(data);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
        // Fallback to static library on error
        setExercises(STATIC_EXERCISE_LIBRARY);
      } finally {
        setIsLoadingExercises(false);
      }
    };
    fetchExercises();
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'coach';

  const handleCreateExercise = async () => {
    if (!newExercise.name || !newExercise.category) return;
    try {
      const exerciseToSave = {
        ...newExercise,
        id: newExercise.name.toLowerCase().replace(/\s+/g, '-')
      };
      await addExerciseToDb(exerciseToSave);
      const updated = await fetchExercisesFromDb();
      setExercises(updated);
      setShowAddExerciseModal(false);
      setNewExercise({ name: '', category: 'SQUAT', equipment: [], videoUrl: '' });
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;
    try {
      await updateExerciseInDb(editingExercise.id, editingExercise);
      const updated = await fetchExercisesFromDb();
      setExercises(updated);
      setEditingExercise(null);
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exercise?")) return;
    try {
      await deleteExerciseFromDb(id);
      const updated = await fetchExercisesFromDb();
      setExercises(updated);
    } catch (error) {
      console.error("Error deleting exercise:", error);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = searchTerm.trim() === '' || ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchTerm, selectedCategory]);

  const filteredExercisesForModal = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = exerciseSearch.trim() === '' || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
      const matchesCategory = exerciseCategory === 'All' || ex.category === exerciseCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, exerciseSearch, exerciseCategory]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'day') {
      const weekId = source.droppableId.replace('week-', '');
      setWeeks(weeks.map(w => {
        if (w.id === weekId) {
          const newDays = Array.from(w.days);
          const [removed] = newDays.splice(source.index, 1);
          newDays.splice(destination.index, 0, removed);
          return { ...w, days: newDays };
        }
        return w;
      }));
    } else if (type === 'exercise') {
      const sourceParts = source.droppableId.split('|');
      const destParts = destination.droppableId.split('|');
      
      const sourceWeekId = sourceParts[1];
      const sourceDayId = sourceParts[3];
      const sourceSection = (sourceParts[5] || 'exercises') as keyof DayEntry;
      
      const destWeekId = destParts[1];
      const destDayId = destParts[3];
      const destSection = (destParts[5] || 'exercises') as keyof DayEntry;
      
      if (source.droppableId === destination.droppableId) {
        // Reordering within the same day and same section
        setWeeks(weeks.map(w => {
          if (w.id === sourceWeekId) {
            return {
              ...w,
              days: w.days.map(d => {
                if (d.id === sourceDayId) {
                  const sectionData = (d[sourceSection] || []) as ExerciseEntry[];
                  const newExercises = Array.from(sectionData);
                  const [removed] = newExercises.splice(source.index, 1);
                  newExercises.splice(destination.index, 0, removed);
                  return { ...d, [sourceSection]: newExercises };
                }
                return d;
              })
            };
          }
          return w;
        }));
      } else {
        // Moving to a different day or different section
        setWeeks(weeks.map(w => {
          let newDays = [...w.days];
          
          // Remove from source week/day/section
          if (w.id === sourceWeekId) {
            newDays = newDays.map(d => {
              if (d.id === sourceDayId) {
                const sectionData = (d[sourceSection] || []) as ExerciseEntry[];
                const newExercises = Array.from(sectionData);
                newExercises.splice(source.index, 1);
                return { ...d, [sourceSection]: newExercises };
              }
              return d;
            });
          }
          
          // Add to destination week/day/section
          if (w.id === destWeekId) {
            // Find the removed item from the original state
            const sourceWeek = weeks.find(sw => sw.id === sourceWeekId);
            const sourceDay = sourceWeek?.days.find(sd => sd.id === sourceDayId);
            const sourceSectionData = (sourceDay?.[sourceSection] || []) as ExerciseEntry[];
            const removed = sourceSectionData[source.index];
            
            if (removed) {
              newDays = newDays.map(d => {
                if (d.id === destDayId) {
                  const sectionData = (d[destSection] || []) as ExerciseEntry[];
                  const newExercises = Array.from(sectionData);
                  newExercises.splice(destination.index, 0, removed);
                  return { ...d, [destSection]: newExercises };
                }
                return d;
              });
            }
          }
          
          return { ...w, days: newDays };
        }));
      }
    }
  };

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
    setActiveWeekId(newWeek.id);
  };

  const removeWeek = (weekId: string) => {
    setWeeks(weeks.filter(w => w.id !== weekId).map((w, idx) => ({ ...w, weekNumber: idx + 1 })));
    if (activeWeekId === weekId) setActiveWeekId(null);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const removeDay = (weekId: string, dayId: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.filter(d => d.id !== dayId)
        };
      }
      return w;
    }));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const removeExercise = (weekId: string, dayId: string, exerciseId: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              const updatedDay = { ...d };
              const sections: (keyof DayEntry)[] = ['exercises', 'warmUp', 'quickness', 'lift', 'metabolic', 'coolDown'];
              sections.forEach(s => {
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  (updatedDay[s] as ExerciseEntry[]) = (updatedDay[s] as ExerciseEntry[]).filter(ex => ex.id !== exerciseId);
                }
              });
              // Also check custom sections
              customSections.forEach(cs => {
                const s = cs.id as keyof DayEntry;
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  (updatedDay[s] as ExerciseEntry[]) = (updatedDay[s] as ExerciseEntry[]).filter(ex => ex.id !== exerciseId);
                }
              });
              return updatedDay;
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
    
    switch (deleteTarget.type) {
      case 'week':
        removeWeek(deleteTarget.weekId);
        break;
      case 'day':
        if (deleteTarget.dayId) removeDay(deleteTarget.weekId, deleteTarget.dayId);
        break;
      case 'exercise':
        if (deleteTarget.dayId && deleteTarget.exerciseId) {
          removeExercise(deleteTarget.weekId, deleteTarget.dayId, deleteTarget.exerciseId);
        }
        break;
    }
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
          exercises: [],
          warmUp: [],
          quickness: [],
          lift: [],
          metabolic: [],
          coolDown: []
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

  const renderExerciseSection = (weekId: string, dayId: string, sectionName: keyof DayEntry, sectionTitle: string, exercisesList: ExerciseEntry[]) => {
    const sectionKey = `${weekId}-${dayId}-${sectionName}`;
    const isCollapsed = collapsedSections[sectionKey];

    return (
      <div className="mb-6 last:mb-0">
        <div 
          className="flex items-center justify-between mb-3 px-2 cursor-pointer hover:bg-white/5 py-1 rounded-lg transition-colors"
          onClick={() => toggleSectionCollapse(weekId, dayId, sectionName as string)}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? <ChevronRight className="w-3 h-3 text-gold/60" /> : <ChevronDown className="w-3 h-3 text-gold/60" />}
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-krome/60">{sectionTitle}</h4>
          </div>
          <Badge variant="outline" className="text-[9px] font-black text-white/20 border-white/5 bg-transparent h-4 px-1.5">
            {exercisesList.length}
          </Badge>
        </div>
        
        {!isCollapsed && (
          <Droppable droppableId={`exercises|${weekId}|day|${dayId}|section|${sectionName}`} type="exercise">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[60px] p-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-gold/5 border border-dashed border-gold/20' : 'bg-black/20 border border-transparent'}`}
              >
                {exercisesList.map((ex, exIndex) => (
                  <Draggable key={ex.id} draggableId={`exercise-${ex.id}`} index={exIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${snapshot.isDragging ? 'z-50' : ''}`}
                      >
                        <div 
                          className={`bg-white/5 border ${ex.collapsed ? 'border-white/5' : 'border-white/10'} rounded-2xl p-4 cursor-pointer hover:border-gold/30 transition-all group relative`}
                          onClick={() => toggleExerciseCollapse(weekId, dayId, ex.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h5 className="font-black text-[11px] uppercase italic text-white group-hover:text-gold transition-colors line-clamp-1">
                                {ex.nameOverride || exercises.find(e => e.id === ex.exerciseId)?.name || 'Unknown Exercise'}
                              </h5>
                              <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-0.5">
                                {exercises.find(e => e.id === ex.exerciseId)?.category || 'General'}
                              </div>
                            </div>
                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-800 border-white/10">
                                  <DropdownMenuItem 
                                    onClick={() => toggleExerciseCollapse(weekId, dayId, ex.id)}
                                    className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                                  >
                                    {ex.collapsed ? 'Expand' : 'Collapse'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setDeleteTarget({ type: 'exercise', weekId, dayId, exerciseId: ex.id });
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer"
                                  >
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {!ex.collapsed && (
                            <div 
                              className="space-y-4 mt-4 pt-4 border-t border-white/5"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Sets</Label>
                                  <Input 
                                    value={ex.sets}
                                    onChange={(e) => updateExercise(weekId, dayId, ex.id, { sets: e.target.value })}
                                    className="h-8 bg-black/40 border-white/5 text-[10px] font-bold text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Reps</Label>
                                  <Input 
                                    value={ex.reps}
                                    onChange={(e) => updateExercise(weekId, dayId, ex.id, { reps: e.target.value })}
                                    className="h-8 bg-black/40 border-white/5 text-[10px] font-bold text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Weight</Label>
                                  <Input 
                                    value={ex.weight || ''}
                                    onChange={(e) => updateExercise(weekId, dayId, ex.id, { weight: e.target.value })}
                                    placeholder="lbs/kg"
                                    className="h-8 bg-black/40 border-white/5 text-[10px] font-bold text-white"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Tempo</Label>
                                  <Input 
                                    value={ex.tempo}
                                    onChange={(e) => updateExercise(weekId, dayId, ex.id, { tempo: e.target.value })}
                                    placeholder="e.g. 3010"
                                    className="h-8 bg-black/40 border-white/5 text-[10px] font-bold text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Rest</Label>
                                  <Input 
                                    value={ex.rest}
                                    onChange={(e) => updateExercise(weekId, dayId, ex.id, { rest: e.target.value })}
                                    placeholder="e.g. 60s"
                                    className="h-8 bg-black/40 border-white/5 text-[10px] font-bold text-white"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">Notes</Label>
                                <Textarea 
                                  value={ex.notes || ''}
                                  onChange={(e) => updateExercise(weekId, dayId, ex.id, { notes: e.target.value })}
                                  placeholder="Special instructions..."
                                  className="bg-black/40 border-white/5 text-[10px] font-bold text-white min-h-[60px] resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.innerRef && provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    );
  };
  const addExercise = (weekId: string, dayId: string, exerciseName: string, category: string, section: keyof DayEntry = 'exercises') => {
    console.log("addExercise called with:", weekId, dayId, exerciseName, category, section);
    const libraryExercise = exercises.find(ex => ex.name === exerciseName);
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              const newExercise: ExerciseEntry = {
                id: generateId(),
                exerciseId: libraryExercise?.id || '',
                sets: '3',
                reps: '10',
                tempo: '',
                rest: '60s',
                notes: '',
                nameOverride: '',
                videoLinkOverride: libraryExercise?.videoUrl || '',
                canGenerateVideo: true,
                collapsed: true
              };
              const sectionData = (d[section] || []) as ExerciseEntry[];
              return { ...d, [section]: [...sectionData, newExercise] };
            }
            return d;
          })
        };
      }
      return w;
    }));
  };

  const toggleExerciseCollapse = (weekId: string, dayId: string, exerciseId: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              const updateSection = (section: ExerciseEntry[] | undefined) => 
                section?.map(ex => ex.id === exerciseId ? { ...ex, collapsed: !ex.collapsed } : ex);
              
              const updatedDay = { ...d };
              const sections: (keyof DayEntry)[] = ['exercises', 'warmUp', 'quickness', 'lift', 'metabolic', 'coolDown'];
              sections.forEach(s => {
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  updatedDay[s] = updateSection(updatedDay[s]);
                }
              });
              customSections.forEach(cs => {
                const s = cs.id;
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  updatedDay[s] = updateSection(updatedDay[s]);
                }
              });
              return updatedDay;
            }
            return d;
          })
        };
      }
      return w;
    }));
  };

  const updateExercise = (weekId: string, dayId: string, exerciseId: string, updates: Partial<ExerciseEntry>) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          days: w.days.map(d => {
            if (d.id === dayId) {
              const updateSection = (section: ExerciseEntry[] | undefined) => 
                section?.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex);
              
              const updatedDay = { ...d };
              const sections: (keyof DayEntry)[] = ['exercises', 'warmUp', 'quickness', 'lift', 'metabolic', 'coolDown'];
              sections.forEach(s => {
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  updatedDay[s] = updateSection(updatedDay[s]);
                }
              });
              customSections.forEach(cs => {
                const s = cs.id;
                if (updatedDay[s] && Array.isArray(updatedDay[s])) {
                  updatedDay[s] = updateSection(updatedDay[s]);
                }
              });
              return updatedDay;
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
    console.log("Saving program...", {
      userId,
      isCustom,
      initialProgramId: initialProgram?.id,
      programName: trimmedName,
      weeksCount: weeks.length
    });

    try {
      const phases: any[] = [{
        name: 'Program Weeks',
        weeks: weeks.map(w => ({
          week: w.weekNumber,
          workouts: w.days.map((d, idx) => {
            const workout: any = {
              id: d.id,
              title: d.title,
              day: idx + 1,
              exercises: d.exercises,
              warmUp: d.warmUp,
              quickness: d.quickness,
              lift: d.lift,
              metabolic: d.metabolic,
              coolDown: d.coolDown
            };
            // Add custom sections
            customSections.forEach(cs => {
              workout[cs.id] = d[cs.id];
            });
            return workout;
          })
        }))
      }];

      let method = 'POST';
      let url = '';

      if (isGlobalTemplate) {
        method = initialProgram?.id ? 'PATCH' : 'POST';
        url = initialProgram?.id ? `/api/program-templates/${initialProgram.id}` : '/api/program-templates';
      } else {
        method = (isCustom && initialProgram?.id) ? 'PATCH' : 'POST';
        url = (isCustom && initialProgram?.id) ? `/api/custom-programs/${userId}/${initialProgram.id}` : `/api/custom-programs/${userId}`;
      }

      console.log(`Sending ${method} request to ${url}`);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: programDescription,
          category: programCategory,
          price: programPrice,
          phases
        })
      });

      console.log("Save response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("Save successful:", result);
        setMessage({ type: 'success', text: 'Program saved successfully!' });
        if (onSave) onSave();
      } else {
        const errorText = await res.text();
        console.error("Save failed:", errorText);
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error("Error in handleSave:", err);
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

  const analyticsStats = useMemo(() => {
    const totalWeeks = weeks.length;
    const totalDays = weeks.reduce((acc, w) => acc + w.days.length, 0);
    const totalVolume = volumeData.reduce((acc, d) => acc + d.volume, 0);
    const totalSets = volumeData.reduce((acc, d) => acc + d.sets, 0);
    
    const averageSetsPerWorkout = totalDays > 0 ? Math.round(totalSets / totalDays) : 0;
    
    // Real-world stats
    const completedLogs = realWorldLogs.filter(l => l.completed);
    const realCompletionRate = realWorldLogs.length > 0 
      ? Math.round((completedLogs.length / realWorldLogs.length) * 100)
      : 0;
    
    const popularExercises = realWorldLogs.reduce((acc: any, log) => {
      const exId = log.exercise_id;
      acc[exId] = (acc[exId] || 0) + 1;
      return acc;
    }, {});

    const sortedPopular = Object.entries(popularExercises)
      .map(([id, count]) => ({ 
        id, 
        count: count as number,
        name: exercises.find(e => e.id === id)?.name || id 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalWeeks,
      totalDays,
      totalVolume,
      averageSetsPerWorkout,
      completionRate: realCompletionRate || 0,
      popularExercises: sortedPopular
    };
  }, [weeks, volumeData, realWorldLogs, exercises]);

  const allEquipment = useMemo(() => {
    return Array.from(new Set(exercises.flatMap(ex => ex.equipment || []))).sort();
  }, [exercises]);

  const EQUIPMENT_OPTIONS = [
    "BB", "DB", "Cable", "Bodyweight", "Band", "Suspension", "KB", "Machine", 
    "Life Fitness", "TechnoGym", "Nautilus", "Free Motion", "Precor", "Hammer", 
    "Ab Wheel", "GX Step", "EZ Bar", "GHD", "MB", "Mini Band", "PVC", 
    "Roman Chair", "SB", "BOSU", "Step 360", "ViPR"
  ];

  const getExerciseEquipment = (name: string) => {
    const exercise = exercises.find(ex => ex.name === name);
    const specific = exercise ? (exercise.equipment || []) : [];
    return Array.from(new Set([...specific, ...EQUIPMENT_OPTIONS])).sort();
  };

  return (
    <div className="w-full px-2 md:px-8 space-y-4 md:space-y-8 relative min-h-screen">
      <img 
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" 
        alt="Builder Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-5"
        referrerPolicy="no-referrer"
      />
      <div className="relative z-10 space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 px-2">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest hover:gap-4 transition-all group shrink-0"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
        )}
        
        {breadcrumbs && breadcrumbs.length > 0 && (
          <>
            <div className="hidden md:block w-px h-4 bg-white/10 mx-2" />
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />}
                  <button
                    onClick={crumb.onClick}
                    disabled={crumb.active || !crumb.onClick}
                    className={`text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      crumb.active 
                        ? 'text-gold underline underline-offset-4 decoration-gold/30' 
                        : 'text-white/40 hover:text-white underline-none'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </>
        )}
      </div>
      <header className="bg-zinc-900/50 p-4 md:p-8 rounded-[24px] md:rounded-[40px] border border-krome/20 shadow-2xl">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programName" className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Program Name</Label>
                <Input 
                  id="programName"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Enter program name..."
                  className="bg-black/40 border-krome/40 text-xl md:text-2xl font-black uppercase italic h-14 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programCategory" className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Category</Label>
                <Select value={programCategory} onValueChange={setProgramCategory}>
                  <SelectTrigger id="programCategory" className="bg-black/40 border-krome/40 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-krome/20 text-white">
                    <SelectItem value="Custom">Custom</SelectItem>
                    <SelectItem value="52 Week">52 Week</SelectItem>
                    <SelectItem value="Movement">Movement</SelectItem>
                    <SelectItem value="Speed & Agility">Speed & Agility</SelectItem>
                    <SelectItem value="Strength & Power">Strength & Power</SelectItem>
                    <SelectItem value="Break Programs">Break Programs</SelectItem>
                    <SelectItem value="Recovery">Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programDescription" className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Description</Label>
                <Textarea 
                  id="programDescription"
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  placeholder="Describe your program..."
                  className="bg-black/40 border-krome/40 text-sm h-20 resize-none text-white"
                />
              </div>
            </div>
            
            {(isGlobalTemplate || isAdmin) && (
              <div className="w-full md:w-48 space-y-2">
                <Label htmlFor="programPrice" className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Price (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold">$</span>
                  <Input 
                    id="programPrice"
                    type="number"
                    value={programPrice}
                    onChange={(e) => setProgramPrice(Number(e.target.value))}
                    className="bg-black/40 border-krome/40 pl-8 h-14 font-bold text-lg text-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 md:pt-4 border-t border-krome/20">
            {activeView !== 'library' ? (
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full sm:w-auto">
                <TabsList className="bg-black/40 border border-krome/20 p-1 h-auto flex flex-col sm:flex-row gap-1">
                  <TabsTrigger value="builder" className="data-[state=active]:bg-gold data-[state=active]:text-black px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-krome w-full sm:w-auto">
                    <Dumbbell className="w-3 md:w-3.5 h-3 md:h-3.5" /> Builder
                  </TabsTrigger>
                  <TabsTrigger value="library" className="data-[state=active]:bg-gold data-[state=active]:text-black px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-krome w-full sm:w-auto">
                    <Search className="w-3 md:w-3.5 h-3 md:h-3.5" /> Library
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-gold data-[state=active]:text-black px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-krome w-full sm:w-auto">
                    <TrendingUp className="w-3 md:w-3.5 h-3 md:h-3.5" /> Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <Button 
                onClick={() => setActiveView('builder')}
                className="bg-gold text-black font-black uppercase tracking-widest text-[10px] rounded-lg px-4 py-2 hover:bg-gold/90 transition-all krome-outline"
              >
                Back to Builder
              </Button>
            )}
            {activeView !== 'library' && (
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-gold text-black font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-lg md:rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all disabled:opacity-50 shadow-lg shadow-gold/10 krome-outline h-auto"
              >
                {saving ? <RefreshCw className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" /> : <Save className="w-3.5 md:w-4 h-3.5 md:h-4" />}
                {saving ? 'Saving...' : 'Save Program'}
              </Button>
            )}
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
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all krome-outline"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => targetWeekId && addDay(targetWeekId, newWorkoutTitle)}
                    disabled={!newWorkoutTitle.trim()}
                    className="flex-1 py-4 bg-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold/90 transition-all disabled:opacity-50 krome-outline"
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
              className="w-full max-w-2xl bg-zinc-900 border border-white/10 p-6 rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Add <span className="text-gold">Exercise</span></h3>
                <button 
                  onClick={() => setIsAddingExercise(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-gold transition-all text-sm"
                  />
                </div>
                <select 
                  value={exerciseCategory}
                  onChange={(e) => setExerciseCategory(e.target.value)}
                  className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold transition-all text-sm font-bold uppercase tracking-widest"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-2 pb-2">
                  {filteredExercisesForModal.length > 0 ? (
                    filteredExercisesForModal.map(ex => (
                      <button 
                        key={ex.id}
                        onClick={() => {
                          addExercise(isAddingExercise.weekId, isAddingExercise.dayId, ex.name, ex.category, isAddingExercise.section);
                          setIsAddingExercise(null);
                        }}
                        className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-gold/10 hover:border-gold/30 transition-all flex items-center justify-between group"
                      >
                        <div className="flex flex-col">
                          <span className="font-black uppercase italic text-sm group-hover:text-gold transition-colors">{ex.name}</span>
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-0.5">{ex.category}</span>
                        </div>
                        <Plus className="w-4 h-4 text-white/10 group-hover:text-gold transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-white/10" />
                      </div>
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest">No exercises found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setIsAddingExercise(null)}
                  className="w-full py-3 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeView === 'builder' && (
          <DragDropContext onDragEnd={onDragEnd}>
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
                <Button 
                  onClick={() => {
                    console.log("Add Week button clicked");
                    addWeek();
                  }}
                  className="flex items-center gap-1 bg-gold text-black font-black uppercase text-[8px] tracking-widest hover:bg-gold/90 px-3 py-1.5 rounded-md transition-all shadow-lg shadow-gold/10 krome-outline h-auto"
                >
                  <Plus className="w-2.5 h-2.5" /> Add Week
                </Button>
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
                  <Card key={week.id} className="bg-zinc-900/30 border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
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
                            <span className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-krome">Week {week.weekNumber}</span>
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
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => { setDeleteTarget({ type: 'week', weekId: week.id }); setShowDeleteConfirm(true); }}
                        className="h-full px-8 text-rose-500/30 hover:text-rose-500 transition-colors border-l border-white/5 rounded-none"
                        aria-label="Delete Week"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <AnimatePresence>
                      {activeWeekId === week.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 md:px-6 pb-8"
                        >
                          <div className="flex-1">
                            <Droppable droppableId={`week-${week.id}`} direction="horizontal" type="day">
                            {(provided) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex flex-wrap justify-center gap-4 min-h-[400px] w-full py-4"
                              >
                                {week.days.map((day, index) => (
                                  <Draggable key={day.id} draggableId={`day-${day.id}`} index={index}>
                                            {(provided) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex-none w-full max-w-xs bg-zinc-900/40 border border-white/5 rounded-[32px] p-4 flex flex-col h-fit max-h-[70vh] overflow-y-auto"
                                      >
                                        <div {...provided.dragHandleProps} className="flex justify-between items-center mb-6 px-2 cursor-grab active:cursor-grabbing">
                                          <div className="flex-1 mr-2">
                                            <Input 
                                              value={day.title}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                setWeeks(weeks.map(w => w.id === week.id ? {
                                                  ...w,
                                                  days: w.days.map(d => d.id === day.id ? { ...d, title: e.target.value } : d)
                                                } : w));
                                              }}
                                              className="bg-transparent border-none hover:bg-white/5 text-sm font-black uppercase italic tracking-widest outline-none focus-visible:ring-0 pb-1 text-white w-full transition-all h-8"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full font-black">
                                              {day.exercises.length}
                                            </Badge>
                                            <Button 
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => { setDeleteTarget({ type: 'day', weekId: week.id, dayId: day.id }); setShowDeleteConfirm(true); }}
                                              className="h-8 w-8 text-white/20 hover:text-rose-500 transition-colors"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 min-h-[50px]">
                                          {allSections.map(section => (
                                            <React.Fragment key={section.id}>
                                              {renderExerciseSection(
                                                week.id, 
                                                day.id, 
                                                section.id as keyof DayEntry, 
                                                section.label, 
                                                (day[section.id as keyof DayEntry] || []) as ExerciseEntry[]
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </div>

                                        <div className="mt-4 space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            {KSP_SECTIONS.filter(s => s.id !== 'exercises').map(section => (
                                              <Button 
                                                key={section.id}
                                                variant="outline"
                                                onClick={() => setIsAddingExercise({ weekId: week.id, dayId: day.id, section: section.id as keyof DayEntry })}
                                                className="py-2 border border-dashed border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all flex items-center justify-center gap-1 h-auto bg-transparent"
                                              >
                                                <Plus className="w-2 h-2" /> {section.label}
                                              </Button>
                                            ))}
                                          </div>
                                          
                                          <Button 
                                            variant="outline"
                                            onClick={() => {
                                              const name = window.prompt("Enter section name:");
                                              if (name) {
                                                const id = name.toLowerCase().replace(/\s+/g, '-');
                                                if (!customSections.find(s => s.id === id)) {
                                                  setCustomSections([...customSections, { id, label: name }]);
                                                }
                                              }
                                            }}
                                            className="w-full py-2 border border-dashed border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/10 hover:text-gold hover:border-gold/20 transition-all flex items-center justify-center gap-1 h-auto bg-transparent"
                                          >
                                            <Plus className="w-2 h-2" /> Add Custom Section
                                          </Button>
                                        </div>
                                      </Card>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {week.days.length < 7 && (
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      setTargetWeekId(week.id);
                                      setIsAddingWorkout(true);
                                    }}
                                    className="group flex-none w-full max-w-xs p-5 border-2 border-dashed border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-gold/30 transition-all flex items-center justify-center gap-3 h-auto"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-white/20 group-hover:text-gold transition-all">
                                      <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-gold transition-all">Add Training Day</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </Droppable>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
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
                        const ex = exercises.find(x => x.name === e.target.value);
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
                          {exercises.filter(ex => ex.category === cat).map(ex => (
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
                  <div 
                    key={idx}
                    className="bg-white/5 border-transparent hover:border-gold/20 p-5 rounded-2xl transition-all group flex flex-col justify-between h-full cursor-pointer"
                    onClick={() => {
                      let targetDayId = activeDayId;
                      let targetWkId = activeWeekId;

                      if (!targetDayId && targetWkId) {
                        const week = weeks.find(w => w.id === targetWkId);
                        if (week && week.days.length > 0) {
                          targetDayId = week.days[0].id;
                          setActiveDayId(targetDayId);
                        }
                      }

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
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-black uppercase italic text-white group-hover:text-gold transition-colors line-clamp-2 leading-tight">{ex.name}</div>
                        {ex.videoUrl && (
                          <a 
                            href={ex.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[8px] font-black uppercase tracking-widest text-gold hover:underline !outline-none"
                            onClick={e => e.stopPropagation()}
                          >
                            Watch Demo
                          </a>
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{ex.category}</div>
                  </div>
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
          </DragDropContext>
        )}
        
        {activeView === 'library' && (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-zinc-900/50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-krome/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-6 mb-12">
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <Input 
                    placeholder="Search exercise library..."
                    className="w-full bg-black/40 border-white/10 rounded-2xl pl-16 pr-6 h-16 text-white text-lg focus:border-gold transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-black/40 border-white/10 rounded-2xl px-6 h-16 text-white min-w-[220px] font-black uppercase tracking-widest text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="All" className="font-bold uppercase tracking-widest text-[10px]">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="font-bold uppercase tracking-widest text-[10px]">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAdmin && (
                    <Button 
                      onClick={() => setShowAddExerciseModal(true)}
                      className="bg-gold text-black px-8 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gold/90 transition-all krome-outline shadow-xl shadow-gold/20"
                    >
                      <Plus className="w-5 h-5" />
                      Add Exercise
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((ex) => (
                    <div key={ex.id} className="bg-black/40 p-8 rounded-[40px] border border-krome/20 hover:border-gold/30 transition-all group relative flex flex-col h-full krome-outline">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform shadow-lg shadow-gold/5">
                          <Dumbbell className="w-7 h-7" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-white/5 rounded-full text-white/40 border border-white/5">{ex.category}</span>
                          {isAdmin && (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => setEditingExercise(ex)}
                                className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-gold hover:bg-gold/10 transition-all border border-white/5"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteExercise(ex.id)}
                                className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="text-2xl font-black uppercase italic mb-4 text-krome group-hover:text-gold transition-colors leading-tight">{ex.name}</h4>
                      
                      <div className="flex flex-col gap-4 mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {ex.equipment?.map((eq: string, i: number) => (
                            <span key={i} className="text-[9px] font-black uppercase tracking-[0.2em] text-gold/60 bg-gold/5 px-3 py-1 rounded-lg border border-gold/10">{eq}</span>
                          ))}
                        </div>
                        
                        {activeDayId && (
                          <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Quick Add to Protocol:</p>
                            <div className="grid grid-cols-2 gap-3">
                              {KSP_SECTIONS.map(section => (
                                <button
                                  key={section.id}
                                  onClick={() => {
                                    if (activeWeekId && activeDayId) {
                                      addExercise(activeWeekId, activeDayId, ex.name, ex.category, section.id);
                                      haptics.success();
                                    }
                                  }}
                                  className="px-4 py-3 bg-white/5 hover:bg-gold text-white/40 hover:text-black border border-white/5 hover:border-gold rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left truncate flex items-center gap-2 group/btn"
                                >
                                  <Plus className="w-3 h-3 shrink-0 group-hover/btn:scale-110 transition-transform" />
                                  <span className="truncate">{section.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {ex.videoUrl && (
                          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <div className="rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl group-hover:border-gold/20 transition-all">
                              <iframe 
                                src={getYouTubeEmbedUrl(ex.videoUrl) || ''}
                                className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={`${ex.name} Demo`}
                              />
                            </div>
                            <a 
                              href={ex.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:text-gold transition-all flex items-center gap-2 group/link"
                            >
                              <Video className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                              Watch Full Demo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-32 text-center bg-black/20 rounded-[48px] border border-dashed border-white/10">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                      <Search className="w-10 h-10 text-white/10" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic text-white/40 mb-2">No Exercises Found</h3>
                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Try adjusting your search or category filters</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {[
                { label: 'Total Weeks', value: analyticsStats.totalWeeks, icon: Calendar, color: 'text-gold' },
                { label: 'Training Days', value: analyticsStats.totalDays, icon: Dumbbell, color: 'text-accent' },
                { label: 'Total Volume', value: `${analyticsStats.totalVolume.toLocaleString()} reps`, icon: TrendingUp, color: 'text-emerald-500' },
                { label: 'Avg Sets/Wkt', value: analyticsStats.averageSetsPerWorkout.toFixed(1), icon: Activity, color: 'text-blue-400' },
                { label: 'Completion', value: `${analyticsStats.completionRate}%`, icon: CheckCircle2, color: 'text-gold' }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 flex flex-col items-center text-center group hover:border-gold/30 transition-all krome-outline">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xl font-black italic uppercase text-white mb-1">{stat.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Volume Chart */}
              <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-10 rounded-[40px] md:rounded-[48px] shadow-2xl flex flex-col krome-outline">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Volume <span className="text-gold">Analytics</span></h3>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Projected Load per Week</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="h-[350px] w-full mt-auto">
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
                        dy={10}
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
                          <div className="flex gap-4 mb-8">
                            {payload?.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{entry.value}</span>
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

              {/* Intensity Chart */}
              <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-10 rounded-[40px] md:rounded-[48px] shadow-2xl flex flex-col krome-outline">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Intensity <span className="text-accent">Tracker</span></h3>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Total Sets per Week</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <div className="h-[350px] w-full mt-auto">
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
                        dy={10}
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

              {/* Popular Exercises */}
              <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-10 rounded-[40px] md:rounded-[48px] shadow-2xl krome-outline">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Popular <span className="text-gold">Exercises</span></h3>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Most logged movements</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  {analyticsStats.popularExercises.length > 0 ? (
                    analyticsStats.popularExercises.map((ex, idx) => (
                      <div key={ex.id} className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-gold/30 transition-all">
                        <div className="flex items-center gap-5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-black italic text-lg shrink-0 group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black uppercase italic text-white group-hover:text-gold transition-colors truncate">{ex.name}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Logged {ex.count} times</div>
                          </div>
                        </div>
                        <div className="h-1.5 w-24 sm:w-32 bg-white/5 rounded-full overflow-hidden ml-4 shrink-0">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(ex.count / analyticsStats.popularExercises[0].count) * 100}%` }}
                            className="h-full bg-gold shadow-[0_0_10px_rgba(197,156,33,0.5)]"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <BarChart2 className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-white/30 text-xs font-black uppercase tracking-widest">No performance data yet</p>
                      <p className="text-white/10 text-[9px] font-bold uppercase tracking-widest mt-2 max-w-[200px]">Data will appear once athletes start logging workouts.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Program Summary */}
              <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-10 rounded-[40px] md:rounded-[48px] shadow-2xl krome-outline">
                <h3 className="text-2xl font-black uppercase italic tracking-tight mb-10">Program <span className="text-gold">Summary</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {weeks.map(w => (
                    <div key={w.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-all group">
                      <div className="text-gold font-black italic text-lg mb-6 flex items-center justify-between">
                        <span>Week {w.weekNumber}</span>
                        <Calendar className="w-4 h-4 text-white/10 group-hover:text-gold transition-colors" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Training Days</span>
                          <span className="text-xs font-bold text-white">{w.days.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Total Movements</span>
                          <span className="text-xs font-bold text-white">{w.days.reduce((acc, d) => acc + d.exercises.length, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Projected Volume</span>
                          <span className="text-xs font-bold text-accent">{w.days.reduce((acc, d) => acc + d.exercises.reduce((eAcc, ex) => eAcc + (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0), 0), 0)} reps</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={showAddExerciseModal} onOpenChange={setShowAddExerciseModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg rounded-[40px] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Add New <span className="text-gold">Exercise</span>
            </DialogTitle>
            <DialogDescription className="text-white/30 text-[10px] font-black uppercase tracking-widest">
              Define elite library movement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Exercise Name</Label>
              <Input 
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                placeholder="e.g. Barbell Back Squat"
                className="bg-black/40 border-white/10 rounded-2xl h-14 text-white focus:border-gold/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Category</Label>
              <Select 
                value={newExercise.category} 
                onValueChange={(val) => setNewExercise({ ...newExercise, category: val })}
              >
                <SelectTrigger className="bg-black/40 border-white/10 rounded-2xl h-14 text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-sm font-bold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Video URL (YouTube Embed Link)</Label>
              <Input 
                value={newExercise.videoUrl}
                onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
                className="bg-black/40 border-white/10 rounded-2xl h-14 text-white"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-4 pt-4 sm:flex-row">
            <Button 
              onClick={handleCreateExercise}
              className="flex-1 h-14 bg-gold text-black rounded-full font-black uppercase tracking-widest hover:bg-gold/90 transition-all krome-outline"
            >
              Create Exercise
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowAddExerciseModal(false)}
              className="flex-1 h-14 bg-white/5 text-white border-transparent rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all krome-outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExercise} onOpenChange={(open) => !open && setEditingExercise(null)}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg rounded-[40px] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Edit <span className="text-gold">Exercise</span>
            </DialogTitle>
            <DialogDescription className="text-white/30 text-[10px] font-black uppercase tracking-widest">
              Update elite library movement
            </DialogDescription>
          </DialogHeader>
          
          {editingExercise && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Exercise Name</Label>
                <Input 
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-2xl h-14 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Category</Label>
                <Select 
                  value={editingExercise.category} 
                  onValueChange={(val) => setEditingExercise({ ...editingExercise, category: val })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 rounded-2xl h-14 text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-white/10">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-sm font-bold">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block ml-1">Video URL</Label>
                <Input 
                  value={editingExercise.videoUrl || ''}
                  onChange={(e) => setEditingExercise({ ...editingExercise, videoUrl: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-2xl h-14 text-white"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-4 pt-4 sm:flex-row">
            <Button 
              onClick={handleUpdateExercise}
              className="flex-1 h-14 bg-gold text-black rounded-full font-black uppercase tracking-widest hover:bg-gold/90 transition-all krome-outline"
            >
              Save Changes
            </Button>
            <Button 
              variant="outline"
              onClick={() => setEditingExercise(null)}
              className="flex-1 h-14 bg-white/5 text-white border-transparent rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all krome-outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-zinc-900 border-red-500/20 text-white max-w-md rounded-[40px] p-10 text-center">
          <DialogHeader className="items-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mb-8 shadow-xl">
              <Trash2 className="w-10 h-10" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic">Delete Item?</DialogTitle>
            <DialogDescription className="text-white/40 leading-relaxed text-sm">
              Are you sure you want to delete this {deleteTarget?.type}? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col gap-3 sm:flex-col pt-4">
            <Button 
              onClick={handleDelete}
              className="w-full h-14 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 krome-outline"
            >
              Confirm Delete
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full h-14 bg-white/5 text-white border-transparent rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all krome-outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
