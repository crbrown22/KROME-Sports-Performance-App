import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Zap, 
  Activity, 
  Target,
  Shield,
  Clock,
  Lock
} from 'lucide-react';
import { ALL_PROGRAMS, FullProgramTemplate } from '../data/workoutTemplates';

interface ProgramCatalogProps {
  userId: string;
  isAdmin?: boolean;
  onBack: () => void;
  onSelectProgram: (program: FullProgramTemplate, locked: boolean) => void;
  type?: 'all' | 'breaks' | 'movement';
}

export default function ProgramCatalog({ userId, isAdmin = false, onBack, onSelectProgram, type = 'all' }: ProgramCatalogProps) {
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases/${userId}`);
        if (res.ok) {
          const data = await res.json();
          // Assuming item_name contains the program name or ID
          setPurchasedPrograms(data.map((p: any) => p.item_name));
        }
      } catch (err) {
        console.error("Failed to fetch purchases", err);
      }
    };
    fetchPurchases();
  }, [userId]);

  // Explicitly define the programs to match the user's requested list and order
  const catalogIds = type === 'breaks' 
    ? ['softball-winter', 'baseball-winter', 'softball-summer', 'baseball-summer']
    : type === 'movement'
    ? ['lower-back-rehab']
    : [
        'soccer-52-week',
        'softball-52-week',
        'baseball-52-week'
      ];

  const isPurchased = (programName: string) => purchasedPrograms.includes(programName);

  const catalogPrograms = catalogIds
    .map(id => ALL_PROGRAMS.find(p => p.id === id))
    .filter((p): p is FullProgramTemplate => p !== undefined);

  const getIcon = (id: string) => {
    if (id.includes('soccer')) return <Activity className="w-6 h-6" />;
    if (id.includes('softball') || id.includes('baseball')) return <Zap className="w-6 h-6" />;
    if (id.includes('rehab')) return <Shield className="w-6 h-6" />;
    return <Dumbbell className="w-6 h-6" />;
  };

  const getAccentColor = (id: string, locked: boolean) => {
    if (locked) return 'text-white/20 bg-white/5';
    if (id.includes('soccer')) return 'text-emerald-500 bg-emerald-500/10';
    if (id.includes('softball') || id.includes('baseball')) return 'text-gold bg-gold/10';
    if (id.includes('rehab')) return 'text-rose-500 bg-rose-500/10';
    return 'text-accent bg-accent/10';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 min-h-screen bg-black relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-4 italic">
              {type === 'breaks' ? 'Seasonal Protocols' : type === 'movement' ? 'Flexibility & Mobility' : 'Elite Performance Catalog'}
            </h2>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic leading-none tracking-tighter">
              {type === 'breaks' ? 'Break' : type === 'movement' ? 'Movement' : 'KSP Elite'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Protocols</span>
            </h1>
            <p className="mt-6 text-white/50 text-lg leading-relaxed">
              {type === 'breaks' 
                ? 'Elite off-season protocols designed to maintain and build performance during school breaks.'
                : type === 'movement'
                ? 'Master your body mechanics with elite mobility protocols designed to improve joint health and movement potential.'
                : 'Select your specialized path to elite performance. Each program is scientifically structured for maximum athletic development and durability.'}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
            <div className="text-right">
              <div className="text-2xl font-black text-gold italic">
                {type === 'breaks' ? '8 WEEKS' : type === 'movement' ? '6 WEEKS' : '52 WEEK'}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Standard Duration</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <div className="text-2xl font-black text-accent italic">
                {type === 'breaks' ? 'ALL' : type === 'movement' ? 'ALL' : 'ELITE'}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Performance Level</div>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {catalogPrograms.map((program) => {
            const locked = !isPurchased(program.name) && !isAdmin;
            return (
              <motion.button
                key={program.id}
                whileHover={{ y: -8, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectProgram(program, locked)}
                className="group relative text-left bg-zinc-900/30 border border-white/5 p-8 md:p-10 rounded-[40px] hover:border-gold/30 transition-all overflow-hidden"
              >
                {/* Decorative background icon */}
                <div className="absolute -top-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <div className="scale-[4] rotate-12">
                    {getIcon(program.id)}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${getAccentColor(program.id, locked)}`}>
                      {locked ? <Lock className="w-6 h-6 text-white/40" /> : getIcon(program.id)}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {program.id.includes('52-week') ? '52 Weeks' : program.id.includes('rehab') ? '6 Weeks' : '8 Weeks'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-4 group-hover:text-gold transition-colors leading-tight">
                      {program.name}
                    </h3>
                    <p className="text-white/40 text-sm md:text-base leading-relaxed mb-8 line-clamp-2">
                      {program.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                            <Target className="w-3 h-3 text-white/20" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Elite Trackers Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-gold font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                      {locked ? 'Purchase Access' : 'Access Program'} <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {/* Footer Info */}
        <div className="mt-20 p-10 rounded-[48px] bg-zinc-900/20 border border-white/5 text-center">
          <h3 className="text-xl font-black uppercase italic mb-4">Can't find your <span className="text-gold">Sport?</span></h3>
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-8 uppercase tracking-widest font-bold">
            We are constantly developing new elite protocols. Contact our performance team for custom programming or upcoming releases.
          </p>
          <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Request Custom Protocol
          </button>
        </div>
      </div>
    </motion.div>
  );
}
