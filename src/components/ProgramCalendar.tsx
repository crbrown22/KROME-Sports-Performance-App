import React, { useState, useEffect } from 'react';
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
  PlayCircle
} from 'lucide-react';
import { getCurrentDate } from '../utils/date';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import VideoModal from './VideoModal';

interface ProgramCalendarProps {
  userId: string;
  programId: string;
  programData: any;
}

export default function ProgramCalendar({ userId, programId, programData }: ProgramCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/program-progress/${userId}`);
        if (res.ok) {
          const data = await res.json();
          const completed = new Set<string>(
            data.filter((p: any) => p.completed === 1).map((p: any) => p.date)
          );
          setCompletedDays(completed);
        }
      } catch (err) {
        console.error("Failed to fetch program progress", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId, programId]);

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
    if (!programData || !programData.weeks) return null;
    
    // Simple mock logic: assign workouts sequentially to days from start date
    // For now, just return a random day from the program to show interactivity
    const allDays = programData.weeks.flatMap((w: any) => w.days);
    if (allDays.length === 0) return null;
    
    // Use date string hash to pick a consistent day
    const hash = dateStr.split('-').reduce((acc, part) => acc + parseInt(part), 0);
    return allDays[hash % allDays.length];
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-black shadow-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Training <span className="text-gold">Schedule</span></h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{monthName} {year}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/5">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-white/20 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
          
          const dateStr = formatDateString(day);
          const isCompleted = completedDays.has(dateStr);
          const isToday = getCurrentDate() === dateStr;
          const workout = getWorkoutForDate(dateStr);
          const hasWorkout = !!workout;

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasWorkout && setSelectedDate(dateStr)}
              className={`aspect-square rounded-2xl border p-2 flex flex-col justify-between transition-all relative group ${hasWorkout ? 'cursor-pointer' : 'cursor-default opacity-50'} ${
                isCompleted 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : isToday
                    ? 'bg-gold/10 border-gold/40 shadow-[0_0_15px_rgba(197,156,33,0.15)]'
                    : 'bg-black/40 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-black/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-gold whitespace-nowrap shadow-xl">
                  {isCompleted ? 'Completed' : isToday ? 'Today' : hasWorkout ? 'View Workout' : 'Rest Day'}
                </div>
              </div>
              <span className={`text-xs font-black italic ${isToday ? 'text-gold' : 'text-white/40'}`}>
                {day}
              </span>
              
              <div className="flex justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : hasWorkout ? (
                  <Dumbbell className={`w-4 h-4 ${isToday ? 'text-gold' : 'text-white/10 group-hover:text-white/30'}`} />
                ) : null}
              </div>

              {isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(197,156,33,0.8)]" />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Scheduled</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-zinc-900/95 backdrop-blur-xl z-20 p-8 flex flex-col rounded-[40px]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-2xl font-black uppercase italic text-white">Workout <span className="text-gold">Details</span></h4>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mt-1">{selectedDate}</p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {getWorkoutForDate(selectedDate)?.exercises?.map((ex: any, i: number) => {
                const exerciseDetails = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
                const videoUrl = ex.videoLinkOverride || exerciseDetails?.videoUrl;
                const name = ex.nameOverride || exerciseDetails?.name || 'Exercise';

                return (
                  <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black uppercase italic text-white">{name}</h5>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                          {ex.sets} Sets × {ex.reps} Reps
                        </div>
                        {videoUrl && (
                          <button 
                            onClick={() => setVideoModal({ isOpen: true, url: videoUrl, title: name })}
                            className="text-[10px] text-gold hover:underline mt-1 flex items-center gap-1 !outline-none"
                          >
                            <PlayCircle className="w-3 h-3" /> Watch Demo
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Rest</div>
                      <div className="text-xs font-bold text-white">{ex.rest || '60s'}</div>
                    </div>
                  </div>
                );
              })}
              
              {(!getWorkoutForDate(selectedDate)?.exercises || getWorkoutForDate(selectedDate)?.exercises.length === 0) && (
                <div className="text-center py-12 text-white/40 text-sm font-bold uppercase tracking-widest">
                  No exercises scheduled for this day
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
              <button 
                onClick={() => {
                  const newCompleted = new Set(completedDays);
                  if (newCompleted.has(selectedDate)) {
                    newCompleted.delete(selectedDate);
                  } else {
                    newCompleted.add(selectedDate);
                  }
                  setCompletedDays(newCompleted);
                  // In a real app, you'd save this to the backend here
                  setSelectedDate(null);
                }}
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 krome-outline ${
                  completedDays.has(selectedDate) 
                    ? 'bg-white/5 text-white hover:bg-white/10' 
                    : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {completedDays.has(selectedDate) ? 'Mark as Incomplete' : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Complete Workout
                  </>
                )}
              </button>
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
    </div>
  );
}
