import { motion } from "framer-motion";
import { ChevronLeft, Zap, Dumbbell, StretchHorizontal, Utensils, ArrowRight, Calendar } from "lucide-react";

interface Props {
  key?: string;
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export default function SpecializedTrainingLanding({ onBack, onNavigate }: Props) {
  const categories = [
    {
      id: "movement",
      title: "Movement",
      subtitle: "Flexibility & Mobility",
      description: "Master your body mechanics with elite mobility protocols designed to improve joint health and movement potential.",
      icon: <StretchHorizontal className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop",
      view: "movementLanding"
    },
    {
      id: "speed",
      title: "Speed & Agility",
      subtitle: "Conditioning & Speed",
      description: "Develop explosive speed and agility with high-intensity training designed to boost your athletic performance.",
      icon: <Zap className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop",
      view: "conditioningSpeed"
    },
    {
      id: "strength",
      title: "Strength & Power",
      subtitle: "Strength & Power",
      description: "Build raw strength and explosive power through scientifically proven lifting and plyometric protocols.",
      icon: <Dumbbell className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop",
      view: "strengthPower"
    },
    {
      id: "nutrition",
      title: "Nutrition",
      subtitle: "Fuel & Recovery",
      description: "Optimize your performance with precision nutrition planning, macro tracking, and supplementation strategies.",
      icon: <Utensils className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
      view: "nutritionLanding"
    },
    {
      id: "breaks",
      title: "Break Programs",
      subtitle: "Winter & Summer",
      description: "Elite off-season protocols designed to maintain and build performance during school breaks.",
      icon: <Calendar className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=800&auto=format&fit=crop",
      view: "breakProgramsLanding"
    },
    {
      id: "recovery",
      title: "Recovery",
      subtitle: "Rest & Repair",
      description: "Optimize your recovery with evidence-based protocols to accelerate healing and reduce fatigue.",
      icon: <StretchHorizontal className="w-8 h-8" />,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
      view: "recoveryPrograms"
    }
  ];

  const handleCardClick = (category: any) => {
    onNavigate(category.view);
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
          src="https://images.unsplash.com/photo-1517963879466-e1b54ebd6694?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Specialized Training Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm mb-2">Elite Protocols</h2>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
              Specialized <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Training</span>
            </h1>
          </div>
          <p className="max-w-md text-white/50 text-lg leading-relaxed">
            Target specific areas of your performance with our specialized training modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => handleCardClick(category)}
              className="group relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-gold/30 transition-all shadow-2xl hover:shadow-gold/10"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 grayscale group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              </div>

              <div className="relative z-10 p-6 h-full flex flex-col justify-end min-h-[300px]">
                <div className="mb-auto">
                  <div className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gold mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gold font-bold uppercase tracking-widest text-[10px] mb-1">{category.subtitle}</h3>
                  <h2 className="text-2xl font-black uppercase italic mb-2 group-hover:text-white transition-colors">{category.title}</h2>
                  <p className="text-white/60 mb-4 line-clamp-2 text-sm group-hover:text-white/80 transition-colors">
                    {category.description}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest group-hover:gap-3 transition-all">
                    Access Module <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
