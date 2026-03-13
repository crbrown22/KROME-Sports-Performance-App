import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, LogOut, Apple, Calendar, ChevronRight, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { getCurrentDate } from '../utils/date';
import { LoggedFood } from '../data/nutritionData';
import { calculateNutritionRecommendations } from '../utils/nutrition';
import { BodyMetricsData, INITIAL_DATA } from '../types';
import SupplementsAndVitamins from './SupplementsAndVitamins';
import { getSupplementRecommendation, generateDefaultSupplements } from '../utils/supplements';

interface NutritionDashboardProps {
  user: any;
  onBack: () => void;
  onLogout: () => void;
}

export default function NutritionDashboard({ user, onBack, onLogout }: NutritionDashboardProps) {
  const [nutritionLogs, setNutritionLogs] = useState<LoggedFood[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getCurrentDate());
  const [bodyMetricsData, setBodyMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!user || !user.id || user.id === 'guest') return;
      try {
        const response = await fetch(`/api/user_metrics/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setBodyMetricsData(data);
        }
      } catch (err) {
        console.error("Failed to load metrics", err);
      }
    };
    loadMetrics();
  }, [user?.id]);

  useEffect(() => {
    const fetchNutritionLogs = async () => {
      if (!user || !user.id || user.id === 'guest') return;
      try {
        const response = await fetch(`/api/nutrition_logs?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setNutritionLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch nutrition logs", err);
      }
    };
    fetchNutritionLogs();
  }, [user?.id]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const displayDate = () => {
    const today = getCurrentDate();
    if (selectedDate === today) return 'Today';
    
    const date = new Date(selectedDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - date.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const selectedDateLogs = nutritionLogs.filter(log => log.date === selectedDate);
  const nutritionTotals = selectedDateLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.serving.calories * log.servings),
    protein: acc.protein + (log.serving.protein * log.servings),
    carbs: acc.carbs + (log.serving.carbs * log.servings),
    fat: acc.fat + (log.serving.fat * log.servings)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const recommendations = calculateNutritionRecommendations(bodyMetricsData);
  const targets = {
    calories: recommendations.totalCalories,
    protein: recommendations.proteinGrams,
    carbs: recommendations.carbsGrams,
    fat: recommendations.fatGrams
  };

  const getProgressState = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return 'over';
    if (percentage > 90) return 'good';
    if (percentage > 75) return 'warning';
    return 'under';
  };

  const getCardColor = (current: number, target: number) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "border-red-500 bg-red-500/10 text-red-500";
    if (state === 'good') return "border-green-500 bg-green-500/10 text-green-500";
    if (state === 'warning') return "border-yellow-500 bg-yellow-500/10 text-yellow-500";
    return "border-white/5 bg-black/40 text-white";
  };

  const getBarColor = (current: number, target: number, defaultColor: string) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "bg-red-500";
    if (state === 'good') return "bg-green-500";
    if (state === 'warning') return "bg-yellow-500";
    return defaultColor;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 pb-24 bg-black px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h3 className="font-bold uppercase italic flex items-center gap-2">
                <Apple className="w-4 h-4 text-gold" />
                Nutrition Logs
              </h3>
              
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-1">
                <button 
                  onClick={() => changeDate(-1)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">
                    {displayDate()}
                  </span>
                </div>
                <button 
                  onClick={() => changeDate(1)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Calories */}
              <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.calories, targets.calories)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Flame className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Calories</div>
                  <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.calories)}</div>
                  <div className="text-[10px] text-white/60 mb-3">/ {targets.calories} kcal</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((nutritionTotals.calories / targets.calories) * 100, 100)}%` }}
                      className={`h-full ${getBarColor(nutritionTotals.calories, targets.calories, 'bg-gold')}`}
                    />
                  </div>
                </div>
              </div>

              {/* Protein */}
              <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.protein, targets.protein)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Beef className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Protein</div>
                  <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.protein)}g</div>
                  <div className="text-[10px] text-white/60 mb-3">/ {targets.protein}g</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((nutritionTotals.protein / targets.protein) * 100, 100)}%` }}
                      className={`h-full ${getBarColor(nutritionTotals.protein, targets.protein, 'bg-blue-500')}`}
                    />
                  </div>
                </div>
              </div>

              {/* Carbs */}
              <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.carbs, targets.carbs)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wheat className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Carbs</div>
                  <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.carbs)}g</div>
                  <div className="text-[10px] text-white/60 mb-3">/ {targets.carbs}g</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((nutritionTotals.carbs / targets.carbs) * 100, 100)}%` }}
                      className={`h-full ${getBarColor(nutritionTotals.carbs, targets.carbs, 'bg-green-500')}`}
                    />
                  </div>
                </div>
              </div>

              {/* Fat */}
              <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.fat, targets.fat)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Droplets className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Fat</div>
                  <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.fat)}g</div>
                  <div className="text-[10px] text-white/60 mb-3">/ {targets.fat}g</div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((nutritionTotals.fat / targets.fat) * 100, 100)}%` }}
                      className={`h-full ${getBarColor(nutritionTotals.fat, targets.fat, 'bg-yellow-500')}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Meals for {displayDate()}</h4>
            <div className="space-y-2">
              {selectedDateLogs.length === 0 ? (
                <p className="text-center text-white/20 py-8 text-xs font-bold uppercase tracking-widest">No meals logged for this date</p>
              ) : (
                selectedDateLogs.map((log) => (
                  <div key={log.logId} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <div className="font-bold text-sm">{log.name}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">{log.meal} • {log.servings}x</div>
                    </div>
                    <div className="text-xs font-mono text-gold">{Math.round(log.serving.calories * log.servings)} kcal</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <SupplementsAndVitamins 
            data={bodyMetricsData} 
            setData={setBodyMetricsData} 
            isEditing={false} 
            getSupplementRecommendation={(name) => getSupplementRecommendation(name, bodyMetricsData)}
            generateDefaultSupplements={() => generateDefaultSupplements(bodyMetricsData, setBodyMetricsData)}
          />
        </div>
      </div>
    </motion.div>
  );
}
