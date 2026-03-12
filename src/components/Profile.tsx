import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { getCurrentDate } from '../utils/date';
import { 
  User, 
  Mail, 
  Trash2, 
  Edit3, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  History,
  Settings,
  Camera,
  Apple,
  Activity,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Dumbbell,
  Video
} from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import BodyMetrics from "./BodyMetrics";
import SupplementsAndVitamins from "./SupplementsAndVitamins";
import BodyCompositionTracker from "./BodyCompositionTracker";
import PARQ from "./PARQ";
import WorkoutTracker from "./WorkoutTracker";
import ProgramViewer from "./ProgramViewer";
import ProgramBuilder from "./ProgramBuilder";
import FitnessOverview from "./FitnessOverview";
import VideoAnalyzer from "./VideoAnalyzer";
import ProgramCalendar from "./ProgramCalendar";
import { LoggedFood } from "../data/nutritionData";
import { calculateNutritionRecommendations } from "../utils/nutrition";
import { BodyMetricsData, INITIAL_DATA } from "../types";
import { getSupplementRecommendation, generateDefaultSupplements } from "../utils/supplements";
import { registerServiceWorker, subscribeToPush } from "../utils/notifications";
import { Bell, BellOff } from "lucide-react";

interface ProfileProps {
  key?: string;
  user: any;
  onLogout: () => void;
  onBack: () => void;
  onUpdate: (updatedUser: any) => void;
  onDelete: () => void;
  onNavigate: (view: string) => void;
  onProgramSelect?: (programId: string) => void;
  initialTab?: 'account' | 'progress' | 'nutrition' | 'metrics' | 'parq' | 'workouts' | 'composition' | 'overview' | 'videoAnalysis' | 'programs' | 'builder' | 'schedule';
}

export default function Profile({ user, onLogout, onBack, onUpdate, onDelete, onNavigate, onProgramSelect, initialTab = 'account' }: ProfileProps) {
  console.log("Profile mounted, user:", user, "initialTab:", initialTab);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    console.log("Profile user changed:", user, "initialTab:", initialTab);
    if (user.parq_completed == 0) {
      setActiveTab('parq');
    } else {
      setActiveTab(initialTab);
    }
    setFormData({
      ...user,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || ""
    });
  }, [user, initialTab]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ 
    ...user,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || ""
  });
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [nutritionLogs, setNutritionLogs] = useState<LoggedFood[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getCurrentDate());
  const [bodyMetricsData, setBodyMetricsData] = useState<BodyMetricsData>(INITIAL_DATA);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user.email_notifications === 1);
  const [globalPushEnabled, setGlobalPushEnabled] = useState(user.push_notifications === 1);
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPurchasedPrograms(data.map((p: any) => p.item_name));
        }
      } catch (err) {
        console.error("Failed to fetch purchases", err);
      }
    };
    fetchPurchases();
  }, [user.id]);

  useEffect(() => {
    const checkPush = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setPushEnabled(!!subscription);
        }
      }

      // Monitor permission changes
      if ('permissions' in navigator) {
        try {
          const status = await navigator.permissions.query({ name: 'notifications' as PermissionName });
          status.onchange = () => {
            if (status.state === 'granted') {
              setSuccess("Permission granted! You can now enable notifications.");
              setError("");
            } else if (status.state === 'denied') {
              setError("Notifications are blocked in your browser settings.");
            }
          };
        } catch (e) {
          console.error("Permissions API not supported for notifications");
        }
      }
    };
    checkPush();
  }, []);

  const handleEnableNotifications = async () => {
    if (Notification.permission === 'denied') {
      setError("Notifications are blocked. Click the lock icon (🔒) in your address bar and set Notifications to 'Allow'.");
      return;
    }

    setNotificationLoading(true);
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        const success = await subscribeToPush(user.id);
        if (success) {
          setPushEnabled(true);
          setSuccess("Notifications enabled!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Failed to enable notifications. Ensure you clicked 'Allow' in the browser prompt.");
        }
      }
    } catch (err) {
      console.error("Notification error:", err);
      setError("An error occurred while enabling notifications.");
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleUpdateNotificationSettings = async (email: boolean, push: boolean) => {
    try {
      const res = await fetch(`/api/users/${user.id}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_notifications: email, push_notifications: push })
      });
      if (res.ok) {
        setEmailNotifications(email);
        setGlobalPushEnabled(push);
        onUpdate({ ...user, email_notifications: email ? 1 : 0, push_notifications: push ? 1 : 0 });
        setSuccess("Notification settings updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Failed to update notification settings");
    }
  };

  // Load body metrics data on mount
  useEffect(() => {
    const loadMetrics = async () => {
      if (user.id !== 'guest') {
        try {
          const res = await fetch(`/api/metrics/${user.id}`);
          if (res.ok) {
            const dbData = await res.json();
            if (dbData) {
              setBodyMetricsData(dbData);
              localStorage.setItem(`krome_metrics_${user.id}`, JSON.stringify(dbData));
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load metrics from DB", err);
        }
      }

      const savedMetrics = localStorage.getItem(`krome_metrics_${user.id}`);
      if (savedMetrics) {
        try {
          setBodyMetricsData(JSON.parse(savedMetrics));
        } catch (e) {
          console.error("Failed to parse body metrics", e);
        }
      }
    };
    
    loadMetrics();
  }, [user.id]);

  useEffect(() => {
    const loadNutrition = async () => {
      try {
        const response = await fetch(`/api/nutrition/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const formattedLogs: LoggedFood[] = data.map((item: any) => ({
            id: item.food_id,
            logId: item.log_id,
            name: item.name,
            category: item.category,
            meal: item.meal,
            date: item.date,
            servings: item.servings,
            serving: {
              size: item.serving_size,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat
            },
            per100g: { calories: 0, protein: 0, carbs: 0, fat: 0 }
          }));
          setNutritionLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Failed to load nutrition logs", error);
      }
    };

    loadNutrition();
  }, [user.id]);

  // Timezone-safe today's date
  const getTodayStr = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day + days);
    setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const displayDate = () => {
    const todayStr = getTodayStr();
    if (selectedDate === todayStr) return "Today";
    
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const today = getTodayStr();
  const selectedDateLogs = nutritionLogs.filter(log => (log.date || today) === selectedDate);
  
  const nutritionTotals = selectedDateLogs.reduce((acc, item) => {
    return {
      calories: acc.calories + (item.serving.calories * item.servings),
      protein: acc.protein + (item.serving.protein * item.servings),
      carbs: acc.carbs + (item.serving.carbs * item.servings),
      fat: acc.fat + (item.serving.fat * item.servings),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const recommendations = bodyMetricsData.recommendations || calculateNutritionRecommendations(bodyMetricsData);
  const targets = {
    calories: recommendations.totalCalories,
    protein: recommendations.proteinGrams,
    carbs: recommendations.carbsGrams,
    fat: recommendations.fatGrams
  };

  const getProgressState = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "over";
    if (percentage >= 90) return "good";
    if (percentage >= 50) return "warning";
    return "under";
  };

  const getCardColor = (current: number, target: number) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "border-red-500 bg-red-500/10 text-red-500";
    if (state === 'good') return "border-green-500 bg-green-500/10 text-green-500";
    if (state === 'warning') return "border-yellow-500 bg-yellow-500/10 text-yellow-500";
    return "border-white/5 bg-black/40 text-white";
  };

  const getBarColor = (current: number, target: number, defaultColor: string) => {
    const state = getProgressState(current, target);
    if (state === 'over') return "bg-red-500";
    if (state === 'good') return "bg-green-500";
    if (state === 'warning') return "bg-yellow-500";
    return defaultColor;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const { filename } = await uploadRes.json();
      const avatarUrl = `/api/files/${filename}`;

      const updatedFormData = { ...formData, avatar_url: avatarUrl };
      setFormData(updatedFormData);

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      if (response.ok) {
        onUpdate({ ...user, avatar_url: avatarUrl });
        setSuccess("Profile picture updated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
      setError("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onUpdate(formData);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (response.ok) {
        onDelete();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 pb-24 bg-black px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
            aria-label="Go back to home page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back to Home
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest hover:gap-4 transition-all"
            aria-label="Logout from your account"
          >
            Logout <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 text-center sticky top-20">
            <div className="relative inline-block mb-8 group">
              <div className="w-40 h-40 rounded-3xl gold-gradient p-1 shadow-2xl shadow-gold/20">
                <div className="w-full h-full bg-zinc-900 rounded-[22px] flex items-center justify-center overflow-hidden relative">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-20 h-20 text-gold/20" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-center text-gold shadow-xl cursor-pointer hover:bg-zinc-700 transition-colors" aria-label="Change profile picture">
                <Camera className="w-5 h-5" aria-hidden="true" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  aria-label="Upload new profile picture"
                />
              </label>
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{user.username}</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-white/60 font-bold uppercase tracking-widest text-sm italic">
                {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Name Not Set'}
              </p>
              <button 
                onClick={() => {
                  setActiveTab('account');
                  setIsEditing(true);
                }}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gold transition-all"
                aria-label="Edit profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gold font-bold uppercase tracking-widest text-[10px] mb-8 italic">Elite Member</p>

            <div className="space-y-3" role="tablist" aria-label="Profile sections">
              <button 
                onClick={() => setActiveTab('programs')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'programs' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'programs'}
                aria-label="Training programs section"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" /> Training Programs
              </button>
              <button 
                onClick={() => setActiveTab('workouts')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'workouts' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'workouts'}
                aria-label="Training history section"
              >
                <History className="w-4 h-4" aria-hidden="true" /> Training History
              </button>
              <button 
                onClick={() => setActiveTab('overview')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'overview'}
                aria-label="Fitness overview section"
              >
                <TrendingUp className="w-4 h-4" aria-hidden="true" /> Fitness Overview
              </button>
              <button 
                onClick={() => setActiveTab('progress')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'progress' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'progress'}
                aria-label="Training stats section"
              >
                <TrendingUp className="w-4 h-4" aria-hidden="true" /> Training Stats
              </button>
              <button 
                onClick={() => setActiveTab('nutrition')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'nutrition' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'nutrition'}
                aria-label="Nutrition section"
              >
                <Apple className="w-4 h-4" aria-hidden="true" /> Nutrition
              </button>
              <button 
                onClick={() => setActiveTab('composition')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'composition' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'composition'}
                aria-label="Body composition section"
              >
                <Camera className="w-4 h-4" aria-hidden="true" /> Body Composition
              </button>
              <button 
                onClick={() => setActiveTab('metrics')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'metrics' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'metrics'}
                aria-label="Body metrics section"
              >
                <Activity className="w-4 h-4" aria-hidden="true" /> Body Metrics
              </button>
              <button 
                onClick={() => setActiveTab('videoAnalysis')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'videoAnalysis' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'videoAnalysis'}
                aria-label="Video analysis section"
              >
                <Video className="w-4 h-4" aria-hidden="true" /> Video Analysis
              </button>
              <button 
                onClick={() => setActiveTab('builder')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'builder'}
                aria-label="Program builder section"
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" /> Program Creator
              </button>
              <button 
                onClick={() => setActiveTab('parq')}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'parq' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                role="tab"
                aria-selected={activeTab === 'parq'}
                aria-label="PAR-Q section"
              >
                <ShieldAlert className="w-4 h-4" aria-hidden="true" /> PAR-Q
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                disabled={user.parq_completed === 0 && activeTab !== 'parq'}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'} ${user.parq_completed === 0 && activeTab !== 'parq' ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="tab"
                aria-selected={activeTab === 'schedule'}
                aria-label="Training schedule section"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" /> Schedule
              </button>
              <button 
                onClick={() => setActiveTab('account')}
                className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                role="tab"
                aria-selected={activeTab === 'account'}
                aria-label="Account settings section"
              >
                <Settings className="w-4 h-4" aria-hidden="true" /> Account Settings
              </button>
              
              <div className="pt-8 space-y-3">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-full border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                  aria-label="Delete your account"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Details / Edit Form / Progress Tracker */}
          <div className="lg:col-span-2">
            {activeTab === 'progress' ? (
              <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <ProgressTracker userId={user.id} onBack={() => setActiveTab('account')} />
              </div>
            ) : activeTab === 'workouts' ? (
              <WorkoutTracker userId={user.id} />
            ) : activeTab === 'overview' ? (
              <FitnessOverview userId={user.id} />
            ) : activeTab === 'schedule' ? (
              <ProgramCalendar userId={user.id} programId="52-week-foundation" programData={{}} />
            ) : activeTab === 'nutrition' ? (
              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h3 className="font-bold uppercase italic flex items-center gap-2">
                      <Apple className="w-4 h-4 text-gold" />
                      Nutrition Logs
                    </h3>
                    
                    {/* Date Selector */}
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-1">
                      <button 
                        onClick={() => changeDate(-1)} 
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        aria-label="Previous day"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="flex items-center gap-2 px-2">
                        <Calendar className="w-4 h-4 text-gold" aria-hidden="true" />
                        <span className="font-bold uppercase tracking-widest text-[10px]">
                          {displayDate()}
                        </span>
                      </div>
                      <button 
                        onClick={() => changeDate(1)} 
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        aria-label="Next day"
                      >
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Calories */}
                    <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.calories, targets.calories)}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Flame className="w-16 h-16" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Calories</div>
                        <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.calories)}</div>
                        <div className="text-[10px] text-white/60 mb-3">/ {targets.calories} kcal</div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((nutritionTotals.calories / targets.calories) * 100, 100)}%` }}
                            className={`h-full ${getBarColor(nutritionTotals.calories, targets.calories, 'bg-gold')}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Protein */}
                    <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.protein, targets.protein)}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Beef className="w-16 h-16" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Protein</div>
                        <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.protein)}g</div>
                        <div className="text-[10px] text-white/60 mb-3">/ {targets.protein}g</div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((nutritionTotals.protein / targets.protein) * 100, 100)}%` }}
                            className={`h-full ${getBarColor(nutritionTotals.protein, targets.protein, 'bg-blue-500')}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.carbs, targets.carbs)}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wheat className="w-16 h-16" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Carbs</div>
                        <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.carbs)}g</div>
                        <div className="text-[10px] text-white/60 mb-3">/ {targets.carbs}g</div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((nutritionTotals.carbs / targets.carbs) * 100, 100)}%` }}
                            className={`h-full ${getBarColor(nutritionTotals.carbs, targets.carbs, 'bg-green-500')}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fat */}
                    <div className={`rounded-3xl p-6 relative overflow-hidden transition-colors border ${getCardColor(nutritionTotals.fat, targets.fat)}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Droplets className="w-16 h-16" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Fat</div>
                        <div className="text-2xl font-black italic mb-1">{Math.round(nutritionTotals.fat)}g</div>
                        <div className="text-[10px] text-white/60 mb-3">/ {targets.fat}g</div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((nutritionTotals.fat / targets.fat) * 100, 100)}%` }}
                            className={`h-full ${getBarColor(nutritionTotals.fat, targets.fat, 'bg-yellow-500')}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Meals for {displayDate()}</h4>
                  <div className="space-y-2">
                    {selectedDateLogs.length === 0 ? (
                      <p className="text-center text-white/20 py-8 text-xs font-bold uppercase tracking-widest">No meals logged for this date</p>
                    ) : (
                      selectedDateLogs.map((log) => (
                        <div key={log.logId} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <div className="font-bold text-sm">{log.name}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider">{log.meal} • {log.servings}x</div>
                          </div>
                          <div className="text-xs font-mono text-gold">{Math.round(log.serving.calories * log.servings)} kcal</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <SupplementsAndVitamins 
                  data={bodyMetricsData} 
                  setData={setBodyMetricsData} 
                  isEditing={isEditing} 
                  getSupplementRecommendation={(name) => getSupplementRecommendation(name, bodyMetricsData)}
                  generateDefaultSupplements={() => generateDefaultSupplements(bodyMetricsData, setBodyMetricsData)}
                />
              </div>
             ) : activeTab === 'metrics' ? (
              <BodyMetrics userId={user.id} data={bodyMetricsData} setData={setBodyMetricsData} />
            ) : activeTab === 'videoAnalysis' ? (
              <VideoAnalyzer userId={user.id} />
            ) : activeTab === 'programs' ? (
              <ProgramViewer userId={user.id} isAdmin={user.role === 'admin'} onBack={() => setActiveTab('account')} onProgramSelect={onProgramSelect} />
            ) : activeTab === 'builder' ? (
              <ProgramBuilder userId={user.id} onSave={() => setActiveTab('programs')} />
            ) : activeTab === 'composition' ? (
              <BodyCompositionTracker userId={user.id} onBack={() => setActiveTab('account')} isAdminView={false} />
            ) : activeTab === 'parq' ? (
              <PARQ userId={user.id} initialReadOnly={user.parq_completed === 1} onComplete={() => {
                onUpdate({ ...user, parq_completed: 1 });
                setActiveTab('workouts');
              }} />
            ) : (
              <div className="profile-gradient border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}

              {showDeleteConfirm ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-xl">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-4">Are you sure?</h3>
                  <p className="text-white/40 mb-10 leading-relaxed">
                    This action is permanent and will delete all your training progress, history, and account data.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={handleDelete} className="bg-red-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Confirm Delete</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="bg-zinc-800 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">First Name</label>
                      <input 
                        type="text" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Username</label>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-gold outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-gold outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-gold w-full mt-4">Save Changes</button>
                </form>
              ) : (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/5">
                    <div>
                      <h3 className="text-2xl font-black uppercase italic mb-1">Account Info</h3>
                      <p className="text-white/40 text-sm">Manage your personal information and settings.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gold transition-all"
                        aria-label="Edit info"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <div className="px-4 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-widest">
                        Verified Athlete
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Full Name</p>
                      <p className="text-lg font-bold uppercase italic">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Athlete Name Not Set'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Email Address</p>
                      <p className="text-lg font-bold uppercase italic">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Member Since</p>
                      <p className="text-lg font-bold uppercase italic">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Programs</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {purchasedPrograms.length > 0 ? (
                          purchasedPrograms.map(p => (
                            <span key={p} className="px-2 py-1 bg-gold/10 border border-gold/20 rounded text-[10px] font-black uppercase italic text-gold">
                              {p}
                            </span>
                          ))
                        ) : (
                          <p className="text-lg font-bold uppercase italic text-white/20">None</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-black/50 border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pushEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'}`}>
                          {pushEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-bold uppercase italic">Device Subscription</h4>
                          <p className="text-white/40 text-xs">
                            {pushEnabled ? 'This device is registered for push alerts.' : 'Enable push alerts on this device.'}
                          </p>
                        </div>
                      </div>
                      {!pushEnabled && (
                        <button 
                          onClick={handleEnableNotifications}
                          disabled={notificationLoading}
                          className="btn-gold !py-2 !px-6 !text-[10px] whitespace-nowrap flex items-center gap-2"
                        >
                          {notificationLoading ? (
                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : <Bell className="w-3 h-3" />}
                          Enable Device
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-6 bg-black/50 border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${globalPushEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase italic">Push Alerts</h4>
                            <p className="text-[10px] text-white/40">Global toggle</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUpdateNotificationSettings(emailNotifications, !globalPushEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${globalPushEnabled ? 'bg-gold' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${globalPushEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-black/50 border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${emailNotifications ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase italic">Email Alerts</h4>
                            <p className="text-[10px] text-white/40">Updates via inbox</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUpdateNotificationSettings(!emailNotifications, globalPushEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifications ? 'bg-gold' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${emailNotifications ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-black/50 border border-white/5 rounded-3xl">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold uppercase italic">Training History</h4>
                        <p className="text-white/40 text-xs">View your past workouts and performance logs.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('workouts')}
                        className="ml-auto text-gold hover:underline text-[10px] font-black uppercase tracking-widest"
                      >
                        View All
                      </button>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-black/50 border border-white/5 rounded-3xl">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold uppercase italic">Training Status</h4>
                        <p className="text-white/40 text-xs">Your account is in good standing. Keep pushing.</p>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-red-500/10">
                      <h4 className="text-red-500 font-bold uppercase italic mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Danger Zone
                      </h4>
                      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                          <h5 className="font-bold uppercase italic text-sm mb-1">Delete Account</h5>
                          <p className="text-white/40 text-[10px]">Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
}
