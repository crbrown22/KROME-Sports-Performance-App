import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, LogOut, Apple, Calendar, ChevronRight, Flame, Beef, Wheat, Droplets, PieChart, Utensils, LayoutDashboard } from 'lucide-react';
import { getCurrentDate, addDays } from '../utils/date';
import { LoggedFood } from '../data/nutritionData';
import { calculateNutritionRecommendations } from '../utils/nutrition';
import { BodyMetricsData, INITIAL_DATA } from '../types';
import SupplementsAndVitamins from './SupplementsAndVitamins';
import PerformanceMacroNutrients from './PerformanceMacroNutrients';
import { getSupplementRecommendation, generateDefaultSupplements } from '../utils/supplements';
import { getNutritionLogs } from '../services/firebaseService';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

interface NutritionDashboardProps {
  user: any;
  onBack: () => void;
  onLogout: () => void;
  isOwnProfile?: boolean;
}

type NutritionView = 'tracker';

export default function NutritionDashboard({ user, onBack, onLogout, isOwnProfile = true, initialView = 'tracker', isStandalone = true }: NutritionDashboardProps & { initialView?: NutritionView, isStandalone?: boolean }) {
  const [activeView, setActiveView] = useState<NutritionView>(initialView);
  const [nutritionLogs, setNutritionLogs] = useState<LoggedFood[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getCurrentDate());
  const [bodyMetricsData, setBodyMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);
  
  const userId = user?.id || user?.uid;

  useEffect(() => {
    if (initialView && initialView !== 'dashboard' as any) {
      setActiveView(initialView);
    }
  }, [initialView]);
  
  useEffect(() => {
    const loadMetrics = async () => {
      if (!userId || userId === 'guest') return;
      try {
        const response = await fetch(`/api/metrics/${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setBodyMetricsData(data);
          }
        }
      } catch (err) {
        console.error("Failed to load metrics", err);
      }
    };
    loadMetrics();
  }, [userId]);

  useEffect(() => {
    const fetchNutritionLogs = async () => {
      if (!userId || userId === 'guest') return;
      try {
        const res = await fetch(`/api/nutrition/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch nutrition logs");
        const data = await res.json();
        const formattedLogs: LoggedFood[] = data.map((item: any) => ({
          id: item.food_id,
          logId: item.log_id || item.id,
          name: item.name,
          category: item.category,
          meal: item.meal,
          date: item.date,
          servings: item.servings,
          serving: {
            size: item.serving_size,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          },
          per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }));
        setNutritionLogs(formattedLogs);
      } catch (err) {
        console.error("Failed to fetch nutrition logs", err);
      }
    };
    fetchNutritionLogs();
    
    window.addEventListener('nutrition-updated', fetchNutritionLogs);
    return () => window.removeEventListener('nutrition-updated', fetchNutritionLogs);
  }, [userId]);

  const changeDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
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
      className={`${isStandalone ? 'min-h-screen pt-4 pb-24' : ''} bg-transparent px-6 relative`}
    >
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {activeView === 'tracker' && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/40 border border-krome/20 rounded-[40px] p-4 md:p-8 backdrop-blur-xl relative overflow-hidden"
              >
                <img 
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop" 
                  alt="Nutrition Background" 
                  className="absolute inset-0 w-full h-full object-cover opacity-10"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10">
                  <PerformanceMacroNutrients 
                    userId={userId?.toString() || 'guest'}
                    onBack={onBack}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

