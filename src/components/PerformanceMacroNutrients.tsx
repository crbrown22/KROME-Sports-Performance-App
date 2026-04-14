import { safeStorage } from '../utils/storage';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import { getCurrentDate } from '../utils/date';
import { ChevronLeft, Search, Plus, Trash2, PieChart, Activity, Flame, Droplets, Wheat, Beef, Calendar, ChevronRight, Sparkles, Loader2, X, ShieldCheck, Apple } from "lucide-react";
import { foodDatabase, FoodItem, LoggedFood } from "../data/nutritionData";
import { getFoodImage } from "../utils/foodImages";
import { recipes, Recipe } from "../data/recipeData";
import { calculateNutritionRecommendations } from "../utils/nutrition";
import { GoogleGenAI } from "@google/genai";

interface Props {
  key?: string;
  userId?: string;
  onBack: () => void;
  isOwnProfile?: boolean;
}

export default function PerformanceMacroNutrients({ userId = 'guest', onBack, isOwnProfile = true }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allLogs, setAllLogs] = useState<LoggedFood[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]); // State for user-saved recipes
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: ""
  });
  
  const handleAddCustomFood = async () => {
    if (!newFood.name || !newFood.calories) return;
    try {
      const res = await fetch(`/api/custom-food/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFood)
      });
      if (res.ok) {
        setShowAddFoodModal(false);
        setNewFood({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "" });
        // Refresh custom foods list
        const customFoodResponse = await fetch(`/api/custom-food/${userId}`);
        if (customFoodResponse.ok) {
          const customFoodData = await customFoodResponse.json();
          const formattedCustomFoods: FoodItem[] = customFoodData.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            category: "Custom",
            per100g: { calories: 0, carbs: 0, protein: 0, fat: 0 },
            serving: {
              size: item.portion || "1 serving",
              calories: item.calories,
              carbs: item.carbs,
              protein: item.protein,
              fat: item.fat
            }
          }));
          setCustomFoods(formattedCustomFoods);
        }
      }
    } catch (err) {
      console.error("Failed to add custom food", err);
    }
  };
  
  const [targets, setTargets] = useState({
    calories: 2500,
    protein: 180,
    carbs: 300,
    fat: 80
  });

  const [tempTargets, setTempTargets] = useState(targets);
  
  // AI Analysis State
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Timezone-safe today's date
  const getTodayStr = () => getCurrentDate();
  
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMeal, setSelectedMeal] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  
  const handleAnalyzeNutrition = async () => {
    if (dailyLog.length === 0) return;
    
    setIsAnalyzing(true);
    setShowAnalysisModal(true);
    setAnalysisResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview";
      
      const prompt = `Analyze this daily nutrition log against the user's targets.
      
      Targets:
      Calories: ${targets.calories}
      Protein: ${targets.protein}g
      Carbs: ${targets.carbs}g
      Fat: ${targets.fat}g
      
      Actual Intake:
      Calories: ${Math.round(totals.calories)}
      Protein: ${Math.round(totals.protein)}g
      Carbs: ${Math.round(totals.carbs)}g
      Fat: ${Math.round(totals.fat)}g
      
      Log Details:
      ${dailyLog.map(item => `- ${item.name} (${item.meal}): ${Math.round(item.serving.calories * item.servings)}kcal, ${Math.round(item.serving.protein * item.servings)}g P`).join('\n')}
      
      Provide a concise analysis (max 3 paragraphs) covering:
      1. Overall adherence to macros.
      2. Specific feedback on meal timing or composition if apparent.
      3. One actionable recommendation for the next meal or tomorrow.
      
      CRITICAL INSTRUCTIONS FOR TONE AND LENGTH:
      - Keep your responses concise, to the point, and highly actionable.
      - Maintain a professional but conversational and encouraging tone.
      - Avoid overly long paragraphs or unnecessary fluff.
      - Use short bullet points for readability where appropriate.
      - Deliver quality information quickly.`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt
      });
      
      setAnalysisResult(result.text);
    } catch (error) {
      console.error("Failed to analyze nutrition:", error);
      setAnalysisResult("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load log and targets
  useEffect(() => {
    const loadData = async () => {
      if (userId !== 'guest') {
        try {
          const response = await fetch(`/api/nutrition/${userId}`);
          if (response.ok) {
            const data = await response.json();
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
              per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 } // Dummy data for per100g
            }));
            setAllLogs(formattedLogs);
          }

          // Fetch custom foods
          const customFoodResponse = await fetch(`/api/custom-food/${userId}`);
          if (customFoodResponse.ok) {
            const customFoodData = await customFoodResponse.json();
            const formattedCustomFoods: FoodItem[] = customFoodData.map((item: any) => ({
              id: item.id.toString(),
              name: item.name,
              category: "Custom",
              per100g: { calories: 0, carbs: 0, protein: 0, fat: 0 },
              serving: {
                size: item.portion || "1 serving",
                calories: item.calories,
                carbs: item.carbs,
                protein: item.protein,
                fat: item.fat
              }
            }));
            setCustomFoods(formattedCustomFoods);
          }
        } catch (error) {
          console.error("Failed to load nutrition logs:", error);
        } finally {
          setIsLoaded(true);
        }
      } else {
        // Fallback to local storage for guest
        const savedLog = safeStorage.getItem(`krome_nutrition_log_${userId}`);
        if (savedLog) {
          const parsed = JSON.parse(savedLog);
          const migrated = parsed.map((item: any) => ({
            ...item,
            date: item.date || getTodayStr(),
            meal: item.meal || 'Snack'
          }));
          setAllLogs(migrated);
        }
        setIsLoaded(true);
      }
    };

    loadData();

    // Load targets from BodyMetrics if available
    const loadTargets = async () => {
      if (userId !== 'guest') {
        try {
          const res = await fetch(`/api/metrics/${userId}`);
          if (res.ok) {
            const dbData = await res.json();
            if (dbData) {
              const recommendations = dbData.recommendations || calculateNutritionRecommendations(dbData);
              setTargets({
                calories: recommendations.totalCalories,
                protein: recommendations.proteinGrams,
                carbs: recommendations.carbsGrams,
                fat: recommendations.fatGrams
              });
              safeStorage.setItem(`krome_metrics_${userId}`, JSON.stringify(dbData));
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load metrics from DB", err);
        }
      }

      const savedMetrics = safeStorage.getItem(`krome_metrics_${userId}`);
      if (savedMetrics) {
        try {
          const parsedMetrics = JSON.parse(savedMetrics);
          const recommendations = parsedMetrics.recommendations || calculateNutritionRecommendations(parsedMetrics);
          setTargets({
            calories: recommendations.totalCalories,
            protein: recommendations.proteinGrams,
            carbs: recommendations.carbsGrams,
            fat: recommendations.fatGrams
          });
        } catch (e) {
          console.error("Failed to parse body metrics", e);
        }
      }
    };
    
    loadTargets();

    // Load user recipes from local storage
    const savedRecipes = safeStorage.getItem('krome_user_recipes');
    if (savedRecipes) {
      try {
        setUserRecipes(JSON.parse(savedRecipes));
      } catch (e) {
        console.error("Failed to parse user recipes", e);
      }
    }
  }, [userId]);

  // Save log to local storage and database automatically
  useEffect(() => {
    if (!isLoaded) return;
    
    safeStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(allLogs));
    
    // Auto-save to database
    if (userId !== 'guest') {
      const saveToDb = async () => {
        try {
          await fetch(`/api/nutrition/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: allLogs })
          });
          window.dispatchEvent(new Event('nutrition-updated'));
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      };
      
      saveToDb();
    }
  }, [allLogs, userId, isLoaded]);

  const addToLog = async (food: FoodItem) => {
    const newEntry: LoggedFood = {
      ...food,
      logId: Math.random().toString(36).substr(2, 9),
      servings: 1,
      meal: selectedMeal,
      date: selectedDate
    };
    
    const updatedLogs = [newEntry, ...allLogs];
    setAllLogs(updatedLogs);

    // Save to local storage
    safeStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(updatedLogs));

    // Save to database
    if (userId !== 'guest') {
      try {
        await fetch(`/api/nutrition/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: updatedLogs })
        });
      } catch (error) {
        console.error("Failed to save new log to database:", error);
      }
    }
  };

  const removeFromLog = (logId: string) => {
    setAllLogs(prev => prev.filter(item => item.logId !== logId));
  };

  const updateServings = (logId: string, delta: number) => {
    setAllLogs(prev => prev.map(item => {
      if (item.logId === logId) {
        const newServings = Math.max(0.5, item.servings + delta);
        return { ...item, servings: newServings };
      }
      return item;
    }));
  };

  // Filter logs for selected date
  const dailyLog = allLogs.filter(item => item.date === selectedDate);

  const totals = dailyLog.reduce((acc, item) => {
    return {
      calories: acc.calories + (item.serving.calories * item.servings),
      protein: acc.protein + (item.serving.protein * item.servings),
      carbs: acc.carbs + (item.serving.carbs * item.servings),
      fat: acc.fat + (item.serving.fat * item.servings),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Fruit", "Vegetable", "Protein", "Fat", "Protein/Fat", "Recipes"];
  const meals: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snack')[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  // Map recipes to FoodItem format
  const allRecipes = [...recipes, ...userRecipes];
  const recipeItems: FoodItem[] = allRecipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    category: "Recipes",
    per100g: { calories: 0, carbs: 0, protein: 0, fat: 0 }, // Not used for recipes
    serving: {
      size: recipe.portion,
      calories: recipe.calories,
      carbs: recipe.carbs,
      protein: recipe.protein,
      fat: recipe.fat
    }
  }));

  const allFoodItems = [...foodDatabase, ...recipeItems, ...customFoods];

  const filteredFoods = allFoodItems.filter(food => {
    const nameStr = food.name || '';
    const categoryStr = food.category || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProgressState = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "over";
    if (percentage >= 90) return "good";
    if (percentage >= 50) return "warning";
    return "under";
  };

  const getCardColor = (current: number, target: number) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "border-red-500 bg-red-500/10 text-red-500";
    if (state === 'good') return "border-green-500 bg-green-500/10 text-green-500";
    if (state === 'warning') return "border-yellow-500 bg-yellow-500/10 text-yellow-500";
    return "border-white/5 bg-zinc-900/80 text-white";
  };

  const getBarColor = (current: number, target: number, defaultColor: string) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "bg-red-500";
    if (state === 'good') return "bg-green-500";
    if (state === 'warning') return "bg-yellow-500";
    return defaultColor;
  };

  const handleSaveLog = async () => {
    if (userId !== 'guest') {
      try {
        await fetch(`/api/nutrition/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: allLogs })
        });
      } catch (error) {
        console.error("Failed to save nutrition logs to database:", error);
      }
    }
    safeStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(allLogs));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleUpdateTargets = async () => {
    setTargets(tempTargets);
    if (userId !== 'guest') {
      try {
        // Fetch current metrics first to preserve other data
        const res = await fetch(`/api/metrics/${userId}`);
        let currentMetrics = {};
        if (res.ok) {
          currentMetrics = await res.json();
        }

        const updatedMetrics = {
          ...currentMetrics,
          recommendations: {
            totalCalories: tempTargets.calories,
            proteinGrams: tempTargets.protein,
            carbsGrams: tempTargets.carbs,
            fatGrams: tempTargets.fat
          }
        };

        await fetch(`/api/metrics/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMetrics)
        });
      } catch (error) {
        console.error("Failed to update nutrition targets:", error);
      }
    }
    setIsEditingTargets(false);
  };

  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day + days);
    const newDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  const displayDate = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-transparent text-white pt-4 pb-12 overflow-x-hidden"
    >
      {/* AI Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalysisModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-black/90 backdrop-blur-xl border border-gold/30 rounded-[40px] p-8 md:p-10 max-w-lg w-full relative shadow-[0_0_50px_rgba(255,215,0,0.1)] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-gold/20 rounded-full flex items-center justify-center text-white/60 hover:text-gold transition-all z-10 krome-outline"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold shadow-[0_0_30px_rgba(255,215,0,0.2)] border border-gold/20">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">AI <span className="text-gold">Nutrition</span> Analysis</h3>
                  <p className="text-[10px] text-gold/60 uppercase tracking-[0.3em] font-bold mt-2">Elite Performance Insights</p>
                </div>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 text-gold gap-6">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-black animate-pulse">Processing Biological Data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-invert prose-sm max-h-[350px] overflow-y-auto custom-scrollbar pr-4 bg-black/40 p-6 rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-white/80 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {analysisResult}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleAnalyzeNutrition}
                      className="flex-1 py-4 bg-gold hover:bg-yellow-400 text-black transition-all rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-gold/20 krome-outline"
                    >
                      <Sparkles className="w-4 h-4" /> Refresh Analysis
                    </button>
                    <button
                      onClick={() => setShowAnalysisModal(false)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white transition-all rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-white/10 krome-outline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40"
          alt="Nutrition Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-[30px] md:rounded-[40px] p-4 sm:p-8 md:p-12 min-h-screen shadow-2xl">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest mb-6 md:mb-8 hover:gap-4 transition-all krome-outline"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Nutrition
          </button>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 md:mb-12 items-start md:items-end justify-between">
            <div className="relative w-full md:w-auto">
              <div className="hidden md:block absolute -left-4 top-0 w-1 h-full bg-gold/50 blur-sm" />
              <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm mb-2">Module 01</h2>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic leading-tight tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                Performance <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-gold pr-2 pb-2">Macro-Nutrients</span>
              </h1>
            </div>
            
            <div className="flex flex-col w-full md:w-auto items-stretch md:items-end gap-4">
              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowAddFoodModal(true)}
                    className="px-6 py-3 bg-white/5 backdrop-blur-md border border-gold/30 rounded-xl text-gold text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold/10 transition-all krome-outline"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Food
                  </button>
                  <button 
                    onClick={() => {
                      if (!isEditingTargets) setTempTargets(targets);
                      setIsEditingTargets(!isEditingTargets);
                    }}
                    className="px-6 py-3 bg-gold text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all krome-outline"
                  >
                    <Activity className="w-4 h-4" /> {isEditingTargets ? 'Cancel' : 'Adjust Macros'}
                  </button>
                </div>
              )}

              {/* Date Selector */}
              <div className="flex items-center justify-between sm:justify-end gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2">
              {/* Add Custom Food Modal */}
              {createPortal(
                <AnimatePresence>
                  {showAddFoodModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-zinc-900/90 backdrop-blur-xl border border-gold/30 rounded-[30px] md:rounded-[40px] p-6 sm:p-10 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.1)]"
                      >
                        <button 
                          onClick={() => setShowAddFoodModal(false)}
                          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 bg-white/5 hover:bg-gold/20 rounded-full flex items-center justify-center text-white/40 hover:text-gold transition-all krome-outline"
                        >
                          <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase italic mb-6 sm:mb-8 text-white tracking-tighter">Add <span className="text-gold">Custom</span> Food</h2>
                        <div className="space-y-4 sm:space-y-6">
                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2 block">Food Name</label>
                            <input type="text" placeholder="e.g. Elite Whey Protein" value={newFood.name} onChange={(e) => setNewFood({...newFood, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 sm:p-4 text-white focus:border-gold/50 outline-none transition-all shadow-inner" />
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 sm:gap-4">
                            <div>
                              <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block text-center">Calories</label>
                              <input type="number" value={newFood.calories} onChange={(e) => setNewFood({...newFood, calories: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-white focus:border-gold/50 outline-none text-center font-mono text-xs sm:text-sm" />
                            </div>
                            <div>
                              <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-400/70 mb-2 block text-center">Protein</label>
                              <input type="number" value={newFood.protein} onChange={(e) => setNewFood({...newFood, protein: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-white focus:border-gold/50 outline-none text-center font-mono text-xs sm:text-sm" />
                            </div>
                            <div>
                              <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-green-400/70 mb-2 block text-center">Carbs</label>
                              <input type="number" value={newFood.carbs} onChange={(e) => setNewFood({...newFood, carbs: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-white focus:border-gold/50 outline-none text-center font-mono text-xs sm:text-sm" />
                            </div>
                            <div>
                              <label className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-yellow-400/70 mb-2 block text-center">Fat</label>
                              <input type="number" value={newFood.fat} onChange={(e) => setNewFood({...newFood, fat: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-2.5 sm:p-3 text-white focus:border-gold/50 outline-none text-center font-mono text-xs sm:text-sm" />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2 block">Portion Size</label>
                            <input type="text" placeholder="e.g. 1 Scoop (30g)" value={newFood.portion} onChange={(e) => setNewFood({...newFood, portion: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 sm:p-4 text-white focus:border-gold/50 outline-none transition-all shadow-inner" />
                          </div>
                          
                          <button onClick={handleAddCustomFood} className="w-full py-3.5 sm:py-4 bg-gold text-black rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-gold/20 mt-2 sm:mt-4 krome-outline">Save Performance Food</button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>,
                document.body
              )}
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="font-bold uppercase tracking-widest text-sm">
                  {displayDate()}
                </span>
              </div>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editing Targets UI */}
        {isEditingTargets && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 p-6 md:p-8 bg-white/5 backdrop-blur-xl border border-gold/30 rounded-[32px] shadow-2xl"
          >
            <h3 className="text-lg md:text-xl font-black uppercase italic mb-6 md:mb-8 flex items-center gap-3 text-white">
              <Activity className="w-6 h-6 text-gold" /> Adjust Daily Performance Targets
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div>
                <label className="block text-[9px] md:text-[10px] text-gold uppercase tracking-[0.2em] mb-2 font-bold">Calories (kcal)</label>
                <input 
                  type="number" 
                  value={tempTargets.calories}
                  onChange={(e) => setTempTargets({...tempTargets, calories: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-white focus:border-gold outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[9px] md:text-[10px] text-blue-400 uppercase tracking-[0.2em] mb-2 font-bold">Protein (g)</label>
                <input 
                  type="number" 
                  value={tempTargets.protein}
                  onChange={(e) => setTempTargets({...tempTargets, protein: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-white focus:border-gold outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[9px] md:text-[10px] text-green-400 uppercase tracking-[0.2em] mb-2 font-bold">Carbs (g)</label>
                <input 
                  type="number" 
                  value={tempTargets.carbs}
                  onChange={(e) => setTempTargets({...tempTargets, carbs: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-white focus:border-gold outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[9px] md:text-[10px] text-yellow-500 uppercase tracking-[0.2em] mb-2 font-bold">Fats (g)</label>
                <input 
                  type="number" 
                  value={tempTargets.fat}
                  onChange={(e) => setTempTargets({...tempTargets, fat: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-white focus:border-gold outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 md:gap-4">
              <button 
                onClick={() => setIsEditingTargets(false)}
                className="px-6 md:px-8 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors krome-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTargets}
                className="px-8 md:px-10 py-2.5 md:py-3 bg-gold text-black rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-gold/20 krome-outline"
              >
                <ShieldCheck className="w-4 h-4" /> Save Targets
              </button>
            </div>
          </motion.div>
        )}

        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Calories */}
          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 relative overflow-hidden transition-all krome-outline ${getCardColor(totals.calories, targets.calories)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-2">Calories</div>
              <div className="text-2xl md:text-3xl font-black italic mb-1 text-white">{Math.round(totals.calories)}</div>
              <div className="text-[10px] text-white/50 mb-4 uppercase tracking-widest">/ {targets.calories} kcal</div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.calories, targets.calories, 'bg-gold')}`}
                />
              </div>
            </div>
          </div>

          {/* Protein */}
          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 relative overflow-hidden transition-all krome-outline ${getCardColor(totals.protein, targets.protein)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Protein</div>
              <div className="text-2xl md:text-3xl font-black italic mb-1 text-white">{Math.round(totals.protein)}g</div>
              <div className="text-[10px] text-white/50 mb-4 uppercase tracking-widest">/ {targets.protein}g</div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.protein / targets.protein) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.protein, targets.protein, 'bg-blue-500')}`}
                />
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 relative overflow-hidden transition-all krome-outline ${getCardColor(totals.carbs, targets.carbs)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Carbs</div>
              <div className="text-2xl md:text-3xl font-black italic mb-1 text-white">{Math.round(totals.carbs)}g</div>
              <div className="text-[10px] text-white/50 mb-4 uppercase tracking-widest">/ {targets.carbs}g</div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.carbs / targets.carbs) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.carbs, targets.carbs, 'bg-green-500')}`}
                />
              </div>
            </div>
          </div>

          {/* Fat */}
          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 relative overflow-hidden transition-all krome-outline ${getCardColor(totals.fat, targets.fat)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">Fats</div>
              <div className="text-2xl md:text-3xl font-black italic mb-1 text-white">{Math.round(totals.fat)}g</div>
              <div className="text-[10px] text-white/50 mb-4 uppercase tracking-widest">/ {targets.fat}g</div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.fat / targets.fat) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.fat, targets.fat, 'bg-yellow-500')}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search & Add */}
          {isOwnProfile ? (
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 h-full krome-outline shadow-xl">
                <div className="flex flex-col gap-4 md:gap-6 mb-8">
                  {/* Meal Selector */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {meals.map(meal => (
                      <button
                        key={meal}
                        onClick={() => setSelectedMeal(meal)}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex-1 min-w-[80px] krome-outline ${
                          selectedMeal === meal 
                            ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                    <input 
                      type="text" 
                      placeholder={`Search high-performance foods...`} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 sm:py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 sm:gap-3 mb-6 md:mb-8 overflow-x-auto pb-2 hide-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all krome-outline ${
                        selectedCategory === cat 
                          ? 'bg-gold text-black' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredFoods.map((food) => (
                    <motion.div 
                      key={food.id}
                      layoutId={food.id}
                      className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden flex items-center gap-3 sm:gap-4 hover:border-gold/30 transition-all group p-1"
                    >
                      <img src={getFoodImage(food.category, food.name)} alt={food.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                      <div className="flex-1 py-1 sm:py-2">
                        <div className="font-bold text-sm sm:text-base text-white group-hover:text-gold transition-colors line-clamp-1">{food.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest font-bold mt-0.5 sm:mt-1">{food.serving.size} • {food.serving.calories} kcal</div>
                        <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                          <span className="text-[9px] sm:text-[10px] text-blue-400/80 font-bold uppercase tracking-tighter">{food.serving.protein}g P</span>
                          <span className="text-[9px] sm:text-[10px] text-green-400/80 font-bold uppercase tracking-tighter">{food.serving.carbs}g C</span>
                          <span className="text-[9px] sm:text-[10px] text-yellow-400/80 font-bold uppercase tracking-tighter">{food.serving.fat}g F</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => addToLog(food)}
                        className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 rounded-full bg-gold text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gold/20 flex-shrink-0"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </motion.div>
                  ))}
                  {filteredFoods.length === 0 && (
                    <div className="text-center py-16 md:py-20 text-white/30 italic text-[10px] sm:text-sm uppercase tracking-widest font-bold">
                      No performance foods found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 h-full flex flex-col items-center justify-center text-center shadow-xl">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                  <Apple className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-4 text-white">Nutrition Profile</h3>
                <p className="text-white/40 text-[10px] md:text-sm max-w-sm uppercase tracking-widest font-bold leading-relaxed">
                  Viewing athlete's daily nutrition log and performance metrics.
                </p>
              </div>
            </div>
          )}

          {/* Daily Log */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 h-full flex flex-col shadow-xl">
              <h3 className="text-sm sm:text-base font-black uppercase italic mb-6 flex items-center gap-3 text-gold">
                <Activity className="w-5 h-5" /> Daily Performance Log
              </h3>

              <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[500px] md:max-h-[600px]">
                {dailyLog.length === 0 ? (
                  <div className="text-center py-16 md:py-20 text-white/30 italic text-[10px] sm:text-sm uppercase tracking-widest font-bold">
                    Log is currently empty.
                  </div>
                ) : (
                  meals.map(meal => {
                    const mealLogs = dailyLog.filter(item => item.meal === meal);
                    if (mealLogs.length === 0) return null;
                    
                    return (
                      <div key={meal} className="space-y-3">
                        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 border-b border-gold/10 pb-2 mb-2">{meal}</h4>
                        <AnimatePresence mode="popLayout">
                          {mealLogs.map((item) => (
                            <motion.div 
                              key={item.logId}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4 relative group hover:border-gold/20 transition-all"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-xs sm:text-sm text-white line-clamp-1 pr-6">{item.name}</div>
                                {isOwnProfile && (
                                  <button 
                                    onClick={() => removeFromLog(item.logId)}
                                    className="text-white/20 hover:text-red-500 transition-colors p-1 absolute top-2 right-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-tighter">
                                <span className="text-white/70">{Math.round(item.serving.calories * item.servings)} kcal</span>
                                <span className="text-blue-400/80">{Math.round(item.serving.protein * item.servings)}g P</span>
                                <span className="text-green-400/80">{Math.round(item.serving.carbs * item.servings)}g C</span>
                                <span className="text-yellow-400/80">{Math.round(item.serving.fat * item.servings)}g F</span>
                              </div>
                              <div className="flex items-center justify-between mt-3 sm:mt-4">
                                {isOwnProfile ? (
                                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 border border-white/10">
                                    <button onClick={() => updateServings(item.logId, -0.5)} className="text-white/40 hover:text-gold transition-colors font-bold px-1 text-xs">-</button>
                                    <span className="text-gold font-mono text-[10px] sm:text-xs w-6 sm:w-8 text-center font-bold">{item.servings}</span>
                                    <button onClick={() => updateServings(item.logId, 0.5)} className="text-white/40 hover:text-gold transition-colors font-bold px-1 text-xs">+</button>
                                  </div>
                                ) : (
                                  <span className="text-white/40 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest">{item.servings} servings</span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
              
              {dailyLog.length > 0 && (
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10 space-y-3 sm:space-y-4">
                  <button
                    onClick={handleAnalyzeNutrition}
                    className="w-full py-3.5 sm:py-4 rounded-xl bg-white/5 border border-gold/30 hover:bg-gold/10 flex items-center justify-center gap-2 sm:gap-3 group transition-all krome-outline"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4 text-gold" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-gold transition-colors">AI Nutrition Analysis</span>
                  </button>

                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <button 
                      onClick={() => setAllLogs(prev => prev.filter(item => item.date !== selectedDate))}
                      className="text-[9px] sm:text-[10px] text-red-400/60 hover:text-red-400 uppercase tracking-widest font-bold transition-colors whitespace-nowrap"
                    >
                      Clear Log
                    </button>
                    <button 
                      onClick={handleSaveLog}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all krome-outline ${
                        isSaved 
                          ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' 
                          : 'bg-gold text-black hover:bg-yellow-400 shadow-lg shadow-gold/20'
                      }`}
                    >
                      {isSaved ? 'Log Saved!' : 'Save Daily Log'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
  );
}
