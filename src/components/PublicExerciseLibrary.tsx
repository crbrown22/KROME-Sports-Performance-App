import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, Dumbbell, PlayCircle, ExternalLink, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXERCISE_LIBRARY, CATEGORIES } from '../data/exerciseLibrary';

interface PublicExerciseLibraryProps {
  onBack: () => void;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
};

export default function PublicExerciseLibrary({ onBack }: PublicExerciseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      const matchesSearch = searchTerm.trim() === '' || ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-tight px-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent">Exercise</span> <br />
            <span className="text-white pr-2 pb-2">Library</span>
          </h2>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-4 px-4">Master every movement with our video vault</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-white/5 hover:bg-white/10 text-white/60 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all krome-outline"
        >
          Back to Home
        </button>
      </div>

      <div className="bg-zinc-900/50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-white/5 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <Input 
              placeholder="Search 100+ exercises..."
              className="w-full bg-black/40 border-white/10 rounded-2xl pl-16 pr-6 h-16 text-white text-lg focus:border-gold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-black/40 border-white/10 rounded-2xl px-6 h-16 text-white min-w-[240px] font-black uppercase tracking-widest text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="All" className="font-bold uppercase tracking-widest text-[10px]">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="font-bold uppercase tracking-widest text-[10px]">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((ex) => (
              <motion.div 
                key={ex.id}
                layoutId={`ex-${ex.id}`}
                onClick={() => setSelectedExercise(ex)}
                className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-gold/30 transition-all group cursor-pointer relative flex flex-col h-full krome-outline"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform shadow-lg shadow-gold/5">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-lg text-white/40 border border-white/5">{ex.category}</span>
                </div>
                
                <h4 className="text-lg font-black uppercase italic mb-4 text-white group-hover:text-gold transition-colors leading-tight line-clamp-2">{ex.name}</h4>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {ex.equipment?.map((eq: string, i: number) => (
                      <span key={i} className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">{eq}</span>
                    ))}
                  </div>
                  <PlayCircle className="w-5 h-5 text-gold opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-white/20 font-black uppercase tracking-widest italic">No exercises found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              layoutId={`ex-${selectedExercise.id}`}
              className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-2 block">{selectedExercise.category}</span>
                    <h3 className="text-3xl md:text-5xl font-black uppercase italic leading-none">{selectedExercise.name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedExercise(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 mb-8 shadow-2xl">
                  {selectedExercise.videoUrl ? (
                    <iframe 
                      src={getYouTubeEmbedUrl(selectedExercise.videoUrl) || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${selectedExercise.name} Demo`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-10 text-center">
                      <PlayCircle className="w-16 h-16 mb-4 opacity-10" />
                      <p className="font-black uppercase tracking-widest italic">Video preview coming soon</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Equipment:</span>
                    <div className="flex gap-2">
                      {selectedExercise.equipment?.map((eq: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/80">{eq}</span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedExercise.videoUrl && (
                    <a 
                      href={selectedExercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gold font-black uppercase tracking-widest text-[10px] hover:gap-4 transition-all"
                    >
                      Watch on YouTube <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
