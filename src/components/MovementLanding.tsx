import { motion } from "framer-motion";
import { ChevronLeft, ThumbsUp, DollarSign, PlayCircle, Zap, Activity, Shield, ArrowRight } from "lucide-react";

interface Props {
  key?: string;
  onBack: () => void;
  onStartProgram: () => void;
}

export default function MovementLanding({ onBack, onStartProgram }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white overflow-x-hidden"
    >
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center pt-24 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 flex">
          <div className="w-1/2 h-full relative">
            <img 
              src="https://images.unsplash.com/photo-1552196564-97c844937db6?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 grayscale"
              alt="Movement training"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
          </div>
          <div className="w-1/2 h-full relative hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 grayscale"
              alt="Movement detail"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/50 to-[#b2d8d8]/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-accent font-bold uppercase text-xs tracking-widest mb-12 hover:gap-4 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Elite Movement Protocol</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-none">
              Movement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Mastery</span>
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-2xl">
              Unlock your true athletic potential. Fix movement patterns, increase flexibility, and build a foundation that prevents injuries and maximizes performance.
            </p>
            <button onClick={onStartProgram} className="btn-accent text-lg px-8 py-4 flex items-center gap-3 group">
              Start Training <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
      
      {/* Add more sections as needed, following the StrengthPower/ConditioningSpeed pattern */}
    </motion.div>
  );
}
