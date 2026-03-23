import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Zap, 
  Dumbbell, 
  TrendingDown, 
  Activity, 
  Trophy,
  ChevronRight,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ALL_PROGRAMS } from '../data/workoutTemplates';

interface FitnessGoalOnboardingProps {
  user: any;
  onComplete: (goal: string) => void;
}

const GOALS = [
  {
    id: 'muscle',
    title: 'Build Muscle',
    subtitle: 'Hypertrophy & Size',
    description: 'Focus on high-volume training to maximize muscle growth and physical presence.',
    icon: <Dumbbell className="w-6 h-6" />,
    color: 'from-orange-500 to-red-600',
    suggestedPrograms: ['strength-power']
  },
  {
    id: 'strength',
    title: 'Increase Strength',
    subtitle: 'Power & Performance',
    description: 'Tap into your kinetic chain to move heavier loads and generate explosive power.',
    icon: <Trophy className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    suggestedPrograms: ['strength-power']
  },
  {
    id: 'speed',
    title: 'Speed & Agility',
    subtitle: 'Elite Movement',
    description: 'Enhance your VO2 Max and reactive ability for peak sport-specific performance.',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-yellow-400 to-orange-500',
    suggestedPrograms: ['speed-agility']
  },
  {
    id: 'weight-loss',
    title: 'Fat Loss',
    subtitle: 'Lean & Conditioned',
    description: 'High-intensity metabolic conditioning designed to torch fat and improve endurance.',
    icon: <TrendingDown className="w-6 h-6" />,
    color: 'from-emerald-400 to-teal-600',
    suggestedPrograms: ['aerobic-capacity']
  },
  {
    id: 'mobility',
    title: 'Mobility & Health',
    subtitle: 'Joint Longevity',
    description: 'Improve joint health and enhance your movement potential with elite protocols.',
    icon: <Activity className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-600',
    suggestedPrograms: ['lower-back-rehab']
  },
  {
    id: 'sport',
    title: 'Sport Specific',
    subtitle: 'Game Ready',
    description: 'Comprehensive 52-week elite performance tracking for your specific sport.',
    icon: <Target className="w-6 h-6" />,
    color: 'from-zinc-400 to-zinc-600',
    suggestedPrograms: ['soccer-52-week', 'softball-52-week', 'baseball-52-week']
  }
];

export default function FitnessGoalOnboarding({ user, onComplete }: FitnessGoalOnboardingProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [step, setStep] = useState<'goal' | 'suggestions'>('goal');
  const [isSaving, setIsSaving] = useState(false);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    setStep('suggestions');
  };

  const currentGoal = GOALS.find(g => g.id === selectedGoal);
  const suggestedPrograms = ALL_PROGRAMS.filter(p => 
    currentGoal?.suggestedPrograms.includes(p.id)
  );

  const handleSave = async () => {
    if (!selectedGoal) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fitness_goal: selectedGoal })
      });
      if (response.ok) {
        onComplete(selectedGoal);
      }
    } catch (err) {
      console.error("Failed to save fitness goal", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-zinc-900 z-[160]">
          <motion.div 
            className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: step === 'goal' ? '50%' : '100%' }}
          />
        </div>

        <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {step === 'goal' ? (
              <motion.div 
                key="goal-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="mb-12 text-center">
                  <motion.h1 
                    className="text-5xl md:text-7xl font-black uppercase italic italic-bold tracking-tighter mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    What's Your <span className="text-gold">Mission?</span>
                  </motion.h1>
                  <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm font-bold">
                    Select your primary fitness objective to personalize your experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {GOALS.map((goal, idx) => (
                    <motion.button
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleGoalSelect(goal.id)}
                      className="group relative p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] text-left hover:border-gold/50 transition-all hover:bg-zinc-900"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                        {goal.icon}
                      </div>
                      <h3 className="text-2xl font-black uppercase italic mb-1">{goal.title}</h3>
                      <p className="text-gold text-[10px] font-black uppercase tracking-widest mb-4">{goal.subtitle}</p>
                      <p className="text-zinc-500 text-sm leading-relaxed">{goal.description}</p>
                      
                      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-6 h-6 text-gold" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="suggestions-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-4xl"
              >
                <button 
                  onClick={() => setStep('goal')}
                  className="mb-8 text-zinc-500 hover:text-white flex items-center gap-2 uppercase text-[10px] font-black tracking-widest transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Change Goal
                </button>

                <div className="mb-12">
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">
                    Recommended <span className="text-gold">Protocols</span>
                  </h2>
                  <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm font-bold">
                    Based on your goal: {currentGoal?.title}
                  </p>
                </div>

                <div className="space-y-4 mb-12">
                  {suggestedPrograms.map((program, idx) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                          <Zap className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase italic">{program.name}</h4>
                          <p className="text-zinc-500 text-xs line-clamp-1">{program.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gold font-black uppercase text-[10px] tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Recommended
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-6 bg-gold text-black font-black uppercase italic text-xl rounded-[32px] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? 'Initializing...' : (
                    <>
                      Start My Journey <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Branding */}
        <footer className="p-12 text-center border-t border-white/5">
          <div className="text-4xl font-black italic tracking-tighter mb-2">
            KROME<span className="text-gold">SPORTS</span>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em]">Elite Performance Systems</p>
        </footer>
      </div>
    </div>
  );
}
