import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Dumbbell, 
  X, 
  Plus, 
  PlayCircle,
  Video,
  Info,
  ChevronLeft,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXERCISE_LIBRARY as STATIC_EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';
import { getExercises as fetchExercisesFromDb, addExercise as addExerciseToDb, updateExercise as updateExerciseInDb, deleteExercise as deleteExerciseFromDb } from '../services/firebaseService';

interface ExerciseLibraryProps {
  onBack?: () => void;
  isAdmin?: boolean;
  userId?: string;
}

export default function ExerciseLibrary({ onBack, isAdmin, userId }: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<any[]>(STATIC_EXERCISE_LIBRARY);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with DB
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercisesFromDb();
        if (data && data.length > 0) {
          setExercises(data);
        } else if (isAdmin) {
          // If empty and admin, try to populate
          for (const ex of STATIC_EXERCISE_LIBRARY) {
            await addExerciseToDb(ex).catch(console.error);
          }
          const freshData = await fetchExercisesFromDb();
          if (freshData && freshData.length > 0) setExercises(freshData);
        }
      } catch (err) {
        console.error("Error loading exercises from DB:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, [isAdmin]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchTerm, selectedCategory]);

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise && !showAddModal) return;
    setIsSaving(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const exerciseData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        videoUrl: formData.get('videoUrl') as string,
        description: formData.get('description') as string,
      };

      if (editingExercise) {
        await updateExerciseInDb(editingExercise.id, exerciseData);
      } else {
        await addExerciseToDb(exerciseData);
      }

      const freshData = await fetchExercisesFromDb();
      setExercises(freshData);
      setShowAddModal(false);
      setEditingExercise(null);
    } catch (err) {
      console.error("Error saving exercise:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!window.confirm("Delete this exercise permanently?")) return;
    try {
      await deleteExerciseFromDb(id);
      const freshData = await fetchExercisesFromDb();
      setExercises(freshData);
    } catch (err) {
      console.error("Error deleting exercise:", err);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  return (
    <div className="min-h-screen bg-black pt-20 md:pt-24 pb-32 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all group krome-outline"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Dumbbell className="w-6 h-6 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Elite Movement Database</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                Exercise <span className="text-gold">Library</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-8 py-4 bg-gold text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20"
              >
                <Plus className="w-4 h-4" /> Add Movement
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text" 
              placeholder="Search through hundreds of exercises..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-gold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-gold appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center lg:justify-end gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/5 rounded-2xl p-4">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing with KSP Cloud...' : `${exercises.length} Movements Loaded`}
          </div>
        </div>

        {/* Content */}
        {filteredExercises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExercises.map((ex) => (
              <motion.div 
                layout
                key={ex.id || ex.name}
                className="group bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden hover:border-gold/30 transition-all krome-outline flex flex-col h-full"
              >
                <div className="aspect-video relative overflow-hidden bg-black/40">
                  {ex.videoUrl ? (
                    <iframe 
                      src={getYouTubeEmbedUrl(ex.videoUrl) || ''}
                      className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Video className="w-8 h-8" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Video Coming Soon</span>
                    </div>
                  )}
                  {/* Category Badge Overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                      {ex.category}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white group-hover:text-gold transition-colors">{ex.name}</h3>
                    {isAdmin && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingExercise(ex)} 
                          className="p-2 bg-white/5 hover:bg-gold hover:text-black rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExercise(ex.id)} 
                          className="p-2 bg-white/5 hover:bg-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-white/40 text-[11px] leading-relaxed mb-8 flex-1">
                    {ex.description || "No specific instructions provided. Consult with your coach for performance markers."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-white/5">
                    <div className="px-3 py-1.5 bg-white/5 rounded-xl flex items-center gap-2">
                      <Zap className="w-3 h-3 text-gold" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Elite Level</span>
                    </div>
                    {ex.videoUrl && (
                      <a 
                        href={ex.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gold/10 hover:bg-gold/20 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <PlayCircle className="w-3 h-3 text-gold" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold">Source</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center bg-zinc-900/20 border border-dashed border-white/10 rounded-[60px]">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 text-white/10">
              <Search className="w-12 h-12" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic text-white/40 mb-3">No Movements Found</h2>
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showAddModal || !!editingExercise} onOpenChange={(open) => { if (!open) { setShowAddModal(false); setEditingExercise(null); } }}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white p-10 rounded-[48px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic mb-8">
              {editingExercise ? 'Update' : 'Initialize'} <span className="text-gold">Movement</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExercise} className="space-y-6">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] font-black text-white/40">Movement Name</Label>
              <Input name="name" required defaultValue={editingExercise?.name} className="bg-black border-white/10 h-14 rounded-2xl" placeholder="e.g. Olympic Barbell Back Squat" />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-[10px] font-black text-white/40">Category</Label>
                <Select name="category" defaultValue={editingExercise?.category || CATEGORIES[0]}>
                  <SelectTrigger className="bg-black border-white/10 h-14 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-[10px] font-black text-white/40">YouTube URL</Label>
                <Input name="videoUrl" defaultValue={editingExercise?.videoUrl} className="bg-black border-white/10 h-14 rounded-2xl" placeholder="https://youtube.com/..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-[10px] font-black text-white/40">Movement Description / Cues</Label>
              <textarea 
                name="description" 
                defaultValue={editingExercise?.description}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm min-h-[120px] outline-none focus:border-gold transition-all"
                placeholder="Key performance markers and coaching cues..."
              />
            </div>

            <DialogFooter className="flex gap-4 pt-8">
              <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditingExercise(null); }} className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 uppercase font-black tracking-widest text-xs">Cancel</Button>
              <Button type="submit" disabled={isSaving} className="flex-1 h-14 rounded-2xl bg-gold text-black hover:bg-gold/90 uppercase font-black tracking-widest text-xs shadow-xl shadow-gold/20">
                {isSaving ? 'Synching...' : (editingExercise ? 'Update Movement' : 'Register Movement')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components
const Zap = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
