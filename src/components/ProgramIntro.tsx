import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  PlayCircle, 
  Calendar,
  Lock,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

interface ProgramIntroProps {
  key?: string;
  onBack: () => void;
  onSelectPhase: (phaseNumber: number) => void;
}

const phases = [
  { number: 1, title: "Metabolic Endurance & Explosion", status: "available" },
  { number: 2, title: "Strength & Power", status: "available" },
  { number: 3, title: "Strength, Hypertrophy & Power (SHP)", status: "available" },
  { number: 4, title: "Fast Twitch & Top End Explosion (FTTX)", status: "available" },
  { number: 5, title: "Optimal Performance (OP)", status: "available" },
  { number: 6, title: "Speed & Agility Drills", status: "available" },
  { number: 7, title: "Mobility & Dynamic Warm Up", status: "available" },
  { number: 8, title: "Nutrition", status: "available" },
];

export default function ProgramIntro({ onBack, onSelectPhase }: ProgramIntroProps) {
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
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" 
          alt="Program Intro Background" 
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
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-4 italic">Elite Performance</h2>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic leading-none tracking-tighter">
              52 Week <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Program</span>
            </h1>
          </div>
          <p className="max-w-md text-white/50 text-lg leading-relaxed">
            A comprehensive year-long roadmap designed to transform you into an elite athlete through systematic progression.
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-24">
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-gold/10 border border-white/10 group">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/fU599S2F3k4" 
              title="52 Week Program Introduction"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-black">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold uppercase italic text-xl">Program Overview</h3>
                <p className="text-white/40 text-sm">Watch this to understand the 52-week journey</p>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">52 Weeks</span>
              <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">Full Transformation</span>
            </div>
          </div>
        </div>

        {/* Phases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((phase) => (
            <motion.div
              key={phase.number}
              whileHover={{ y: -5 }}
              onClick={() => phase.status === 'available' && onSelectPhase(phase.number)}
              className={`bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-gold/30 transition-colors group ${phase.status === 'available' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl font-black italic text-white/10 group-hover:text-gold/20 transition-colors">
                  0{phase.number}
                </div>
                {phase.status === 'available' ? (
                  <CheckCircle2 className="w-5 h-5 text-gold" />
                ) : (
                  <Lock className="w-5 h-5 text-white/20" />
                )}
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Phase {phase.number}</h4>
              <h3 className="text-xl font-bold uppercase italic mb-4">{phase.title}</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                <Calendar className="w-3 h-3" /> View Workouts <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
