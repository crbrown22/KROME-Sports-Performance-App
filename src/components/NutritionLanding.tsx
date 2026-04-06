import { motion } from "framer-motion";
import { ChevronLeft, Utensils, ArrowRight, Calendar, Zap, Activity } from "lucide-react";

interface Props {
  key?: string;
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export default function NutritionLanding({ onBack, onNavigate }: Props) {
  const modules = [
    {
      id: "performanceMacroNutrients",
      title: "Performance Macro-Nutrients",
      moduleNumber: "Module 01",
      img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
      view: "performanceMacroNutrients"
    },
    {
      id: "micronutrientOptimization",
      title: "Micronutrient & Supplementation Optimization",
      moduleNumber: "Module 02",
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
      view: "micronutrientOptimization"
    },
    {
      id: "recipeLibrary",
      title: "Fuel Prep & Recipes",
      moduleNumber: "Module 03",
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
      view: "recipeLibrary"
    }
  ];

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
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Nutrition Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest mb-6 md:mb-8 hover:gap-4 transition-all !outline-none border border-[#b2d8d8] px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm mb-2">Specialized Training</h2>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-tight">
              Fuel for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1">Performance</span>
            </h1>
          </div>
          <div className="flex gap-4 md:gap-8">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-[#b2d8d8]/40 mb-1">Duration</p>
              <p className="text-sm font-bold uppercase italic text-[#b2d8d8]">ONGOING</p>
            </div>
            <div className="text-right border-l border-white/10 pl-4 md:pl-8">
              <p className="text-[10px] uppercase tracking-widest text-[#b2d8d8]/40 mb-1">Focus</p>
              <p className="text-sm font-bold uppercase italic text-[#b2d8d8]">FUELING</p>
            </div>
          </div>
        </div>

        {/* Program Mission */}
        <div className="bg-black/40 backdrop-blur-md border border-[#b2d8d8]/20 rounded-3xl p-8 md:p-12 mb-16 krome-outline">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic text-[#b2d8d8]">Elite Nutrition & Program</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-gold">Program Mission</p>
            </div>
          </div>
          <p className="text-lg md:text-xl text-[#b2d8d8]/80 leading-relaxed italic mb-8">
            "Optimize your body composition and recovery through performance-driven nutritional protocols and supplementation strategies."
          </p>
          <div className="pt-8 border-t border-white/10">
            <h4 className="text-sm font-black uppercase italic text-gold mb-2 tracking-widest">Fuel for Performance Optimization</h4>
          </div>
        </div>

        {/* Modules Section (Shop Layout) */}
        <div className="mb-20">
          <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-[#b2d8d8] mb-8 md:mb-12 text-center italic">Program Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {modules.map((module, idx) => (
              <div key={idx} className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden border border-[#b2d8d8] flex flex-col hover:border-gold/50 transition-all krome-outline group">
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <img src={module.img} alt={module.title} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-[#b2d8d8]/30 px-3 py-1 rounded-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold">{module.moduleNumber}</span>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <h5 className="text-base md:text-lg font-bold text-[#b2d8d8] mb-4 flex-1 uppercase italic group-hover:text-gold transition-colors leading-tight">{module.title}</h5>
                  <button 
                    onClick={() => onNavigate(module.view)} 
                    className="border border-[#b2d8d8] text-[#b2d8d8] hover:text-gold hover:border-gold !py-3 !text-xs w-full transition-all rounded-xl font-black uppercase italic tracking-widest"
                  >
                    Select Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
