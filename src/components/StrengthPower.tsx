import { motion } from "framer-motion";
import { ChevronLeft, ThumbsUp, DollarSign, PlayCircle, Zap, Dumbbell, Shield, ArrowRight } from "lucide-react";

interface Props {
  key?: string;
  onBack: () => void;
  onStartProgram: () => void;
}

export default function StrengthPower({ onBack, onStartProgram }: Props) {
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
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 grayscale"
              alt="Strength training"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
          </div>
          <div className="w-1/2 h-full relative hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 grayscale"
              alt="Strength detail"
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
              <Dumbbell className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Building Champions</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-none">
              Strength & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Power</span>
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-2xl">
              Power starts from the ground up. Unlock your potential through precision and strength. Elite results come from elite training.
            </p>
            <button onClick={onStartProgram} className="btn-accent text-lg px-8 py-4 flex items-center gap-3 group">
              Start Training <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Program Highlights Section */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#b2d8d8]/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "The Stronger, The Better",
                desc: "Power starts from the ground up. Unlock your potential through precision and strength.",
                icon: <Dumbbell className="w-8 h-8" />
              },
              {
                title: "Boost Performance",
                desc: "Elite results come from elite training. Optimize strength to elevate your game.",
                icon: <Zap className="w-8 h-8" />
              },
              {
                title: "Stay Elite",
                desc: "It's not just about looking the part. Perform at your peak and dominate the field.",
                icon: <Shield className="w-8 h-8" />
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#b2d8d8]/10 border border-[#b2d8d8]/20 p-10 rounded-3xl hover:border-[#b2d8d8]/50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-[#b2d8d8] mb-8 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h5 className="text-2xl font-black italic uppercase mb-4">{item.title}</h5>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Athlete Benefits Section */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#b2d8d8]/5 rounded-full blur-3xl z-0" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Maximize</span> Your <br />Potential
            </h2>
            <p className="text-2xl text-white/50 font-medium italic max-w-2xl mx-auto">
              Increase Strength, Speed, and Injury Prevention. <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1">Become Elite.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop"
            ].map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="aspect-[3/4] rounded-3xl overflow-hidden relative group"
              >
                <img 
                  src={img} 
                  alt="Athlete" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="py-24 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b2d8d8]/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-1 pb-1 font-bold uppercase tracking-[0.2em] text-sm mb-4">The Advantage</h2>
              <h3 className="text-4xl md:text-6xl font-black uppercase italic leading-tight">
                Strength & <br />Power Perks
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "More Explosion", desc: "Unlock the posterior chain to produce true power and speed for maximum performance." },
              { title: "Boost Performance", desc: "Build strength to support joints and enhance stability." },
              { title: "Increased Muscle Mass", desc: "Gain muscle mass to dominate sports requiring power and strength." }
            ].map((perk, idx) => (
              <div key={idx} className="bg-black border border-[#b2d8d8]/10 rounded-3xl p-10 hover:bg-zinc-900 transition-colors group">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent font-black text-6xl opacity-20 mb-6 italic group-hover:opacity-40 transition-opacity">0{idx + 1}</div>
                <h3 className="text-2xl font-bold uppercase italic mb-4">{perk.title}</h3>
                <p className="text-white/50">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-24 bg-[#b2d8d8] text-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { title: "Proven Results", desc: "Thousands of athletes. Real results. Proven success.", icon: <ThumbsUp className="w-8 h-8" /> },
              { title: "Affordable", desc: "Elite programs, without the elite price tag.", icon: <DollarSign className="w-8 h-8" /> },
              { title: "Full Access", desc: "Programs, videos, coaching—everything you need.", icon: <PlayCircle className="w-8 h-8" /> },
              { title: "Customizable", desc: "Tailor your training. Get the perfect fit for your goals.", icon: <Zap className="w-8 h-8" /> }
            ].map((feature, idx) => (
              <div key={idx} className="bg-black/5 rounded-3xl p-8 text-center hover:bg-black/10 transition-colors">
                <div className="w-16 h-16 mx-auto bg-black text-[#b2d8d8] rounded-full flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-black uppercase italic text-xl mb-3">{feature.title}</h3>
                <p className="text-black/70 text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button 
              onClick={onStartProgram} 
              className="bg-black text-[#b2d8d8] text-xl px-12 py-5 rounded-full font-black uppercase italic hover:scale-105 transition-transform shadow-2xl shadow-black/20 flex items-center gap-3 mx-auto"
            >
              Start A Program <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
