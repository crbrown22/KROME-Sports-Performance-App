import { motion, AnimatePresence } from "framer-motion";
import { safeStorage } from '../utils/storage';
import React, { useState, useEffect, useMemo } from "react";
import { getCurrentDate } from '../utils/date';
import { getWorkoutExercises, calculateWorkoutProgress } from '../lib/workoutUtils';
import AthleteDashboard from "./AthleteDashboard";
import { TopNavigation } from "./TopNavigation";
import { getProgramImage } from '../utils/imageUtils';
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
  PieChart,
  Share2,
  Scale,
  Zap,
  Clock
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
import NutritionDashboard from "./NutritionDashboard";
import PerformanceMacroNutrients from "./PerformanceMacroNutrients";
import RecipeLibrary from "./RecipeLibrary";
import { LoggedFood } from "../data/nutritionData";
import { calculateNutritionRecommendations } from "../utils/nutrition";
import { ALL_PROGRAMS, FullProgramTemplate } from '../data/workoutTemplates';
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
  onProgramSelect?: (programId: string, phaseIdx?: number, weekIdx?: number, workoutId?: string) => void;
  initialTab?: 'dashboard' | 'training' | 'progress' | 'nutrition' | 'account' | 'metrics' | 'parq' | 'workouts' | 'composition' | 'overview' | 'videoAnalysis' | 'programs' | 'builder' | 'library' | 'schedule';
  isOwnProfile?: boolean;
}

export default function Profile({ 
  user, 
  onLogout, 
  onBack, 
  onUpdate, 
  onDelete, 
  onNavigate, 
  onProgramSelect, 
  initialTab = 'dashboard',
  isOwnProfile = true 
}: ProfileProps) {
  console.log("Profile mounted, user:", user, "initialTab:", initialTab);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'progress' | 'nutrition' | 'account' | 'metrics' | 'parq' | 'workouts' | 'composition' | 'overview' | 'videoAnalysis' | 'programs' | 'builder' | 'library' | 'schedule' | 'supplementsAndVitamins' | 'recipeLibrary'>(initialTab as any);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const getProgramIcon = (id: string) => {
    if (id.includes('soccer')) return <Activity className="w-6 h-6" />;
    if (id.includes('softball') || id.includes('baseball')) return <Zap className="w-6 h-6" />;
    if (id.includes('rehab')) return <Shield className="w-6 h-6" />;
    return <Dumbbell className="w-6 h-6" />;
  };

  const getProgramAccentColor = (id: string) => {
    if (id.includes('soccer')) return 'text-emerald-500 bg-emerald-500/10';
    if (id.includes('softball') || id.includes('baseball')) return 'text-gold bg-gold/10';
    if (id.includes('rehab')) return 'text-rose-500 bg-rose-500/10';
    return 'text-accent bg-accent/10';
  };

  const handleDashboardNavigate = (view: string) => {
    const internalTabs: Record<string, string> = {
      'bodyMetrics': 'metrics',
      'programBuilder': 'builder',
      'exerciseLibrary': 'library',
      'supplementsAndVitamins': 'supplementsAndVitamins',
      'recipeLibrary': 'recipeLibrary',
      'programCalendar': 'schedule',
      'accountSettings': 'account',
      'progressTracker': 'progress',
      'nutritionDashboard': 'nutrition'
    };

    if (internalTabs[view]) {
      setActiveTab(internalTabs[view] as any);
    } else {
      onNavigate(view);
    }
  };

  const hasGoal = !!user.fitness_goal;
  const hasParq = user.parq_completed === 1 || user.parq_completed === true;
  const needsOnboarding = !hasGoal || !hasParq;

  useEffect(() => {
    console.log("Profile mounted or initialTab changed:", initialTab, "parq_completed:", user.parq_completed);
    const hasParq = user.parq_completed === 1 || user.parq_completed === true;
    if (!hasParq) {
      setActiveTab('parq');
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, user.parq_completed]);

  useEffect(() => {
    setFormData({
      ...user,
      firstName: user.firstName || user.first_name || "",
      lastName: user.lastName || user.last_name || "",
      username: user.username || "",
      avatar_url: user.avatar_url || user.avatarUrl || ""
    });
  }, [user]);
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
  const [latestBodyComp, setLatestBodyComp] = useState<any>(null);
  const [latestNutrition, setLatestNutrition] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user.email_notifications === 1);
  const [globalPushEnabled, setGlobalPushEnabled] = useState(user.push_notifications === 1);
  const [purchasedPrograms, setPurchasedPrograms] = useState<string[]>([]);
  const [customPrograms, setCustomPrograms] = useState<FullProgramTemplate[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = safeStorage.getItem(`completedExercises_${user.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const allUserPrograms = useMemo(() => {
    const validPurchased = purchasedPrograms
      .map(idOrName => ALL_PROGRAMS.find(p => String(p.id) === String(idOrName) || String(p.name) === String(idOrName)))
      .filter((p): p is typeof ALL_PROGRAMS[0] => !!p);
    
    // Deduplicate by ID
    const uniquePurchased = Array.from(new Map(validPurchased.map(p => [p.id, p])).values());
    
    return [
      ...uniquePurchased, 
      ...customPrograms.map(p => ({ ...p, isCustom: true }))
    ];
  }, [purchasedPrograms, customPrograms]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?view=profile&userId=${user.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KROME Sports Profile',
          text: `Check out my performance profile on KROME Sports!`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setSuccess("Profile link copied to clipboard!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to copy link");
      }
    }
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!user?.id) return;
      setLoadingPrograms(true);
      try {
        const [purchasesRes, customRes, logsRes] = await Promise.all([
          fetch(`/api/purchases/${user.id}`),
          fetch(`/api/custom-programs/${user.id}`),
          fetch(`/api/workout-logs/${user.id}`)
        ]);

        if (purchasesRes.ok) {
          const data = await purchasesRes.json();
          // Map both program_id and item_name to ensure we catch all purchases
          const programIdentifiers = data.map((p: any) => p.program_id || p.item_name).filter(Boolean);
          // Remove duplicates
          setPurchasedPrograms(Array.from(new Set(programIdentifiers as string[])));
        }

        if (logsRes.ok) {
          const logs = await logsRes.json();
          const completed: Record<string, boolean> = {};
          logs.forEach((log: any) => {
            completed[`${log.workout_id}-${log.exercise_id}`] = log.completed === 1 || log.completed === true;
          });
          setCompletedExercises(prev => ({ ...prev, ...completed }));
        }

        if (customRes.ok) {
          const data = await customRes.json();
          const transformed = data.map((p: any) => {
            const dataObj = typeof p.data === 'string' ? JSON.parse(p.data) : (p.data || {});
            return {
              ...dataObj,
              ...p, // This will include top-level fields like 'phases' from Firestore
              id: p.id,
              name: p.name || dataObj.name || dataObj.programName,
              description: p.description || dataObj.description,
              isCustom: true
            };
          });
          setCustomPrograms(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();

    const handleRefresh = () => {
      fetchPrograms();
    };
    window.addEventListener('workout-completed', handleRefresh);
    return () => window.removeEventListener('workout-completed', handleRefresh);
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

  useEffect(() => {
    const fetchLatestData = async () => {
      if (user.id && user.id !== 'guest') {
        try {
          // Fetch latest body comp
          const bodyCompRes = await fetch(`/api/body-comp/${user.id}`);
          if (bodyCompRes.ok) {
            const history = await bodyCompRes.json();
            if (history && history.length > 0) {
              setLatestBodyComp(history[history.length - 1]);
            }
          }

          // Fetch latest nutrition
          const nutritionRes = await fetch(`/api/nutrition/${user.id}/latest`);
          if (nutritionRes.ok) {
            const latest = await nutritionRes.json();
            if (latest) {
              setLatestNutrition(latest);
            }
          }
        } catch (err) {
          console.error("Error fetching latest profile data:", err);
        }
      }
    };

    fetchLatestData();
  }, [user.id]);

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
    
    window.addEventListener('nutrition-updated', loadNutrition);
    return () => window.removeEventListener('nutrition-updated', loadNutrition);
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

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Update local state
        const updatedFormData = { ...formData, avatar_url: base64Image };
        setFormData(updatedFormData);

        // Update server (both SQLite and Firestore)
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: base64Image })
        });

        if (response.ok) {
          onUpdate({ ...user, avatar_url: base64Image });
          setSuccess("Profile picture updated!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          throw new Error('Failed to update profile');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Avatar update failed", err);
      setError("Failed to update avatar. Please try again.");
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
      className="min-h-screen pb-8 bg-transparent px-4 md:px-6"
      style={{ paddingTop: 'calc(100px + var(--safe-area-top))' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="relative z-10 flex flex-col items-center mb-2 text-center">
          <div className="relative mb-4 group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] gold-gradient p-1 shadow-2xl shadow-gold/20">
              <div className="w-full h-full bg-zinc-900 rounded-[35px] flex items-center justify-center overflow-hidden relative">
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
                {isOwnProfile && (
                  <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2 break-words max-w-full px-4 text-white">
            {user.username}
          </h1>
          <div className="flex items-center gap-2 mb-12">
            <div className="px-3 py-1 bg-gold/20 border border-gold/40 rounded-full">
              <p className="text-gold font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px]">
                {user.role === 'admin' ? 'Elite Administrator' : user.role === 'coach' ? 'Elite Performance Coach' : 'Elite Performance Athlete'}
              </p>
            </div>
            <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-full">
              <p className="text-white font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] italic">
                Elite Member
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 w-full max-w-lg mb-2 pt-6">
            <button 
              onClick={onBack}
              className="flex-1 min-w-[100px] py-3 bg-zinc-800/50 border border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-700/50 transition-all krome-outline backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {isOwnProfile && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 min-w-[100px] py-3 border rounded-2xl flex items-center justify-center gap-2 font-black uppercase italic text-[10px] tracking-widest transition-all krome-outline backdrop-blur-md ${activeTab === 'dashboard' ? 'bg-gold text-zinc-950 border-gold shadow-lg shadow-gold/20' : 'bg-zinc-800/50 border-white/20 text-white hover:bg-zinc-700/50'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
            )}
            {isOwnProfile && (
              <button 
                onClick={handleShare}
                className="flex-1 min-w-[100px] py-3 bg-gold/20 border border-gold/40 rounded-2xl flex items-center justify-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest hover:bg-gold/30 transition-all krome-outline"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            )}
            {isOwnProfile && (user?.role === 'admin' || user?.role === 'coach') && (
              <button 
                onClick={() => onNavigate('admin')}
                className="flex-1 min-w-[100px] py-3 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all krome-outline"
              >
                <Shield className="w-4 h-4" /> Admin
              </button>
            )}
            {isOwnProfile && (
              <button 
                onClick={onLogout}
                className="flex-1 min-w-[100px] py-3 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500/30 transition-all krome-outline"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-[72px] md:top-6 z-[100] grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 pt-4 pb-4 px-4 -mx-4 bg-black/60 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
          {isOwnProfile && (
            <>
              <button 
                onClick={() => setActiveTab('programs')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all border ${
                  activeTab === 'programs' 
                    ? 'bg-krome text-black border-krome font-black italic uppercase text-[10px] tracking-widest shadow-lg shadow-krome/20' 
                    : 'bg-zinc-800/50 text-krome/80 border-krome/20 hover:border-krome/40 font-bold uppercase text-[10px] tracking-widest backdrop-blur-md'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> My Programs
              </button>

              <button 
                onClick={() => setActiveTab('progress')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all border ${
                  activeTab === 'progress' 
                    ? 'bg-krome text-black border-krome font-black italic uppercase text-[10px] tracking-widest shadow-lg shadow-krome/20' 
                    : 'bg-zinc-800/50 text-krome/80 border-krome/20 hover:border-krome/40 font-bold uppercase text-[10px] tracking-widest backdrop-blur-md'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Stats
              </button>

              <button 
                onClick={() => setActiveTab('nutrition')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all border ${
                  activeTab === 'nutrition' 
                    ? 'bg-krome text-black border-krome font-black italic uppercase text-[10px] tracking-widest shadow-lg shadow-krome/20' 
                    : 'bg-zinc-800/50 text-krome/80 border-krome/20 hover:border-krome/40 font-bold uppercase text-[10px] tracking-widest backdrop-blur-md'
                }`}
              >
                <Apple className="w-4 h-4" /> Nutrition Log
              </button>

              <button 
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all border ${
                  activeTab === 'schedule' 
                    ? 'bg-krome text-black border-krome font-black italic uppercase text-[10px] tracking-widest shadow-lg shadow-krome/20' 
                    : 'bg-zinc-800/50 text-krome/80 border-krome/20 hover:border-krome/40 font-bold uppercase text-[10px] tracking-widest backdrop-blur-md'
                }`}
              >
                <Calendar className="w-4 h-4" /> Schedule
              </button>
            </>
          )}
        </div>

        {/* Quick Stats Bar */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-krome/20 rounded-[32px] p-4 md:p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center text-center backdrop-blur-xl hover:border-krome/40 transition-all">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-0">
                <div className="w-10 h-10 rounded-2xl bg-gold/10 text-gold flex items-center justify-center sm:mb-3">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Calories</p>
                  <p className="text-xl md:text-2xl font-black uppercase italic text-white truncate max-w-[120px] sm:max-w-full">
                    {Math.round(nutritionTotals.calories)} <span className="text-[10px] font-bold not-italic text-white/40">/ {targets.calories || 2500}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-krome/20 rounded-[32px] p-4 md:p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center text-center backdrop-blur-xl hover:border-krome/40 transition-all">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-400/10 text-blue-400 flex items-center justify-center sm:mb-3">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Weight</p>
                  <p className="text-xl md:text-2xl font-black uppercase italic text-white truncate max-w-[120px] sm:max-w-full">
                    {latestBodyComp ? latestBodyComp.weight : bodyMetricsData.initialWeight || '--'} <span className="text-[10px] font-bold not-italic">lbs</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-krome/20 rounded-[32px] p-4 md:p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center text-center backdrop-blur-xl hover:border-krome/40 transition-all">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-400/10 text-purple-400 flex items-center justify-center sm:mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Body Fat</p>
                  <p className="text-xl md:text-2xl font-black uppercase italic text-white truncate max-w-[120px] sm:max-w-full">
                    {latestBodyComp ? latestBodyComp.bodyFat : '--'} <span className="text-[10px] font-bold not-italic">%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6 px-2">
              <div>
                <h3 className="text-xl font-black uppercase italic text-krome leading-none">My Programs</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-2">Your active training protocols</p>
              </div>
              {allUserPrograms.length > 1 && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    disabled={carouselIndex === 0}
                    className="p-3 rounded-2xl bg-black/40 border border-krome/20 text-krome hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all krome-outline"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCarouselIndex(prev => Math.min(allUserPrograms.length - 1, prev + 1))}
                    disabled={carouselIndex >= allUserPrograms.length - 1}
                    className="p-3 rounded-2xl bg-black/40 border border-krome/20 text-krome hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all krome-outline"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {allUserPrograms.length > 0 ? (
              <div className="relative overflow-hidden px-2">
                <motion.div 
                  className="flex gap-6"
                  animate={{ x: `-${carouselIndex * (100 / (allUserPrograms.length > 1 ? 1.2 : 1))}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ width: `${allUserPrograms.length * 100}%` }}
                >
                  {allUserPrograms.map((program) => (
                    <motion.button
                      key={program.id}
                      whileHover={{ y: -8, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onProgramSelect?.(program.id)}
                      className="group relative text-left bg-black/20 backdrop-blur-md border border-krome/40 rounded-[32px] md:rounded-[40px] hover:border-gold/50 transition-all overflow-hidden krome-outline flex flex-col h-full w-full max-w-[400px]"
                    >
                      <div className="h-40 relative overflow-hidden">
                        <img 
                          src={getProgramImage(program.name, program.sport)} 
                          alt={program.name} 
                          className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        
                        <div className="absolute top-4 right-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 krome-outline ${getProgramAccentColor(program.id)}`}>
                            {getProgramIcon(program.id)}
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col h-full p-6 -mt-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-krome/20">
                            <Clock className="w-3 h-3 text-white/60" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/80">
                              {(program as any).duration || '52 Weeks'}
                            </span>
                          </div>
                          {(program as any).isCustom && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                              Custom
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black uppercase italic leading-tight mb-3 group-hover:text-gold transition-colors drop-shadow-lg text-krome">
                          {program.name}
                        </h3>

                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6 flex-1 line-clamp-2">
                          {program.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Sport</span>
                            <span className="text-[10px] font-bold text-gold uppercase italic">{program.sport || 'All Sports'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gold font-black uppercase italic text-[10px] group-hover:gap-4 transition-all">
                            Access Program <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            ) : (
              <div className="p-12 bg-black/20 backdrop-blur-md border border-dashed border-krome/20 rounded-[40px] text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-krome/40" />
                </div>
                <h3 className="text-sm font-black uppercase italic text-krome mb-1">No Programs Found</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Explore the catalog to start your journey</p>
              </div>
            )}
          </div>
        )}

        {/* Onboarding Alert */}
        {isOwnProfile && needsOnboarding && activeTab === 'dashboard' && (
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
        <AnimatePresence initial={false}>
          {activeTab === 'parq' && (
            <motion.div
              key="parq"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PARQ userId={user.id} onUpdate={onUpdate} onComplete={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AthleteDashboard user={user} onNavigate={handleDashboardNavigate} isOwnProfile={isOwnProfile} onProgramSelect={onProgramSelect} />
            </motion.div>
          )}

          {activeTab === 'programs' && (
            <motion.div
              key="programs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 relative z-10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-6 bg-zinc-900/50 border border-white/5 rounded-[32px] backdrop-blur-xl">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-krome leading-none">My Programs</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-2">Your active training protocols</p>
                </div>
                <button 
                  onClick={() => onNavigate('programCatalog')}
                  className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-krome hover:text-white transition-all px-8 py-4 bg-black/40 rounded-2xl border border-krome/20 hover:bg-white/10 shadow-lg shadow-black/20 krome-outline"
                >
                  Browse Catalog
                </button>
              </div>

              {(() => {
                const validPurchased = purchasedPrograms
                  .map(idOrName => ALL_PROGRAMS.find(p => String(p.id) === String(idOrName) || String(p.name) === String(idOrName)))
                  .filter((p): p is typeof ALL_PROGRAMS[0] => !!p);
                
                // Deduplicate by ID
                const uniquePurchased = Array.from(new Map(validPurchased.map(p => [p.id, p])).values());
                
                const allUserPrograms = [
                  ...uniquePurchased, 
                  ...customPrograms.map(p => ({ ...p, isCustom: true }))
                ];

                if (loadingPrograms) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                    </div>
                  );
                }

                return allUserPrograms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allUserPrograms.map((program) => {
                      // Calculate overall progress for this program
                      let totalExercises = 0;
                      let completedCount = 0;
                      let nextWorkoutInfo = null;

                      let totalWorkouts = 0;
                      let firstWorkoutTitle = '';
                      if (program.phases) {
                        program.phases.forEach((phase: any, pIdx: number) => {
                          (phase.weeks || []).forEach((week: any, wIdx: number) => {
                            (week.workouts || []).forEach((workout: any) => {
                              totalWorkouts++;
                              if (totalWorkouts === 1) firstWorkoutTitle = workout.title;
                              const exercises = getWorkoutExercises(workout);
                              totalExercises += exercises.length;
                              let workoutCompleted = 0;
                              exercises.forEach((ex: any) => {
                                if (completedExercises[`${workout.id}-${ex.id}`]) {
                                  completedCount++;
                                  workoutCompleted++;
                                }
                              });
                              
                              if (!nextWorkoutInfo && workoutCompleted < exercises.length) {
                                nextWorkoutInfo = {
                                  title: workout.title,
                                  week: week.week,
                                  day: workout.day,
                                  phaseIdx: pIdx,
                                  weekIdx: wIdx,
                                  workoutId: workout.id,
                                  progress: exercises.length > 0 ? Math.round((workoutCompleted / exercises.length) * 100) : 0,
                                  inProgress: workoutCompleted > 0
                                };
                              }
                            });
                          });
                        });
                      }

                      const overallProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
                      const isSingleWorkout = totalWorkouts === 1;

                      return (
                        <button 
                          key={program.id}
                          onClick={() => onProgramSelect?.(program.id, nextWorkoutInfo?.phaseIdx, nextWorkoutInfo?.weekIdx, nextWorkoutInfo?.workoutId)}
                          className="p-6 bg-black/40 border border-krome/20 rounded-[32px] flex flex-col hover:bg-white/10 hover:border-krome/40 transition-all group text-left backdrop-blur-xl relative overflow-hidden krome-outline"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl -mr-12 -mt-12 group-hover:bg-gold/10 transition-all" />
                          <div className="flex items-center justify-between w-full mb-4 relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-black transition-all">
                                <Dumbbell className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="text-sm font-black uppercase italic text-krome group-hover:text-gold transition-colors leading-tight">
                                  {isSingleWorkout && (program as any).isCustom && program.name === 'Custom Program' ? firstWorkoutTitle : (program.name || 'Untitled Program')}
                                  {(program as any).isCustom && (
                                    <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-gold/20 text-gold rounded-full border border-gold/30">
                                      {isSingleWorkout ? 'Custom Workout' : 'Custom Program'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-bold">
                                  {(program as any).isCustom 
                                    ? (isSingleWorkout ? '1 Workout' : `${totalWorkouts} Workouts`)
                                    : `${program.sport || 'Elite'} • ${program.goal || 'Performance'}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-gold italic">{overallProgress}%</div>
                              <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Overall</div>
                            </div>
                          </div>

                          {nextWorkoutInfo && (
                            <div className="mt-2 space-y-3 w-full relative z-10">
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${nextWorkoutInfo.inProgress ? 'text-gold' : 'text-white/30'}`}>
                                    {nextWorkoutInfo.inProgress ? 'In Progress:' : 'Next:'} {nextWorkoutInfo.title}
                                  </p>
                                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Week {nextWorkoutInfo.week} • Day {nextWorkoutInfo.day}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-[10px] font-black text-gold">{nextWorkoutInfo.progress}%</div>
                                  {!nextWorkoutInfo.inProgress && nextWorkoutInfo.progress === 0 && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('schedule');
                                      }}
                                      className="px-3 py-1 bg-gold/10 text-gold rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-colors"
                                    >
                                      Schedule
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-gold to-yellow-500" style={{ width: `${nextWorkoutInfo.progress}%` }} />
                              </div>
                            </div>
                          )}
                          {!nextWorkoutInfo && (
                            <div className="mt-2 space-y-3 w-full relative z-10">
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Program Complete</p>
                                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Ready for your next challenge?</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-[10px] font-black text-emerald-500">100%</div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigate('programCatalog');
                                    }}
                                    className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-colors"
                                  >
                                    Browse
                                  </button>
                                </div>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `100%` }} />
                              </div>
                            </div>
                          )}
                          
                          <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all z-10" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-16 bg-black/40 border border-dashed border-krome/20 rounded-[40px] text-center backdrop-blur-xl krome-outline">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <Lock className="w-10 h-10 text-white/10" />
                    </div>
                    <h3 className="text-lg font-black uppercase italic text-krome mb-2">No Active Programs</h3>
                    <p className="text-white/40 text-xs mb-8 max-w-xs mx-auto leading-relaxed">Unlock elite training protocols from our catalog to start your performance journey.</p>
                    <button 
                      onClick={() => onNavigate('programCatalog')}
                      className="btn-gold px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gold/20 krome-outline"
                    >
                      Explore Programs
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProgressTracker userId={user.id} isOwnProfile={isOwnProfile} onBack={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <PerformanceMacroNutrients 
                userId={user.id || user.uid}
                onBack={() => setActiveTab('dashboard')}
                isOwnProfile={isOwnProfile}
              />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => onNavigate('accountSettings')}
                  className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-white/60 group-hover:text-gold transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase italic tracking-widest">Account Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => onNavigate('notificationSettings')}
                  className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-white/60 group-hover:text-gold transition-colors">
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase italic tracking-widest">Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="pt-8 border-t border-white/5">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <BodyMetrics userId={user.id} data={bodyMetricsData} setData={setBodyMetricsData} />
            </motion.div>
          )}

          {activeTab === 'workouts' && (
            <motion.div
              key="workouts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <WorkoutTracker userId={user.id} onBack={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'composition' && (
            <motion.div
              key="composition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <BodyCompositionTracker userId={user.id} onBack={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <FitnessOverview userId={user.id} />
            </motion.div>
          )}

          {activeTab === 'videoAnalysis' && (
            <motion.div
              key="videoAnalysis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <VideoAnalyzer userId={user.id} />
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProgramBuilder userId={user.id} userRole={user.role} onBack={() => setActiveTab('dashboard')} initialView="builder" />
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProgramBuilder userId={user.id} userRole={user.role} onBack={() => setActiveTab('dashboard')} initialView="library" />
            </motion.div>
          )}

          {activeTab === 'supplementsAndVitamins' && (
            <motion.div
              key="supplementsAndVitamins"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SupplementsAndVitamins 
                data={bodyMetricsData} 
                setData={setBodyMetricsData} 
                isEditing={isEditing}
                getSupplementRecommendation={getSupplementRecommendation}
                generateDefaultSupplements={generateDefaultSupplements}
              />
            </motion.div>
          )}

          {activeTab === 'recipeLibrary' && (
            <motion.div
              key="recipeLibrary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RecipeLibrary userId={user.id} onBack={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProgramCalendar userId={user.id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Tab Bar */}
        <TopNavigation 
          currentView={activeTab} 
          onNavigate={(view) => {
            if (view === 'home') {
              onNavigate('home');
            } else {
              setActiveTab(view as any);
            }
          }}
          user={user}
        />
      </div>
    </motion.div>
  );
}
