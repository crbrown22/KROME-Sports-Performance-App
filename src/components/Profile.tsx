import { motion } from "framer-motion";
import { safeStorage } from '../utils/storage';
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
      firstName: user.firstName || user.first_name || "",
      lastName: user.lastName || user.last_name || "",
      username: user.username || ""
    });
  }, [user, initialTab]);
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
      className="min-h-screen pt-24 md:pt-32 pb-24 bg-black px-4 md:px-6"
    >
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] md:text-xs tracking-widest hover:gap-4 transition-all !outline-none"
            aria-label="Go back to home page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 font-bold uppercase text-[10px] md:text-xs tracking-widest hover:gap-4 transition-all !outline-none"
            aria-label="Logout from your account"
          >
            Logout <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="text-center">
          <div className="relative inline-block mb-6 md:mb-8 group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl gold-gradient p-1 shadow-2xl shadow-gold/20">
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
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2">{user.username}</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-white/60 font-bold uppercase tracking-widest text-xs md:text-sm italic">
              {user.firstName || user.lastName || user.first_name || user.last_name ? 
                `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() : 
                'Name Not Set'}
            </p>
          </div>
          <p className="text-gold font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-6 md:mb-8 italic">Elite Member</p>

          <div className="grid grid-cols-1 gap-3" role="tablist" aria-label="Profile sections">
            <button 
              onClick={() => {
                if (onProgramSelect) {
                  onProgramSelect('');
                } else {
                  onNavigate('programViewer');
                }
              }}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" /> Training Programs
            </button>
            <button 
              onClick={() => onNavigate('workoutTracker')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <History className="w-4 h-4" aria-hidden="true" /> Training History
            </button>
            <button 
              onClick={() => onNavigate('fitnessOverview')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" /> Fitness Overview
            </button>
            <button 
              onClick={() => onNavigate('progressTracker')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" /> Training Stats
            </button>
            <button 
              onClick={() => onNavigate('nutritionDashboard')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Apple className="w-4 h-4" aria-hidden="true" /> Nutrition
            </button>
            <button 
              onClick={() => onNavigate('bodyComposition')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Camera className="w-4 h-4" aria-hidden="true" /> Body Composition
            </button>
            <button 
              onClick={() => onNavigate('bodyMetrics')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Activity className="w-4 h-4" aria-hidden="true" /> Body Metrics
            </button>
            <button 
              onClick={() => onNavigate('videoAnalysis')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Video className="w-4 h-4" aria-hidden="true" /> Video Analysis
            </button>
            <button 
              onClick={() => onNavigate('programBuilder')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" /> Program Creator
            </button>
            <button 
              onClick={() => onNavigate('parq')}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline`}
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" /> PAR-Q
            </button>
            <button 
              onClick={() => onNavigate('programCalendar')}
              disabled={user.parq_completed === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 ${user.parq_completed === 0 ? 'opacity-50 cursor-not-allowed' : ''} krome-outline`}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" /> Schedule
            </button>
            {user.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-gold/10 text-gold hover:bg-gold/20 krome-outline`}
              >
                <Shield className="w-4 h-4" aria-hidden="true" /> Admin Dashboard
              </button>
            )}
            <button 
              onClick={() => onNavigate('accountSettings')}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-white/5 text-white/60 hover:bg-white/10 krome-outline`}
            >
              <Settings className="w-4 h-4" aria-hidden="true" /> Account Settings
            </button>
            <button 
              onClick={onLogout}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 mt-4`}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
