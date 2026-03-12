import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, Circle, PlayCircle, Edit2, Save, X, Calendar } from "lucide-react";
import { logActivity } from "../utils/activity";
import { getCurrentDate } from "../utils/date";
import { aerobicCapacityWeek1, aerobicCapacityWeek2, DailyWorkout, WorkoutSection, Exercise } from "../data/aerobicCapacityData";

interface Props {
  key?: string;
  onBack: () => void;
  userId: string;
}

export default function AerobicCapacityFoundation({ onBack, userId }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [editedExercises, setEditedExercises] = useState<Record<string, Partial<Exercise>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Exercise>>({});
  const [started, setStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null);
  const [workoutEndTime, setWorkoutEndTime] = useState<string | null>(null);
  const startedLogged = useRef(false);

  // Load saved progress from localStorage and DB on mount
  useEffect(() => {
    const loadProgress = async () => {
      // Local storage fallback
      const savedCompleted = localStorage.getItem(`krome_aerobic_completed_${userId}`);
      const savedEdited = localStorage.getItem(`krome_aerobic_edited_${userId}`);
      if (savedCompleted) setCompletedExercises(JSON.parse(savedCompleted));
      if (savedEdited) setEditedExercises(JSON.parse(savedEdited));

      // DB load
      if (userId !== 'guest') {
        try {
          const response = await fetch(`/api/workout-logs/${userId}`);
          if (response.ok) {
            const logs = await response.json();
            const completed: Record<string, boolean> = {};
            const edited: Record<string, any> = {};
            
            logs.forEach((log: any) => {
              if (log.workout_id.startsWith('aerobic')) {
                completed[log.exercise_id] = log.completed === 1;
                if (log.edited_data) {
                  edited[log.exercise_id] = JSON.parse(log.edited_data);
                }
              }
            });

            if (Object.keys(completed).length > 0) setCompletedExercises(completed);
            if (Object.keys(edited).length > 0) setEditedExercises(edited);
          }
        } catch (err) {
          console.error("Failed to load progress from DB", err);
        }
      }
    };

    loadProgress();
  }, [userId]);

  // Save progress to localStorage and DB whenever it changes
  useEffect(() => {
    localStorage.setItem(`krome_aerobic_completed_${userId}`, JSON.stringify(completedExercises));
    localStorage.setItem(`krome_aerobic_edited_${userId}`, JSON.stringify(editedExercises));

    if (userId !== 'guest') {
      const syncProgress = async () => {
        const workoutId = `aerobic-w${selectedWeek}-d${selectedDay}`;
        const logs = Object.entries(completedExercises)
          .filter(([exId]) => exId.startsWith(`d${selectedDay}`)) // Simple heuristic for current day
          .map(([exId, completed]) => ({
            workoutId,
            exerciseId: exId,
            completed: completed,
            date: getCurrentDate(),
            editedData: editedExercises[exId] || {},
            workoutStartTime,
            workoutEndTime
          }));

        if (logs.length === 0) return;

        try {
          await fetch(`/api/workout-logs/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs })
          });

          // Update program progress
          const progress = [{
            programId: 'aerobic',
            phase: 'Phase 1',
            week: selectedWeek,
            day: selectedDay,
            completed: getProgress() === 100,
            date: getCurrentDate()
          }];

          await fetch(`/api/program-progress/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress })
          });
        } catch (err) {
          console.error("Sync failed", err);
        }
      };

      const timer = setTimeout(syncProgress, 2000);
      return () => clearTimeout(timer);
    }
  }, [completedExercises, editedExercises, userId, selectedWeek, selectedDay, workoutStartTime, workoutEndTime]);

  const currentWeekData = selectedWeek === 1 ? aerobicCapacityWeek1 : aerobicCapacityWeek2;
  const currentWorkout = currentWeekData.find(w => w.day === selectedDay) || currentWeekData[0];

  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const startEditing = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setEditForm({
      sets: editedExercises[exercise.id]?.sets ?? exercise.sets,
      reps: editedExercises[exercise.id]?.reps ?? exercise.reps,
      distance: editedExercises[exercise.id]?.distance ?? exercise.distance,
      seconds: editedExercises[exercise.id]?.seconds ?? exercise.seconds,
      notes: editedExercises[exercise.id]?.notes ?? exercise.notes,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      setEditedExercises(prev => ({
        ...prev,
        [editingId]: { ...editForm }
      }));
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getProgress = () => {
    const totalExercises = currentWorkout.sections.reduce((acc, section) => acc + section.exercises.length, 0);
    const completedCount = currentWorkout.sections.reduce((acc, section) => {
      return acc + section.exercises.filter(ex => completedExercises[ex.id]).length;
    }, 0);
    return totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);
  };

  const handleStartWorkout = () => {
    setStarted(true);
    setWorkoutStartTime(new Date().toISOString());
    if (userId !== 'guest') {
      logActivity(userId, 'workout_started', {
        workoutId: currentWorkout.title,
        week: selectedWeek,
        day: selectedDay
      });
    }
  };

  useEffect(() => {
    setStarted(false);
    setWorkoutStartTime(null);
    setWorkoutEndTime(null);
    startedLogged.current = false;
  }, [currentWorkout.title, selectedWeek, selectedDay]);

  const handleCompleteWorkout = async () => {
    if (userId === 'guest') return;
    
    setWorkoutEndTime(new Date().toISOString());

    // Mark all exercises in current workout as completed
    const newCompleted = { ...completedExercises };
    currentWorkout.sections.forEach(section => {
      section.exercises.forEach(ex => {
        newCompleted[ex.id] = true;
      });
    });
    setCompletedExercises(newCompleted);

    // Log activity
    await logActivity(userId, 'workout_completed', {
      workoutId: currentWorkout.title,
      week: selectedWeek,
      day: selectedDay
    });
  };

  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black text-white pt-24 pb-12 px-6"
      >
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#b2d8d8] font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all mb-12"
        >
            <ChevronLeft className="w-4 h-4" /> Back to Programs
        </button>
        <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
                <h1 className="text-4xl font-black uppercase italic mb-8">Ready to Train?</h1>
                <button 
                  onClick={handleStartWorkout}
                  className="px-12 py-6 bg-gold text-black font-black uppercase text-xl tracking-widest rounded-full hover:bg-gold/90 transition-all shadow-2xl shadow-gold/20"
                  aria-label="Start your aerobic capacity workout"
                >
                  Start Workout
                </button>
            </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white overflow-x-hidden pt-24 pb-12"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-[#b2d8d8]/10" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#b2d8d8] font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Programs
          </button>
          
          {getProgress() === 100 && (
            <div className="text-gold font-bold uppercase text-xs tracking-widest">Workout Completed!</div>
          )}
          {getProgress() < 100 && (
            <button 
              onClick={handleCompleteWorkout}
              className="px-6 py-2 bg-gold text-black font-bold uppercase text-xs tracking-widest rounded-full hover:bg-gold/90 transition-all"
              aria-label="Mark workout as complete"
            >
              Complete Workout
            </button>
          )}
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
            Aerobic Capacity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Foundation</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Week {selectedWeek}: Build your base. Track your progress, customize your sets and reps, and push your limits.
          </p>
        </div>

        {/* Week Selector */}
        <div className="flex gap-4 mb-8">
          {[1, 2].map((week) => (
            <button
              key={week}
              onClick={() => { setSelectedWeek(week); setSelectedDay(1); }}
              className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all border border-white/10 ${
                selectedWeek === week 
                  ? 'bg-[#b2d8d8] text-black shadow-lg shadow-[#b2d8d8]/20' 
                  : 'bg-black/50 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-pressed={selectedWeek === week}
              aria-label={`Select Week ${week}`}
            >
              Week {week}
            </button>
          ))}
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-4 hide-scrollbar">
          {currentWeekData.map((workout) => (
            <button
              key={workout.day}
              onClick={() => setSelectedDay(workout.day)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all ${
                selectedDay === workout.day 
                  ? 'bg-gradient-to-r from-gold to-accent text-black shadow-lg shadow-accent/20' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-pressed={selectedDay === workout.day}
              aria-label={`Select Day ${workout.day}`}
            >
              Day {workout.day}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold uppercase italic">{currentWorkout.title}</h3>
              <p className="text-white/50 text-sm">Track your completion</p>
            </div>
            <div className="text-3xl font-black text-[#b2d8d8]">{getProgress()}%</div>
          </div>
          <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-white/10">
            <motion.div 
              className="bg-gradient-to-r from-gold to-accent h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.5 }}
              role="progressbar"
              aria-valuenow={getProgress()}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Workout completion progress"
            />
          </div>
        </div>

        {/* Workout Sections */}
        <div className="space-y-8">
          {currentWorkout.sections.map((section) => (
            <div key={section.id} className="bg-black/50 backdrop-blur-md rounded-3xl border border-[#b2d8d8]/10 overflow-hidden">
              <div className="bg-[#b2d8d8]/5 px-6 py-4 border-b border-[#b2d8d8]/10 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#b2d8d8]" />
                <h3 className="text-lg font-bold uppercase tracking-wider">{section.title}</h3>
              </div>
              
              <div className="divide-y divide-white/5">
                {section.exercises.map((exercise) => {
                  const isCompleted = completedExercises[exercise.id];
                  const isEditing = editingId === exercise.id;
                  const displayData = { ...exercise, ...editedExercises[exercise.id] };

                  return (
                    <div key={exercise.id} className={`p-6 transition-colors ${isCompleted ? 'bg-accent/5' : 'hover:bg-white/5'}`}>
                      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        
                        {/* Exercise Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <button 
                            onClick={() => toggleExercise(exercise.id)}
                            className="mt-1 flex-shrink-0 text-[#b2d8d8] hover:scale-110 transition-transform"
                            aria-label={isCompleted ? `Mark ${displayData.name} as incomplete` : `Mark ${displayData.name} as complete`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> : <Circle className="w-6 h-6 opacity-50" aria-hidden="true" />}
                          </button>
                          
                          <div className="flex-1">
                            {displayData.category && (
                              <div className="text-xs font-bold text-gold uppercase tracking-widest mb-1">
                                {displayData.category}
                              </div>
                            )}
                            <h4 className={`text-lg font-bold ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
                              {displayData.name}
                            </h4>
                            {displayData.equipment && (
                              <div className="text-sm text-white/40 mt-1">
                                Equip: {displayData.equipment}
                              </div>
                            )}
                            {displayData.notes && (
                              <div className="text-sm text-[#b2d8d8]/70 mt-2 italic">
                                Note: {displayData.notes}
                              </div>
                            )}
                            {displayData.link && (
                              <a 
                                href={displayData.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-accent hover:text-gold mt-2 transition-colors uppercase tracking-wider font-bold"
                              >
                                <PlayCircle className="w-3 h-3" /> Watch Video
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Metrics & Editing */}
                        <div className="flex flex-col md:items-end gap-3 md:w-1/3 md:pl-4 md:border-l border-white/10">
                          {isEditing ? (
                            <div className="w-full space-y-2 bg-black/50 p-3 rounded-xl border border-white/10">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Sets</label>
                                  <input 
                                    type="text" 
                                    value={editForm.sets || ''} 
                                    onChange={(e) => setEditForm({...editForm, sets: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-accent outline-none"
                                  />
                                </div>
                                {exercise.reps !== undefined && (
                                  <div>
                                    <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Reps</label>
                                    <input 
                                      type="text" 
                                      value={editForm.reps || ''} 
                                      onChange={(e) => setEditForm({...editForm, reps: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-accent outline-none"
                                    />
                                  </div>
                                )}
                                {exercise.distance !== undefined && (
                                  <div className="col-span-2">
                                    <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Distance</label>
                                    <input 
                                      type="text" 
                                      value={editForm.distance || ''} 
                                      onChange={(e) => setEditForm({...editForm, distance: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-accent outline-none"
                                    />
                                  </div>
                                )}
                                {exercise.seconds !== undefined && (
                                  <div className="col-span-2">
                                    <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Time/Seconds</label>
                                    <input 
                                      type="text" 
                                      value={editForm.seconds || ''} 
                                      onChange={(e) => setEditForm({...editForm, seconds: e.target.value})}
                                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-accent outline-none"
                                    />
                                  </div>
                                )}
                                <div className="col-span-2">
                                  <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Notes</label>
                                  <input 
                                    type="text" 
                                    value={editForm.notes || ''} 
                                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-accent outline-none"
                                    placeholder="Add personal notes..."
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={cancelEdit} className="p-1.5 bg-white/5 text-white/60 hover:text-white rounded-lg transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                                <button onClick={saveEdit} className="p-1.5 bg-accent/20 text-accent hover:bg-accent hover:text-black rounded-lg transition-colors">
                                  <Save className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between md:justify-end w-full gap-4">
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-mono text-white/70">
                                {displayData.sets && <span><span className="text-white/40 uppercase text-[10px] tracking-wider font-sans">Sets:</span> {displayData.sets}</span>}
                                {displayData.reps && <span><span className="text-white/40 uppercase text-[10px] tracking-wider font-sans">Reps:</span> {displayData.reps}</span>}
                                {displayData.distance && <span><span className="text-white/40 uppercase text-[10px] tracking-wider font-sans">Dist:</span> {displayData.distance}</span>}
                                {displayData.seconds && <span><span className="text-white/40 uppercase text-[10px] tracking-wider font-sans">Time:</span> {displayData.seconds}</span>}
                              </div>
                              <button 
                                onClick={() => startEditing(exercise)}
                                className="text-white/30 hover:text-accent transition-colors p-2"
                                title="Edit metrics"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Video Section (Day 5 or general) */}
        {selectedDay === 5 && (
          <div className="mt-12 bg-black/50 backdrop-blur-md rounded-3xl border border-[#b2d8d8]/10 p-8 text-center">
            <h3 className="text-2xl font-black uppercase italic mb-6 text-[#b2d8d8]">Weekly Review & Form Check</h3>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 max-w-3xl mx-auto shadow-2xl shadow-accent/10">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/fU599S2F3k4"
                title="KROME Fitness"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
