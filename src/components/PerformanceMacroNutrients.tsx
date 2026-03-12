import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentDate } from '../utils/date';
import { ChevronLeft, Search, Plus, Trash2, PieChart, Activity, Flame, Droplets, Wheat, Beef, Calendar, ChevronRight, Sparkles, Loader2, X } from "lucide-react";
import { foodDatabase, FoodItem, LoggedFood } from "../data/nutritionData";
import { recipes, Recipe } from "../data/recipeData";
import { calculateNutritionRecommendations } from "../utils/nutrition";
import { GoogleGenAI } from "@google/genai";

interface Props {
  key?: string;
  userId?: string;
  onBack: () => void;
}

export default function PerformanceMacroNutrients({ userId = 'guest', onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allLogs, setAllLogs] = useState<LoggedFood[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]); // State for user-saved recipes
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // AI Analysis State
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Timezone-safe today's date
  const getTodayStr = () => getCurrentDate();
  
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMeal, setSelectedMeal] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  
  const [targets, setTargets] = useState({
    calories: 2500,
    protein: 180,
    carbs: 300,
    fat: 80
  });

  // ... (rest of the component)

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
              logId: item.log_id,
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
        } catch (error) {
          console.error("Failed to load nutrition logs:", error);
        } finally {
          setIsLoaded(true);
        }
      } else {
        // Fallback to local storage for guest
        const savedLog = localStorage.getItem(`krome_nutrition_log_${userId}`);
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
              localStorage.setItem(`krome_metrics_${userId}`, JSON.stringify(dbData));
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load metrics from DB", err);
        }
      }

      const savedMetrics = localStorage.getItem(`krome_metrics_${userId}`);
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
    const savedRecipes = localStorage.getItem('krome_user_recipes');
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
    
    localStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(allLogs));
    
    // Auto-save to database
    if (userId !== 'guest') {
      const saveToDb = async () => {
        try {
          await fetch(`/api/nutrition/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: allLogs })
          });
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
    localStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(updatedLogs));

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

  const allFoodItems = [...foodDatabase, ...recipeItems];

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
    localStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(allLogs));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
      className="min-h-screen bg-black text-white pt-24 pb-12 overflow-x-hidden"
    >
      {/* AI Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalysisModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-gold/20 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-white">AI <span className="text-gold">Analysis</span></h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Nutrition Insights</p>
                </div>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-10 text-gold gap-4">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Analyzing Data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose prose-invert prose-sm max-h-[300px] overflow-y-auto custom-scrollbar pr-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-white/80 leading-relaxed whitespace-pre-line text-sm">
                      {analysisResult}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAnalyzeNutrition}
                      className="flex-1 py-3 bg-gold hover:bg-yellow-400 text-black transition-colors rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Refresh
                    </button>
                    <button
                      onClick={() => setShowAnalysisModal(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white transition-colors rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
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
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Nutrition Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-green-900/10" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Nutrition
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-8 items-end justify-between">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm mb-2">Module 01</h2>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
              Performance <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Macro-Nutrients</span>
            </h1>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-4 bg-zinc-900/80 border border-white/10 rounded-2xl p-2">
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

        {/* Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Calories */}
          <div className={`rounded-2xl p-5 relative overflow-hidden transition-all border ${getCardColor(totals.calories, targets.calories)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Calories</div>
              <div className="text-2xl font-black italic mb-0.5">{Math.round(totals.calories)}</div>
              <div className="text-[10px] text-white/40 mb-3">/ {targets.calories} kcal</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.calories, targets.calories, 'bg-gold')}`}
                />
              </div>
            </div>
          </div>

          {/* Protein */}
          <div className={`rounded-2xl p-5 relative overflow-hidden transition-all border ${getCardColor(totals.protein, targets.protein)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Protein</div>
              <div className="text-2xl font-black italic mb-0.5">{Math.round(totals.protein)}g</div>
              <div className="text-[10px] text-white/40 mb-3">/ {targets.protein}g</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.protein / targets.protein) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.protein, targets.protein, 'bg-blue-500')}`}
                />
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div className={`rounded-2xl p-5 relative overflow-hidden transition-all border ${getCardColor(totals.carbs, targets.carbs)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Carbs</div>
              <div className="text-2xl font-black italic mb-0.5">{Math.round(totals.carbs)}g</div>
              <div className="text-[10px] text-white/40 mb-3">/ {targets.carbs}g</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.carbs / targets.carbs) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.carbs, targets.carbs, 'bg-green-500')}`}
                />
              </div>
            </div>
          </div>

          {/* Fat */}
          <div className={`rounded-2xl p-5 relative overflow-hidden transition-all border ${getCardColor(totals.fat, targets.fat)}`}>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Fats</div>
              <div className="text-2xl font-black italic mb-0.5">{Math.round(totals.fat)}g</div>
              <div className="text-[10px] text-white/40 mb-3">/ {targets.fat}g</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totals.fat / targets.fat) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(totals.fat, targets.fat, 'bg-yellow-500')}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search & Add */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 h-full">
              <div className="flex flex-col gap-4 mb-6">
                {/* Meal Selector */}
                <div className="flex gap-2">
                  {meals.map(meal => (
                    <button
                      key={meal}
                      onClick={() => setSelectedMeal(meal)}
                      className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all flex-1 ${
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder={`Search foods...`} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-gold text-black' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {filteredFoods.map((food) => (
                  <motion.div 
                    key={food.id}
                    layoutId={food.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-sm">{food.name}</div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider">{food.serving.size} • {food.serving.calories} kcal</div>
                    </div>
                    <button 
                      onClick={() => addToLog(food)}
                      className="w-8 h-8 rounded-full bg-gold text-black flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                {filteredFoods.length === 0 && (
                  <div className="text-center py-12 text-white/30 italic text-sm">
                    No foods found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Log */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 h-full flex flex-col">
              <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2 text-gold">
                <Activity className="w-4 h-4" /> Daily Log
              </h3>

              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                {dailyLog.length === 0 ? (
                  <div className="text-center py-12 text-white/30 italic text-sm">
                    Log is empty.
                  </div>
                ) : (
                  meals.map(meal => {
                    const mealLogs = dailyLog.filter(item => item.meal === meal);
                    if (mealLogs.length === 0) return null;
                    
                    return (
                      <div key={meal} className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-1 mb-1">{meal}</h4>
                        <AnimatePresence mode="popLayout">
                          {mealLogs.map((item) => (
                            <motion.div 
                              key={item.logId}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="bg-black/40 border border-white/5 rounded-lg p-3 relative group"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-bold text-xs">{item.name}</div>
                                <button 
                                  onClick={() => removeFromLog(item.logId)}
                                  className="text-white/20 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between text-[10px] text-white/50">
                                <span>{Math.round(item.serving.calories * item.servings)} kcal</span>
                                <div className="flex items-center gap-1 bg-white/5 rounded-md px-1.5 py-0.5">
                                  <button onClick={() => updateServings(item.logId, -0.5)} className="hover:text-white">-</button>
                                  <span className="text-white font-mono w-6 text-center">{item.servings}</span>
                                  <button onClick={() => updateServings(item.logId, 0.5)} className="hover:text-white">+</button>
                                </div>
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
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <button
                    onClick={handleAnalyzeNutrition}
                    className="w-full py-2 rounded-lg bg-zinc-800 border border-white/10 hover:border-gold/50 flex items-center justify-center gap-2 group transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-gold transition-colors">Analyze</span>
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={() => setAllLogs(prev => prev.filter(item => item.date !== selectedDate))}
                      className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-bold"
                    >
                      Clear Day
                    </button>
                    <button 
                      onClick={handleSaveLog}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isSaved 
                          ? 'bg-green-500 text-black' 
                          : 'bg-gold text-black hover:bg-yellow-400'
                      }`}
                    >
                      {isSaved ? 'Saved!' : 'Save Log'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
