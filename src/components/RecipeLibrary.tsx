import { safeStorage } from '../utils/storage';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Search, 
  Clock, 
  Flame, 
  ChefHat, 
  Calendar, 
  ArrowRight, 
  Utensils, 
  Sparkles, 
  Loader2, 
  X, 
  Plus,
  Save,
  PlusCircle,
  Info
} from "lucide-react";
import { recipes, Recipe } from "../data/recipeData";
import { GoogleGenAI } from "@google/genai";
import { getCurrentDate } from "../utils/date";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Separator } from "./ui/separator";

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
  const userRecipes = JSON.parse(safeStorage.getItem('krome_user_recipes') || '[]');
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

    const savedRecipes = JSON.parse(safeStorage.getItem('krome_user_recipes') || '[]');
    const updatedRecipes = [...savedRecipes, recipe];
    safeStorage.setItem('krome_user_recipes', JSON.stringify(updatedRecipes));
    
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

    const savedRecipes = JSON.parse(safeStorage.getItem('krome_user_recipes') || '[]');
    const newRecipes = [...savedRecipes, generatedRecipe];
    safeStorage.setItem('krome_user_recipes', JSON.stringify(newRecipes));
    
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

    const currentLog = JSON.parse(safeStorage.getItem(`krome_nutrition_log_${userId}`) || '[]');
    const updatedLog = [newEntry, ...currentLog];
    safeStorage.setItem(`krome_nutrition_log_${userId}`, JSON.stringify(updatedLog));

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
      {/* AI Chef Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase italic">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Sparkles className="w-5 h-5" />
              </div>
              AI Chef
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Describe what you want to eat, and I'll create a custom recipe for you.
            </DialogDescription>
          </DialogHeader>

          {!generatedRecipe ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="text-xs font-bold uppercase tracking-widest text-white/70">Your Request</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., high protein vegetarian dinner, post-workout meal with chicken..."
                  className="bg-black/50 border-white/10 min-h-[120px] focus:border-gold/50"
                />
              </div>

              <Button
                onClick={handleGenerateRecipe}
                disabled={!aiPrompt.trim() || isGenerating}
                className="w-full bg-gold hover:bg-gold/90 text-black font-black uppercase italic tracking-widest"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Recipe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="text-gold border-gold/30 mb-2">Generated Recipe</Badge>
                  <h3 className="text-2xl font-black uppercase italic">{generatedRecipe.name}</h3>
                </div>
                <Button 
                  variant="link"
                  onClick={() => {
                    setGeneratedRecipe(null);
                    setAiPrompt("");
                  }}
                  className="text-xs text-white/70 hover:text-white underline p-0 h-auto"
                >
                  Create Another
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <div className="text-[10px] text-white/70 uppercase font-bold">Cal</div>
                  <div className="font-black text-orange-400 italic">{generatedRecipe.calories}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <div className="text-[10px] text-white/70 uppercase font-bold">Pro</div>
                  <div className="font-black text-blue-400 italic">{generatedRecipe.protein}g</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <div className="text-[10px] text-white/70 uppercase font-bold">Carb</div>
                  <div className="font-black text-green-400 italic">{generatedRecipe.carbs}g</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <div className="text-[10px] text-white/70 uppercase font-bold">Fat</div>
                  <div className="font-black text-yellow-400 italic">{generatedRecipe.fat}g</div>
                </div>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-2 flex items-center gap-2">
                      <Utensils className="w-3 h-3" /> Ingredients
                    </h4>
                    <p className="text-sm text-white/90 leading-relaxed">{generatedRecipe.ingredients}</p>
                  </div>
                  <Separator className="bg-white/5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-2 flex items-center gap-2">
                      <ChefHat className="w-3 h-3" /> Instructions
                    </h4>
                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{generatedRecipe.instructions}</p>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRecipe(generatedRecipe);
                    setShowAiModal(false);
                  }}
                  className="flex-1 border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest"
                >
                  View Details
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  className={`flex-1 font-black uppercase italic tracking-widest transition-all ${isSaved ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-gold hover:bg-gold/90 text-black'}`}
                >
                  {isSaved ? 'Saved!' : 'Save Recipe'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Recipe Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase italic">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <ChefHat className="w-5 h-5" />
              </div>
              Create Recipe
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Recipe Name</Label>
                <Input 
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="bg-black/50 border-white/10 focus:border-gold/50"
                  placeholder="e.g. Grilled Chicken Salad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Meal Type</Label>
                  <Select 
                    value={newRecipe.mealType}
                    onValueChange={(val) => setNewRecipe({...newRecipe, mealType: val as any})}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {mealTypes.filter(t => t !== 'All').map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Day</Label>
                  <Select 
                    value={newRecipe.day}
                    onValueChange={(val) => setNewRecipe({...newRecipe, day: val as any})}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      <SelectItem value="Any">Any</SelectItem>
                      {days.filter(d => d !== 'All').map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/70">Calories</Label>
                  <Input 
                    type="number" 
                    value={newRecipe.calories}
                    onChange={(e) => setNewRecipe({...newRecipe, calories: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/70">Protein (g)</Label>
                  <Input 
                    type="number" 
                    value={newRecipe.protein}
                    onChange={(e) => setNewRecipe({...newRecipe, protein: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/70">Carbs (g)</Label>
                  <Input 
                    type="number" 
                    value={newRecipe.carbs}
                    onChange={(e) => setNewRecipe({...newRecipe, carbs: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/70">Fat (g)</Label>
                  <Input 
                    type="number" 
                    value={newRecipe.fat}
                    onChange={(e) => setNewRecipe({...newRecipe, fat: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Ingredients (comma separated)</Label>
                <Textarea 
                  value={newRecipe.ingredients}
                  onChange={(e) => setNewRecipe({...newRecipe, ingredients: e.target.value})}
                  className="bg-black/50 border-white/10 focus:border-gold/50 min-h-[80px]"
                  placeholder="Chicken breast, Olive oil, Salt..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Instructions</Label>
                <Textarea 
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({...newRecipe, instructions: e.target.value})}
                  className="bg-black/50 border-white/10 focus:border-gold/50 min-h-[120px]"
                  placeholder="1. Preheat oven..."
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleCreateRecipe}
              className="w-full bg-gold hover:bg-gold/90 text-black font-black uppercase italic tracking-widest"
            >
              Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1542362567-b07e54276754?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Recipe Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-gold/10" />
      </div>

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
              className="px-6 py-3 bg-gold text-black rounded-xl font-black uppercase italic tracking-widest text-xs flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-gold/20"
            >
              <Sparkles className="w-4 h-4" /> AI Chef
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase italic tracking-widest text-xs flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Recipe
            </button>
          </div>
        </div>

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
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all ${
                          selectedDay === day 
                            ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mealTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedMealType(type)}
                        className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all ${
                          selectedMealType === type 
                            ? 'bg-white text-black shadow-lg' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
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
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 text-gold">
                          <Utensils className="w-6 h-6" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest">
                          {recipe.mealType}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-black uppercase italic mb-2 group-hover:text-gold transition-colors">{recipe.name}</h3>
                      
                      <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{recipe.calories} kcal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{recipe.day}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedRecipe ? (
                <motion.div 
                  key={selectedRecipe.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 h-full sticky top-24"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black/40 text-gold">
                        <ChefHat className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black uppercase italic leading-none">{selectedRecipe.name}</h2>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1 text-gold">{selectedRecipe.mealType} • {selectedRecipe.day}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToLog(selectedRecipe)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isAddedToLog 
                          ? 'bg-green-500 text-black' 
                          : 'bg-white/5 text-white hover:bg-gold hover:text-black'
                      }`}
                    >
                      {isAddedToLog ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Protein</div>
                        <div className="text-lg font-black italic text-blue-400">{selectedRecipe.protein}g</div>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Carbs</div>
                        <div className="text-lg font-black italic text-green-400">{selectedRecipe.carbs}g</div>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Fat</div>
                        <div className="text-lg font-black italic text-yellow-400">{selectedRecipe.fat}g</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                        <Utensils className="w-3 h-3" /> Ingredients
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.ingredients.split(', ').map((ingredient, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors cursor-default">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
                        <ChefHat className="w-3 h-3" /> Instructions
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed italic">
                        {selectedRecipe.instructions}
                      </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Portion Size</h4>
                      <p className="text-sm font-mono text-gold">{selectedRecipe.portion}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                  <Info className="w-16 h-16 text-white/10" />
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
