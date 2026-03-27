import { motion, AnimatePresence } from "framer-motion";
import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from "react";
import { getCurrentDate } from '../utils/date';
import AthleteDashboard from "./AthleteDashboard";
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
  Shield,
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
  Video,
  Target,
  Lock,
  LayoutDashboard,
  PieChart
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
  initialTab?: 'dashboard' | 'training' | 'progress' | 'nutrition' | 'account' | 'metrics' | 'parq' | 'workouts' | 'composition' | 'overview' | 'videoAnalysis' | 'programs' | 'builder' | 'schedule';
}

export default function Profile({ user, onLogout, onBack, onUpdate, onDelete, onNavigate, onProgramSelect, initialTab = 'dashboard' }: ProfileProps) {
  console.log("Profile mounted, user:", user, "initialTab:", initialTab);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'progress' | 'nutrition' | 'account' | 'metrics' | 'parq' | 'workouts' | 'composition' | 'overview' | 'videoAnalysis' | 'programs' | 'builder' | 'schedule'>(initialTab as any);

  const needsOnboarding = !user.fitness_goal || user.parq_completed === 0;

  useEffect(() => {
    console.log("Profile user changed:", user, "initialTab:", initialTab, "needsOnboarding:", needsOnboarding);
    if (user.parq_completed === 0) {
      setActiveTab('parq');
    } else {
      setActiveTab(initialTab);
    }
    setFormData({
      ...user,
      firstName: user.firstName || user.first_name || "",
      lastName: user.lastName || user.last_name || "",
      username: user.username || ""
    });
  }, [user, initialTab, needsOnboarding]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ 
    ...user,
    firstName: user.firstName || user.first_name || "",
    lastName: user.lastName || user.last_name || "",
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
          setPurchasedPrograms(data.map((p: any) => p.program_id || p.item_name));
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
              safeStorage.setItem(`krome_metrics_${user.id}`, JSON.stringify(dbData));
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load metrics from DB", err);
        }
      }

      const savedMetrics = safeStorage.getItem(`krome_metrics_${user.id}`);
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
      className="min-h-screen pt-24 md:pt-32 pb-32 bg-black px-4 md:px-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest hover:gap-4 transition-all !outline-none"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className="p-2 bg-gold/10 border border-gold/20 rounded-xl text-gold hover:bg-gold/20 transition-all"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => setActiveTab('account')}
              className={`p-2 rounded-xl transition-all ${activeTab === 'account' ? 'bg-gold text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Onboarding Alert */}
        {needsOnboarding && activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gold/10 border border-gold/20 rounded-3xl space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all" />
            <div className="flex items-center gap-3 text-gold relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black uppercase italic tracking-tighter text-lg leading-none">Action Required</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold/60 mt-1">Onboarding Incomplete</p>
              </div>
            </div>
            <p className="text-white/60 text-sm relative z-10 leading-relaxed">
              To unlock all features and ensure your safety, please complete your PAR-Q and set your fitness goals.
            </p>
            <button 
              onClick={() => onNavigate('onboarding')}
              className="btn-gold w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all"
            >
              Complete Setup Now
            </button>
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <AthleteDashboard user={user} onNavigate={onNavigate} />
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Training Hub</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => onNavigate('myPrograms')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-gold/10 text-gold"><Lock className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">My Programs</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Purchased Content</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('programViewer')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Calendar className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Training Programs</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Browse Catalog</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('workoutTracker')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><History className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Training History</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Log & Review</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('programCalendar')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Calendar className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Schedule</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Weekly Planner</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Progress & Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => onNavigate('progressTracker')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><TrendingUp className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Training Stats</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Performance Metrics</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('bodyMetrics')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Activity className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Body Metrics</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Weight & Measurements</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('bodyComposition')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Camera className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Body Composition</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Photos & Analysis</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('videoAnalysis')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Video className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Video Analysis</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Form Review</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Nutrition Hub</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => onNavigate('performanceMacroNutrients')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><Apple className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Nutrition Tracker</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Macros & Calories</p>
                  </div>
                </button>
                <button onClick={() => onNavigate('nutritionDashboard')} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/60"><PieChart className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">Nutrition Insights</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Detailed Analysis</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="relative inline-block mb-6 group">
                  <div className="w-32 h-32 rounded-3xl gold-gradient p-1 shadow-2xl shadow-gold/20">
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
                  <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-zinc-800 border border-white/10 rounded-2xl flex items-center justify-center text-gold shadow-xl cursor-pointer hover:bg-zinc-700 transition-colors">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{user.username}</h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Elite Member</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => onNavigate('accountSettings')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Settings className="w-4 h-4" /> Account Settings
                </button>
                <button onClick={() => onNavigate('parq')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                  <ShieldAlert className="w-4 h-4" /> PAR-Q Status
                </button>
                <button onClick={() => onNavigate('fitnessGoal')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Target className="w-4 h-4" /> Update Fitness Goal
                </button>
                <button onClick={onLogout} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all mt-4">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>

              {/* Notification Settings */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase italic mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gold" /> Notification Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase italic tracking-widest">Email Notifications</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Receive updates via email</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateNotificationSettings(!emailNotifications, globalPushEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${emailNotifications ? 'bg-gold' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailNotifications ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase italic tracking-widest">Push Notifications</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Real-time alerts on this device</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateNotificationSettings(emailNotifications, !globalPushEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${globalPushEnabled ? 'bg-gold' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${globalPushEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  {!pushEnabled && (
                    <button 
                      onClick={handleEnableNotifications}
                      disabled={notificationLoading}
                      className="w-full py-3 bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {notificationLoading ? 'Enabling...' : 'Enable Device Push'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-between items-center z-[100] pb-[calc(12px+var(--safe-area-bottom))]">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'training', icon: Dumbbell, label: 'Training' },
            { id: 'progress', icon: TrendingUp, label: 'Progress' },
            { id: 'nutrition', icon: Apple, label: 'Nutrition' },
            { id: 'account', icon: User, label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-gold' : 'text-white/40'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
