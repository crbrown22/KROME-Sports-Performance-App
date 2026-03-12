import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Zap, 
  Timer,
  Activity,
  CheckCircle2,
  Lock,
  ChevronRight,
  PlayCircle,
  Dumbbell,
  StretchHorizontal,
  Apple
} from "lucide-react";

interface SpecializedProgramProps {
  key?: string;
  type: 'movement' | 'speed' | 'strength' | 'nutrition';
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const programData = {
  movement: {
    title: "Movement & Mobility",
    subtitle: "Elite Biomechanics",
    description: "Master the fundamental movement patterns and joint mechanics required for injury prevention and peak athletic output.",
    icon: <StretchHorizontal className="w-6 h-6" />,
    stats: { duration: "8 WEEKS", focus: "MOBILITY" },
    modules: [
      { number: 1, title: "Ankle & Hip Dissociation", status: "available", duration: "Week 1" },
      { number: 2, title: "Thoracic Spine Optimization", status: "available", duration: "Week 2" },
      { number: 3, title: "Dynamic Stability Protocols", status: "locked", duration: "Week 3" },
    ]
  },
  speed: {
    title: "Speed & Agility",
    subtitle: "Explosive Quickness",
    description: "Develop elite-level linear speed and multi-directional agility through scientific sprint mechanics and change-of-direction drills.",
    icon: <Zap className="w-6 h-6" />,
    stats: { duration: "10 WEEKS", focus: "VELOCITY" },
    modules: [
      { number: 1, title: "Acceleration Mechanics", status: "available", duration: "Week 1" },
      { number: 2, title: "Top End Speed Phasing", status: "available", duration: "Week 2" },
      { number: 3, title: "Deceleration & Re-acceleration", status: "locked", duration: "Week 3" },
      { number: 4, title: "Game Speed & Agility", status: "locked", duration: "Week 4" },
    ]
  },
  strength: {
    title: "Strength & Power",
    subtitle: "Force Production",
    description: "A specialized track focusing on maximal strength and explosive power development outside of the 52-week progression.",
    icon: <Dumbbell className="w-6 h-6" />,
    stats: { duration: "12 WEEKS", focus: "POWER" },
    modules: [
      { number: 1, title: "Hypertrophy Foundation", status: "available", duration: "Week 1" },
      { number: 2, title: "Absolute Strength Phase", status: "available", duration: "Week 2" },
      { number: 3, title: "Power Conversion", status: "locked", duration: "Week 3" },
      { number: 4, title: "Peak Power Output", status: "locked", duration: "Week 4" },
    ]
  },
  nutrition: {
    title: "Elite Nutrition",
    subtitle: "Fuel for Performance",
    description: "Optimize your body composition and recovery through performance-driven nutritional protocols and supplementation strategies.",
    icon: <Apple className="w-6 h-6" />,
    stats: { duration: "ONGOING", focus: "FUELING" },
    modules: [
      { number: 1, title: "Performance Macro-Nutrients", status: "available", duration: "Module 1" },
      { number: 2, title: "Micronutrient & Supplementation Optimization", status: "available", duration: "Module 2" },
      { number: 3, title: "Fuel Prep & Recipes", status: "available", duration: "Module 3" },
    ]
  }
};

export default function SpecializedProgram({ type, onBack, onNavigate }: SpecializedProgramProps) {
  const data = programData[type];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 min-h-screen bg-black relative overflow-hidden"
    >
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2000&auto=format&fit=crop" 
          alt="Specialized Program Background" 
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-[#b2d8d8]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-3xl">
            <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-4 italic">Specialized Training: {data.subtitle}</h2>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter mb-6">
              {data.title.split(' & ')[0]} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">& {data.title.split(' & ')[1] || 'Program'}</span>
            </h1>
            <p className="text-xl text-white/50 leading-relaxed">
              {data.description}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-center min-w-[120px]">
              <Timer className="w-6 h-6 text-gold mx-auto mb-2" />
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration</div>
              <div className="text-lg font-black italic">{data.stats.duration}</div>
            </div>
            <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-center min-w-[120px]">
              <Activity className="w-6 h-6 text-gold mx-auto mb-2" />
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Focus</div>
              <div className="text-lg font-black italic">{data.stats.focus}</div>
            </div>
          </div>
        </div>

        {/* Intro Video */}
        <div className="mb-16">
          <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-gold/10 border border-white/10 group">
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <PlayCircle className="w-16 h-16 text-gold/20 group-hover:text-gold/40 transition-all group-hover:scale-110" />
              <div className="absolute bottom-6 left-6 text-left">
                <div className="text-gold font-black italic uppercase tracking-widest text-[10px] mb-1">PROGRAM MISSION</div>
                <div className="text-xl font-black uppercase italic">{data.subtitle} Optimization</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.modules.map((module) => (
            <motion.div
              key={module.number}
              whileHover={{ y: -5 }}
              onClick={() => {
                if (type === 'nutrition' && module.number === 1 && onNavigate) {
                  onNavigate('performanceMacroNutrients');
                } else if (type === 'nutrition' && module.number === 2 && onNavigate) {
                  onNavigate('micronutrientOptimization');
                } else if (type === 'nutrition' && module.number === 3 && onNavigate) {
                  onNavigate('recipeLibrary');
                }
              }}
              className={`relative bg-zinc-900/50 border border-white/5 rounded-2xl p-6 transition-all group ${module.status === 'available' ? 'hover:border-gold/30 cursor-pointer' : 'opacity-60'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all">
                  {data.icon}
                </div>
                {module.status === 'available' ? (
                  <CheckCircle2 className="w-5 h-5 text-gold" />
                ) : (
                  <Lock className="w-5 h-5 text-white/20" />
                )}
              </div>
              
              <div className="mb-6">
                <div className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-1">{module.duration}</div>
                <h3 className="text-lg font-black uppercase italic leading-tight group-hover:text-gold transition-colors">
                  {module.title}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Module 0{module.number}</span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
