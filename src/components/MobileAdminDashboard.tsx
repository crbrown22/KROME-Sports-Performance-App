import { motion } from "framer-motion";
import { safeStorage } from '../utils/storage';
import React from "react";
import { 
  User, 
  LogOut, 
  ChevronLeft,
  Calendar,
  Shield,
  TrendingUp,
  History,
  Settings,
  Camera,
  Apple,
  Activity,
  Video,
  Edit3,
  ShieldAlert,
  MessageSquare,
  Star,
  Bot
} from "lucide-react";

interface MobileAdminDashboardProps {
  user: any;
  onLogout: () => void;
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export default function MobileAdminDashboard({ user, onLogout, onBack, onNavigate }: MobileAdminDashboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 pb-24 bg-black px-6"
    >
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all !outline-none"
            aria-label="Go back to home page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all !outline-none"
            aria-label="Logout from your account"
          >
            Logout <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="text-center">
          <div className="relative inline-block mb-8">
            <div className="w-40 h-40 rounded-3xl gold-gradient p-1 shadow-2xl shadow-gold/20">
              <div className="w-full h-full bg-zinc-900 rounded-[22px] flex items-center justify-center overflow-hidden relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-20 h-20 text-gold/20" />
                )}
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{user.username}</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm italic">
              {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Name Not Set'}
            </p>
          </div>
          <p className="text-gold font-bold uppercase tracking-widest text-[10px] mb-8 italic">KROME ADMIN</p>

          <div className="space-y-3" role="tablist" aria-label="Admin sections">
            <button onClick={() => onNavigate('fitnessOverview')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <TrendingUp className="w-4 h-4" /> Overview
            </button>
            <button onClick={() => onNavigate('progressTracker')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <TrendingUp className="w-4 h-4" /> Training Stats
            </button>
            <button onClick={() => onNavigate('programCatalog')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Calendar className="w-4 h-4" /> Training Program
            </button>
            <button onClick={() => onNavigate('programBuilder')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Edit3 className="w-4 h-4" /> Program Builder
            </button>
            <button onClick={() => onNavigate('bodyMetrics')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Activity className="w-4 h-4" /> Body Metrics
            </button>
            <button onClick={() => onNavigate('workoutTracker')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <History className="w-4 h-4" /> Workouts
            </button>
            <button onClick={() => onNavigate('bodyComposition')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Camera className="w-4 h-4" /> Body Comp
            </button>
            <button onClick={() => onNavigate('parq')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <ShieldAlert className="w-4 h-4" /> PAR-Q
            </button>
            <button onClick={() => onNavigate('nutritionDashboard')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Apple className="w-4 h-4" /> Nutrition
            </button>
            <button onClick={() => onNavigate('activityLog')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <History className="w-4 h-4" /> Activity Log
            </button>
            <button onClick={() => onNavigate('videoAnalysis')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Video className="w-4 h-4" /> Video Analysis
            </button>
            <button onClick={() => onNavigate('aiAcademy')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Bot className="w-4 h-4" /> AI Academy Lab
            </button>
            <button onClick={() => onNavigate('chat')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button onClick={() => onNavigate('accountSettings')} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline">
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button 
              onClick={onLogout}
              className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 mt-4"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
