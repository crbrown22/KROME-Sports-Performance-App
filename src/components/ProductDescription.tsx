import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, CheckCircle2 } from 'lucide-react';
import { FullProgramTemplate } from '../data/workoutTemplates';

interface ProductDescriptionProps {
  program: FullProgramTemplate;
  onBack: () => void;
  onPurchase: () => void;
}

export default function ProductDescription({ program, onBack, onPurchase }: ProductDescriptionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 min-h-screen bg-black text-white px-6"
    >
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </button>

        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">{program.name}</h1>
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4" /> Locked
            </div>
          </div>
          
          <p className="text-white/60 text-lg leading-relaxed mb-10">{program.description}</p>

          <div className="space-y-4 mb-10">
            <h3 className="font-bold uppercase italic">Program Includes:</h3>
            <ul className="space-y-2 text-white/50">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> {program.phases.length} Training Phases</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Full Workout Templates</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Progress Tracking</li>
            </ul>
          </div>

          <button 
            onClick={onPurchase}
            className="w-full btn-gold py-4 text-lg font-black uppercase tracking-widest"
          >
            Purchase Access
          </button>
        </div>
      </div>
    </motion.div>
  );
}
