import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProgramImage } from '../utils/imageUtils';
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
import { usePrograms } from '../context/ProgramContext';

interface ProgramCatalogProps {
  userId: string;
  isAdmin?: boolean;
  onBack: () => void;
  onSelectProgram: (program: FullProgramTemplate, locked: boolean) => void;
  onBrowseCatalog?: () => void;
  type?: 'all' | 'breaks' | 'movement' | 'myPrograms';
}

export default function ProgramCatalog({ userId, isAdmin = false, onBack, onSelectProgram, onBrowseCatalog, type = 'all' }: ProgramCatalogProps) {
  const { programs: allPrograms } = usePrograms();
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<FullProgramTemplate[]>([]);
  const [customPrograms, setCustomPrograms] = useState<FullProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterTrainer, setFilterTrainer] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purchasesRes, assignedRes, templatesRes, customRes] = await Promise.all([
          fetch(`/api/purchases/${userId}`),
          fetch(`/api/assigned-programs/${userId}`),
          fetch('/api/program-templates'),
          fetch(`/api/custom-programs/${userId}`)
        ]);

        if (purchasesRes.ok) {
          const data = await purchasesRes.json();
          setPurchasedPrograms(data.map((p: any) => p.programId || p.program_id || p.item_name));
        }

        if (assignedRes.ok) {
          const data = await assignedRes.json();
          setAssignedPrograms(data);
        }

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          const transformed = data.map((p: any) => {
            let parsedData = p.data || {};
            if (typeof p.data === 'string') {
              try {
                parsedData = JSON.parse(p.data);
              } catch (e) {
                parsedData = {};
              }
            }
            return {
              ...p,
              ...parsedData,
              id: p.id,
              isGlobal: true,
              price: p.price
            };
          });
          setGlobalTemplates(transformed);
        }

        if (customRes.ok) {
          const data = await customRes.json();
          const transformed = data.map((p: any) => {
            let parsedData = p.data;
            if (typeof p.data === 'string') {
              try {
                parsedData = JSON.parse(p.data);
              } catch (e) {
                parsedData = {};
              }
            }
            return {
              ...p,
              ...parsedData,
              id: p.id,
              isCustom: true
            };
          });
          setCustomPrograms(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch catalog data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const isPurchased = (programId: string | number) => {
    return purchasedPrograms.some(p => String(p) === String(programId)) || 
           assignedPrograms.some(ap => String(ap.programId || ap.program_id) === String(programId));
  };

  const getBasePrograms = () => {
    if (type === 'breaks') {
      const ids = ['softball-winter', 'baseball-winter', 'softball-summer', 'baseball-summer'];
      return ids.map(id => allPrograms.find(p => p.id === id)).filter((p): p is FullProgramTemplate => !!p);
    }
    if (type === 'movement') {
      const ids = ['lower-back-rehab'];
      return ids.map(id => allPrograms.find(p => p.id === id)).filter((p): p is FullProgramTemplate => !!p);
    }
    if (type === 'myPrograms') {
      const purchased = purchasedPrograms
        .map(id => allPrograms.find(p => p.id === id) || globalTemplates.find(gt => String(gt.id) === String(id)))
        .filter((p): p is FullProgramTemplate => !!p);
      
      const assigned = assignedPrograms
        .map(ap => {
          const apId = String(ap.programId || ap.program_id);
          return allPrograms.find(p => String(p.id) === apId) || globalTemplates.find(gt => String(gt.id) === apId);
        })
        .filter((p): p is FullProgramTemplate => !!p);

      return [...purchased, ...assigned, ...customPrograms];
    }
    return [...allPrograms, ...globalTemplates];
  };

  const basePrograms = getBasePrograms();

  const catalogPrograms = basePrograms.filter(p => {
    if (filterSport !== 'all' && p.sport !== filterSport) return false;
    if (filterGoal !== 'all' && p.goal !== filterGoal) return false;
    if (filterTrainer !== 'all' && p.trainer !== filterTrainer) return false;
    return true;
  });

  const uniqueSports = Array.from(new Set(basePrograms.map(p => p.sport).filter(Boolean)));
  const uniqueGoals = Array.from(new Set(basePrograms.map(p => p.goal).filter(Boolean)));
  const uniqueTrainers = Array.from(new Set(basePrograms.map(p => p.trainer).filter(Boolean)));

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
      className="pb-24 min-h-screen bg-black relative overflow-hidden"
      style={{ paddingTop: 'calc(100px + var(--safe-area-top))' }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full px-4 md:px-12 relative z-10">
        {/* Header */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest mb-6 md:mb-8 hover:gap-4 transition-all !outline-none border border-[#b2d8d8] px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-16 gap-6 md:gap-8">
          <div className="max-w-2xl">
            <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm mb-3 md:mb-4 italic">
              {type === 'breaks' ? 'Seasonal Protocols' : type === 'movement' ? 'Flexibility & Mobility' : type === 'myPrograms' ? 'Your Training Protocols' : 'Elite Performance Catalog'}
            </h2>
            <h1 className="text-4xl md:text-8xl font-black uppercase italic leading-none tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">
                {type === 'breaks' ? 'Break' : type === 'movement' ? 'Movement' : type === 'myPrograms' ? 'My' : 'KSP Elite'}
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Protocols</span>
            </h1>
            <p className="mt-4 md:mt-6 text-white/70 text-sm md:text-lg leading-relaxed">
              {type === 'breaks' 
                ? 'Elite off-season protocols designed to maintain and build performance during school breaks.'
                : type === 'movement'
                ? 'Master your body mechanics with elite mobility protocols designed to improve joint health and movement potential.'
                : type === 'myPrograms'
                ? 'Access all your purchased programs and custom protocols created in the program builder.'
                : 'Select your specialized path to elite performance. Each program is scientifically structured for maximum athletic development and durability.'}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4 bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-[#b2d8d8]">
            <div className="text-right">
              <div className="text-2xl font-black text-gold italic">
                {type === 'breaks' ? '8 WEEKS' : type === 'movement' ? '6 WEEKS' : '52 WEEK'}
              </div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Standard Duration</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-right">
              <div className="text-2xl font-black text-accent italic">
                {type === 'breaks' ? 'ALL' : type === 'movement' ? 'ALL' : 'ELITE'}
              </div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Performance Level</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
          {uniqueSports.length > 0 && (
            <select 
              value={filterSport} 
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full sm:w-auto bg-black/20 backdrop-blur-md border border-[#b2d8d8] text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-gold"
            >
              <option value="all">All Sports</option>
              {uniqueSports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          )}
          {uniqueGoals.length > 0 && (
            <select 
              value={filterGoal} 
              onChange={(e) => setFilterGoal(e.target.value)}
              className="w-full sm:w-auto bg-black/20 backdrop-blur-md border border-[#b2d8d8] text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-gold"
            >
              <option value="all">All Goals</option>
              {uniqueGoals.map(goal => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          )}
          {uniqueTrainers.length > 0 && (
            <select 
              value={filterTrainer} 
              onChange={(e) => setFilterTrainer(e.target.value)}
              className="w-full sm:w-auto bg-black/20 backdrop-blur-md border border-[#b2d8d8] text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-gold"
            >
              <option value="all">All Trainers</option>
              {uniqueTrainers.map(trainer => (
                <option key={trainer} value={trainer}>{trainer}</option>
              ))}
            </select>
          )}
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : catalogPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {catalogPrograms.map((program) => {
              const locked = !isPurchased(program.id) && !isAdmin && !(program as any).isCustom;
              return (
                <motion.button
                  key={program.id}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectProgram(program, locked)}
                  className="group relative text-left bg-black/20 backdrop-blur-md border border-[#b2d8d8] rounded-[32px] md:rounded-[40px] hover:border-gold/50 transition-all overflow-hidden krome-outline flex flex-col h-full"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={getProgramImage(program.name, program.sport)} 
                      alt={program.name} 
                      className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 right-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 krome-outline ${getAccentColor(program.id, locked)}`}>
                        {locked ? <Lock className="w-4 h-4 text-white/40" /> : getIcon(program.id)}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col h-full p-6 md:p-10 -mt-12">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#b2d8d8]/50">
                        <Clock className="w-3 h-3 text-white/60" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/80">
                          {(program as any).isCustom ? 'Custom' : program.id.includes('52-week') ? '52 Weeks' : program.id.includes('rehab') ? '6 Weeks' : '8 Weeks'}
                        </span>
                      </div>
                      {locked && (
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                          Locked
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl md:text-3xl font-black uppercase italic leading-tight mb-4 group-hover:text-gold transition-colors drop-shadow-lg text-[#b2d8d8]">
                      {program.name}
                    </h3>

                    <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed mb-8 flex-1 line-clamp-2">
                      {program.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Sport</span>
                        <span className="text-[10px] font-bold text-gold uppercase italic">{program.sport || 'All Sports'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gold font-black uppercase italic text-xs group-hover:gap-4 transition-all">
                        {locked ? 'Purchase Access' : 'Access Program'} <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="p-16 bg-black/20 backdrop-blur-md border border-dashed border-[#b2d8d8] rounded-[40px] text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#b2d8d8]" />
            </div>
            <h3 className="text-lg font-black uppercase italic text-[#b2d8d8] mb-2">No Programs Found</h3>
            <p className="text-white/60 text-xs mb-8 max-w-xs mx-auto leading-relaxed">We couldn't find any programs matching your criteria.</p>
            {type === 'myPrograms' && onBrowseCatalog && (
              <button 
                onClick={onBrowseCatalog}
                className="px-8 py-4 rounded-2xl bg-gold text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold/90 transition-all krome-outline shadow-xl shadow-gold/20"
              >
                Browse Full Catalog
              </button>
            )}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="mt-20 p-10 rounded-[48px] bg-black/20 backdrop-blur-md border border-[#b2d8d8] text-center">
          <h3 className="text-xl font-black uppercase italic mb-4 text-[#b2d8d8]">Can't find your <span className="text-gold">Sport?</span></h3>
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-8 uppercase tracking-widest font-bold">
            We are constantly developing new elite protocols. Contact our performance team for custom programming or upcoming releases.
          </p>
          <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all krome-outline">
            Request Custom Protocol
          </button>
        </div>
      </div>
    </motion.div>
  );
}
