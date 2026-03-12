import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, Clock, Flame, ChefHat, Calendar, ArrowRight, Utensils, Sparkles, Loader2, X, Plus } from "lucide-react";
import { recipes, Recipe } from "../data/recipeData";
import { GoogleGenAI } from "@google/genai";
import { getCurrentDate } from "../utils/date";

interface Props {
  key?: string;
  userId?: string;
  onBack: () => void;
}

export default function RecipeLibrary({ userId = 'guest', onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [selectedMealType, setSelectedMealType] = useState<string>("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isAddedToLog, setIsAddedToLog] = useState(false);
  
  // Manual Recipe Creation State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    name: "",
    mealType: "Lunch",
    day: "Monday",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: "1 serving",
    ingredients: "",
    instructions: ""
  });

  const days = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

  // Load user recipes
  const userRecipes = JSON.parse(localStorage.getItem('krome_user_recipes') || '[]');
  const allRecipes = [...recipes, ...userRecipes];

  const filteredRecipes = allRecipes.filter(recipe => {
    const nameStr = recipe.name || '';
    const ingredientsStr = recipe.ingredients || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredientsStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDay = selectedDay === "All" || recipe.day === selectedDay;
    const matchesMealType = selectedMealType === "All" || recipe.mealType === selectedMealType;
    return matchesSearch && matchesDay && matchesMealType;
  });

  const handleCreateRecipe = () => {
    if (!newRecipe.name || !newRecipe.ingredients || !newRecipe.instructions) return;

    const recipe: Recipe = {
      id: `manual-${Date.now()}`,
      name: newRecipe.name || "Untitled Recipe",
      mealType: (newRecipe.mealType as any) || "Snack",
      day: (newRecipe.day as any) || "Monday",
      calories: Number(newRecipe.calories) || 0,
      protein: Number(newRecipe.protein) || 0,
      carbs: Number(newRecipe.carbs) || 0,
      fat: Number(newRecipe.fat) || 0,
      portion: newRecipe.portion || "1 serving",
      ingredients: newRecipe.ingredients || "",
      instructions: newRecipe.instructions || ""
    };

    const savedRecipes = JSON.parse(localStorage.getItem('krome_user_recipes') || '[]');
    const updatedRecipes = [...savedRecipes, recipe];
    localStorage.setItem('krome_user_recipes', JSON.stringify(updatedRecipes));
    
    setShowAddModal(false);
    setNewRecipe({
      name: "",
      mealType: "Lunch",
      day: "Monday",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "1 serving",
      ingredients: "",
      instructions: ""
    });
  };

  const handleGenerateRecipe = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedRecipe(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `Generate a healthy recipe based on this request: "${aiPrompt}". 
      Return ONLY a JSON object with the following structure (no markdown, no backticks):
      {
        "id": "ai-generated-${Date.now()}",
        "name": "Recipe Name",
        "mealType": "Lunch",
        "day": "Any",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "portion": "1 serving",
        "ingredients": "ingredient 1, ingredient 2, ...",
        "instructions": "Step 1... Step 2..."
      }`;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt
      });
      
      const text = result.text;
      // Clean up potential markdown code blocks
      const jsonStr = text?.replace(/```json/g, '').replace(/```/g, '').trim();
      
      if (jsonStr) {
        const recipe = JSON.parse(jsonStr);
        setGeneratedRecipe(recipe);
      }
    } catch (error) {
      console.error("Failed to generate recipe:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = () => {
    if (!generatedRecipe) return;

    const savedRecipes = JSON.parse(localStorage.getItem('krome_user_recipes') || '[]');
    const newRecipes = [...savedRecipes, generatedRecipe];
    localStorage.setItem('krome_user_recipes', JSON.stringify(newRecipes));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddToLog = (recipe: Recipe) => {
    const today = getCurrentDate();
    const meal = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(recipe.mealType) 
      ? recipe.mealType as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
      : 'Snack';

    const newEntry = {
      id: recipe.id,
      name: recipe.name,
      category: "Recipes",
      meal: meal,
      date: today,
      logId: Math.random().toString(36).substr(2, 9),
      servings: 1,
      serving: {
        size: recipe.portion,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat
      },
      per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };

    const currentLog = JSON.parse(localStorage.getItem(`krome_nutrition_log_${userId}`) || '[]');
    const updatedLog = [newEntry, ...currentLog];
    localStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(updatedLog));

    // Also try to save to DB if user is logged in (fire and forget)
    if (userId !== 'guest') {
      fetch(`/api/nutrition/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLog })
      }).catch(err => console.error("Failed to sync log", err));
    }

    setIsAddedToLog(true);
    setTimeout(() => setIsAddedToLog(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pt-24 pb-12 overflow-x-hidden"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Recipe Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-orange-900/10" />
      </div>

      {/* AI Modal */}
      {createPortal(
        <AnimatePresence>
          {showAiModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative overflow-hidden"
              >
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold to-accent" />
                 <button 
                  onClick={() => setShowAiModal(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic">AI Chef</h2>
                </div>

                {!generatedRecipe ? (
                  <>
                    <p className="text-white/60 mb-6">
                      Describe what you want to eat (e.g., "high protein vegetarian dinner", "post-workout meal with chicken"), and I'll create a custom recipe for you.
                    </p>
                    
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Enter your request..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-all min-h-[120px] mb-6"
                    />

                    <button
                      onClick={handleGenerateRecipe}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="w-full btn-gold flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Recipe...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Recipe
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-gold text-xs font-black uppercase tracking-widest mb-1">Generated Recipe</div>
                        <h3 className="text-2xl font-black uppercase italic">{generatedRecipe.name}</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setGeneratedRecipe(null);
                          setAiPrompt("");
                        }}
                        className="text-xs text-white/40 hover:text-white underline"
                      >
                        Create Another
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-[10px] text-white/40 uppercase">Cal</div>
                        <div className="font-bold text-orange-400">{generatedRecipe.calories}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-[10px] text-white/40 uppercase">Pro</div>
                        <div className="font-bold text-blue-400">{generatedRecipe.protein}g</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-[10px] text-white/40 uppercase">Carb</div>
                        <div className="font-bold text-green-400">{generatedRecipe.carbs}g</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg text-center">
                        <div className="text-[10px] text-white/40 uppercase">Fat</div>
                        <div className="font-bold text-yellow-400">{generatedRecipe.fat}g</div>
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Ingredients</h4>
                        <p className="text-sm text-white/80 leading-relaxed">{generatedRecipe.ingredients}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Instructions</h4>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{generatedRecipe.instructions}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setSelectedRecipe(generatedRecipe);
                          setShowAiModal(false);
                        }}
                        className="flex-1 btn-outline-accent"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={handleSaveRecipe}
                        className={`flex-1 btn-gold transition-all ${isSaved ? 'bg-green-500 text-black border-green-500' : ''}`}
                      >
                        {isSaved ? 'Saved to Library!' : 'Save to My Recipes'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Nutrition
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end justify-between">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm mb-2">Module 03</h2>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
              Fuel Prep <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">& Recipes</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAiModal(true)}
              className="btn-gold flex items-center gap-2 shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Chef</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-outline-gold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Recipe</span>
            </button>
          </div>
        </div>

        {/* Add Recipe Modal */}
        {createPortal(
          <AnimatePresence>
            {showAddModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold to-accent" />
                   <button 
                    onClick={() => setShowAddModal(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic">Create Recipe</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Recipe Name</label>
                      <input 
                        type="text" 
                        value={newRecipe.name}
                        onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                        placeholder="e.g. Grilled Chicken Salad"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Meal Type</label>
                        <select 
                          value={newRecipe.mealType}
                          onChange={(e) => setNewRecipe({...newRecipe, mealType: e.target.value as any})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                        >
                          {mealTypes.filter(t => t !== 'All').map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Day</label>
                        <select 
                          value={newRecipe.day}
                          onChange={(e) => setNewRecipe({...newRecipe, day: e.target.value as any})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none"
                        >
                          <option value="Any">Any</option>
                          {days.filter(d => d !== 'All').map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 block">Calories</label>
                        <input 
                          type="number" 
                          value={newRecipe.calories}
                          onChange={(e) => setNewRecipe({...newRecipe, calories: Number(e.target.value)})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white focus:border-gold/50 outline-none text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 block">Protein (g)</label>
                        <input 
                          type="number" 
                          value={newRecipe.protein}
                          onChange={(e) => setNewRecipe({...newRecipe, protein: Number(e.target.value)})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white focus:border-gold/50 outline-none text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 block">Carbs (g)</label>
                        <input 
                          type="number" 
                          value={newRecipe.carbs}
                          onChange={(e) => setNewRecipe({...newRecipe, carbs: Number(e.target.value)})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white focus:border-gold/50 outline-none text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 block">Fat (g)</label>
                        <input 
                          type="number" 
                          value={newRecipe.fat}
                          onChange={(e) => setNewRecipe({...newRecipe, fat: Number(e.target.value)})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white focus:border-gold/50 outline-none text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Ingredients (comma separated)</label>
                      <textarea 
                        value={newRecipe.ingredients}
                        onChange={(e) => setNewRecipe({...newRecipe, ingredients: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none min-h-[80px]"
                        placeholder="Chicken breast, Olive oil, Salt..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 block">Instructions</label>
                      <textarea 
                        value={newRecipe.instructions}
                        onChange={(e) => setNewRecipe({...newRecipe, instructions: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none min-h-[120px]"
                        placeholder="1. Preheat oven..."
                      />
                    </div>

                    <button
                      onClick={handleCreateRecipe}
                      className="w-full btn-gold mt-4"
                    >
                      Save Recipe
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search & Filter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search recipes or ingredients..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedDay === day 
                          ? 'bg-gold text-black' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {mealTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedMealType === type 
                          ? 'bg-white text-black' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-white/30 italic">
                    No recipes found matching your criteria
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <motion.div 
                      key={recipe.id}
                      layoutId={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className={`relative p-6 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
                        selectedRecipe?.id === recipe.id 
                          ? 'bg-white/10 border-gold/50 shadow-xl shadow-gold/10' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest">
                          {recipe.mealType}
                        </div>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {recipe.day}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-black uppercase italic mb-2 group-hover:text-gold transition-colors line-clamp-2">{recipe.name}</h3>
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-white/60 mt-4">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{recipe.calories} kcal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-blue-500" />
                          <span>{recipe.protein}g Protein</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recipe Details */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedRecipe ? (
                <motion.div 
                  key={selectedRecipe.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 h-full sticky top-24 overflow-y-auto max-h-[calc(100vh-150px)] custom-scrollbar"
                >
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gold text-xs font-black uppercase tracking-widest">{selectedRecipe.day} • {selectedRecipe.mealType}</span>
                      </div>
                      <button
                        onClick={() => handleAddToLog(selectedRecipe)}
                        className={`p-2 rounded-full transition-all ${
                          isAddedToLog 
                            ? 'bg-green-500 text-black' 
                            : 'bg-white/10 text-white hover:bg-gold hover:text-black'
                        }`}
                        title="Add to Daily Log"
                      >
                        {isAddedToLog ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic leading-none mb-4">{selectedRecipe.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-white/80">
                        {selectedRecipe.portion}
                      </div>
                      <div className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-bold">
                        {selectedRecipe.calories} Calories
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-8">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Protein</div>
                      <div className="text-xl font-black italic text-blue-400">{selectedRecipe.protein}g</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Carbs</div>
                      <div className="text-xl font-black italic text-green-400">{selectedRecipe.carbs}g</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Fat</div>
                      <div className="text-xl font-black italic text-yellow-400">{selectedRecipe.fat}g</div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                        <Utensils className="w-3 h-3" /> Ingredients
                      </h4>
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.split(', ').map((ingredient, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                        <ChefHat className="w-3 h-3" /> Instructions
                      </h4>
                      <p className="text-sm leading-relaxed text-white/80 bg-white/5 p-4 rounded-xl border border-white/5">
                        {selectedRecipe.instructions}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                  <ChefHat className="w-16 h-16 text-white/10" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Select a recipe to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
