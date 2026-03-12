import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Dumbbell, 
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { getCurrentDate } from '../utils/date';

interface ProgramCalendarProps {
  userId: string;
  programId: string;
  programData: any;
}

export default function ProgramCalendar({ userId, programId, programData }: ProgramCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8">
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

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-2xl border p-2 flex flex-col justify-between transition-all relative group cursor-pointer ${
                isCompleted 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : isToday
                    ? 'bg-gold/10 border-gold/40'
                    : 'bg-black/40 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-gold whitespace-nowrap">
                  {isCompleted ? 'Completed' : isToday ? 'Today' : 'Workout'}
                </div>
              </div>
              <span className={`text-xs font-black italic ${isToday ? 'text-gold' : 'text-white/40'}`}>
                {day}
              </span>
              
              <div className="flex justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Dumbbell className={`w-4 h-4 ${isToday ? 'text-gold' : 'text-white/10 group-hover:text-white/30'}`} />
                )}
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
    </div>
  );
}
