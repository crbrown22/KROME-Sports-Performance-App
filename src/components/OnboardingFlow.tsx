import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Activity, 
  Scale, 
  Target, 
  ShieldCheck,
  Trophy
} from 'lucide-react';
import FitnessGoalOnboarding from './FitnessGoalOnboarding';
import PARQ from './PARQ';
import BodyMetrics from './BodyMetrics';
import { BodyMetricsData, INITIAL_DATA } from '../types';

interface OnboardingFlowProps {
  user: any;
  onComplete: () => void;
}

type Step = 'welcome' | 'fitnessGoal' | 'parqInfo' | 'parqForm' | 'bodyMetrics' | 'final';

export default function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const userId = user.id.toString();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [metricsData, setMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);

  const nextStep = () => {
    const steps: Step[] = ['welcome', 'fitnessGoal', 'parqInfo', 'parqForm', 'bodyMetrics', 'final'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'fitnessGoal', 'parqInfo', 'parqForm', 'bodyMetrics', 'final'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24 px-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12 flex items-center justify-between gap-2">
          {['welcome', 'fitnessGoal', 'parqInfo', 'parqForm', 'bodyMetrics', 'final'].map((step, index) => {
            const steps: Step[] = ['welcome', 'fitnessGoal', 'parqInfo', 'parqForm', 'bodyMetrics', 'final'];
            const currentIndex = steps.indexOf(currentStep);
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={step} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                <motion.div 
                  initial={false}
                  animate={{ 
                    width: isCompleted || isActive ? '100%' : '0%',
                    backgroundColor: isCompleted ? '#D4AF37' : isActive ? '#D4AF37' : '#ffffff10'
                  }}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 gold-gradient rounded-3xl flex items-center justify-center font-black text-black text-5xl italic mx-auto shadow-2xl shadow-gold/20">K</div>
              <div className="space-y-4">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                  Welcome to <span className="text-gold">Krome Nation</span>
                </h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                  Let's get you set up for your 52-week journey. We'll walk you through your goals, safety checks, and initial metrics.
                </p>
              </div>
              <button 
                onClick={nextStep}
                className="btn-gold px-12 py-4 text-lg flex items-center gap-3 mx-auto"
              >
                Start Onboarding <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {currentStep === 'fitnessGoal' && (
            <motion.div 
              key="fitnessGoal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FitnessGoalOnboarding user={user} onComplete={nextStep} />
            </motion.div>
          )}

          {currentStep === 'parqInfo' && (
            <motion.div 
              key="parqInfo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl text-center space-y-8">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-10 h-10 text-gold" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Safety <span className="text-gold">First</span></h2>
                  <p className="text-white/60 text-lg leading-relaxed">
                    Before we start training, we need to ensure you're physically ready for activity. The Physical Activity Readiness Questionnaire (PAR-Q) is a mandatory step to protect your health and safety.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {[
                    { title: 'Health Check', desc: 'Identify potential risks before they become issues.' },
                    { title: 'Personalization', desc: 'Tailor your program to your physical capabilities.' },
                    { title: 'Legal Safety', desc: 'Ensures we follow professional training standards.' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-gold uppercase text-xs tracking-widest mb-2">{item.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex gap-4 justify-center">
                  <button onClick={prevStep} className="px-8 py-4 rounded-xl border border-white/10 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">Back</button>
                  <button onClick={nextStep} className="btn-gold px-12 py-4 text-xs">I Understand, Continue</button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'parqForm' && (
            <motion.div 
              key="parqForm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Complete your <span className="text-gold">PAR-Q</span></h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Step 4 of 6</p>
              </div>
              <PARQ userId={userId} onComplete={nextStep} initialReadOnly={false} />
            </motion.div>
          )}

          {currentStep === 'bodyMetrics' && (
            <motion.div 
              key="bodyMetrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Initial <span className="text-gold">Body Metrics</span></h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Step 5 of 6</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl mb-8">
                <p className="text-white/60 text-sm mb-8 leading-relaxed">
                  Now, let's record your starting point. These metrics help us calculate your metabolic rate and track your progress accurately over time.
                </p>
                <BodyMetrics userId={userId} data={metricsData} setData={setMetricsData} onComplete={nextStep} initialEditing={true} />
                <div className="mt-8 flex justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Click "Save Changes" above to continue</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'final' && (
            <motion.div 
              key="final"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-10 py-12"
            >
              <div className="w-32 h-32 bg-gold/20 rounded-full flex items-center justify-center mx-auto relative">
                <Trophy className="w-16 h-16 text-gold" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-black"
                >
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">You're <span className="text-gold">Ready!</span></h2>
                <p className="text-white/60 text-lg max-w-xl mx-auto">
                  Your profile is set up and your journey has officially begun. You can now access all features of the Krome Nation app.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                {[
                  { title: 'Training Stats', desc: 'View your progress in the Athlete Dashboard.' },
                  { title: 'Programs', desc: 'Access your assigned 52-week training plan.' },
                  { title: 'Nutrition', desc: 'Log your meals and track your macros.' },
                  { title: 'Community', desc: 'Connect with other athletes and coaches.' }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                    <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">{item.title}</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={onComplete}
                className="btn-gold px-16 py-5 text-lg shadow-2xl shadow-gold/30"
              >
                Enter the App
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
